import 'dotenv/config'
import axios from 'axios'
import * as fs from 'fs'
import { createClient } from '@supabase/supabase-js'
import { compareTwoStrings } from 'string-similarity'
import { parseString } from 'xml2js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { persistSession: false }
})

async function getExercisesFromSitemap(): Promise<Array<{ name: string; url: string; slug: string; id: number }>> {
  console.log('🌐 Fetching exercises from Programme.app sitemap...\n')
  
  try {
    // Get sitemap index
    const sitemapIndexResponse = await axios.get('https://programme.app/sitemap/sitemap-index.xml')
    const sitemapIndex = sitemapIndexResponse.data
    
    // Extract sitemap URLs
    const sitemapUrls = sitemapIndex.match(/<loc>([^<]+)<\/loc>/g)?.map((loc: string) => 
      loc.replace('<loc>', '').replace('</loc>', '')
    ) || []
    
    console.log(`Found ${sitemapUrls.length} sitemap files`)
    
    const allExercises: Array<{ name: string; url: string; slug: string; id: number }> = []
    
    for (const sitemapUrl of sitemapUrls) {
      console.log(`  Fetching ${sitemapUrl}...`)
      try {
        const sitemapResponse = await axios.get(sitemapUrl, { timeout: 10000 })
        const sitemap = sitemapResponse.data
        
        // Extract exercise URLs
        const exerciseUrls = sitemap.match(/https:\/\/programme\.app\/exercises\/[^<\s]+/g) || []
        
        console.log(`    Found ${exerciseUrls.length} exercise URLs`)
        
        exerciseUrls.forEach((url: string) => {
          const match = url.match(/\/exercises\/([^\/]+)\/(\d+)$/)
          if (match) {
            allExercises.push({
              name: match[1].replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase()), // Generate name from slug
              url,
              slug: match[1],
              id: parseInt(match[2])
            })
          }
        })
      } catch (err: any) {
        console.log(`    Error fetching ${sitemapUrl}: ${err.message}`)
      }
    }
    
    // Remove duplicates
    const unique = new Map<string, { name: string; url: string; slug: string; id: number }>()
    allExercises.forEach(ex => {
      unique.set(ex.url, ex)
    })
    
    return Array.from(unique.values())
  } catch (error: any) {
    console.error(`Error: ${error.message}`)
    return []
  }
}

async function getExerciseNameFromUrl(url: string): Promise<string | null> {
  try {
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      },
      timeout: 3000
    })
    
    const html = response.data as string
    const nameMatch = html.match(/<h1[^>]*>([^<]+)<\/h1>/i) || 
                     html.match(/<title[^>]*>([^<]+)<\/title>/i)
    
    if (nameMatch) {
      return nameMatch[1].trim().replace(/\s*-\s*Programme\.app.*/i, '')
    }
    
    return null
  } catch {
    return null
  }
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
  programmeExercises: Array<{ name: string; url: string }>,
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
  
  // First, try to get real names for a sample of exercises
  console.log('  Fetching exercise names from Programme.app...')
  const sampleSize = Math.min(programmeExercises.length, 100) // Limit to 100 to save time
  for (let i = 0; i < sampleSize; i++) {
    const ex = programmeExercises[i]
    if (!ex.name || ex.name.length < 3) {
      const realName = await getExerciseNameFromUrl(ex.url)
      if (realName) {
        ex.name = realName
      }
    }
    if (i % 20 === 0 && i > 0) {
      console.log(`    Fetched ${i}/${sampleSize} names...`)
    }
    await new Promise(resolve => setTimeout(resolve, 100)) // Rate limiting
  }
  
  console.log('\n  Matching...\n')
  
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
  // Step 1: Get all exercises from sitemap
  const programmeExercises = await getExercisesFromSitemap()
  
  console.log(`\n✅ Found ${programmeExercises.length} exercises from sitemap`)
  
  if (programmeExercises.length === 0) {
    console.log('\n⚠️  No exercises found in sitemap.')
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

