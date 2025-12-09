import 'dotenv/config'

import os from 'os'
import path from 'path'
import { promises as fs } from 'fs'

import axios from 'axios'
import Fuse from 'fuse.js'
import { load, CheerioAPI } from 'cheerio'
import { extension as mimeExtension } from 'mime-types'
import puppeteer, { Browser } from 'puppeteer'
import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface ExerciseRow {
  id: number
  name: string
  library_exercise_id: string | null
}

interface AceExerciseSummary {
  name: string
  url: string
}

interface AceExerciseDetail {
  name: string
  url: string
  description: string | null
  bodyParts: string[]
  equipment: string[]
  injuryAreas: string[]
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  media: {
    demoUrl: string | null
    thumbnailUrl: string | null
  }
}

interface CliOptions {
  aceIndexFile?: string
  dryRun: boolean
  forceScrape: boolean
}

interface AceMatch {
  exerciseName: string
  aceUrl: string
}

const ACE_LIBRARY_URL = 'https://www.acefitness.org/resources/everyone/exercise-library/'
const DEFAULT_SCRAPE_DELAY_MS = parseInt(process.env.ACE_SCRAPE_DELAY_MS ?? '1500', 10) || 1500
const DEFAULT_MAX_CONCURRENT_UPLOADS =
  parseInt(process.env.ACE_MAX_CONCURRENT_UPLOADS ?? '2', 10) || 2
const STORAGE_BUCKET = process.env.ACE_STORAGE_BUCKET || 'exercise-videos'

// Fuzzy matching threshold (lower = stricter). 0.5 is a reasonable middle ground.
const MATCH_THRESHOLD = 0.5

// Optional manual overrides for tricky exercise names.
// Key: your exercise name in the DB
// Value: canonical name to search for in ACE's library.
const NAME_OVERRIDES: Record<string, string> = {
  'Box Jumps (step down controlled)': 'Box Jumps',
  'Goblet Squat': 'Goblet Squat',
  'Goblet Squats': 'Goblet Squat',
  'Dead bugs': 'Dead Bug',
  'Push-ups': 'Pushup',
  'Plyometric Push-ups': 'Plyometric Push-up',
  'Russian twists': 'Russian Twist'
}

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. The import script requires elevated privileges.'
  )
}

type StorageUploadPayload = {
  supabase: SupabaseClient
  bucket: string
  filePath: string
  storagePath: string
  contentType: string
}

function parseArgs(argv: string[]): CliOptions {
  const options: CliOptions = {
    dryRun: false,
    forceScrape: false
  }

  for (const arg of argv) {
    if (arg.startsWith('--ace-index-file=')) {
      options.aceIndexFile = arg.split('=')[1]
    }
    if (arg === '--dry-run') {
      options.dryRun = true
    }
    if (arg === '--force-scrape') {
      options.forceScrape = true
    }
  }

  return options
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

const toSlug = (input: string): string =>
  input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

function normalizeExerciseNameForSearch(name: string): string {
  let result = name.trim()

  // Remove any parenthetical qualifiers, e.g. "Box Jumps (step down controlled)" -> "Box Jumps"
  result = result.replace(/\([^)]*\)/g, '').trim()

  // Normalize whitespace
  result = result.replace(/\s+/g, ' ')

  // Expand common abbreviations (case-insensitive, word-boundary)
  const replacements: Array<[RegExp, string]> = [
    [/\bdb\b/gi, 'Dumbbell'],
    [/\bkb\b/gi, 'Kettlebell'],
    [/\boh\b/gi, 'Overhead'],
    [/\bsl\b/gi, 'Single-leg']
  ]

  for (const [pattern, replacement] of replacements) {
    result = result.replace(pattern, replacement)
  }

  return result.trim()
}

function isAceDetailUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    const segments = parsed.pathname.split('/').filter(Boolean)
    const idx = segments.findIndex((seg) => seg === 'exercise-library')
    if (idx === -1 || idx + 1 >= segments.length) {
      return false
    }

    const idSegment = segments[idx + 1]
    // Detail pages typically look like /exercise-library/115/box-jumps/
    return /^\d+$/.test(idSegment)
  } catch {
    return false
  }
}

