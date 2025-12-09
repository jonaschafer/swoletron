import 'dotenv/config'
import puppeteer from 'puppeteer'
import * as fs from 'fs'
import { compareTwoStrings } from 'string-similarity'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'

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

async function scrapeViaNetworkRequests(): Promise<ProgrammeExercise[]> {
  console.log('🌐 Scraping Programme.app via network requests...\n')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })
  
  const page = await browser.newPage()
  const allExercises = new Map<string, ProgrammeExercise>()
  const apiUrls = new Set<string>()
  
  // Intercept network requests to find API endpoints
  page.on('response', async (response) => {
    const url = response.url()
    // Look for API calls that might return exercise data
    if (url.includes('api') || url.includes('exercises') || url.includes('json')) {
      try {
        const contentType = response.headers()['content-type'] || ''
        if (contentType.includes('json')) {
          apiUrls.add(url)
        }
      } catch (e) {
        // Ignore
      }
    }
  })
  
  try {
    await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2', timeout: 30000 })
    await delay(5000) // Wait for all requests
    
    console.log(`  Found ${apiUrls.size} potential API endpoints`)
    
    // Try to extract exercises from the page
    const exercises = await page.evaluate(() => {
      const found: ProgrammeExercise[] = []
      
      // Try to find exercise data in window object or global variables
      const windowAny = window as any
      if (windowAny.__NEXT_DATA__) {
        const nextData = windowAny.__NEXT_DATA__
        if (nextData.props && nextData.props.pageProps) {
          // Common Next.js pattern
          console.log('Found Next.js data')
        }
      }
      
      // Extract from DOM
      document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
        const href = (link as HTMLAnchorElement).href
        let text = link.textContent?.trim() || ''
        
        // Clean text
        text = text.replace(/^(Primary|Secondary|Tertiary|Warmup|Movement)\s*(Lower|Upper|Trunk|Core)\s*(Body|Movement)?/i, '')
        const words = text.split(/\s+/).filter((w, i, arr) => arr.indexOf(w) === i)
        text = words.join(' ').trim()
        
        const match = href.match(/\/exercises\/([^\/]+)\/(\d+)$/)
        if (match) {
          if (!text || text.length < 3) {
            text = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
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
      if (ex.url && ex.slug && ex.id) {
        allExercises.set(ex.url, ex)
      }
    })
    
    // Try scrolling extensively
    console.log('  Scrolling to load all exercises...')
    for (let i = 0; i < 200; i++) {
      await page.evaluate(() => {
        window.scrollBy(0, 300)
      })
      await delay(500)
      
      if (i % 20 === 0) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })
        await delay(3000)
        
        const newExercises = await page.evaluate(() => {
          const found: ProgrammeExercise[] = []
          document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
            const href = (link as HTMLAnchorElement).href
            let text = link.textContent?.trim() || ''
            text = text.replace(/^(Primary|Secondary|Tertiary|Warmup|Movement)\s*(Lower|Upper|Trunk|Core)\s*(Body|Movement)?/i, '')
            const words = text.split(/\s+/).filter((w, i, arr) => arr.indexOf(w) === i)
            text = words.join(' ').trim()
            
            const match = href.match(/\/exercises\/([^\/]+)\/(\d+)$/)
            if (match) {
              if (!text || text.length < 3) {
                text = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
              }
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
        
        const beforeCount = allExercises.size
        newExercises.forEach(ex => {
          if (ex.url && ex.slug && ex.id) {
            allExercises.set(ex.url, ex)
          }
        })
        
        if (allExercises.size > beforeCount) {
          console.log(`  Found ${allExercises.size} exercises so far...`)
        }
        
        // Stop if we haven't found new exercises in a while
        if (allExercises.size === beforeCount && i > 50) {
          break
        }
      }
    }
    
  } finally {
    await browser.close()
  }
  
  return Array.from(allExercises.values())
}

function calculateMatchScore(myExercise: string, programmeName: string): number {
  const myLower = myExercise.toLowerCase().replace(/[®©™]/g, '').trim()
  const progLower = programmeName.toLowerCase().replace(/[®©™]/g, '').trim()
  
  if (myLower === progLower) return 1.0
  if (myLower.includes(progLower) || progLower.includes(myLower)) return 0.9
  
  const similarity = compareTwoStrings(myLower, progLower)
  
  const myWords = myLower.split(/[\s-]+/).filter(w => w.length > 2)
  const progWords = progLower.split(/[\s-]+/).filter(w => w.length > 2)
  
  if (myWords.length === 0 || progWords.length === 0) return similarity
  
  const matchingWords = myWords.filter(w => 
    progWords.some(pw => pw.includes(w) || w.includes(pw))
  )
  
  const wordScore = matchingWords.length / Math.max(myWords.length, progWords.length)
  
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
  const programmeExercises = await scrapeViaNetworkRequests()
  
  console.log(`\n✅ Scraped ${programmeExercises.length} total exercises from Programme.app`)
  
  if (programmeExercises.length === 0) {
    console.log('\n⚠️  No exercises found.')
    process.exit(1)
  }
  
  fs.writeFileSync('programme-all-exercises.json', JSON.stringify(programmeExercises, null, 2))
  console.log('💾 Saved to programme-all-exercises.json\n')
  
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')
  
  const myExercises = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }).map(ex => ex.name) || []
  
  console.log(`Found ${myExercises.length} exercises to match\n`)
  
  const { matches, notFound } = await matchExercises(programmeExercises, myExercises)
  
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

