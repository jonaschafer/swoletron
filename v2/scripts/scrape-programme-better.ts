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
    await delay(4000) // Give it more time to load
    
    // First, let's see what's on the page
    const pageContent = await page.evaluate(() => {
      return {
        title: document.title,
        links: Array.from(document.querySelectorAll('a')).map(a => ({
          href: a.href,
          text: a.textContent?.trim()
        })).filter(a => a.href.includes('/exercises/')),
        bodyText: document.body.innerText.substring(0, 500)
      }
    })
    
    console.log(`  Page title: ${pageContent.title}`)
    console.log(`  Found ${pageContent.links.length} links with /exercises/`)
    
    // Extract exercises from current page
    const exercises = await page.evaluate(() => {
      const found: ProgrammeExercise[] = []
      
      // Find all links with /exercises/ pattern
      document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
        const href = (link as HTMLAnchorElement).href
        let text = link.textContent?.trim() || ''
        
        // If no text, try to find text in child elements
        if (!text || text.length < 2) {
          const childText = link.querySelector('span, div, h1, h2, h3, h4, p')?.textContent?.trim()
          if (childText && childText.length > text.length) {
            text = childText
          }
        }
        
        // If still no text, try to get it from title or aria-label
        if (!text || text.length < 2) {
          text = link.getAttribute('title') || link.getAttribute('aria-label') || ''
        }
        
        // If still no text, try parent element
        if (!text || text.length < 2) {
          const parent = link.parentElement
          if (parent) {
            text = parent.textContent?.trim() || ''
          }
        }
        
        const match = href.match(/\/exercises\/([^\/]+)\/(\d+)$/)
        if (match) {
          // Clean up the text
          text = text.replace(/\s+/g, ' ').trim()
          // Remove very long text (probably got whole page)
          if (text.length > 100) {
            text = text.substring(0, 100).split(' ').slice(0, 5).join(' ')
          }
          
          // Clean up text - remove category prefixes and duplicates
          let cleanText = text
          // Remove common prefixes like "SecondaryLower BodySquat"
          cleanText = cleanText.replace(/^(Primary|Secondary|Tertiary|Warmup|Movement)\s*(Lower|Upper|Trunk|Core)\s*(Body|Movement)?/i, '')
          // Remove duplicate words (sometimes name appears twice)
          const words = cleanText.split(/\s+/)
          const uniqueWords: string[] = []
          words.forEach(w => {
            if (w && !uniqueWords.includes(w)) {
              uniqueWords.push(w)
            }
          })
          cleanText = uniqueWords.join(' ').trim()
          
          // If still messy, use slug as fallback
          if (!cleanText || cleanText.length < 3) {
            cleanText = match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
          }
          
          found.push({
            name: cleanText,
            url: href,
            slug: match[1],
            id: parseInt(match[2])
          })
        }
      })
      
      return found
    })
    
    console.log(`  Found ${exercises.length} exercises on initial page load`)
    
    exercises.forEach(ex => {
      // Accept exercises even if name is empty - we can match by URL pattern
      if (ex.url && ex.slug && ex.id) {
        allExercises.set(ex.url, ex)
      }
    })
    
    console.log(`  Added ${allExercises.size} exercises after filtering`)
    
    // Try scrolling to load more - do it more aggressively
    console.log('  Scrolling to load more exercises...')
    let noNewCount = 0
    for (let i = 0; i < 100; i++) {
      // Scroll down incrementally
      await page.evaluate((scrollAmount) => {
        window.scrollBy(0, scrollAmount)
      }, 500)
      await delay(800)
      
      // Every few scrolls, jump to bottom
      if (i % 5 === 0) {
        await page.evaluate(() => {
          window.scrollTo(0, document.body.scrollHeight)
        })
        await delay(2500) // Wait longer for lazy loading
      }
      
      // Try clicking "Load More" or similar buttons if they exist
      if (i % 10 === 0) {
        try {
          const loadMoreButton = await page.$('button:has-text("Load"), button:has-text("More"), [aria-label*="load" i], [aria-label*="more" i]')
          if (loadMoreButton) {
            await loadMoreButton.click()
            await delay(2000)
          }
        } catch (e) {
          // No load more button
        }
      }
      
      const newExercises = await page.evaluate(() => {
        const found: ProgrammeExercise[] = []
        document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
          const href = (link as HTMLAnchorElement).href
          let text = link.textContent?.trim() || ''
          
          // Clean up text
          if (text) {
            text = text.replace(/^(Primary|Secondary|Tertiary|Warmup|Movement)\s*(Lower|Upper|Trunk|Core)\s*(Body|Movement)?/i, '')
            const words = text.split(/\s+/).filter((w, i, arr) => arr.indexOf(w) === i)
            text = words.join(' ').trim()
          }
          
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
        console.log(`  Now have ${allExercises.size} exercises...`)
        noNewCount = 0
      } else {
        noNewCount++
        if (noNewCount > 10) {
          console.log(`  No new exercises after ${noNewCount} scrolls, stopping...`)
          break
        }
      }
    }
    
    // Try searching with common terms
    console.log('  Searching with common terms...')
    const searchTerms = ['squat', 'deadlift', 'row', 'press', 'pull', 'lunge', 'plank', 'bridge']
    
    for (const term of searchTerms.slice(0, 5)) { // Limit to 5 to save time
      try {
        await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2' })
        await delay(2000)
        
        // Try to find search input
        const searchInput = await page.$('input[type="search"], input[type="text"], input[placeholder*="search" i], input[placeholder*="Search" i]')
        
        if (searchInput) {
          await searchInput.click()
          await delay(500)
          await page.evaluate((input) => {
            (input as HTMLInputElement).value = ''
          }, searchInput)
          await searchInput.type(term, { delay: 100 })
          await delay(3000) // Wait for search results
          
          const searchExercises = await page.evaluate(() => {
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
          
          const beforeCount = allExercises.size
          searchExercises.forEach(ex => {
            if (ex.url && ex.slug && ex.id) {
              allExercises.set(ex.url, ex)
            }
          })
          
          if (allExercises.size > beforeCount) {
            console.log(`  Found ${allExercises.size - beforeCount} new exercises with search "${term}"`)
          }
        }
        await delay(1000)
      } catch (err: any) {
        console.log(`  Search "${term}" failed: ${err.message}`)
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
  
  // Exact or near-exact match
  if (myLower === progLower) return 1.0
  if (myLower.includes(progLower) || progLower.includes(myLower)) return 0.9
  
  // String similarity
  const similarity = compareTwoStrings(myLower, progLower)
  
  // Word overlap
  const myWords = myLower.split(/[\s-]+/).filter(w => w.length > 2)
  const progWords = progLower.split(/[\s-]+/).filter(w => w.length > 2)
  
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
  
  console.log(`\n✅ Scraped ${programmeExercises.length} total exercises from Programme.app`)
  
  // Show sample of what we found
  if (programmeExercises.length > 0) {
    console.log('\n  Sample exercises found:')
    programmeExercises.slice(0, 5).forEach(ex => {
      console.log(`    - ${ex.name || 'Unnamed'} (${ex.url})`)
    })
  }
  
  if (programmeExercises.length === 0) {
    console.log('\n⚠️  No exercises found. The page structure might be different.')
    console.log('   Try running with headless: false to see what\'s happening')
    process.exit(1)
  }
  
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