async function fetchExistingExercises(supabase: SupabaseClient): Promise<ExerciseRow[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name, library_exercise_id')
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`)
  }

  if (!data) {
    return []
  }

  const seen = new Map<string, ExerciseRow>()

  for (const row of data as ExerciseRow[]) {
    const normalized = row.name.trim().toLowerCase()
    if (!seen.has(normalized)) {
      seen.set(normalized, row)
    }
  }

  return Array.from(seen.values())
}

async function loadAceIndexFromFile(aceIndexPath: string): Promise<AceExerciseSummary[]> {
  const absolutePath = path.isAbsolute(aceIndexPath)
    ? aceIndexPath
    : path.resolve(process.cwd(), aceIndexPath)

  const buffer = await fs.readFile(absolutePath, 'utf8')
  const parsed = JSON.parse(buffer) as unknown

  if (!Array.isArray(parsed)) {
    throw new Error('ACE index file must contain an array of { name, url } objects')
  }

  return parsed.map((item) => {
    if (typeof item !== 'object' || item === null) {
      throw new Error('Invalid entry in ACE index file')
    }

    const name = (item as { name?: unknown }).name
    const url = (item as { url?: unknown }).url

    if (typeof name !== 'string' || typeof url !== 'string') {
      throw new Error('Each ACE index entry must include string name and url fields')
    }

    return {
      name: name.trim(),
      url: url.startsWith('http') ? url : new URL(url, ACE_LIBRARY_URL).toString()
    }
  })
}

async function loadAceMatchesFromFile(filePath: string): Promise<AceMatch[]> {
  try {
    const content = await fs.readFile(filePath, 'utf-8')
    const matches = JSON.parse(content) as Record<string, string>

    return Object.entries(matches).map(([exerciseName, aceUrl]) => ({
      exerciseName,
      aceUrl
    }))
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return []
    }
    throw error
  }
}

async function scrapeAceLibraryIndex(): Promise<AceExerciseSummary[]> {
  console.log('🔎 Scraping ACE Fitness exercise index...')

  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: 'new'
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto(ACE_LIBRARY_URL, { waitUntil: 'networkidle2', timeout: 30000 })

    let loadMoreAttempts = 0
    let lastCount = 0

    // Repeatedly click a button whose text includes 'load more' until none remain
    // Also scroll to bottom to trigger lazy loading if ACE uses infinite scroll
    while (loadMoreAttempts < 50) {
      // Scroll to bottom to trigger any lazy loading
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await delay(500)

      // Try to click "Load more" button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button'))
        const target = buttons.find((btn) => {
          const text = (btn.textContent || '').toLowerCase()
          return text.includes('load more') || text.includes('show more')
        })

        if (target && !target.disabled) {
          target.scrollIntoView({ behavior: 'smooth', block: 'center' })
          target.click()
          return true
        }
        return false
      })

      if (clicked) {
        loadMoreAttempts += 1
        console.log(` • Clicking "Load more" (attempt ${loadMoreAttempts})`)
        await delay(DEFAULT_SCRAPE_DELAY_MS)
      } else {
        // Check if new content loaded by counting links
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll<HTMLAnchorElement>('a[href*="/exercise-library/"]').length
        })

        if (currentCount === lastCount && lastCount > 0) {
          // No new content loaded, we're done
          break
        }

        lastCount = currentCount
        await delay(1000)
      }
    }

    if (loadMoreAttempts >= 50) {
      console.warn('⚠️  Reached max "Load more" attempts (50). Some exercises may be missing.')
    }

    const summaries = await page.evaluate(() => {
      const anchorElements = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href*="/exercise-library/"]')
      )

      const seen = new Map<string, { name: string; url: string }>()

      for (const anchor of anchorElements) {
        const href = anchor.getAttribute('href')
        if (!href || !href.includes('/exercise-library/')) {
          continue
        }

        // Skip equipment/category pages
        if (href.includes('/equipment/') || href.includes('/exercise-library/equipment')) {
          continue
        }

        // Only include actual exercise pages (have numeric ID in path like /6/deadlift/)
        const exerciseIdMatch = href.match(/\/exercise-library\/(\d+)\//)
        if (!exerciseIdMatch) {
          continue
        }

        // Skip "Learn More" or generic links
        const linkText = (anchor.textContent || anchor.innerText || '').trim().toLowerCase()
        if (linkText === 'learn more' || linkText === 'view details' || linkText.length < 2) {
          continue
        }

        // Try to find the exercise name - look for h2, h3, or strong tags within the anchor or its parent
        let exerciseName = ''
        
        // First, try to find a heading within the anchor or its parent container
        const parent = anchor.closest('article, div, section, li')
        if (parent) {
          const heading = parent.querySelector('h1, h2, h3, h4, strong')
          if (heading) {
            const headingText = (heading.textContent || '').trim()
            // Clean up the heading text - remove metadata lines
            const lines = headingText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
            // Take the first line that doesn't look like metadata
            for (const line of lines) {
              const lower = line.toLowerCase()
              if (!lower.includes('body part:') && 
                  !lower.includes('equipment:') && 
                  !lower.includes('difficulty:') &&
                  !lower.includes('view details') &&
                  line.length > 2 && 
                  line.length < 100) {
                exerciseName = line
                break
              }
            }
          }
        }

        // Fallback: use anchor text, but clean it up
        if (!exerciseName) {
          const anchorText = (anchor.textContent || anchor.innerText || '').trim()
          const lines = anchorText.split('\n').map(l => l.trim()).filter(l => l.length > 0)
          for (const line of lines) {
            const lower = line.toLowerCase()
            if (!lower.includes('body part:') && 
                !lower.includes('equipment:') && 
                !lower.includes('difficulty:') &&
                !lower.includes('view details') &&
                !lower.includes('learn more') &&
                line.length > 2 && 
                line.length < 100) {
              exerciseName = line
              break
            }
          }
        }

        // Last resort: extract from URL
        if (!exerciseName) {
          const urlParts = href.split('/').filter(Boolean)
          const lastPart = urlParts[urlParts.length - 1]
          if (lastPart && lastPart !== 'exercise-library') {
            exerciseName = lastPart
              .split('-')
              .map(word => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }
        }

        if (!exerciseName || exerciseName.length < 2) {
          continue
        }

        const url = href.startsWith('http') ? href : new URL(href, window.location.origin).toString()
        const normalizedUrl = url.split('?')[0]

        if (!seen.has(normalizedUrl)) {
          seen.set(normalizedUrl, { name: exerciseName, url: normalizedUrl })
        }
      }

      return Array.from(seen.values())
    })

    console.log(`✅ Found ${summaries.length} ACE exercises`)
    return summaries
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

function normalizeDifficulty(value: string | null): AceExerciseDetail['difficulty'] {
  if (!value) {
    return null
  }

  const normalized = value.trim().toLowerCase()

  if (normalized === 'beginner' || normalized === 'intermediate' || normalized === 'advanced') {
    return normalized
  }

  return null
}

function extractSectionList($: CheerioAPI, headingText: string): string[] {
  const matches = $(`*:contains("${headingText}")`).filter((_, element) => {
    return $(element).text().trim().toLowerCase() === headingText.toLowerCase()
  })

  if (matches.length === 0) {
    return []
  }

  for (let index = 0; index < matches.length; index++) {
    const heading = matches[index]
    const nextSection = $(heading).next()

    if (!nextSection || nextSection.length === 0) {
      continue
    }

    if (nextSection.is('ul') || nextSection.is('ol')) {
      return nextSection
        .find('li')
        .map((_, element) => $(element).text().trim())
        .get()
        .filter((item) => item.length > 0)
    }

    if (nextSection.is('div') || nextSection.is('p')) {
      return nextSection
        .text()
        .split(',')
        .map((item) => item.trim())
        .filter((item) => item.length > 0)
    }
  }

  return []
}

async function runWithConcurrency(tasks: Array<() => Promise<void>>, concurrency: number) {
  if (tasks.length === 0) {
    return
  }

  const limit = Math.max(1, concurrency)
  const executing: Promise<void>[] = []

  for (const task of tasks) {
    const promise = task().finally(() => {
      const index = executing.indexOf(promise)
      if (index >= 0) {
        executing.splice(index, 1)
      }
    })

    executing.push(promise)

    if (executing.length >= limit) {
      await Promise.race(executing)
    }
  }

  await Promise.all(executing)
}

async function cleanupFiles(filePaths: string[]) {
  await Promise.all(
    filePaths.map(async (filePath) => {
      try {
        await fs.unlink(filePath)
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
          console.warn(`     ⚠️  Failed to remove temp file ${filePath}: ${(error as Error).message}`)
        }
      }
    })
  )
}

function extractMedia($: CheerioAPI, baseUrl: string): AceExerciseDetail['media'] {
  const videoSource =
    $('video source').first().attr('src') ?? $('video').first().attr('src') ?? null
  const imageSource =
    $('img')
      .toArray()
      .map((element) => $(element).attr('src'))
      .find(
        (src) =>
          src &&
          (src.endsWith('.jpg') ||
            src.endsWith('.jpeg') ||
            src.endsWith('.png') ||
            src.endsWith('.gif'))
      ) ?? null

  const resolveUrl = (input: string | null): string | null => {
    if (!input) {
      return null
    }

    if (input.startsWith('http')) {
      return input
    }

    try {
      return new URL(input, baseUrl).toString()
    } catch {
      return null
    }
  }

  return {
    demoUrl: resolveUrl(videoSource),
    thumbnailUrl: resolveUrl(imageSource)
  }
}

async function scrapeAceExerciseDetail(url: string): Promise<AceExerciseDetail> {
  console.log(`   ↳ Scraping ${url}`)
  const response = await axios.get(url, {
    responseType: 'text'
  })

  const html = response.data as string
  const $ = load(html)
  const name = $('h1').first().text().trim() || $('h2').first().text().trim()
  const description = $('section p').first().text().trim() || $('p').first().text().trim() || null
  const bodyParts = extractSectionList($, 'Target Body Part')
  const equipment = extractSectionList($, 'Equipment')
  const difficultyRaw =
    $('strong:contains("Difficulty")').parent().text() ||
    $('p:contains("Difficulty")').text()
  const difficulty = normalizeDifficulty(
    difficultyRaw ? difficultyRaw.replace(/Difficulty:/i, '').trim() : null
  )
  const injuryAreas = extractSectionList($, 'Injury')
  const media = extractMedia($, url)

  return {
    name: name || url.split('/').filter(Boolean).pop() || 'Unknown Exercise',
    url,
    description,
    bodyParts,
    equipment,
    difficulty,
    injuryAreas,
    media
  }
}

async function ensureDirectoryExists(directoryPath: string) {
  try {
    await fs.mkdir(directoryPath, { recursive: true })
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
      throw error
    }
  }
}

async function downloadMediaFile(
  url: string,
  tempDir: string,
  slug: string,
  suffix: string
): Promise<{ filePath: string; contentType: string } | null> {
  try {
    const response = await axios.get<ArrayBuffer>(url, {
      responseType: 'arraybuffer'
    })

    const contentTypeHeader = response.headers['content-type']
    const contentType =
      (Array.isArray(contentTypeHeader) ? contentTypeHeader[0] : contentTypeHeader) ||
      'application/octet-stream'

    const ext = mimeExtension(contentType) || url.split('.').pop() || 'bin'
    const fileName = `${slug}-${suffix}.${ext}`.replace(/[^a-zA-Z0-9.-]+/g, '-')
    const filePath = path.join(tempDir, fileName)

    await fs.writeFile(filePath, Buffer.from(response.data))
    return { filePath, contentType }
  } catch (error) {
    console.warn(`     ⚠️  Failed to download media from ${url}: ${(error as Error).message}`)
    return null
  }
}

async function ensureBucketExists(supabase: SupabaseClient, bucketName: string) {
  const { data: buckets, error: listError } = await supabase.storage.listBuckets()

  if (listError) {
    throw new Error(`Failed to list buckets: ${listError.message}`)
  }

  const bucketExists = buckets?.some((b) => b.name === bucketName)

  if (!bucketExists) {
    console.log(`📦 Creating storage bucket "${bucketName}"...`)
    const { error: createError } = await supabase.storage.createBucket(bucketName, {
      public: true
    })

    if (createError) {
      throw new Error(`Failed to create bucket "${bucketName}": ${createError.message}`)
    }

    console.log(`✅ Bucket "${bucketName}" created successfully`)
  }
}

async function uploadToSupabaseStorage({
  supabase,
  bucket,
  filePath,
  storagePath,
  contentType
}: StorageUploadPayload) {
  const fileBuffer = await fs.readFile(filePath)
  const { error } = await supabase.storage.from(bucket).upload(storagePath, fileBuffer, {
    contentType,
    upsert: true
  })

  if (error) {
    throw new Error(`Failed to upload file to Supabase Storage: ${error.message}`)
  }
}

async function upsertExerciseLibraryEntry(
  supabase: SupabaseClient,
  detail: AceExerciseDetail,
  mediaPaths: { demoPath: string | null; thumbnailPath: string | null }
): Promise<string> {
  const { data: existing } = await supabase
    .from('exercise_library')
    .select('id')
    .ilike('name', detail.name)
    .maybeSingle()

  const payload = {
    name: detail.name,
    description: detail.description,
    body_parts: detail.bodyParts.length > 0 ? detail.bodyParts : null,
    equipment: detail.equipment.length > 0 ? detail.equipment : null,
    injury_areas: detail.injuryAreas.length > 0 ? detail.injuryAreas : null,
    difficulty: detail.difficulty,
    external_video_url: detail.url,
    demo_file_path: mediaPaths.demoPath,
    thumbnail_path: mediaPaths.thumbnailPath
  }

  if (existing?.id) {
    const { error: updateError, data } = await supabase
      .from('exercise_library')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (updateError) {
      throw new Error(`Failed to update exercise_library entry: ${updateError.message}`)
    }

    return (data as { id: string }).id
  }

  const { error: insertError, data: insertData } = await supabase
    .from('exercise_library')
    .insert(payload)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed to insert exercise_library entry: ${insertError.message}`)
  }

  return (insertData as { id: string }).id
}

