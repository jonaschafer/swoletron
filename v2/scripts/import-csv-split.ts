// scripts/import-csv-split.ts
import { config } from 'dotenv'
config({ path: '.env.local' })

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { parse } from 'csv-parse/sync'

// Load environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local')
  console.error('Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Phase mapping
const PHASE_MAP: Record<string, string> = {
  '1': 'Recovery',
  '2': 'Recovery', 
  '3': 'General Prep',
  '4': 'General Prep',
  '5': 'General Prep',
  '6': 'General Prep',
  '7': 'Max Strength',
  '8': 'Max Strength',
  '9': 'Max Strength',
  '10': 'Power',
  '11': 'Power',
  '12': 'Taper'
}

// Function to split combined workouts into separate entries
function splitCombinedWorkout(record: any): any[] {
  const workouts: any[] = []
  const weekNumber = parseInt(record.week)
  const phase = PHASE_MAP[weekNumber.toString()] || 'General Prep'
  
  // Parse the combined workout type
  const workoutType = record.workout_type?.toLowerCase() || ''
  const description = record.description || ''
  const exercises = record.exercises || ''
  
  // Handle different combined workout types
  if (workoutType.includes('run + strength')) {
    // Split into separate run and strength workouts
    
    // 1. Run workout
    const runWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: 'run',
      title: `Group Run - Week ${weekNumber}`,
      description: description.split('+')[0]?.trim() || description,
      duration_minutes: Math.floor(record.duration / 2), // Split duration
      distance_miles: record.distance ? parseFloat(record.distance) : null,
      elevation_gain_feet: null,
      intensity: 'Moderate',
      notes: `Part of combined workout - Week ${weekNumber}`,
      phase: phase
    }
    workouts.push(runWorkout)
    
    // 2. Strength workout
    const strengthWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: 'strength',
      title: `Lower Body Strength - Week ${weekNumber}`,
      description: description.split('+')[1]?.trim() || 'Lower body strength training',
      duration_minutes: Math.floor(record.duration / 2), // Split duration
      distance_miles: null,
      elevation_gain_feet: null,
      intensity: 'Moderate',
      notes: `Part of combined workout - Week ${weekNumber}`,
      phase: phase,
      exercises_data: exercises // Store exercises data temporarily
    }
    workouts.push(strengthWorkout)
    
  } else if (workoutType.includes('easy run + core')) {
    // Split into separate run and micro workouts
    
    // 1. Run workout
    const runWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: 'run',
      title: `Easy Run - Week ${weekNumber}`,
      description: description.split('+')[0]?.trim() || description,
      duration_minutes: Math.floor(record.duration / 2), // Split duration
      distance_miles: record.distance ? parseFloat(record.distance) : null,
      elevation_gain_feet: null,
      intensity: 'Easy',
      notes: `Part of combined workout - Week ${weekNumber}`,
      phase: phase
    }
    workouts.push(runWorkout)
    
    // 2. Micro workout
    const microWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: 'micro',
      title: `Core Micro - Week ${weekNumber}`,
      description: description.split('+')[1]?.trim() || 'Core micro-dose',
      duration_minutes: Math.floor(record.duration / 2), // Split duration
      distance_miles: null,
      elevation_gain_feet: null,
      intensity: 'Easy',
      notes: `Part of combined workout - Week ${weekNumber}`,
      phase: phase,
      exercises_data: exercises // Store exercises data temporarily
    }
    workouts.push(microWorkout)
    
  } else if (workoutType.includes('rest/easy')) {
    // Handle rest/easy as separate rest and micro workouts
    
    // 1. Rest workout
    const restWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: 'rest',
      title: `Rest Day - Week ${weekNumber}`,
      description: 'Complete rest or optional easy activity',
      duration_minutes: 0,
      distance_miles: null,
      elevation_gain_feet: null,
      intensity: 'Rest',
      notes: `Week ${weekNumber} rest day`,
      phase: phase
    }
    workouts.push(restWorkout)
    
    // 2. Micro workout (if exercises exist)
    if (exercises && exercises.length > 0) {
      const microWorkout = {
        date: record.date,
        week_number: weekNumber,
        workout_type: 'micro',
        title: `Ankle/Foot Micro - Week ${weekNumber}`,
        description: 'Ankle and foot micro-dose exercises',
        duration_minutes: 15,
        distance_miles: null,
        elevation_gain_feet: null,
        intensity: 'Easy',
        notes: `Week ${weekNumber} micro-dose`,
        phase: phase,
        exercises_data: exercises // Store exercises data temporarily
      }
      workouts.push(microWorkout)
    }
    
  } else {
    // Single workout - handle as before
    let workoutType = record.workout_type?.toLowerCase() || 'run'
    
    // Standardize workout types
    if (workoutType.includes('easy run')) workoutType = 'run'
    if (workoutType.includes('long run')) workoutType = 'run'
    if (workoutType.includes('rest')) workoutType = 'rest'
    
    const singleWorkout = {
      date: record.date,
      week_number: weekNumber,
      workout_type: workoutType,
      title: `${record.workout_type} - Week ${weekNumber}`,
      description: description,
      duration_minutes: record.duration ? parseInt(record.duration) : null,
      distance_miles: record.distance ? parseFloat(record.distance) : null,
      elevation_gain_feet: null,
      intensity: workoutType === 'rest' ? 'Rest' : 'Easy',
      notes: `Week ${weekNumber}`,
      phase: phase,
      exercises_data: exercises
    }
    workouts.push(singleWorkout)
  }
  
  return workouts
}

