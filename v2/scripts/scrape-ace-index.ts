import 'dotenv/config'

import { promises as fs } from 'fs'
import { load } from 'cheerio'
import puppeteer, { Browser } from 'puppeteer'
import { compareTwoStrings } from 'string-similarity'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

const ACE_LIBRARY_URL = 'https://www.acefitness.org/resources/everyone/exercise-library/'
const REQUEST_DELAY_MS = 200
const CONCURRENT_REQUESTS = 5
const MIN_MATCH_SCORE = 0.65

// Manual mappings for exercises that don't match automatically
const MANUAL_MAPPINGS: Record<string, string> = {
  'Clamshells': 'Clamshell',
  'Monster walks': 'Monster Walk',
  'Pallof Press': 'Pallof Press',
  'Dead bugs': 'Dead Bug',
  'Glute bridges': 'Glute Bridge',
  'Goblet Squats': 'Goblet Squat',
  'Goblet Squat': 'Goblet Squat',
  'Push-ups': 'Pushup',
  'Plyometric Push-ups': 'Plyometric Push-up',
  'Russian twists': 'Russian Twist',
  'Side plank': 'Side Plank',
  'Flutter kicks': 'Flutter Kick',
  'Calf Raises': 'Calf Raise',
  'Calf raises (bent knee)': 'Calf Raise',
  'Calf Raises (deficit)': 'Calf Raise',
  'Single-leg Calf Raise (deficit)': 'Calf Raise',
  'SL Calf Raise (deficit)': 'Calf Raise',
  'Eccentric Calf Raises (SL)': 'Calf Raise',
  'Inverted Rows': 'Inverted Row',
  'Negative Pull-ups': 'Negative Pull-up',
  'Assisted Pull-ups (light band)': 'Assisted Pull-up',
  'Assisted Pull-ups (lightest band)': 'Assisted Pull-up',
  'Assisted Pull-ups (thick band)': 'Assisted Pull-up',
  'Overhead Press': 'Overhead Press',
  'OH Press': 'Overhead Press',
  'OH Press (standing)': 'Overhead Press',
  'Bench Press': 'Chest Press',
  'Bent-over Barbell Row': 'Bent-Over Row',
  'Barbell Row (explosive)': 'Bent-Over Row',
  'DB Row': 'Dumbbell Row',
  'DB Row (single-arm)': 'Dumbbell Row',
  'Dumbbell Row (single-arm)': 'Dumbbell Row',
  'Bulgarian Split Squat': 'Bulgarian Split Squat',
  'Bulgarian Split Squat (tempo)': 'Bulgarian Split Squat',
  'Bosu Squats': 'BOSU® Squat Jumps',
  'Bosu balance': 'BOSU Balance',
  'Bosu single-leg balance': 'BOSU Balance',
  'Single-leg Balance (eyes closed)': 'Single-Leg Balance',
  'SL Balance': 'Single-Leg Balance',
  'Single-leg Hops': 'Single-Leg Hop',
  'SL Hops': 'Single-Leg Hop',
  'Single-leg RDL': 'Single-Leg Romanian Deadlift',
  'SL RDL': 'Single-Leg Romanian Deadlift',
  'SL Deadlift (unstable)': 'Single-Leg Romanian Deadlift',
  'Single-leg Calf Raise (deficit)': 'Single-Leg Calf Raise',
  'Eccentric Step-downs': 'Step-Down',
  'Eccentric Step-downs (from box)': 'Step-Down',
  'Lateral Step-downs': 'Step-Down',
  'Step-ups (20in box)': 'Step-Up',
  'Box Jumps (step down controlled)': 'Box Jumps',
  'Lateral Skaters': 'Lateral Skater',
  'Lateral bounds': 'Lateral Bound',
  'KB Swings': 'Kettlebell Swing',
  'Farmer Carry': 'Farmer Walk',
  "Farmer's Carry": 'Farmer Walk',
  'Farmers Carry': 'Farmer Walk',
  'Farmers Carry (heavy)': 'Farmer Walk',
  'Suitcase Carry': 'Suitcase Carry',
  'Suitcase carry (heavy)': 'Suitcase Carry',
  'Hex Bar Deadlift': 'Trap Bar Deadlift',
  'Glute-Ham Curl': 'Glute-Ham Raise',
  'Landmine Press': 'Landmine Press',
  'Face Pulls': 'Face Pull',
  'Band pull-aparts': 'Band Pull-Apart',
  'Banded ankle eversion/inversion': 'Ankle Eversion',
  'Banded dorsiflexion': 'Ankle Dorsiflexion',
  'Toe towel grabs': 'Toe Yoga',
  'Plank w/ shoulder taps': 'Plank with Shoulder Tap',
  'Side plank w/ leg lift': 'Side Plank with Leg Lift',
  'Plank (weighted)': 'Plank',
  'Pallof press (explosive)': 'Pallof Press',
  'Med Ball Chest Pass': 'Medicine Ball Chest Pass'
}

