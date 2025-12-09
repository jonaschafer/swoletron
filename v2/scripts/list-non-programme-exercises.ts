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

async function listNonProgrammeExercises() {
  console.log('🔍 Finding exercises that do NOT use Programme.app URLs...\n')

  // Get all exercises
  const { data: exercises, error } = await supabase
    .from('exercise_library')
    .select('name, external_video_url, demo_file_path, thumbnail_path')
    .order('name')

  if (error) {
    console.error('❌ Error fetching exercises:', error)
    process.exit(1)
  }

  if (!exercises || exercises.length === 0) {
    console.log('No exercises found.')
    return
  }

  const nonProgrammeExercises: Array<{
    name: string
    external_video_url: string | null
    demo_file_path: string | null
    thumbnail_path: string | null
  }> = []

  for (const exercise of exercises) {
    const hasProgrammeUrl = 
      (exercise.external_video_url && exercise.external_video_url.includes('programme.app')) ||
      (exercise.demo_file_path && exercise.demo_file_path.includes('programme')) ||
      (exercise.thumbnail_path && exercise.thumbnail_path.includes('programme'))

    if (!hasProgrammeUrl) {
      nonProgrammeExercises.push(exercise)
    }
  }

  console.log(`Found ${nonProgrammeExercises.length} exercises that do NOT use Programme.app URLs:\n`)
  console.log('='.repeat(60))
  
  for (const exercise of nonProgrammeExercises) {
    console.log(`• ${exercise.name}`)
    if (exercise.external_video_url) {
      console.log(`  External URL: ${exercise.external_video_url}`)
    }
    if (exercise.demo_file_path) {
      console.log(`  Demo file: ${exercise.demo_file_path}`)
    }
    if (exercise.thumbnail_path) {
      console.log(`  Thumbnail: ${exercise.thumbnail_path}`)
    }
    if (!exercise.external_video_url && !exercise.demo_file_path && !exercise.thumbnail_path) {
      console.log(`  ⚠️  No video/thumbnail URLs found`)
    }
    console.log('')
  }

  console.log('='.repeat(60))
  console.log(`\nTotal: ${nonProgrammeExercises.length} exercises`)
}

listNonProgrammeExercises()
  .then(() => {
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Fatal error:', error)
    process.exit(1)
  })

