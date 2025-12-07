import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import { scrapeExercise, ExerciseData } from './scrape-multi-site'

if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL in environment variables')
}

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error(
    'Missing SUPABASE_SERVICE_ROLE_KEY in environment variables. The import script requires elevated privileges.'
  )
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

interface ExerciseInput {
  name: string
  url: string
  variations?: string[] // For exercises with same URL
}

// Complete exercise list with variations grouped
const EXERCISES: ExerciseInput[] = [
  // Pull-ups & variations (grouped - same URL)
  {
    name: 'Assisted Pull-ups',
    url: 'https://exrx.net/WeightExercises/LatissimusDorsi/ASPullupBand',
    variations: ['light band', 'lightest band', 'thick band']
  },
  
  // Rows (DB Row already done, but include for completeness)
  {
    name: 'Dumbbell Row',
    url: 'https://exrx.net/WeightExercises/BackGeneral/DBBentOverRow'
  },
  {
    name: 'Inverted Rows',
    url: 'https://exrx.net/WeightExercises/BackGeneral/BWSupineRow'
  },
  
  // Band/resistance exercises
  {
    name: 'Band Pull-aparts',
    url: 'https://library.theprehabguys.com/vimeo-video/band-pull-apart/'
  },
  {
    name: 'Banded Ankle Eversion/Inversion',
    url: 'https://www.rehabhero.ca/exercise/banded-ankle-eversion'
  },
  {
    name: 'Banded Dorsiflexion',
    url: 'https://www.rehabhero.ca/exercise/banded-active-dorsiflexion'
  },
  
  // Balance & stability (grouped)
  {
    name: 'Bosu Single-leg Balance',
    url: 'https://www.rehabhero.ca/exercise/bosu-ball-single-leg-balance?rq=balance',
    variations: ['Bosu balance', 'Bosu single-leg balance']
  },
  {
    name: 'Single-leg Balance',
    url: 'https://www.rehabhero.ca/exercise/balance-pad-single-leg-stance?rq=balance',
    variations: ['Single-leg Balance (eyes closed)', 'SL Balance']
  },
  
  // Step-downs & lateral movements (grouped)
  {
    name: 'Eccentric Step-downs',
    url: 'https://programme.app/exercises/single-leg-step-down/894',
    variations: ['Eccentric Step-downs (from box)']
  },
  {
    name: 'Lateral Bounds',
    url: 'https://exrx.net/Plyometrics/MBLateralBound'
  },
  {
    name: 'Lateral Step-downs',
    url: 'https://exrx.net/WeightExercises/Quadriceps/BWStepDown'
  },
  
  // Core & abs (grouped)
  {
    name: 'Clamshells',
    url: 'https://www.rehabhero.ca/exercise/clamshells?rq=Clamshells'
  },
  {
    name: 'Flutter Kicks',
    url: 'https://www.catalystathletics.com/exercise/567/Flutter-Kick/'
  },
  {
    name: 'Pallof Press',
    url: 'https://www.rehabhero.ca/exercise/pallof-press?rq=Pallof%20press',
    variations: ['Pallof press (explosive)']
  },
  {
    name: 'Plank w/ Shoulder Taps',
    url: 'https://www.benjiphysio.co.uk/video-library/v/full-plank-with-shoulder-taps'
  },
  
  // Other exercises
  {
    name: 'Dead Hang',
    url: 'https://library.theprehabguys.com/vimeo-video/dead-hang-unilateral/'
  },
  {
    name: 'Face Pulls',
    url: 'https://www.muscleandstrength.com/exercises/banded-face-pull'
  },
  {
    name: 'Glute-Ham Curl',
    url: 'https://www.acefitness.org/resources/everyone/exercise-library/153/lying-hamstrings-curl/?srsltid=AfmBOoq18mRAkwkGfJXRot2kukLaepFACHAGCeZnZDXZJT2mcIb-vqWI'
  },
  {
    name: 'Landmine Press',
    url: 'https://exrx.net/WeightExercises/Power/LVOneArmPress'
  },
  {
    name: 'Med Ball Chest Pass',
    url: 'https://exrx.net/Testing/FlexFunction/MBChestPass'
  },
  {
    name: 'Monster Walks',
    url: 'https://www.rehabhero.ca/exercise/monster-walks?rq=Monster%20walk'
  },
  {
    name: 'Plyometric Push-ups',
    url: 'https://exrx.net/Plyometrics/KneelingPlyoPushupWall'
  },
  {
    name: 'Single-leg Calf Raise (deficit)',
    url: 'https://exrx.net/WeightExercises/Gastrocnemius/BWSingleLegCalfRaise'
  },
  {
    name: 'Toe Towel Grabs',
    url: 'https://www.rehabhero.ca/exercise/towel-curl?rq=towel%20grab'
  },
  {
    name: 'Wood Choppers',
    url: 'https://musclewiki.com/exercise/kettlebell-wood-chopper'
  },
  {
    name: 'Negative Pull-ups',
    url: 'https://workoutlabs.com/exercise-guide/negative-pull-ups-pullups/'
  }
]

