import 'dotenv/config'

import { promises as fs } from 'fs'
import { createClient } from '@supabase/supabase-js'
import { load } from 'cheerio'
import { compareTwoStrings } from 'string-similarity'
import axios from 'axios'

const ACE_BASE_URL = 'https://www.acefitness.org'
const ACE_LIBRARY_BASE = `${ACE_BASE_URL}/resources/everyone/exercise-library`
const REQUEST_DELAY_MS = 200
const MAX_ID_TO_TEST = 200
const MAX_CONSECUTIVE_FAILURES = 3
const MIN_SIMILARITY_THRESHOLD = 0.8
const CONCURRENT_REQUESTS = 5
const COMMON_EXERCISE_ID_RANGE = 100 // Test 1-100 first, then 101-200 if needed

interface ExerciseRow {
  id: number
  name: string
}

interface DiscoveredUrl {
  exerciseName: string
  url: string
  similarity: number
  aceName: string
}

function generateSlugVariations(exerciseName: string): string[] {
  const variations: Set<string> = new Set()

  // Base slug: lowercase, spaces to hyphens, remove special chars
  const base = exerciseName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  variations.add(base)

  // Remove common suffixes
  const withoutSuffix = base.replace(/-(s|es|ing|ed)$/, '')
  if (withoutSuffix !== base) {
    variations.add(withoutSuffix)
  }

  // Handle abbreviations
  const expanded = base
    .replace(/\b(sl|single-leg|single leg)\b/g, 'single-leg')
    .replace(/\b(rdl|romanian-deadlift)\b/g, 'romanian-deadlift')
    .replace(/\b(db|dumbbell)\b/g, 'dumbbell')
    .replace(/\b(kb|kettlebell)\b/g, 'kettlebell')
    .replace(/\b(oh|overhead)\b/g, 'overhead')

  if (expanded !== base) {
    variations.add(expanded)
  }

  // Handle plural/singular
  if (base.endsWith('s')) {
    variations.add(base.slice(0, -1))
  } else {
    variations.add(`${base}s`)
  }

  // Remove parentheticals and try again
  const withoutParens = exerciseName
    .replace(/\([^)]*\)/g, '')
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')

  if (withoutParens && withoutParens !== base) {
    variations.add(withoutParens)
  }

  return Array.from(variations).filter((slug) => slug.length > 0)
}

async function extractExerciseNameFromPage(html: string): Promise<string | null> {
  const $ = load(html)

  // Try h1 first
  let name = $('h1').first().text().trim()

  // If h1 is empty or looks like metadata, try h2
  if (!name || name.length > 100 || name.toLowerCase().includes('exercise library')) {
    name = $('h2').first().text().trim()
  }

  // Clean up the name - remove metadata lines
  if (name) {
    const lines = name.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
    for (const line of lines) {
      const lower = line.toLowerCase()
      if (
        !lower.includes('body part:') &&
        !lower.includes('equipment:') &&
        !lower.includes('difficulty:') &&
        !lower.includes('view details') &&
        !lower.includes('exercise library') &&
        line.length > 2 &&
        line.length < 100
      ) {
        return line
      }
    }
  }

  // Fallback: try title tag
  const title = $('title').text().trim()
  if (title && !title.toLowerCase().includes('exercise library')) {
    const titleMatch = title.match(/^([^|]+)/)
    if (titleMatch) {
      return titleMatch[1].trim()
    }
  }

  return null
}

async function validateACEUrl(
  exerciseName: string,
  url: string
): Promise<{ isValid: boolean; aceName: string | null; similarity: number }> {
  try {
    const response = await axios.get(url, {
      responseType: 'text',
      timeout: 10000,
      validateStatus: (status) => status < 500 // Accept 404s, but not server errors
    })

    if (response.status === 404) {
      return { isValid: false, aceName: null, similarity: 0 }
    }

    if (response.status !== 200) {
      return { isValid: false, aceName: null, similarity: 0 }
    }

    const aceName = await extractExerciseNameFromPage(response.data)

    if (!aceName) {
      return { isValid: false, aceName: null, similarity: 0 }
    }

    // Normalize both names for comparison
    const normalize = (str: string) =>
      str
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim()

    const normalizedExercise = normalize(exerciseName)
    const normalizedACE = normalize(aceName)

    const similarity = compareTwoStrings(normalizedExercise, normalizedACE)

    return {
      isValid: similarity >= MIN_SIMILARITY_THRESHOLD,
      aceName,
      similarity
    }
  } catch (error) {
    // Network errors, timeouts, etc.
    return { isValid: false, aceName: null, similarity: 0 }
  }
}

