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

// Known mappings from user feedback
const knownMappings: Record<string, string> = {
  'Bent-over Row': 'https://programme.app/exercises/bent-over-row/130',
  'Bird-dog': 'https://programme.app/exercises/bird-dog/134',
  'Single-Leg RDL': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
  'Single-leg Romanian Deadlift': 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864',
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[®©™]/g, '')
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

// Try direct URL patterns
async function tryDirectUrl(slug: string, possibleIds: number[] = []): Promise<string | null> {
  // If no IDs provided, try a wider range based on known IDs (130, 134, etc.)
  // Programme.app seems to use IDs roughly in the 1-1100 range
  const idsToTry = possibleIds.length > 0 ? possibleIds : [
    // Try known IDs first
    130, 134, 19, 76, 87, 134, 270, 306, 361, 391, 450, 566, 628,
    // Then try common ranges
    1, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95,
    100, 105, 110, 115, 120, 125, 135, 140, 145, 150, 155, 160, 165, 170, 175, 180, 185, 190, 195,
    200, 210, 220, 230, 240, 250, 260, 280, 290, 300, 310, 320, 330, 340, 350, 360, 370, 380, 390,
    400, 410, 420, 430, 440, 450, 460, 470, 480, 490, 500, 550, 600, 650, 700, 750, 800, 850, 900, 950, 1000, 1050, 1100
  ]
  
  for (const id of idsToTry) {
    const url = `https://programme.app/exercises/${slug}/${id}`
    try {
      const response = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 3000,
        validateStatus: (status) => status < 500
      })
      
      if (response.status === 200) {
        const html = response.data as string
        // Check if it's a valid exercise page (not 404)
        if (!html.includes('404') && !html.includes('Not Found') && (html.includes('exercise') || html.includes('Exercise'))) {
          return url
        }
      }
    } catch (err) {
      // Continue
    }
  }
  return null
}

async function findProgrammeUrl(exerciseName: string): Promise<string | null> {
  // Check known mappings first
  if (knownMappings[exerciseName]) {
    console.log(`  ✅ Using known mapping`)
    return knownMappings[exerciseName]
  }
  
  // Try direct URL patterns
  const slug = createSlug(exerciseName)
  console.log(`  Trying slug: ${slug}`)
  
  const directUrl = await tryDirectUrl(slug)
  if (directUrl) {
    return directUrl
  }
  
  // Try variations
  const variations = [
    slug.replace(/-/g, ' '),
    slug.replace(/-single-leg-/, '-single-leg-'),
    slug.replace(/-leg-/, '-'),
    slug.replace(/s$/, ''), // Remove plural
    slug + 's', // Add plural
  ]
  
  for (const variation of variations) {
    if (variation !== slug) {
      const url = await tryDirectUrl(variation)
      if (url) {
        return url
      }
    }
  }
  
  return null
}

async function main() {
  console.log('🔍 Smart Programme.app URL finder...\n')
  
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log(`Found ${nonProgramme.length} exercises to find URLs for\n`)
  console.log('='.repeat(80))
  
  const results: Array<{ exercise: string; url: string | null }> = []
  
  for (let i = 0; i < nonProgramme.length; i++) {
    const exercise = nonProgramme[i]
    console.log(`\n[${i + 1}/${nonProgramme.length}] ${exercise.name}`)
    
    const url = await findProgrammeUrl(exercise.name)
    
    if (url) {
      console.log(`  ✅ Found: ${url}`)
      results.push({ exercise: exercise.name, url })
    } else {
      console.log(`  ❌ Not found`)
      results.push({ exercise: exercise.name, url: null })
    }
    
    // Small delay
    await new Promise(resolve => setTimeout(resolve, 500))
  }

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
  
  // Save results
  const output = {
    found: found.map(r => ({ exercise: r.exercise, programmeUrl: r.url })),
    notFound: notFound.map(r => r.exercise),
    timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync('programme-smart-matches.json', JSON.stringify(output, null, 2))
  console.log('\n💾 Results saved to programme-smart-matches.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