interface ProcessedExercise {
  primaryName: string
  url: string
  variations: string[]
  scrapedData: ExerciseData | null
}

async function upsertExerciseLibraryEntry(
  exercise: ProcessedExercise,
  scrapedData: ExerciseData
): Promise<string> {
  // Build notes with variations
  let notes = `Scraped from ${new URL(exercise.url).hostname}`
  if (exercise.variations.length > 0) {
    notes += `. Variations: ${exercise.variations.join(', ')}`
  }
  if (scrapedData.demoUrl) {
    notes += `. Video: ${scrapedData.demoUrl}`
  }

  // Check if exercise already exists
  const { data: existing } = await supabase
    .from('exercise_library')
    .select('id, name')
    .ilike('name', exercise.primaryName)
    .maybeSingle()

  const payload = {
    name: exercise.primaryName,
    description: scrapedData.description,
    body_parts: scrapedData.bodyParts.length > 0 ? scrapedData.bodyParts : null,
    equipment: scrapedData.equipment.length > 0 ? scrapedData.equipment : null,
    injury_areas: scrapedData.injuryAreas.length > 0 ? scrapedData.injuryAreas : null,
    difficulty: scrapedData.difficulty,
    external_video_url: exercise.url, // Store the source page URL
    demo_file_path: null,
    thumbnail_path: scrapedData.thumbnailUrl,
    notes: notes
  }

  if (existing?.id) {
    const { error: updateError, data } = await supabase
      .from('exercise_library')
      .update(payload)
      .eq('id', existing.id)
      .select('id')
      .single()

    if (updateError) {
      throw new Error(`Failed to update exercise_library entry: ${updateError.message}`)
    }

    return (data as { id: string }).id
  }

  const { error: insertError, data: insertData } = await supabase
    .from('exercise_library')
    .insert(payload)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Failed to insert exercise_library entry: ${insertError.message}`)
  }

  return (insertData as { id: string }).id
}

async function processExercises() {
  console.log('🚀 Starting batch import of exercises...\n')
  console.log(`Total exercises to process: ${EXERCISES.length}\n`)

  // Group exercises by URL
  const urlMap = new Map<string, ProcessedExercise>()
  
  for (const exercise of EXERCISES) {
    const existing = urlMap.get(exercise.url)
    if (existing) {
      // Add variations to existing entry
      if (exercise.variations) {
        existing.variations.push(...exercise.variations)
      } else {
        existing.variations.push(exercise.name)
      }
    } else {
      // Create new entry
      urlMap.set(exercise.url, {
        primaryName: exercise.name,
        url: exercise.url,
        variations: exercise.variations || [],
        scrapedData: null
      })
    }
  }

  const uniqueExercises = Array.from(urlMap.values())
  console.log(`Unique URLs to scrape: ${uniqueExercises.length}\n`)

  let successCount = 0
  let errorCount = 0
  const errors: Array<{ name: string; url: string; error: string }> = []

  // Process each unique exercise
  for (let i = 0; i < uniqueExercises.length; i++) {
    const exercise = uniqueExercises[i]
    console.log(`[${i + 1}/${uniqueExercises.length}] Processing: ${exercise.primaryName}`)
    console.log(`  URL: ${exercise.url}`)
    
    try {
      // Scrape the exercise data
      const scrapedData = await scrapeExercise(exercise.url)
      exercise.scrapedData = scrapedData
      
      console.log(`  ✓ Scraped: ${scrapedData.name}`)
      console.log(`  Body Parts: ${scrapedData.bodyParts.length > 0 ? scrapedData.bodyParts.join(', ') : 'None'}`)
      console.log(`  Equipment: ${scrapedData.equipment.length > 0 ? scrapedData.equipment.join(', ') : 'None'}`)
      
      // Use scraped name if better, otherwise use provided name
      if (scrapedData.name && scrapedData.name !== 'Unknown' && scrapedData.name.length > exercise.primaryName.length) {
        exercise.primaryName = scrapedData.name
      }
      
      // Insert/update in database
      const id = await upsertExerciseLibraryEntry(exercise, scrapedData)
      console.log(`  ✓ Added to database: ${id}\n`)
      successCount++
      
      // Small delay between requests to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000))
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      console.error(`  ❌ Error: ${errorMessage}\n`)
      errors.push({
        name: exercise.primaryName,
        url: exercise.url,
        error: errorMessage
      })
      errorCount++
    }
  }

  // Print summary
  console.log('\n' + '='.repeat(80))
  console.log('📊 BATCH IMPORT SUMMARY')
  console.log('='.repeat(80))
  console.log(`✅ Successfully imported: ${successCount}`)
  console.log(`❌ Failed: ${errorCount}`)
  console.log(`📝 Total processed: ${uniqueExercises.length}`)
  
  if (errors.length > 0) {
    console.log('\n❌ ERRORS:')
    errors.forEach(({ name, url, error }) => {
      console.log(`  - ${name}`)
      console.log(`    URL: ${url}`)
      console.log(`    Error: ${error}\n`)
    })
  }
  
  console.log('\n🎉 Batch import complete!')
}

processExercises()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Fatal error:', error)
    process.exit(1)
  })