async function testUrlBatch(
  exerciseName: string,
  slug: string,
  idStart: number,
  idEnd: number
): Promise<DiscoveredUrl | null> {
  const urls: Array<{ id: number; url: string }> = []
  for (let id = idStart; id <= idEnd; id++) {
    urls.push({ id, url: `${ACE_LIBRARY_BASE}/${id}/${slug}/` })
  }

  let consecutiveFailures = 0

  // Test URLs in parallel batches
  for (let i = 0; i < urls.length; i += CONCURRENT_REQUESTS) {
    const batch = urls.slice(i, i + CONCURRENT_REQUESTS)
    const results = await Promise.all(
      batch.map((item) => validateACEUrl(exerciseName, item.url))
    )

    // Check if any result is valid
    for (let j = 0; j < results.length; j++) {
      if (results[j].isValid) {
        return {
          exerciseName,
          url: batch[j].url,
          similarity: results[j].similarity,
          aceName: results[j].aceName || exerciseName
        }
      }
    }

    // Check for consecutive failures across the batch
    for (let j = 0; j < results.length; j++) {
      if (!results[j].aceName) {
        // 404 - no page found
        consecutiveFailures++
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          // Stop testing this slug if we hit too many consecutive 404s
          return null
        }
      } else {
        // Page exists (even if name doesn't match) - reset counter
        consecutiveFailures = 0
      }
    }

    // Rate limiting between batches
    if (i + CONCURRENT_REQUESTS < urls.length) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS))
    }
  }

  return null
}

async function discoverURLForExercise(
  exerciseName: string,
  progressCallback?: (message: string) => void
): Promise<DiscoveredUrl | null> {
  const slugVariations = generateSlugVariations(exerciseName)

  for (const slug of slugVariations) {
    // First, test common ID range (1-100)
    if (progressCallback) {
      progressCallback(`  Testing IDs 1-${COMMON_EXERCISE_ID_RANGE}...`)
    }

    const commonResult = await testUrlBatch(
      exerciseName,
      slug,
      1,
      COMMON_EXERCISE_ID_RANGE
    )

    if (commonResult) {
      return commonResult
    }

    // If not found in common range, test extended range (101-200)
    if (progressCallback) {
      progressCallback(`  Testing IDs ${COMMON_EXERCISE_ID_RANGE + 1}-${MAX_ID_TO_TEST}...`)
    }

    const extendedResult = await testUrlBatch(
      exerciseName,
      slug,
      COMMON_EXERCISE_ID_RANGE + 1,
      MAX_ID_TO_TEST
    )

    if (extendedResult) {
      return extendedResult
    }
  }

  return null
}

async function fetchAllExercises(
  supabase: ReturnType<typeof createClient>
): Promise<ExerciseRow[]> {
  const { data, error } = await supabase
    .from('exercises')
    .select('id, name')
    .order('name')

  if (error) {
    throw new Error(`Failed to fetch exercises: ${error.message}`)
  }

  if (!data) {
    return []
  }

  // Deduplicate by name (case-insensitive)
  const seen = new Map<string, ExerciseRow>()

  for (const row of data as ExerciseRow[]) {
    const normalized = row.name.trim().toLowerCase()
    if (!seen.has(normalized)) {
      seen.set(normalized, row)
    }
  }

  return Array.from(seen.values())
}

function parseArgs(): { resume: boolean; startFrom?: string } {
  const args = process.argv.slice(2)
  const resume = args.includes('--resume')
  const startFromIndex = args.findIndex((arg) => arg.startsWith('--start-from='))
  const startFrom = startFromIndex >= 0 ? args[startFromIndex].split('=')[1] : undefined

  return { resume, startFrom }
}

