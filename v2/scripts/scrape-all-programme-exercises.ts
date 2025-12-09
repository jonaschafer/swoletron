import 'dotenv/config'
import puppeteer from 'puppeteer'
import * as fs from 'fs'
import { compareTwoStrings } from 'string-similarity'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

interface ProgrammeExercise {
  name: string
  url: string
  slug: string
  id: number
}

async function scrapeAllProgrammeExercises(): Promise<ProgrammeExercise[]> {
  console.log('🌐 Scraping all exercises from Programme.app...\n')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  const allExercises = new Map<string, ProgrammeExercise>()
  
  try {
    // Go to exercises page
    console.log('  Loading exercises page...')
    await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2', timeout: 30000 })
    await delay(3000)
    
    // Try to load all exercises - scroll to load more
    let previousCount = 0
    let scrollAttempts = 0
    const maxScrolls = 30
    
    console.log('  Scrolling to load all exercises...')
    
    while (scrollAttempts < maxScrolls) {
      // Extract current exercises
      const exercises = await page.evaluate(() => {
        const found: ProgrammeExercise[] = []
        
        document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
          const href = (link as HTMLAnchorElement).href
          const text = link.textContent?.trim() || ''
          
          const match = href.match(/\/exercises\/([^\/]+)\/(\d+)$/)
          if (match && text) {
            found.push({
              name: text,
              url: href,
              slug: match[1],
              id: parseInt(match[2])
            })
          }
        })
        
        return found
      })
      
      // Add new exercises
      exercises.forEach(ex => {
        if (!allExercises.has(ex.url)) {
          allExercises.set(ex.url, ex)
        }
      })
      
      const currentCount = allExercises.size
      if (currentCount > previousCount) {
        console.log(`  Found ${currentCount} exercises so far...`)
        previousCount = currentCount
        scrollAttempts = 0
      } else {
        scrollAttempts++
      }
      
      // Scroll to load more
      await page.evaluate(() => {
        window.scrollTo(0, document.body.scrollHeight)
      })
      await delay(2000)
    }
    
    // Also try searching for common terms to find more exercises
    console.log('  Searching with common terms to find more exercises...')
    const searchTerms = ['squat', 'deadlift', 'row', 'press', 'pull', 'lunge', 'plank', 'bridge', 'carry', 'step', 'jump']
    
    for (const term of searchTerms) {
      try {
        await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2' })
        await delay(1000)
        
        const searchInput = await page.$('input[type="search"], input[type="text"]')
        if (searchInput) {
          await page.evaluate((input) => {
            (input as HTMLInputElement).value = ''
          }, searchInput)
          await searchInput.click()
          await delay(300)
          await searchInput.type(term, { delay: 50 })
          await delay(2500)
          
          const exercises = await page.evaluate(() => {
            const found: ProgrammeExercise[] = []
            document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
              const href = (link as HTMLAnchorElement).href
              const text = link.textContent?.trim() || ''
              const match = href.match(/\/exercises\/([^\/]+)\/(\d+)$/)
              if (match && text) {
                found.push({
                  name: text,
                  url: href,
                  slug: match[1],
                  id: parseInt(match[2])
                })
              }
            })
            return found
          })
          
          exercises.forEach(ex => {
            if (!allExercises.has(ex.url)) {
              allExercises.set(ex.url, ex)
            }
          })
        }
        await delay(500)
      } catch (err) {
        // Continue
      }
    }
    
  } finally {
    await browser.close()
  }
  
  return Array.from(allExercises.values())
}

function calculateMatchScore(myExercise: string, programmeName: string): number {
  const myLower = myExercise.toLowerCase()
  const progLower = programmeName.toLowerCase()
  
  // Exact or near-exact match
  if (myLower === progLower) return 1.0
  if (myLower.includes(progLower) || progLower.includes(myLower)) return 0.9
  
  // String similarity
  const similarity = compareTwoStrings(myLower, progLower)
  
  // Word overlap
  const myWords = myLower.split(/\s+/).filter(w => w.length > 3)
  const progWords = progLower.split(/\s+/).filter(w => w.length > 3)
  
  if (myWords.length === 0 || progWords.length === 0) return similarity
  
  const matchingWords = myWords.filter(w => 
    progWords.some(pw => pw.includes(w) || w.includes(pw))
  )
  
  const wordScore = matchingWords.length / Math.max(myWords.length, progWords.length)
  
  // Combined score
  return Math.max(similarity, wordScore * 0.8)
}

async function matchExercises(
  programmeExercises: ProgrammeExercise[], 
  myExercises: string[]
) {
  console.log('\n🔍 Matching exercises...\n')
  
  const matches: Array<{ 
    exercise: string
    programmeName: string
    programmeUrl: string
    score: number
  }> = []
  const notFound: string[] = []
  
  for (const myExercise of myExercises) {
    let bestMatch: { name: string; url: string; score: number } | null = null
    
    for (const progExercise of programmeExercises) {
      const score = calculateMatchScore(myExercise, progExercise.name)
      
      if (score > 0.4 && (!bestMatch || score > bestMatch.score)) {
        bestMatch = { 
          name: progExercise.name, 
          url: progExercise.url, 
          score 
        }
      }
    }
    
    if (bestMatch && bestMatch.score > 0.5) {
      matches.push({
        exercise: myExercise,
        programmeName: bestMatch.name,
        programmeUrl: bestMatch.url,
        score: bestMatch.score
      })
      console.log(`✅ ${myExercise}`)
      console.log(`   → ${bestMatch.name} (${(bestMatch.score * 100).toFixed(0)}%)`)
      console.log(`   ${bestMatch.url}\n`)
    } else {
      notFound.push(myExercise)
      console.log(`❌ ${myExercise}\n`)
    }
  }
  
  return { matches, notFound }
}

async function main() {
  // Step 1: Scrape all Programme.app exercises
  const programmeExercises = await scrapeAllProgrammeExercises()
  
  console.log(`\n✅ Scraped ${programmeExercises.length} exercises from Programme.app`)
  
  // Save the scraped exercises
  fs.writeFileSync('programme-all-exercises.json', JSON.stringify(programmeExercises, null, 2))
  console.log('💾 Saved to programme-all-exercises.json\n')
  
  // Step 2: Get your exercises
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')
  
  const myExercises = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }).map(ex => ex.name) || []
  
  console.log(`Found ${myExercises.length} exercises to match\n`)
  
  // Step 3: Match them
  const { matches, notFound } = await matchExercises(programmeExercises, myExercises)
  
  // Save results
  const output = {
    matches: matches.map(m => ({
      exercise: m.exercise,
      programmeName: m.programmeName,
      programmeUrl: m.programmeUrl,
      confidence: Math.round(m.score * 100)
    })),
    notFound,
    timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync('programme-matched-exercises.json', JSON.stringify(output, null, 2))
  
  console.log('='.repeat(80))
  console.log(`✅ Matched: ${matches.length}/${myExercises.length}`)
  console.log(`❌ Not found: ${notFound.length}/${myExercises.length}`)
  console.log('\n💾 Results saved to programme-matched-exercises.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