async function linkExerciseToLibrary(
  supabase: SupabaseClient,
  exerciseId: number,
  libraryId: string
) {
  const { error } = await supabase
    .from('exercises')
    .update({ library_exercise_id: libraryId })
    .eq('id', exerciseId)

  if (error) {
    throw new Error(
      `Failed to link exercise ${exerciseId} to library entry ${libraryId}: ${error.message}`
    )
  }
}

async function processExercise(
  supabase: SupabaseClient,
  exercise: ExerciseRow,
  fuse: Fuse<AceExerciseSummary>,
  detailCache: Map<string, AceExerciseDetail>,
  options: CliOptions,
  tempDir: string
): Promise<{ matched: boolean; reason?: string }> {
  const rawName = exercise.name.trim()
  const searchName =
    NAME_OVERRIDES[rawName] !== undefined
      ? NAME_OVERRIDES[rawName]
      : normalizeExerciseNameForSearch(rawName)

  const result = fuse.search(searchName, { limit: 1 })[0]

  if (!result || result.score === undefined || result.score > MATCH_THRESHOLD) {
    return { matched: false, reason: 'No close ACE match found' }
  }

  const aceSummary = result.item

  // Skip ACE category/index pages (e.g., generic equipment or library pages);
  // we only want concrete exercise detail pages with numeric IDs.
  if (!isAceDetailUrl(aceSummary.url)) {
    return { matched: false, reason: 'Matched ACE index/equipment page only' }
  }

  // Delegate to processExerciseWithUrl for the actual processing
  return processExerciseWithUrl(supabase, exercise, aceSummary.url, detailCache, options, tempDir)
}

