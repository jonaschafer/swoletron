import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import axios from 'axios'
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

// Known mappings from manual finds
const knownMappings: Record<string, string> = {
  'Bent-over Row': 'https://programme.app/exercises/bent-over-row/130',
  'Bird-dog': 'https://programme.app/exercises/bird-dog/134',
  'Single-Leg RDL': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
  'Single-leg Romanian Deadlift': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
}

function createSlugVariations(name: string): string[] {
  const base = name.toLowerCase()
    .replace(/[®©™]/g, '')
    .replace(/\([^)]*\)/g, '') // Remove parentheses content
    .replace(/\s*-\s*/g, ' ') // Normalize dashes
    .replace(/\s+/g, ' ')
    .trim()
  
  const variations = new Set<string>()
  
  // Original with dashes
  variations.add(base.replace(/\s+/g, '-'))
  
  // Without dashes (spaces)
  variations.add(base)
  
  // Key word combinations
  const words = base.split(' ').filter(w => w.length > 2)
  
  if (words.length >= 2) {
    // First two words
    variations.add(`${words[0]}-${words[1]}`)
    // Last two words
    if (words.length > 2) {
      variations.add(`${words[words.length - 2]}-${words[words.length - 1]}`)
    }
    // All words with dashes
    variations.add(words.join('-'))
  }
  
  // Common abbreviations
  const abbrev = base
    .replace(/\bassisted\b/g, 'assissted') // Common typo
    .replace(/\bpull.?up\b/g, 'pull-up')
    .replace(/\bstep.?up\b/g, 'step-up')
    .replace(/\bpush.?up\b/g, 'push-up')
  
  if (abbrev !== base) {
    variations.add(abbrev.replace(/\s+/g, '-'))
  }
  
  return Array.from(variations)
}

async function checkUrl(url: string): Promise<boolean> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 3000,
      validateStatus: () => true // Don't throw on any status
    })
    
    // Check if it's a valid exercise page
    if (response.status === 200 && response.data) {
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      return !html.includes('404') && 
             !html.includes('Not Found') && 
             !html.includes('Page not found') &&
             (html.includes('exercise') || html.includes('Exercise') || html.includes('Coaching Tips'))
    }
    
    return false
  } catch {
    return false
  }
}

async function findProgrammeUrl(exerciseName: string): Promise<string | null> {
  // Check known mappings
  if (knownMappings[exerciseName]) {
    return knownMappings[exerciseName]
  }
  
  const slugs = createSlugVariations(exerciseName)
  console.log(`  Trying ${slugs.length} slug variations...`)
  
  // Known ID ranges from examples: 19, 76, 87, 130, 134, 270, 306, 361, 391, 450, 566, 628, 864
  // Try IDs in a smart range
  const idRanges = [
    // Known IDs first
    [19, 76, 87, 130, 134, 270, 306, 361, 391, 450, 566, 628, 864],
    // Common ranges
    Array.from({ length: 50 }, (_, i) => i + 1),
    Array.from({ length: 50 }, (_, i) => i + 100),
    Array.from({ length: 50 }, (_, i) => i + 200),
    Array.from({ length: 50 }, (_, i) => i + 300),
    Array.from({ length: 50 }, (_, i) => i + 400),
    Array.from({ length: 50 }, (_, i) => i + 500),
    Array.from({ length: 50 }, (_, i) => i + 600),
    Array.from({ length: 50 }, (_, i) => i + 700),
    Array.from({ length: 50 }, (_, i) => i + 800),
  ]
  
  const allIds = [...new Set(idRanges.flat())].slice(0, 200) // Limit to 200 IDs
  
  // Try each slug with known IDs first, then expand
  for (const slug of slugs.slice(0, 5)) { // Limit slugs to avoid too many requests
    // Try known IDs first
    for (const id of [19, 76, 87, 130, 134, 270, 306, 361, 391, 450, 566, 628, 864]) {
      const url = `https://programme.app/exercises/${slug}/${id}`
      if (await checkUrl(url)) {
        console.log(`  ✅ Found at ID ${id}`)
        return url
      }
    }
    
    // Then try a sample of other IDs
    for (const id of allIds.slice(13, 50)) { // Skip known IDs, try next 37
      const url = `https://programme.app/exercises/${slug}/${id}`
      if (await checkUrl(url)) {
        console.log(`  ✅ Found at ID ${id}`)
        return url
      }
    }
  }
  
  return null
}

async function main() {
  console.log('🔍 Finding Programme.app URLs...\n')
  
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log(`Found ${nonProgramme.length} exercises\n`)
  console.log('='.repeat(80))
  
  const results: Array<{ exercise: string; url: string | null }> = []
  
  for (let i = 0; i < nonProgramme.length; i++) {
    const exercise = nonProgramme[i]
    console.log(`\n[${i + 1}/${nonProgramme.length}] ${exercise.name}`)
    
    const url = await findProgrammeUrl(exercise.name)
    
    if (url) {
      console.log(`  ✅ ${url}`)
      results.push({ exercise: exercise.name, url })
    } else {
      console.log(`  ❌ Not found`)
      results.push({ exercise: exercise.name, url: null })
    }
    
    await new Promise(resolve => setTimeout(resolve, 200)) // Small delay
  }

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
  
  fs.writeFileSync('programme-urls-found.json', JSON.stringify(output, null, 2))
  console.log('\n💾 Saved to programme-urls-found.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

