import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import puppeteer from 'puppeteer'
import * as fs from 'fs'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Helper function to delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Extract key words from exercise name for better matching
function getSearchTerms(exerciseName: string): string[] {
  // Remove common words and punctuation
  const cleaned = exerciseName
    .toLowerCase()
    .replace(/[®©™]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
  
  // Split into words and filter out common stop words
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by']
  const words = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.includes(w))
  
  // Return variations: full name, key words, and individual important words
  const terms = [cleaned] // Full cleaned name
  
  // Add key word combinations (2-3 word phrases)
  if (words.length > 1) {
    for (let i = 0; i < words.length - 1; i++) {
      terms.push(`${words[i]} ${words[i + 1]}`)
    }
    if (words.length > 2) {
      terms.push(`${words[0]} ${words[words.length - 1]}`) // First and last
    }
  }
  
  // Add individual important words (skip very common ones)
  words.forEach(w => {
    if (w.length > 4) terms.push(w) // Only longer words
  })
  
  return [...new Set(terms)] // Remove duplicates
}

// Calculate similarity between two strings
function calculateSimilarity(str1: string, str2: string): number {
  const s1 = str1.toLowerCase().replace(/[^a-z0-9]/g, '')
  const s2 = str2.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (s1 === s2) return 1.0
  if (s1.includes(s2) || s2.includes(s1)) return 0.8
  
  // Simple word overlap
  const words1 = s1.split(/\s+/)
  const words2 = s2.split(/\s+/)
  const common = words1.filter(w => words2.includes(w))
  return common.length / Math.max(words1.length, words2.length)
}

async function searchProgrammeApp(browser: any, exerciseName: string): Promise<string | null> {
  const page = await browser.newPage()
  
  try {
    const searchTerms = getSearchTerms(exerciseName)
    console.log(`  Trying search terms: ${searchTerms.slice(0, 3).join(', ')}${searchTerms.length > 3 ? '...' : ''}`)
    
    // Go to Programme.app exercises page
    await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2', timeout: 30000 })
    await delay(2000)
    
    let allLinks: Array<{ url: string; text: string; score: number }> = []
    
    // Try each search term
    for (const searchTerm of searchTerms.slice(0, 5)) { // Limit to 5 terms to avoid too many searches
      try {
        // Clear any previous search
        await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2', timeout: 30000 })
        await delay(1000)
        
        // Find search input
        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[name*="search" i], input[type="text"]')
        
        if (searchInput) {
          await searchInput.click()
          await delay(300)
          // Clear and type new search
          await page.evaluate((input) => {
            (input as HTMLInputElement).value = ''
          }, searchInput)
          await searchInput.type(searchTerm, { delay: 80 })
          await delay(2000) // Wait for results
        }
        
        // Extract links from current results
        const links = await page.evaluate(() => {
          const found: Array<{ url: string; text: string }> = []
          
          // Find all links that look like exercise links
          document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
            const href = (link as HTMLAnchorElement).href
            const text = link.textContent?.trim() || ''
            
            if (href.match(/\/exercises\/[^\/]+\/\d+$/)) {
              found.push({ url: href, text })
            }
          })
          
          // Also check for exercise cards/items
          document.querySelectorAll('[href*="/exercises/"], [data-href*="/exercises/"]').forEach(el => {
            const href = (el as any).href || (el as any).getAttribute('data-href') || ''
            const text = el.textContent?.trim() || ''
            if (href.match(/\/exercises\/[^\/]+\/\d+$/)) {
              found.push({ url: href, text })
            }
          })
          
          return found
        })
        
        // Score each link based on similarity
        links.forEach(link => {
          const similarity = calculateSimilarity(exerciseName, link.text)
          if (similarity > 0.3) { // Only keep reasonably similar matches
            allLinks.push({ ...link, score: similarity })
          }
        })
        
        await delay(500) // Small delay between searches
      } catch (err) {
        // Continue to next search term
      }
    }
    
    try {
      await page.close()
    } catch (e) {
      // Page might already be closed
    }
    
    // Remove duplicates and sort by score
    const uniqueLinks = new Map<string, { url: string; text: string; score: number }>()
    allLinks.forEach(link => {
      const existing = uniqueLinks.get(link.url)
      if (!existing || link.score > existing.score) {
        uniqueLinks.set(link.url, link)
      }
    })
    
    const sorted = Array.from(uniqueLinks.values()).sort((a, b) => b.score - a.score)
    
    // Return best match if score is good enough
    if (sorted.length > 0 && sorted[0].score > 0.4) {
      return sorted[0].url
    }
    
    return null
  } catch (error: any) {
    try {
      await page.close()
    } catch (e) {
      // Page might already be closed
    }
    console.error(`  ❌ Error: ${error.message}`)
    return null
  }
}

async function main() {
  console.log('🤖 Automating Programme.app search with Puppeteer...\n')
  
  // Get exercises that don't use Programme.app
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log(`Found ${nonProgramme.length} exercises to search for\n`)
  console.log('🚀 Launching browser...')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results: Array<{ exercise: string; url: string | null }> = []
  
  console.log('='.repeat(80))
  
  for (let i = 0; i < nonProgramme.length; i++) {
    const exercise = nonProgramme[i]
    console.log(`\n[${i + 1}/${nonProgramme.length}] Searching: ${exercise.name}`)
    
    let url: string | null = null
    let retries = 0
    const maxRetries = 2
    
    while (retries <= maxRetries && !url) {
      try {
        url = await searchProgrammeApp(browser, exercise.name)
        break
      } catch (error: any) {
        retries++
        if (retries <= maxRetries) {
          console.log(`  ⚠️  Retry ${retries}/${maxRetries}...`)
          await delay(2000)
        } else {
          console.error(`  ❌ Failed after ${maxRetries} retries`)
        }
      }
    }
    
    if (url) {
      console.log(`  ✅ Found: ${url}`)
      results.push({ exercise: exercise.name, url })
    } else {
      console.log(`  ❌ Not found`)
      results.push({ exercise: exercise.name, url: null })
    }
    
    // Small delay between searches
    await delay(1500)
  }

  await browser.close()

  console.log('\n' + '='.repeat(80))
  console.log('📊 RESULTS')
  console.log('='.repeat(80))
  
  const found = results.filter(r => r.url)
  const notFound = results.filter(r => !r.url)
  
  console.log(`\n✅ Found: ${found.length}/${nonProgramme.length}`)
  console.log(`❌ Not found: ${notFound.length}/${nonProgramme.length}`)
  
  if (found.length > 0) {
    console.log('\n✅ MATCHES FOUND:')
    found.forEach(r => {
      console.log(`  ${r.exercise} → ${r.url}`)
    })
  }
  
  if (notFound.length > 0) {
    console.log('\n❌ NOT FOUND:')
    notFound.forEach(r => {
      console.log(`  ${r.exercise}`)
    })
  }
  
  // Save results
  const output = {
    found: found.map(r => ({ exercise: r.exercise, programmeUrl: r.url })),
    notFound: notFound.map(r => r.exercise),
    timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync('programme-automated-matches.json', JSON.stringify(output, null, 2))
  console.log('\n💾 Results saved to programme-automated-matches.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