// Extract exercises from description
function extractExercises(exercises: string): Array<{
  name: string
  sets: number
  reps: string
  weight: number
  unit: string
}> {
  const exerciseList: any[] = []
  
  if (!exercises || exercises.length === 0) return exerciseList
  
  // Split by comma and process each exercise
  const exerciseStrings = exercises.split(',').map(ex => ex.trim())
  
  for (const exerciseStr of exerciseStrings) {
    // Match patterns like: "Bosu balance: 2×30sec each leg" or "Goblet Squat: 3×12 @ 35lb"
    const match = exerciseStr.match(/([^:]+):\s*(\d+)×(\d+(?:sec|min|-\d+)?)\s*(?:each\s+\w+)?\s*(?:@\s*(\d+(?:\.\d+)?)\s*(lb|kg|BW|time))?/i)
    
    if (match) {
      const [, name, sets, reps, weight, unit] = match
      exerciseList.push({
        name: name.trim(),
        sets: parseInt(sets),
        reps: reps.trim(),
        weight: weight ? parseFloat(weight) : 0,
        unit: unit ? unit.toLowerCase() : 'BW'
      })
    } else {
      // Try to match simpler patterns without time units
      const simpleMatch = exerciseStr.match(/([^:]+):\s*(\d+)×(\d+)/)
      if (simpleMatch) {
        const [, name, sets, reps] = simpleMatch
        exerciseList.push({
          name: name.trim(),
          sets: parseInt(sets),
          reps: reps.trim(),
          weight: 0,
          unit: 'BW'
        })
      }
    }
  }
  
  return exerciseList
}

async function importCSV() {
  console.log('🚀 Starting CSV import with workout splitting...\n')

  try {
    // Read CSV file
    const csvPath = './workouts.csv'
    console.log(`📄 Reading CSV from: ${csvPath}`)
    
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
      quote: '"',
      escape: '"'
    })

    console.log(`✅ Parsed ${records.length} records from CSV\n`)

    // Clear existing data
    console.log('🗑️  Clearing existing workouts...')
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000')
    
    if (deleteError) {
      console.warn('⚠️  Warning clearing data:', deleteError.message)
    } else {
      console.log('✅ Old data cleared\n')
    }

    let successCount = 0
    let errorCount = 0
    let totalWorkouts = 0

    // Process each record and split combined workouts
    for (const record of records) {
      try {
        const splitWorkouts = splitCombinedWorkout(record)
        totalWorkouts += splitWorkouts.length
        
        for (const workoutData of splitWorkouts) {
          // Store exercises data separately before inserting workout
          const exercisesData = workoutData.exercises_data
          delete workoutData.exercises_data // Remove from workout data
          
          // Insert workout
          const { data: workout, error: workoutError } = await supabase
            .from('workouts')
            .insert(workoutData)
            .select()
            .single()

          if (workoutError) {
            console.error(`❌ Error inserting workout for ${workoutData.date}:`, workoutError.message)
            errorCount++
            continue
          }

          // Extract and insert exercises for strength/micro workouts
          if ((workoutData.workout_type === 'strength' || workoutData.workout_type === 'micro') && exercisesData) {
            const exercises = extractExercises(exercisesData)
            
            for (let i = 0; i < exercises.length; i++) {
              const ex = exercises[i]
              
              // Find or create exercise in library
              let { data: exerciseRecord } = await supabase
                .from('exercises')
                .select('id')
                .ilike('name', ex.name)
                .maybeSingle()

              if (!exerciseRecord) {
                const { data: newExercise, error: exerciseError } = await supabase
                  .from('exercises')
                  .insert({
                    name: ex.name,
                    category: workoutData.workout_type === 'strength' ? 'strength' : 'micro',
                    equipment: [ex.unit]
                  })
                  .select()
                  .single()

                if (exerciseError) {
                  console.warn(`⚠️  Could not create exercise "${ex.name}":`, exerciseError.message)
                  continue
                }
                
                exerciseRecord = newExercise
              }

              // Link exercise to workout
              if (exerciseRecord) {
                const { error: linkError } = await supabase
                  .from('workout_exercises')
                  .insert({
                    workout_id: workout.id,
                    exercise_id: exerciseRecord.id,
                    order_index: i + 1,
                    sets: ex.sets,
                    reps: ex.reps,
                    weight: ex.weight,
                    weight_unit: ex.unit
                  })

                if (linkError) {
                  console.warn(`⚠️  Could not link exercise "${ex.name}" to workout:`, linkError.message)
                }
              }
            }
            
            if (exercises.length > 0) {
              console.log(`  ✓ ${workout.title} (${exercises.length} exercises)`)
            }
          } else {
            console.log(`  ✓ ${workout.title}`)
          }

          successCount++
        }

      } catch (err: any) {
        console.error(`❌ Error processing record:`, err.message)
        errorCount++
      }
    }

    console.log('\n🎉 Import complete!')
    console.log(`✅ Successfully imported: ${successCount} individual workouts`)
    console.log(`📊 Total workout blocks created: ${totalWorkouts}`)
    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount}`)
    }

    // Verify data
    const { count } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Total workouts in database: ${count}`)

    // Show workout type breakdown
    const { data: typeCounts } = await supabase
      .from('workouts')
      .select('workout_type')

    if (typeCounts) {
      const types = typeCounts.reduce((acc: any, w: any) => {
        acc[w.workout_type] = (acc[w.workout_type] || 0) + 1
        return acc
      }, {})

      console.log('\n📋 Workout types:')
      Object.entries(types).forEach(([type, count]) => {
        console.log(`  ${type}: ${count} workouts`)
      })
    }

    console.log('\n✨ Database is ready! You can now start the app.\n')

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run import
importCSV()
