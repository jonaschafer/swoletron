import 'dotenv/config'
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

// Common exercise name to slug mappings
const knownMappings: Record<string, string> = {
  'Reverse Lunges': 'db-goblet-reverse-lunge',
  'Box Step-Ups': 'db-suitcase-step-up',
  'Single-Leg Glute Bridges': 'single-leg-glute-bridge-hold',
  'Step-Downs': 'single-leg-step-down',
  'Fire Hydrants': 'banded-fire-hydrant',
  'Band Pull Apart': 'banded-pull-aparts',
  'Face Pulls': 'banded-facepulls',
  'Dead Hang': 'active-hang',
  'Negative Pull-Ups / Pullups': 'eccentric-pull-up',
  'Lateral Band Walks': 'lateral-banded-walks',
  'Flutter Kicks': 'hollow-body-flutters',
  'Kettlebell Wood Chopper': 'half-kneeling-kb-cross-chops',
  'Bird Dogs': 'bird-dog',
  'Dead Bugs': 'deadbug-hold',
  'Glute Bridge': 'glute-bridge-hold',
  'Clamshells': 'banded-clam-shell',
  'Full Plank - Shoulder Taps': 'opposite-shoulder-tap-with-pause',
}

function createSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

async function tryProgrammeUrl(slug: string, id?: number): Promise<string | null> {
  const baseUrl = `https://programme.app/exercises/${slug}`
  const urlsToTry = id ? [`${baseUrl}/${id}`] : [
    `${baseUrl}/1`,
    `${baseUrl}/10`,
    `${baseUrl}/50`,
    `${baseUrl}/100`,
    `${baseUrl}/200`,
    `${baseUrl}/300`,
  ]

  for (const url of urlsToTry) {
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
        if (!html.includes('404') && !html.includes('Not Found') && html.includes('exercise')) {
          return url
        }
      }
    } catch (err) {
      // Continue
    }
  }
  return null
}

async function main() {
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  const nonProgramme = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []

  console.log('🔍 Searching Programme.app for exercises...\n')
  console.log('='.repeat(80))
  
  const found: Array<{ name: string; url: string }> = []
  const notFound: string[] = []

  for (const exercise of nonProgramme) {
    // Try known mapping first
    let slug = knownMappings[exercise.name]
    
    if (!slug) {
      // Generate slug from name
      slug = createSlug(exercise.name)
    }

    console.log(`Searching: ${exercise.name}`)
    console.log(`  Trying slug: ${slug}`)
    
    const url = await tryProgrammeUrl(slug)
    
    if (url) {
      found.push({ name: exercise.name, url })
      console.log(`  ✅ FOUND: ${url}\n`)
    } else {
      notFound.push(exercise.name)
      console.log(`  ❌ Not found\n`)
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 200))
  }

  console.log('='.repeat(80))
  console.log('\n📊 RESULTS\n')
  console.log(`✅ Found: ${found.length}`)
  console.log(`❌ Not found: ${notFound.length}\n`)

  if (found.length > 0) {
    console.log('✅ FOUND MATCHES:')
    found.forEach(f => {
      console.log(`  ${f.name} → ${f.url}`)
    })
    console.log('')
  }

  if (notFound.length > 0) {
    console.log('❌ NEED MANUAL SEARCH:')
    notFound.forEach(name => {
      const searchSlug = createSlug(name)
      console.log(`  ${name}`)
      console.log(`    Search: https://programme.app/exercises?q=${encodeURIComponent(name)}`)
      console.log(`    Try slug: ${searchSlug}`)
      console.log('')
    })
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