interface AceExercise {
  name: string
  url: string
  id: number
  category?: string
}

interface ExerciseRow {
  id: number
  name: string
}

interface MatchResult {
  exerciseName: string
  aceName: string
  url: string
  score: number
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

async function scrapeAceIndexPage(): Promise<AceExercise[]> {
  console.log('🔎 Scraping ACE Fitness exercise index...\n')

  let browser: Browser | null = null
  try {
    browser = await puppeteer.launch({
      headless: 'new'
    })

    const page = await browser.newPage()
    await page.setViewport({ width: 1920, height: 1080 })
    await page.goto(ACE_LIBRARY_URL, { waitUntil: 'networkidle2', timeout: 30000 })

    console.log('📄 Page loaded, extracting exercises...')

    // Wait for initial content
    await delay(2000)

    let loadMoreAttempts = 0
    let lastCount = 0
    let noChangeCount = 0

    // Try to load all exercises by clicking "Load more" or scrolling
    while (loadMoreAttempts < 100 && noChangeCount < 5) {
      // Scroll to bottom multiple times
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })
        await delay(300)
      }

      // Try to click "Load more" button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(
          document.querySelectorAll<HTMLButtonElement>('button, a[role="button"]')
        )
        const target = buttons.find((btn) => {
          const text = (btn.textContent || '').toLowerCase()
          return (
            text.includes('load more') ||
            text.includes('show more') ||
            text.includes('see more') ||
            text.includes('view all')
          )
        })

        if (target && !target.disabled && target.offsetParent !== null) {
          target.scrollIntoView({ behavior: 'auto', block: 'center' })
          target.click()
          return true
        }
        return false
      })

      if (clicked) {
        loadMoreAttempts += 1
        console.log(` • Clicking "Load more" (attempt ${loadMoreAttempts})`)
        await delay(REQUEST_DELAY_MS * 2)
        noChangeCount = 0
      } else {
        // Check if new content loaded
        await delay(1000)
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll<HTMLAnchorElement>(
            'a[href*="/exercise-library/"]'
          ).length
        })

        if (currentCount === lastCount && lastCount > 0) {
          noChangeCount += 1
          if (noChangeCount >= 3) {
            console.log(` • No new content after ${noChangeCount} attempts, stopping`)
            break
          }
        } else {
          noChangeCount = 0
          if (currentCount > lastCount) {
            console.log(` • Found ${currentCount} exercise links (was ${lastCount})`)
          }
        }

        lastCount = currentCount
      }
    }

    // Extract all exercise links
    console.log('\n📋 Extracting exercise data...')
    const exercises = await page.evaluate(() => {
      const anchorElements = Array.from(
        document.querySelectorAll<HTMLAnchorElement>('a[href*="/exercise-library/"]')
      )

      const seen = new Map<string, AceExercise>()

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

        const exerciseId = parseInt(exerciseIdMatch[1], 10)

        // Skip "Learn More" or generic links
        const linkText = (anchor.textContent || anchor.innerText || '').trim().toLowerCase()
        if (linkText === 'learn more' || linkText === 'view details' || linkText.length < 2) {
          continue
        }

        // Try to find the exercise name
        let exerciseName = ''

        // First, try to find a heading within the anchor or its parent container
        const parent = anchor.closest('article, div, section, li')
        if (parent) {
          const heading = parent.querySelector('h1, h2, h3, h4, strong')
          if (heading) {
            const headingText = (heading.textContent || '').trim()
            // Clean up the heading text - remove metadata lines
            const lines = headingText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
            for (const line of lines) {
              const lower = line.toLowerCase()
              if (
                !lower.includes('body part:') &&
                !lower.includes('equipment:') &&
                !lower.includes('difficulty:') &&
                !lower.includes('view details') &&
                line.length > 2 &&
                line.length < 100
              ) {
                exerciseName = line
                break
              }
            }
          }
        }

        // Fallback: use anchor text, but clean it up
        if (!exerciseName) {
          const anchorText = (anchor.textContent || anchor.innerText || '').trim()
          const lines = anchorText.split('\n').map((l) => l.trim()).filter((l) => l.length > 0)
          for (const line of lines) {
            const lower = line.toLowerCase()
            if (
              !lower.includes('body part:') &&
              !lower.includes('equipment:') &&
              !lower.includes('difficulty:') &&
              !lower.includes('view details') &&
              !lower.includes('learn more') &&
              line.length > 2 &&
              line.length < 100
            ) {
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
              .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
              .join(' ')
          }
        }

        if (!exerciseName || exerciseName.length < 2) {
          continue
        }

        const url = href.startsWith('http') ? href : new URL(href, window.location.origin).toString()
        const normalizedUrl = url.split('?')[0]

        if (!seen.has(normalizedUrl)) {
          seen.set(normalizedUrl, {
            name: exerciseName,
            url: normalizedUrl,
            id: exerciseId
          })
        }
      }

      return Array.from(seen.values())
    })

    console.log(`✅ Found ${exercises.length} exercises from index page`)
    return exercises
  } finally {
    if (browser) {
      await browser.close()
    }
  }
}

