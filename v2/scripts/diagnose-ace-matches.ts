import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'
import Fuse from 'fuse.js'
import puppeteer, { Browser } from 'puppeteer'

const ACE_LIBRARY_URL = 'https://www.acefitness.org/resources/everyone/exercise-library/'
const DEFAULT_SCRAPE_DELAY_MS = parseInt(process.env.ACE_SCRAPE_DELAY_MS ?? '1500', 10) || 1500

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms))

interface ExerciseRow {
  id: number
  name: string
  library_exercise_id: string | null
}

interface AceExerciseSummary {
  name: string
  url: string
}

async function fetchExistingExercises(supabase: ReturnType<typeof createClient>): Promise<ExerciseRow[]> {
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
    let noChangeCount = 0

    // Wait for initial content to load
    await delay(2000)

    while (loadMoreAttempts < 100 && noChangeCount < 5) {
      // Scroll to bottom multiple times to trigger lazy loading
      for (let i = 0; i < 3; i++) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })
        await delay(300)
      }

      // Try to click "Load more" button
      const clicked = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll<HTMLButtonElement>('button, a[role="button"]'))
        const target = buttons.find((btn) => {
          const text = (btn.textContent || '').toLowerCase()
          return (text.includes('load more') || 
                  text.includes('show more') || 
                  text.includes('see more') ||
                  text.includes('view all'))
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
        await delay(DEFAULT_SCRAPE_DELAY_MS)
        noChangeCount = 0 // Reset counter when we click
      } else {
        // Check if new content loaded
        await delay(1000)
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll<HTMLAnchorElement>('a[href*="/exercise-library/"]').length
        })

        if (currentCount === lastCount && lastCount > 0) {
          noChangeCount += 1
          if (noChangeCount >= 3) {
            console.log(` • No new content after ${noChangeCount} attempts, stopping`)
            break
          }
        } else {
          noChangeCount = 0
          console.log(` • Found ${currentCount} exercise links (was ${lastCount})`)
        }

        lastCount = currentCount
      }
    }

    if (loadMoreAttempts >= 100) {
      console.warn('⚠️  Reached max "Load more" attempts (100)')
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

function normalizeExerciseName(name: string): string {
  return name
    .toLowerCase()
    .replace(/\([^)]*\)/g, '') // Remove parentheticals like "(tempo)", "(heavy)"
    .replace(/\b(sl|single-leg|single leg)\b/gi, '')
    .replace(/\b(kb|kettlebell)\b/gi, 'kettlebell')
    .replace(/\b(db|dumbbell)\b/gi, 'dumbbell')
    .replace(/\b(oh|overhead)\b/gi, 'overhead')
    .replace(/\s+/g, ' ')
    .trim()
}

async function run() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.SUPABASE_SERVICE_ROLE_KEY as string
  )

  console.log('🔍 ACE Fitness Match Diagnostic\n')

  const exercises = await fetchExistingExercises(supabase)
  console.log(`📋 Loaded ${exercises.length} unique exercises from database\n`)

  const aceSummaries = await scrapeAceLibraryIndex()

  if (aceSummaries.length === 0) {
    console.warn('⚠️  No ACE exercises were discovered.')
    return
  }

  console.log(`\n📝 Sample ACE exercises found (first 20):`)
  aceSummaries.slice(0, 20).forEach((ace, idx) => {
    console.log(`   ${idx + 1}. ${ace.name}`)
  })
  if (aceSummaries.length > 20) {
    console.log(`   ... and ${aceSummaries.length - 20} more`)
  }

  const fuse = new Fuse(aceSummaries, {
    includeScore: true,
    threshold: 0.5,
    keys: ['name']
  })

  console.log(`\n🔍 Testing matches with threshold 0.5...\n`)

  const matches: Array<{ exercise: string; aceName: string; score: number; url: string }> = []
  const noMatches: string[] = []

  for (const exercise of exercises) {
    const normalizedName = normalizeExerciseName(exercise.name)
    const result = fuse.search(normalizedName, { limit: 1 })[0]

    if (result && result.score !== undefined && result.score <= 0.5) {
      matches.push({
        exercise: exercise.name,
        aceName: result.item.name,
        score: result.score,
        url: result.item.url
      })
    } else {
      noMatches.push(exercise.name)
    }
  }

  console.log(`\n✅ Potential Matches (${matches.length}):`)
  matches
    .sort((a, b) => a.score - b.score)
    .forEach((match, idx) => {
      console.log(`   ${idx + 1}. "${match.exercise}" → "${match.aceName}" (score: ${match.score.toFixed(3)})`)
      console.log(`      URL: ${match.url}`)
    })

  console.log(`\n⚠️  No Matches (${noMatches.length}):`)
  noMatches.slice(0, 20).forEach((name, idx) => {
    console.log(`   ${idx + 1}. ${name}`)
  })
  if (noMatches.length > 20) {
    console.log(`   ... and ${noMatches.length - 20} more`)
  }

  // Check what's in exercise_library
  console.log(`\n📊 Checking exercise_library table...`)
  const { data: libraryEntries, error: libraryError } = await supabase
    .from('exercise_library')
    .select('name, demo_file_path, thumbnail_path')
    .order('name')

  if (libraryError) {
    console.error(`   ❌ Error: ${libraryError.message}`)
  } else {
    console.log(`   ✅ Found ${libraryEntries?.length || 0} entries in exercise_library`)
    if (libraryEntries && libraryEntries.length > 0) {
      console.log(`\n   Sample entries:`)
      libraryEntries.slice(0, 10).forEach((entry, idx) => {
        console.log(`   ${idx + 1}. ${entry.name}`)
        console.log(`      Demo: ${entry.demo_file_path || 'none'}`)
        console.log(`      Thumbnail: ${entry.thumbnail_path || 'none'}`)
      })
    }
  }
}

run().catch((error) => {
  console.error('❌ Diagnostic failed:', error)
  process.exitCode = 1
})

