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

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

// Known mappings
const knownMappings: Record<string, string> = {
  'Bent-over Row': 'https://programme.app/exercises/bent-over-row/130',
  'Bird-dog': 'https://programme.app/exercises/bird-dog/134',
  'Single-Leg RDL': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
  'Single-leg Romanian Deadlift': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
}

// Extract key words for better search
function getSearchTerms(exerciseName: string): string[] {
  const cleaned = exerciseName
    .toLowerCase()
    .replace(/[®©™]/g, '')
    .replace(/[()]/g, ' ')
    .replace(/\s*-\s*/g, ' ') // Replace dashes with spaces
    .replace(/\s+/g, ' ')
    .trim()
  
  const stopWords = ['the', 'a', 'an', 'and', 'or', 'but', 'with', 'for', 'of', 'to', 'in', 'on', 'at', 'by']
  const words = cleaned.split(' ').filter(w => w.length > 2 && !stopWords.includes(w))
  
  const terms = new Set<string>()
  
  // Add full name
  terms.add(cleaned)
  
  // Add without dashes/hyphens
  terms.add(cleaned.replace(/-/g, ' '))
  
  // Add key 2-word phrases
  if (words.length >= 2) {
    for (let i = 0; i < words.length - 1; i++) {
      terms.add(`${words[i]} ${words[i + 1]}`)
    }
    // First and last word combo
    if (words.length > 2) {
      terms.add(`${words[0]} ${words[words.length - 1]}`)
    }
  }
  
  // Add individual important words (longer ones)
  words.forEach(w => {
    if (w.length > 4) terms.add(w)
  })
  
  return Array.from(terms).slice(0, 5) // Limit to 5 search terms
}

function calculateSimilarity(exerciseName: string, resultText: string): number {
  const s1 = exerciseName.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  const s2 = resultText.toLowerCase().replace(/[^a-z0-9\s]/g, '').trim()
  
  if (s1 === s2) return 1.0
  
  // Check if all key words are present
  const words1 = s1.split(/\s+/).filter(w => w.length > 3)
  const words2 = s2.split(/\s+/).filter(w => w.length > 3)
  
  if (words1.length === 0 || words2.length === 0) return 0
  
  const matchingWords = words1.filter(w => words2.some(w2 => w2.includes(w) || w.includes(w2)))
  const score = matchingWords.length / Math.max(words1.length, words2.length)
  
  // Bonus if strings contain each other
  if (s1.includes(s2) || s2.includes(s1)) {
    return Math.max(score, 0.7)
  }
  
  return score
}

async function searchProgrammeApp(browser: any, exerciseName: string): Promise<string | null> {
  // Check known mappings first
  if (knownMappings[exerciseName]) {
    return knownMappings[exerciseName]
  }
  
  const page = await browser.newPage()
  
  try {
    const searchTerms = getSearchTerms(exerciseName)
    console.log(`  Search terms: ${searchTerms.join(', ')}`)
    
    let allResults: Array<{ url: string; text: string; score: number }> = []
    
    // Try each search term
    for (const searchTerm of searchTerms) {
      try {
        await page.goto('https://programme.app/exercises', { waitUntil: 'networkidle2', timeout: 30000 })
        await delay(1500)
        
        // Find and use search
        const searchInput = await page.$('input[type="search"], input[placeholder*="search" i], input[placeholder*="Search" i], input[type="text"]')
        
        if (searchInput) {
          // Clear and type
          await page.evaluate((input) => {
            (input as HTMLInputElement).value = ''
          }, searchInput)
          await searchInput.click()
          await delay(300)
          await searchInput.type(searchTerm, { delay: 50 })
          await delay(2000) // Wait for results
          
          // Extract results
          const results = await page.evaluate((name) => {
            const found: Array<{ url: string; text: string }> = []
            
            // Find all exercise links
            document.querySelectorAll('a[href*="/exercises/"]').forEach(link => {
              const href = (link as HTMLAnchorElement).href
              const text = link.textContent?.trim() || ''
              
              if (href.match(/\/exercises\/[^\/]+\/\d+$/)) {
                found.push({ url: href, text })
              }
            })
            
            // Also check for data attributes or other link patterns
            document.querySelectorAll('[href*="/exercises/"], [data-href*="/exercises/"]').forEach(el => {
              const href = (el as any).href || (el as any).getAttribute('data-href') || ''
              const text = el.textContent?.trim() || ''
              if (href && href.match(/\/exercises\/[^\/]+\/\d+$/)) {
                found.push({ url: href, text })
              }
            })
            
            return found
          }, exerciseName)
          
          // Score results
          results.forEach(result => {
            const score = calculateSimilarity(exerciseName, result.text)
            if (score > 0.3) {
              allResults.push({ ...result, score })
            }
          })
        }
        
        await delay(500)
      } catch (err) {
        // Continue to next search term
      }
    }
    
    await page.close()
    
    // Remove duplicates, keep best score
    const unique = new Map<string, { url: string; text: string; score: number }>()
    allResults.forEach(r => {
      const existing = unique.get(r.url)
      if (!existing || r.score > existing.score) {
        unique.set(r.url, r)
      }
    })
    
    const sorted = Array.from(unique.values()).sort((a, b) => b.score - a.score)
    
    // Return best match if score is good
    if (sorted.length > 0 && sorted[0].score > 0.5) {
      return sorted[0].url
    }
    
    return null
  } catch (error: any) {
    try {
      await page.close()
    } catch (e) {}
    return null
  }
}

async function main() {
  console.log('🤖 Better Programme.app search...\n')
  
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log(`Found ${nonProgramme.length} exercises to search\n`)
  console.log('🚀 Launching browser...')
  
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  })

  const results: Array<{ exercise: string; url: string | null }> = []
  
  console.log('='.repeat(80))
  
  for (let i = 0; i < nonProgramme.length; i++) {
    const exercise = nonProgramme[i]
    console.log(`\n[${i + 1}/${nonProgramme.length}] ${exercise.name}`)
    
    let url: string | null = null
    try {
      url = await searchProgrammeApp(browser, exercise.name)
    } catch (error: any) {
      console.error(`  Error: ${error.message}`)
    }
    
    if (url) {
      console.log(`  ✅ Found: ${url}`)
      results.push({ exercise: exercise.name, url })
    } else {
      console.log(`  ❌ Not found`)
      results.push({ exercise: exercise.name, url: null })
    }
    
    await delay(1000)
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
    console.log('\n✅ MATCHES:')
    found.forEach(r => {
      console.log(`  ${r.exercise} → ${r.url}`)
    })
  }
  
  const output = {
    found: found.map(r => ({ exercise: r.exercise, programmeUrl: r.url })),
    notFound: notFound.map(r => r.exercise),
    timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync('programme-final-matches.json', JSON.stringify(output, null, 2))
  console.log('\n💾 Saved to programme-final-matches.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