async function scrapeAceByIDRange(): Promise<AceExercise[]> {
  console.log('🔎 Scraping ACE exercises by ID range (1-500)...\n')
  console.log('⚠️  This will take ~10-15 minutes but ensures complete coverage\n')

  const exercises: AceExercise[] = []
  const seen = new Map<string, AceExercise>()

  // Test IDs 1-500 in parallel batches
  const totalIds = 500
  const batches: number[][] = []

  for (let i = 1; i <= totalIds; i += CONCURRENT_REQUESTS) {
    const batch = []
    for (let j = 0; j < CONCURRENT_REQUESTS && i + j <= totalIds; j++) {
      batch.push(i + j)
    }
    batches.push(batch)
  }

  console.log(`📦 Testing ${totalIds} IDs in ${batches.length} batches of ${CONCURRENT_REQUESTS}...\n`)

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i]
    const progress = `[${i + 1}/${batches.length}]`

    const results = await Promise.all(
      batch.map(async (id) => {
        const url = `${ACE_LIBRARY_BASE}/${id}/`
        try {
          const response = await axios.get(url, {
            responseType: 'text',
            timeout: 10000,
            validateStatus: (status) => status < 500
          })

          if (response.status === 404) {
            return null
          }

          if (response.status !== 200) {
            return null
          }

          const $ = load(response.data)
          let name = $('h1').first().text().trim()

          if (!name || name.length > 100 || name.toLowerCase().includes('exercise library')) {
            name = $('h2').first().text().trim()
          }

          // Clean up the name
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
                name = line
                break
              }
            }
          }

          if (!name || name.length < 2) {
            return null
          }

          return {
            name,
            url,
            id
          }
        } catch {
          return null
        }
      })
    )

    const found = results.filter((r): r is AceExercise => r !== null)
    for (const exercise of found) {
      if (!seen.has(exercise.url)) {
        seen.set(exercise.url, exercise)
        exercises.push(exercise)
      }
    }

    if (found.length > 0) {
      console.log(`${progress} Found ${found.length} exercises (total: ${exercises.length})`)
    } else if (i % 10 === 0) {
      process.stdout.write(`\r${progress} Testing... (found: ${exercises.length})`)
    }

    // Rate limiting between batches
    if (i < batches.length - 1) {
      await delay(REQUEST_DELAY_MS)
    }
  }

  console.log(`\n✅ Found ${exercises.length} total exercises`)
  return exercises
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

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function generateNameVariations(name: string): string[] {
  const variations: Set<string> = new Set([name])

  // Remove parentheticals
  const withoutParens = name.replace(/\([^)]*\)/g, '').trim()
  if (withoutParens && withoutParens !== name) {
    variations.add(withoutParens)
  }

  // Singular/plural variations
  if (name.endsWith('s') && !name.endsWith('ss')) {
    variations.add(name.slice(0, -1))
  } else if (!name.endsWith('s')) {
    variations.add(`${name}s`)
  }

  // Common abbreviation expansions
  const expanded = name
    .replace(/\bRDL\b/gi, 'Romanian Deadlift')
    .replace(/\bSL\b/gi, 'Single-leg')
    .replace(/\bDB\b/gi, 'Dumbbell')
    .replace(/\bOH\b/gi, 'Overhead')
    .replace(/\bKB\b/gi, 'Kettlebell')
    .replace(/\bSL\s+/gi, 'Single-leg ')

  if (expanded !== name) {
    variations.add(expanded)
  }

  // Remove common qualifiers
  const withoutQualifiers = name
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/\s*(tempo|heavy|light|lightest|thick|banded|unstable|explosive|deficit|bent knee|from box|20in box|eyes closed|step down controlled)\s*/gi, '')
    .trim()

  if (withoutQualifiers && withoutQualifiers !== name) {
    variations.add(withoutQualifiers)
  }

  return Array.from(variations)
}

