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

// Get exercises that don't use Programme.app
async function getNonProgrammeExercises() {
  const { data: exercises, error } = await supabase
    .from('exercise_library')
    .select('name, external_video_url')
    .order('name')

  if (error) {
    console.error('❌ Error fetching exercises:', error)
    return []
  }

  return exercises?.filter(ex => {
    const url = ex.external_video_url || ''
    return !url.includes('programme.app')
  }) || []
}

// Try to find exercise on Programme.app by searching
async function searchProgrammeApp(exerciseName: string): Promise<string | null> {
  try {
    // Try different search variations
    const searchTerms = [
      exerciseName.toLowerCase(),
      exerciseName.toLowerCase().replace(/\s+/g, '-'),
      exerciseName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
    ]

    for (const term of searchTerms) {
      // Try direct URL patterns
      const possibleUrls = [
        `https://programme.app/exercises/${term}`,
        `https://programme.app/exercises/${term.replace(/-+/g, '-')}`,
      ]

      for (const url of possibleUrls) {
        try {
          const response = await axios.get(url, {
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            },
            timeout: 5000,
            validateStatus: (status) => status < 500
          })

          if (response.status === 200 && response.data) {
            // Check if page contains exercise name
            const html = response.data as string
            if (html.includes(exerciseName) || html.includes(exerciseName.toLowerCase())) {
              // Extract ID from URL or HTML
              const idMatch = url.match(/\/(\d+)$/) || html.match(/\/exercises\/[^\/]+\/(\d+)/)
              if (idMatch) {
                return url
              }
            }
          }
        } catch (err) {
          // Continue to next URL
        }
      }
    }

    return null
  } catch (error) {
    return null
  }
}

// Scrape Programme.app exercises page to get all exercises
async function getAllProgrammeExercises(): Promise<Map<string, string>> {
  const exerciseMap = new Map<string, string>()
  
  try {
    // Programme.app might have pagination or a list page
    // Try common patterns
    const listUrls = [
      'https://programme.app/exercises',
      'https://programme.app/exercises/list',
      'https://programme.app/exercises/all',
    ]

    for (const listUrl of listUrls) {
      try {
        const response = await axios.get(listUrl, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
          },
          timeout: 10000
        })

        const html = response.data as string
        
        // Extract exercise links
        const exerciseLinkPattern = /href="\/exercises\/([^\/]+)\/(\d+)"/gi
        let match
        while ((match = exerciseLinkPattern.exec(html)) !== null) {
          const slug = match[1]
          const id = match[2]
          const url = `https://programme.app/exercises/${slug}/${id}`
          
          // Try to extract exercise name from surrounding context
          const nameMatch = html.substring(Math.max(0, match.index - 100), match.index + 200).match(/>([^<]+)</)
          if (nameMatch) {
            const name = nameMatch[1].trim()
            exerciseMap.set(name.toLowerCase(), url)
            exerciseMap.set(slug.replace(/-/g, ' '), url)
          }
          
          exerciseMap.set(slug.replace(/-/g, ' '), url)
        }
        
        if (exerciseMap.size > 0) {
          break // Found exercises, stop trying other URLs
        }
      } catch (err) {
        // Continue to next URL
      }
    }
  } catch (error) {
    console.error('Error scraping Programme.app:', error)
  }

  return exerciseMap
}

// Fuzzy match exercise names
function fuzzyMatch(exerciseName: string, programmeName: string): number {
  const name1 = exerciseName.toLowerCase().replace(/[^a-z0-9]/g, '')
  const name2 = programmeName.toLowerCase().replace(/[^a-z0-9]/g, '')
  
  if (name1 === name2) return 1.0
  if (name1.includes(name2) || name2.includes(name1)) return 0.8
  
  // Simple word matching
  const words1 = exerciseName.toLowerCase().split(/\s+/)
  const words2 = programmeName.toLowerCase().split(/\s+/)
  const commonWords = words1.filter(w => words2.includes(w))
  return commonWords.length / Math.max(words1.length, words2.length)
}

async function main() {
  console.log('🔍 Finding Programme.app matches for exercises...\n')
  
  const exercises = await getNonProgrammeExercises()
  console.log(`Found ${exercises.length} exercises to search for\n`)
  
  console.log('📡 Fetching Programme.app exercise list...')
  const programmeExercises = await getAllProgrammeExercises()
  console.log(`Found ${programmeExercises.size} exercises on Programme.app\n`)
  
  console.log('='.repeat(60))
  console.log('MATCHING EXERCISES')
  console.log('='.repeat(60))
  
  const matches: Array<{ exercise: string; programmeUrl: string; confidence: number }> = []
  const noMatches: string[] = []
  
  for (const exercise of exercises) {
    let bestMatch: { url: string; confidence: number } | null = null
    
    // Try exact match first
    for (const [progName, url] of programmeExercises.entries()) {
      const confidence = fuzzyMatch(exercise.name, progName)
      if (confidence > 0.5) {
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = { url, confidence }
        }
      }
    }
    
    if (bestMatch && bestMatch.confidence > 0.6) {
      matches.push({
        exercise: exercise.name,
        programmeUrl: bestMatch.url,
        confidence: bestMatch.confidence
      })
      console.log(`✅ ${exercise.name}`)
      console.log(`   → ${bestMatch.url} (confidence: ${(bestMatch.confidence * 100).toFixed(0)}%)`)
    } else {
      noMatches.push(exercise.name)
      console.log(`❌ ${exercise.name} - No match found`)
    }
    console.log('')
  }
  
  console.log('='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`✅ Matches found: ${matches.length}`)
  console.log(`❌ No matches: ${noMatches.length}`)
  
  if (matches.length > 0) {
    console.log('\n📋 MATCHES FOUND:')
    matches.forEach(m => {
      console.log(`${m.exercise} → ${m.programmeUrl}`)
    })
  }
  
  // Save to file
  const output = {
    matches: matches.map(m => ({
      exercise: m.exercise,
      programmeUrl: m.programmeUrl
    })),
    noMatches
  }
  
  fs.writeFileSync('programme-matches.json', JSON.stringify(output, null, 2))
  console.log('\n💾 Results saved to programme-matches.json')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

