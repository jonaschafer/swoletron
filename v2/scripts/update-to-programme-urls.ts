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

interface ExerciseUpdate {
  name: string
  programmeUrl: string
}

const updates: ExerciseUpdate[] = [
  { name: 'Bird Dog', programmeUrl: 'https://programme.app/exercises/bird-dog/134' },
  { name: 'Bird Dogs', programmeUrl: 'https://programme.app/exercises/bird-dog/134' },
  { name: 'Dead Bugs', programmeUrl: 'https://programme.app/exercises/deadbug-hold/270' },
  { name: 'Glute Bridge', programmeUrl: 'https://programme.app/exercises/glute-bridge-hold/361' },
  { name: 'Clamshells', programmeUrl: 'https://programme.app/exercises/banded-clam-shell/69' },
  { name: 'Fire Hydrants', programmeUrl: 'https://programme.app/exercises/banded-fire-hydrant/77' },
  { name: 'Full Plank - Shoulder Taps', programmeUrl: 'https://programme.app/exercises/opposite-shoulder-tap-with-pause/628' },
  { name: 'Band Pull Apart', programmeUrl: 'https://programme.app/exercises/banded-pull-aparts/87' },
  { name: 'Face Pulls', programmeUrl: 'https://programme.app/exercises/banded-facepulls/76' },
  { name: 'Negative Pull-Ups / Pullups', programmeUrl: 'https://programme.app/exercises/eccentric-pull-up/306' },
  { name: 'Dead Hang', programmeUrl: 'https://programme.app/exercises/active-hang/19' },
  { name: 'Lateral Band Walks', programmeUrl: 'https://programme.app/exercises/lateral-banded-walks/566' },
  { name: 'Flutter Kicks', programmeUrl: 'https://programme.app/exercises/hollow-body-flutters/450' },
  { name: 'Kettlebell Wood Chopper', programmeUrl: 'https://programme.app/exercises/half-kneeling-kb-cross-chops/391' },
]

function extractSlug(url: string): string {
  const match = url.match(/\/exercises\/([^\/]+)\/\d+/)
  return match ? match[1] : ''
}

async function updateExercise(exercise: ExerciseUpdate): Promise<boolean> {
  try {
    // Find the exercise by name
    const { data: exerciseData, error: findError } = await supabase
      .from('exercise_library')
      .select('id, name, external_video_url, thumbnail_path')
      .eq('name', exercise.name)
      .maybeSingle()

    if (findError) {
      console.error(`  ❌ Error finding exercise: ${findError.message}`)
      return false
    }

    if (!exerciseData) {
      console.log(`  ⚠️  Exercise "${exercise.name}" not found. Skipping.`)
      return false
    }

    // Extract slug for thumbnail path
    const slug = extractSlug(exercise.programmeUrl)
    const thumbnailPath = slug ? `youtube/${slug}/thumbnail.jpg` : null

    // Update the exercise
    const updateData: any = {
      external_video_url: exercise.programmeUrl
    }

    // Only update thumbnail path if we have a slug
    if (thumbnailPath) {
      updateData.thumbnail_path = thumbnailPath
    }

    const { error: updateError } = await supabase
      .from('exercise_library')
      .update(updateData)
      .eq('id', exerciseData.id)

    if (updateError) {
      console.error(`  ❌ Error updating exercise: ${updateError.message}`)
      return false
    }

    console.log(`  ✅ Updated "${exercise.name}"`)
    if (thumbnailPath) {
      console.log(`     URL: ${exercise.programmeUrl}`)
      console.log(`     Thumbnail: ${thumbnailPath}`)
    }
    return true
  } catch (error: any) {
    console.error(`  ❌ Error: ${error.message}`)
    return false
  }
}

async function main() {
  console.log('🚀 Updating exercises to use Programme.app URLs...\n')
  console.log('='.repeat(60))

  let successCount = 0
  let failCount = 0

  for (const update of updates) {
    console.log(`\nUpdating: ${update.name}`)
    const success = await updateExercise(update)
    if (success) {
      successCount++
    } else {
      failCount++
    }
  }

  console.log(`\n\n${'='.repeat(60)}`)
  console.log('📊 SUMMARY')
  console.log(`${'='.repeat(60)}\n`)
  console.log(`✅ Successful: ${successCount}/${updates.length}`)
  console.log(`❌ Failed: ${failCount}/${updates.length}`)
  console.log('\n📋 Next steps:')
  console.log('  1. Run the download script to fetch thumbnails for updated exercises')
  console.log('  2. Verify the changes in the database')
}

main()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