interface ReviewRow {
  ourExercise: string
  bestAceMatch: string
  score: number
  aceUrl: string
  action: string
}

function matchExercises(
  dbExercises: ExerciseRow[],
  aceExercises: AceExercise[]
): {
  matches: MatchResult[]
  noMatch: string[]
  review: ReviewRow[]
} {
  console.log('\n🔍 Matching exercises...\n')

  const matches: MatchResult[] = []
  const noMatch: string[] = []
  const review: ReviewRow[] = []

  for (const dbExercise of dbExercises) {
    // Check manual mapping first
    const manualMatch = MANUAL_MAPPINGS[dbExercise.name]
    if (manualMatch) {
      const aceMatch = aceExercises.find(
        (ace) => normalizeName(ace.name) === normalizeName(manualMatch)
      )
      if (aceMatch) {
        matches.push({
          exerciseName: dbExercise.name,
          aceName: aceMatch.name,
          url: aceMatch.url,
          score: 1.0 // Manual match gets perfect score
        })
        console.log(
          `✓ ${dbExercise.name} → ${aceMatch.name} (100% - manual mapping)`
        )
        review.push({
          ourExercise: dbExercise.name,
          bestAceMatch: aceMatch.name,
          score: 100,
          aceUrl: aceMatch.url,
          action: 'MANUAL_MAPPING'
        })
        continue
      }
    }

    // Try name variations
    const nameVariations = generateNameVariations(dbExercise.name)
    let bestMatch: { ace: AceExercise; score: number } | null = null

    for (const variation of nameVariations) {
      const normalizedVariation = normalizeName(variation)

      // Find best match for this variation
      const scored = aceExercises.map((ace) => {
        const normalizedAce = normalizeName(ace.name)
        const score = compareTwoStrings(normalizedVariation, normalizedAce)
        return { ace, score }
      })

      const topMatch = scored
        .filter((m) => m.score >= MIN_MATCH_SCORE)
        .sort((a, b) => b.score - a.score)[0]

      if (topMatch && (!bestMatch || topMatch.score > bestMatch.score)) {
        bestMatch = topMatch
      }
    }

    if (bestMatch) {
      matches.push({
        exerciseName: dbExercise.name,
        aceName: bestMatch.ace.name,
        url: bestMatch.ace.url,
        score: bestMatch.score
      })
      const scorePercent = (bestMatch.score * 100).toFixed(0)
      console.log(
        `✓ ${dbExercise.name} → ${bestMatch.ace.name} (${scorePercent}%)`
      )

      // Add to review if score is borderline
      if (bestMatch.score < 0.8) {
        review.push({
          ourExercise: dbExercise.name,
          bestAceMatch: bestMatch.ace.name,
          score: Math.round(bestMatch.score * 100),
          aceUrl: bestMatch.ace.url,
          action: 'REVIEW_MATCH'
        })
      } else {
        review.push({
          ourExercise: dbExercise.name,
          bestAceMatch: bestMatch.ace.name,
          score: Math.round(bestMatch.score * 100),
          aceUrl: bestMatch.ace.url,
          action: 'AUTO_MATCHED'
        })
      }
    } else {
      noMatch.push(dbExercise.name)
      console.log(`✗ ${dbExercise.name} → No match`)

      // Find closest match even if below threshold for review
      const allScored = aceExercises.map((ace) => {
        const normalizedAce = normalizeName(ace.name)
        const score = compareTwoStrings(
          normalizeName(dbExercise.name),
          normalizedAce
        )
        return { ace, score }
      })

      const closest = allScored.sort((a, b) => b.score - a.score)[0]

      review.push({
        ourExercise: dbExercise.name,
        bestAceMatch: closest && closest.score > 0.3 ? closest.ace.name : 'No match',
        score: closest ? Math.round(closest.score * 100) : 0,
        aceUrl: closest && closest.score > 0.3 ? closest.ace.url : '',
        action: 'NEEDS_MANUAL'
      })
    }
  }

  return { matches, noMatch, review }
}

