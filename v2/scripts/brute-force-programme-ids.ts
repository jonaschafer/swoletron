import 'dotenv/config'
import axios from 'axios'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { compareTwoStrings } from 'string-similarity'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

// Known exercises from user's manual finds
const knownExercises = [
  { name: 'Bent Over Row', url: 'https://programme.app/exercises/bent-over-row/130', slug: 'bent-over-row', id: 130 },
  { name: 'Bird Dog', url: 'https://programme.app/exercises/bird-dog/134', slug: 'bird-dog', id: 134 },
  { name: 'Single Leg Crossbody Straight Leg Deadlift', url: 'https://programme.app/exercises/single-leg-crossbody-straight-leg-deadlift/864', slug: 'single-leg-crossbody-straight-leg-deadlift', id: 864 },
  { name: 'Single Leg Adduction with Bench', url: 'https://programme.app/exercises/single-leg-adduction-with-bench/863', slug: 'single-leg-adduction-with-bench', id: 863 },
]

async function checkExerciseUrl(url: string): Promise<{ exists: boolean; name: string | null }> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 2000,
      validateStatus: () => true
    })
    
    if (response.status === 200 && response.data) {
      const html = typeof response.data === 'string' ? response.data : JSON.stringify(response.data)
      
      if (html.includes('404') || html.includes('Not Found') || html.includes('Page not found')) {
        return { exists: false, name: null }
      }
      
      // Try to extract exercise name from HTML
      const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                       html.match(/<title[^>]*>([^<]+)<\/title>/i) ||
                       html.match(/"name"\s*:\s*"([^"]+)"/i)
      
      let name = nameMatch ? nameMatch[1].trim() : null
      
      // Clean up name
      if (name) {
        name = name.replace(/\s*-\s*Programme\.app.*/i, '')
        name = name.replace(/^\s*(Primary|Secondary|Tertiary|Warmup|Movement)\s*/i, '')
      }
      
      return { exists: true, name }
    }
    
    return { exists: false, name: null }
  } catch {
    return { exists: false, name: null }
  }
}

async function bruteForceFindExercises(myExercises: string[]): Promise<Map<string, string>> {
  console.log('🔍 Brute forcing Programme.app exercise IDs...\n')
  console.log('This will check IDs 1-1100 with common slug patterns')
  console.log('This may take 10-15 minutes...\n')
  
  const foundExercises = new Map<string, { name: string; url: string; slug: string; id: number }>()
  const matches = new Map<string, string>()
  
  // Add known exercises
  knownExercises.forEach(ex => {
    foundExercises.set(ex.url, ex)
  })
  
  // Generate slug variations for each exercise
  function getSlugVariations(exerciseName: string): string[] {
    const base = exerciseName.toLowerCase()
      .replace(/[®©™]/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s*-\s*/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
    
    const variations = new Set<string>()
    variations.add(base.replace(/\s+/g, '-'))
    variations.add(base)
    
    const words = base.split(' ').filter(w => w.length > 2)
    if (words.length >= 2) {
      variations.add(`${words[0]}-${words[1]}`)
      variations.add(words.join('-'))
    }
    
    return Array.from(variations).slice(0, 3)
  }
  
  // Try IDs in batches
  const idRanges = [
    // Known IDs first
    [19, 76, 87, 130, 134, 270, 306, 361, 391, 450, 566, 628, 863, 864],
    // Then common ranges
    Array.from({ length: 100 }, (_, i) => i + 1),
    Array.from({ length: 200 }, (_, i) => i + 100),
    Array.from({ length: 200 }, (_, i) => i + 300),
    Array.from({ length: 200 }, (_, i) => i + 500),
    Array.from({ length: 200 }, (_, i) => i + 700),
    Array.from({ length: 200 }, (_, i) => i + 900),
  ]
  
  const allIds = [...new Set(idRanges.flat())].slice(0, 1000)
  
  console.log(`Checking ${allIds.length} IDs with slug variations for ${myExercises.length} exercises...\n`)
  
  let checked = 0
  const totalChecks = myExercises.length * 3 * Math.min(allIds.length, 100) // Limit to 100 IDs per exercise
  
  for (const exercise of myExercises) {
    const slugs = getSlugVariations(exercise)
    console.log(`\n${exercise}:`)
    console.log(`  Trying slugs: ${slugs.join(', ')}`)
    
    for (const slug of slugs.slice(0, 3)) {
      // Try known IDs first
      for (const id of [19, 76, 87, 130, 134, 270, 306, 361, 391, 450, 566, 628, 863, 864]) {
        const url = `https://programme.app/exercises/${slug}/${id}`
        const result = await checkExerciseUrl(url)
        
        if (result.exists) {
          foundExercises.set(url, {
            name: result.name || exercise,
            url,
            slug,
            id
          })
          
          // Check if this matches our exercise
          if (result.name) {
            const similarity = compareTwoStrings(exercise.toLowerCase(), result.name.toLowerCase())
            if (similarity > 0.5) {
              matches.set(exercise, url)
              console.log(`  ✅ Found match: ${result.name} → ${url}`)
              break
            }
          }
        }
        
        checked++
        if (checked % 50 === 0) {
          console.log(`  Progress: ${checked}/${totalChecks} checks...`)
        }
        
        await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
      }
      
      // If we found a match, stop trying other slugs
      if (matches.has(exercise)) break
    }
  }
  
  return matches
}

async function main() {
  const { data: exercises } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')
  
  const myExercises = exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }).map(ex => ex.name) || []
  
  console.log(`Found ${myExercises.length} exercises to find\n`)
  
  const matches = await bruteForceFindExercises(myExercises)
  
  const output = {
    matches: Array.from(matches.entries()).map(([exercise, url]) => ({
      exercise,
      programmeUrl: url
    })),
    notFound: myExercises.filter(ex => !matches.has(ex)),
    timestamp: new Date().toISOString()
  }
  
  fs.writeFileSync('programme-brute-force-matches.json', JSON.stringify(output, null, 2))
  
  console.log('\n' + '='.repeat(80))
  console.log(`✅ Found: ${matches.size}/${myExercises.length}`)
  console.log(`❌ Not found: ${myExercises.length - matches.size}/${myExercises.length}`)
  console.log('\n💾 Results saved to programme-brute-force-matches.json')
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

