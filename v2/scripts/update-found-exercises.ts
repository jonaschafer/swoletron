import 'dotenv/config'
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

// Exercises found by user
const foundExercises = [
  { name: 'Chest Press', programmeUrl: 'https://programme.app/exercises/bench-press/124' },
  { name: 'Inverted Rows', programmeUrl: 'https://programme.app/exercises/archer-ring-row/46' },
  { name: 'Kettlebell Swings', programmeUrl: 'https://programme.app/exercises/russian-kb-swing/767' },
  { name: 'Medicine Ball Lateral Bound', programmeUrl: 'https://programme.app/exercises/lateral-lunge-with-jump/575' },
  { name: 'Step-up', programmeUrl: 'https://programme.app/exercises/db-goblet-step-up/237' },
  { name: 'Step-Downs', programmeUrl: 'https://programme.app/exercises/single-leg-step-down/892' },
  { name: 'Seated Overhead Press', programmeUrl: 'https://programme.app/exercises/alternating-kb-seated-press/35' },
  { name: 'Push-up', programmeUrl: 'https://programme.app/exercises/db-walk-over-push-ups/267' },
]

async function updateExercises() {
  console.log(`🔄 Updating ${foundExercises.length} exercises with Programme.app URLs...\n`)

  let successCount = 0
  let errorCount = 0

  for (const exercise of foundExercises) {
    try {
      const { data: exerciseData, error } = await supabase
        .from('exercise_library')
        .update({ external_video_url: exercise.programmeUrl })
        .eq('name', exercise.name)
        .select()

      if (error) {
        console.error(`❌ Error updating "${exercise.name}":`, error.message)
        errorCount++
      } else if (exerciseData && exerciseData.length > 0) {
        console.log(`✅ Updated: ${exercise.name} → ${exercise.programmeUrl}`)
        successCount++
      } else {
        console.warn(`⚠️  Exercise not found: "${exercise.name}"`)
        errorCount++
      }
    } catch (err: any) {
      console.error(`❌ Error updating "${exercise.name}":`, err.message)
      errorCount++
    }
  }

  console.log('\n' + '='.repeat(80))
  console.log(`✅ Successfully updated: ${successCount}`)
  console.log(`❌ Errors/Not found: ${errorCount}`)
  console.log(`📊 Total: ${foundExercises.length}`)
  
  if (successCount > 0) {
    console.log('\n💡 Next steps:')
    console.log('   1. Run thumbnail path fix: npx tsx scripts/fix-thumbnail-paths.ts')
    console.log('   2. Download thumbnails: npx tsx scripts/download-programme-thumbnails.ts')
  }
}

updateExercises()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