async function run() {
  const args = process.argv.slice(2)
  const useIdRange = args.includes('--use-id-range')

  console.log('🚀 ACE Fitness Index Scraper\n')

  // Try to load existing index
  let aceExercises: AceExercise[] = []
  try {
    const existing = await fs.readFile('ace-full-index.json', 'utf8')
    aceExercises = JSON.parse(existing)
    console.log(`📂 Loaded ${aceExercises.length} exercises from ace-full-index.json`)
    console.log('   (Use --use-id-range to re-scrape)\n')
  } catch {
    // No existing file, need to scrape
    if (useIdRange) {
      aceExercises = await scrapeAceByIDRange()
    } else {
      aceExercises = await scrapeAceIndexPage()

      // If we got very few exercises from index page, fall back to ID range
      if (aceExercises.length < 50) {
        console.log(
          `\n⚠️  Only found ${aceExercises.length} exercises from index page.`
        )
        console.log('   Falling back to ID range scraping...\n')
        aceExercises = await scrapeAceByIDRange()
      }
    }

    // Save the full index
    await fs.writeFile('ace-full-index.json', JSON.stringify(aceExercises, null, 2))
    console.log(`\n💾 Saved ${aceExercises.length} exercises to ace-full-index.json`)
  }

  // Now match against our exercises
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const dbExercises = await fetchAllExercises(supabase)
  console.log(`\n📋 Found ${dbExercises.length} exercises in database\n`)

  const { matches, noMatch, review } = matchExercises(dbExercises, aceExercises)

  // Save matches
  const matchesMap: Record<string, string> = {}
  for (const match of matches) {
    matchesMap[match.exerciseName] = match.url
  }
  await fs.writeFile('ace-matches.json', JSON.stringify(matchesMap, null, 2))
  console.log(`\n💾 Saved ${matches.length} matches to ace-matches.json`)

  // Save no matches
  if (noMatch.length > 0) {
    const noMatchText = `Exercises without ACE matches:\n\n${noMatch.map((name) => `- ${name}`).join('\n')}\n`
    await fs.writeFile('ace-no-match.txt', noMatchText)
    console.log(`💾 Saved ${noMatch.length} unmatched exercises to ace-no-match.txt`)
  }

  // Save review CSV
  const csvHeader = 'Our Exercise,Best ACE Match,Score,ACE URL,Action\n'
  const csvRows = review
    .map(
      (row) =>
        `"${row.ourExercise}","${row.bestAceMatch}",${row.score}%,"${row.aceUrl}","${row.action}"`
    )
    .join('\n')
  await fs.writeFile('ace-review.csv', csvHeader + csvRows)
  console.log(`💾 Saved review data to ace-review.csv`)

  // Summary
  console.log(`\n📊 Results:`)
  console.log(`   ✅ Matched: ${matches.length}/${dbExercises.length} exercises`)
  console.log(`   ⚠️  Unmatched: ${noMatch.length} exercises`)

  if (matches.length > 0) {
    console.log(`\n✅ Top matches:`)
    matches
      .sort((a, b) => b.score - a.score)
      .slice(0, 10)
      .forEach((match) => {
        console.log(
          `   • ${match.exerciseName} → ${match.aceName} (${(match.score * 100).toFixed(0)}%)`
        )
      })
  }
}

const ACE_LIBRARY_BASE = 'https://www.acefitness.org/resources/everyone/exercise-library'

run().catch((error) => {
  console.error('\n❌ Scraping failed:', error)
  process.exitCode = 1
})

