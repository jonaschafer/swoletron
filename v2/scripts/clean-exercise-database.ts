import 'dotenv/config'

import { createClient } from '@supabase/supabase-js'

const GARBAGE_EXERCISES = [
  'band',
  'deficit)',
  'in box)',
  'unstable)',
  'lateral)',
  'throw/catch)',
  'various angles)'
]

async function findGarbageExercises(supabase: ReturnType<typeof createClient>) {
  console.log('🔍 Finding garbage exercises...\n')

  const { data, error } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', GARBAGE_EXERCISES)

  if (error) {
    throw new Error(`Failed to query exercises: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log('✅ No garbage exercises found!')
    return []
  }

  console.log(`⚠️  Found ${data.length} garbage exercises:\n`)
  for (const exercise of data) {
    console.log(`   • ID ${exercise.id}: "${exercise.name}"`)
  }

  return data
}

async function showExerciseContext(
  supabase: ReturnType<typeof createClient>,
  exerciseIds: string[]
) {
  console.log('\n📋 Checking exercise usage in workouts...\n')

  const { data, error } = await supabase
    .from('workout_exercises')
    .select('id, workout_id, exercise_id, exercises(name)')
    .in('exercise_id', exerciseIds)

  if (error) {
    throw new Error(`Failed to query workout_exercises: ${error.message}`)
  }

  if (!data || data.length === 0) {
    console.log('✅ These exercises are not used in any workouts (safe to delete)')
    return { used: [], unused: exerciseIds }
  }

  const usedIds = new Set(data.map((we) => we.exercise_id))
  const unusedIds = exerciseIds.filter((id) => !usedIds.has(id))

  console.log(`⚠️  These exercises are used in ${data.length} workout exercise(s):\n`)
  for (const we of data) {
    const exercise = we.exercises as { name: string } | null
    console.log(
      `   • Workout ID ${we.workout_id}: "${exercise?.name || 'Unknown'}" (workout_exercise ID: ${we.id})`
    )
  }

  if (unusedIds.length > 0) {
    console.log(`\n✅ These exercises are NOT used (safe to delete):`)
    const { data: unusedExercises } = await supabase
      .from('exercises')
      .select('id, name')
      .in('id', unusedIds)
    for (const ex of unusedExercises || []) {
      console.log(`   • "${ex.name}" (ID: ${ex.id})`)
    }
  }

  return { used: Array.from(usedIds), unused: unusedIds }
}

async function deleteGarbageExercises(
  supabase: ReturnType<typeof createClient>,
  exerciseIds: string[]
) {
  console.log('\n🗑️  Deleting garbage exercises...\n')

  // First, delete workout_exercises that reference these
  const { error: weError } = await supabase
    .from('workout_exercises')
    .delete()
    .in('exercise_id', exerciseIds)

  if (weError) {
    throw new Error(`Failed to delete workout_exercises: ${weError.message}`)
  }

  console.log(`✅ Deleted workout_exercises references`)

  // Now delete the exercises themselves
  const { error: exError } = await supabase
    .from('exercises')
    .delete()
    .in('id', exerciseIds)

  if (exError) {
    throw new Error(`Failed to delete exercises: ${exError.message}`)
  }

  console.log(`✅ Deleted ${exerciseIds.length} garbage exercises`)
}

async function run() {
  const args = process.argv.slice(2)
  const dryRun = !args.includes('--delete')

  console.log('🧹 Exercise Database Cleaner\n')
  if (dryRun) {
    console.log('ℹ️  DRY RUN MODE (use --delete to actually delete)\n')
  }

  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Missing Supabase environment variables')
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  )

  const garbageExercises = await findGarbageExercises(supabase)

  if (garbageExercises.length === 0) {
    return
  }

  const exerciseIds = garbageExercises.map((e) => e.id)
  const { used, unused } = await showExerciseContext(supabase, exerciseIds)

  if (dryRun) {
    console.log('\n💡 Next steps:')
    if (unused.length > 0) {
      console.log(`   1. Delete ${unused.length} unused exercises: Run with --delete flag`)
    }
    if (used.length > 0) {
      console.log(`   2. Investigate ${used.length} used exercises: Check workouts to see if they're fragments`)
      console.log(`      - "throw/catch)" and "various angles)" might be part of larger exercise names`)
      console.log(`      - You may need to manually fix these in the workouts`)
    }
  } else {
    if (unused.length > 0) {
      console.log(`\n🗑️  Deleting ${unused.length} unused exercises...`)
      await deleteGarbageExercises(supabase, unused)
    }
    if (used.length > 0) {
      console.log(`\n⚠️  Skipping ${used.length} used exercises (investigate manually):`)
      const { data: usedExercises } = await supabase
        .from('exercises')
        .select('id, name')
        .in('id', used)
      for (const ex of usedExercises || []) {
        console.log(`   • "${ex.name}" (ID: ${ex.id})`)
      }
    }
    console.log('\n✅ Cleanup complete!')
  }
}

run().catch((error) => {
  console.error('\n❌ Cleanup failed:', error)
  process.exitCode = 1
})