async function processExerciseWithUrl(
  supabase: SupabaseClient,
  exercise: ExerciseRow,
  aceUrl: string,
  detailCache: Map<string, AceExerciseDetail>,
  options: CliOptions,
  tempDir: string
): Promise<{ matched: boolean; reason?: string }> {
  // Check if this is actually an exercise detail page
  if (!isAceDetailUrl(aceUrl)) {
    return { matched: false, reason: 'Matched ACE index/equipment page only' }
  }

  let detail = detailCache.get(aceUrl)
  if (!detail) {
    try {
      detail = await scrapeAceExerciseDetail(aceUrl)
      detailCache.set(aceUrl, detail)
      await delay(DEFAULT_SCRAPE_DELAY_MS)
    } catch (error) {
      return { matched: false, reason: `Failed to scrape ACE page: ${(error as Error).message}` }
    }
  }

  const slug = toSlug(detail.name)
  const mediaPaths: { demoPath: string | null; thumbnailPath: string | null } = {
    demoPath: null,
    thumbnailPath: null
  }

  const uploadTasks: Array<() => Promise<void>> = []
  const downloadedFiles: string[] = []

  if (detail.media.demoUrl) {
    const download = await downloadMediaFile(detail.media.demoUrl, tempDir, slug, 'demo')
    if (download) {
      const storagePath = `ace/${slug}/demo.${download.filePath.split('.').pop()}`
      mediaPaths.demoPath = storagePath
      downloadedFiles.push(download.filePath)

      if (!options.dryRun) {
        uploadTasks.push(() =>
          uploadToSupabaseStorage({
            supabase,
            bucket: STORAGE_BUCKET,
            filePath: download.filePath,
            storagePath,
            contentType: download.contentType
          })
        )
      }
    }
  }

  if (detail.media.thumbnailUrl) {
    const download = await downloadMediaFile(detail.media.thumbnailUrl, tempDir, slug, 'thumbnail')
    if (download) {
      const storagePath = `ace/${slug}/thumbnail.${download.filePath.split('.').pop()}`
      mediaPaths.thumbnailPath = storagePath
      downloadedFiles.push(download.filePath)

      if (!options.dryRun) {
        uploadTasks.push(() =>
          uploadToSupabaseStorage({
            supabase,
            bucket: STORAGE_BUCKET,
            filePath: download.filePath,
            storagePath,
            contentType: download.contentType
          })
        )
      }
    }
  }

  if (!options.dryRun) {
    await runWithConcurrency(uploadTasks, DEFAULT_MAX_CONCURRENT_UPLOADS)
    const libraryId = await upsertExerciseLibraryEntry(supabase, detail, mediaPaths)
    await linkExerciseToLibrary(supabase, exercise.id, libraryId)
  } else {
    console.log(`   [dry-run] Would link exercise "${exercise.name}" to ACE entry "${detail.name}"`)
  }

  if (downloadedFiles.length > 0) {
    await cleanupFiles(downloadedFiles)
  }

  return { matched: true }
}