async function loadProgress(): Promise<{ discovered: DiscoveredUrl[]; lastExercise?: string }> {
  try {
    const foundData = await fs.readFile('ace-urls-found.json', 'utf8')
    const foundMap = JSON.parse(foundData) as Record<string, string>

    const discovered: DiscoveredUrl[] = []
    for (const [exerciseName, url] of Object.entries(foundMap)) {
      discovered.push({
        exerciseName,
        url,
        similarity: 1.0, // Assume good match if already found
        aceName: exerciseName
      })
    }

    return { discovered }
  } catch {
    return { discovered: [] }
  }
}

async function run() {
  const args = parseArgs()
  const startTime = Date.now()

  console.log('🔍 Discovering ACE Fitness URLs...\n')

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const exercises = await fetchAllExercises(supabase)
  console.log(`📋 Found ${exercises.length} unique exercises\n`)

  let discovered: DiscoveredUrl[] = []
  let startIndex = 0

  if (args.resume) {
    const progress = await loadProgress()
    discovered = progress.discovered
    const foundNames = new Set(discovered.map((d) => d.exerciseName))

    if (args.startFrom) {
      startIndex = exercises.findIndex((e) => e.name === args.startFrom)
      if (startIndex < 0) startIndex = 0
    } else {
      // Find first exercise not in discovered list
      startIndex = exercises.findIndex((e) => !foundNames.has(e.name))
      if (startIndex < 0) {
        console.log('✅ All exercises already discovered!')
        return
      }
    }

    console.log(`📂 Resuming from exercise ${startIndex + 1}/${exercises.length} (${exercises[startIndex].name})\n`)
  }

  const missing: string[] = []

  for (let i = startIndex; i < exercises.length; i++) {
    const exercise = exercises[i]
    const progress = `[${i + 1}/${exercises.length}]`
    const elapsed = Math.floor((Date.now() - startTime) / 1000 / 60)
    const avgTimePerExercise = elapsed / Math.max(1, i - startIndex)
    const remaining = Math.ceil(avgTimePerExercise * (exercises.length - i - 1))
    const foundCount = discovered.length

    console.log(`\n${progress} Testing: "${exercise.name}"`)
    console.log(`⏱️  Elapsed: ${elapsed}m | ETA: ${remaining}m | Found: ${foundCount}/${i + 1}`)

    const result = await discoverURLForExercise(exercise.name, (msg) => {
      process.stdout.write(`\r${progress} ${msg}`)
    })

    if (result) {
      console.log(
        `\r${progress} ✓ Found: ${result.url} (${(result.similarity * 100).toFixed(0)}% match → "${result.aceName}")`
      )
      discovered.push(result)

      // Save progress incrementally
      const foundMap: Record<string, string> = {}
      for (const item of discovered) {
        foundMap[item.exerciseName] = item.url
      }
      await fs.writeFile('ace-urls-found.json', JSON.stringify(foundMap, null, 2))
    } else {
      console.log(`\r${progress} ✗ Not found`)
      missing.push(exercise.name)
    }

    // Rate limiting between exercises
    if (i < exercises.length - 1) {
      await new Promise((resolve) => setTimeout(resolve, REQUEST_DELAY_MS))
    }
  }

  // Prepare output
  const foundMap: Record<string, string> = {}
  for (const item of discovered) {
    foundMap[item.exerciseName] = item.url
  }

  // Write JSON file
  await fs.writeFile('ace-urls-found.json', JSON.stringify(foundMap, null, 2))
  console.log(`\n💾 Saved ${discovered.length} URLs to ace-urls-found.json`)

  // Write missing exercises file
  if (missing.length > 0) {
    const missingText = `Exercises without ACE URLs (manual lookup needed):\n\n${missing.map((name) => `- ${name}`).join('\n')}\n`
    await fs.writeFile('ace-urls-missing.txt', missingText)
    console.log(`💾 Saved ${missing.length} missing exercises to ace-urls-missing.txt`)
  }

  // Summary
  console.log(`\n📊 Results:`)
  console.log(`   ✅ Found: ${discovered.length}/${exercises.length} exercises`)
  console.log(`   ⚠️  Missing: ${missing.length} exercises`)

  if (discovered.length > 0) {
    console.log(`\n✅ Top matches:`)
    discovered
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 10)
      .forEach((item) => {
        console.log(`   • ${item.exerciseName} → ${item.aceName} (${(item.similarity * 100).toFixed(0)}%)`)
      })
  }
}

run().catch((error) => {
  console.error('\n❌ Discovery failed:', error)
  process.exitCode = 1
})