async function run() {
  const options = parseArgs(process.argv.slice(2))
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'ace-import-'))
  await ensureDirectoryExists(tempDir)

  console.log('📦 ACE Fitness import starting...')
  console.log(`   • Dry run: ${options.dryRun ? 'enabled' : 'disabled'}`)
  console.log(`   • Storage bucket: ${STORAGE_BUCKET}`)
  console.log(`   • Temp directory: ${tempDir}`)

  try {
    // Ensure bucket exists before starting
    if (!options.dryRun) {
      await ensureBucketExists(supabase, STORAGE_BUCKET)
    }

    const exercises = await fetchExistingExercises(supabase)
    console.log(`📋 Loaded ${exercises.length} unique exercises from database`)

    // Check for existing matches file first
    const matchesPath = path.join(process.cwd(), 'ace-matches.json')
    let aceMatches: AceMatch[] = []

    if (!options.forceScrape) {
      aceMatches = await loadAceMatchesFromFile(matchesPath)
      if (aceMatches.length > 0) {
        console.log(`📂 Loading ${aceMatches.length} matches from ace-matches.json`)
        console.log(`   (Use --force-scrape to re-scrape instead)`)
      }
    }

    let fuse: Fuse<AceExerciseSummary> | null = null
    let aceSummaries: AceExerciseSummary[] = []

    // Only scrape if no matches file or force-scrape flag is set
    if (aceMatches.length === 0 || options.forceScrape) {
      console.log('🔎 Scraping ACE Fitness exercise index...')
      aceSummaries = options.aceIndexFile
        ? await loadAceIndexFromFile(options.aceIndexFile)
        : await scrapeAceLibraryIndex()

      if (aceSummaries.length === 0) {
        console.warn('⚠️  No ACE exercises were discovered. Aborting.')
        return
      }

      fuse = new Fuse(aceSummaries, {
        includeScore: true,
        threshold: 0.4,
        keys: ['name']
      })
    }

    const detailCache = new Map<string, AceExerciseDetail>()
    const unmatched: Array<{ exercise: string; reason: string }> = []
    const matched: Array<{ exercise: string; aceName: string }> = []

    // Create a map of exercise name to ACE URL for quick lookup
    const matchesMap = new Map<string, string>()
    for (const match of aceMatches) {
      matchesMap.set(match.exerciseName, match.aceUrl)
    }

    // Filter exercises to only process those in matches (if using matches file)
    const exercisesToProcess =
      aceMatches.length > 0 && !options.forceScrape
        ? exercises.filter((ex) => matchesMap.has(ex.name))
        : exercises

    console.log(`\n📊 Processing ${exercisesToProcess.length} exercise(s)`)

    for (let i = 0; i < exercisesToProcess.length; i++) {
      const exercise = exercisesToProcess[i]
      const progress = `[${i + 1}/${exercisesToProcess.length}]`
      console.log(`\n${progress} Processing "${exercise.name}"`)

      try {
        let outcome: { matched: boolean; reason?: string }

        // Use direct URL from matches file if available
        if (matchesMap.has(exercise.name)) {
          const aceUrl = matchesMap.get(exercise.name)!
          console.log(`   ✓ Found ACE match in ace-matches.json`)
          outcome = await processExerciseWithUrl(
            supabase,
            exercise,
            aceUrl,
            detailCache,
            options,
            tempDir
          )
        } else if (fuse) {
          // Fall back to fuzzy matching if no direct match
          outcome = await processExercise(
            supabase,
            exercise,
            fuse,
            detailCache,
            options,
            tempDir
          )
        } else {
          outcome = { matched: false, reason: 'No match in ace-matches.json and scraping disabled' }
        }

        if (!outcome.matched) {
          unmatched.push({ exercise: exercise.name, reason: outcome.reason ?? 'Unknown reason' })
          console.log(`   ⚠️  ${outcome.reason ?? 'No match'}`)
        } else {
          const aceUrl = matchesMap.get(exercise.name) || ''
          const aceDetail = detailCache.get(aceUrl)
          matched.push({
            exercise: exercise.name,
            aceName: aceDetail?.name || 'Unknown'
          })
          console.log(`   ✅ Linked with ACE exercise: "${aceDetail?.name || 'Unknown'}"`)
        }
      } catch (error) {
        unmatched.push({
          exercise: exercise.name,
          reason: (error as Error).message
        })
        console.error(`   ❌ Failed: ${(error as Error).message}`)
      }

      await delay(DEFAULT_SCRAPE_DELAY_MS)
    }

    const skipped = exercises.length - exercisesToProcess.length

    console.log('\n📊 Import Summary:')
    console.log(`   ✅ Processed: ${matched.length}/${exercisesToProcess.length} matched exercises`)
    if (skipped > 0) {
      console.log(`   ⏭️  Skipped: ${skipped} unmatched exercises (not in ace-matches.json)`)
    }
    if (unmatched.length > 0) {
      console.log(`   ⚠️  Failed: ${unmatched.length} exercises`)
    }

    if (matched.length > 0) {
      console.log('\n✅ Successfully matched exercises:')
      for (const entry of matched) {
        console.log(`   • ${entry.exercise} → ${entry.aceName}`)
      }
    }

    if (unmatched.length > 0) {
      console.log('\n⚠️  The following exercises did not match ACE entries:')
      for (const entry of unmatched) {
        console.log(`   • ${entry.exercise} → ${entry.reason}`)
      }
      console.log(
        '\n💡 Tip: Many exercises may not exist in ACE library, or use different names.'
      )
      console.log(
        '   You can add manual overrides in NAME_OVERRIDES or search ACE manually for specific exercises.'
      )
    }

    if (!options.dryRun) {
      console.log('\n✅ ACE Fitness import completed.')
    } else {
      console.log('\nℹ️  ACE Fitness dry run finished (no database changes were made).')
    }
  } finally {
    try {
      await fs.rm(tempDir, { recursive: true, force: true })
    } catch (error) {
      console.warn(`⚠️  Failed to remove temporary directory ${tempDir}: ${(error as Error).message}`)
    }
  }
}

run().catch((error) => {
  console.error('❌ ACE Fitness import failed:', error)
  process.exitCode = 1
})

