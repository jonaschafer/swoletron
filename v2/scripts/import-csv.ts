// scripts/import-csv.ts
import { config } from 'dotenv'
config({ path: '.env.local' })  // Explicitly tell it to use .env.local

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

// Extract week number from date (Week 1 starts Oct 13, 2025)
function getWeekNumber(dateStr: string): number {
  const date = new Date(dateStr)
  const startDate = new Date('2025-10-13')
  const diffTime = date.getTime() - startDate.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  return Math.floor(diffDays / 7) + 1
}

// Parse workout type from title and content
function getWorkoutType(title: string, workoutType?: string): string {
  const titleLower = title.toLowerCase()
  
  // Always check content first - some "Strength" workouts are actually micro
  if (titleLower.includes('recovery - ankles') || 
      titleLower.includes('stability - ankles') || 
      titleLower.includes('stability + prehab') ||
      titleLower.includes('dessert day') ||
      titleLower.includes('power day') ||
      titleLower.includes('core strength') ||
      titleLower.includes('core endurance') ||
      titleLower.includes('core - light') ||
      titleLower.includes('anti-rotation core') ||
      titleLower.includes('ankle/foot resilience') ||
      titleLower.includes('light maintenance') ||
      titleLower.includes('light week') ||
      titleLower.includes('maintenance')) {
    return 'micro'
  }
  
  // Real strength workouts have "upper body" or "lower body" in the title
  if (titleLower.includes('upper body') || titleLower.includes('lower body')) {
    return 'strength'
  }
  
  // Use CSV workout type as fallback, but convert to lowercase
  if (workoutType) return workoutType.toLowerCase()
  
  // Additional fallbacks based on title content
  if (titleLower.includes('run') || titleLower.includes('recovery')) {
    return 'run'
  }
  if (titleLower.includes('micro') || titleLower.includes('core') || titleLower.includes('ankles')) {
    return 'micro'
  }
  if (titleLower.includes('rest')) {
    return 'rest'
  }
  return 'run' // default
}

// Extract exercises from description
function extractExercises(description: string): Array<{
  name: string
  sets: number
  reps: string
  weight: number
  unit: string
}> {
  const exercises: any[] = []
  
  // Split by | to get individual exercises, then process each
  const sections = description.split('|')
  
  for (const section of sections) {
    const trimmed = section.trim()
    
    // Skip section headers like "WARM-UP (5min):", "MAIN:", "FINISHER:"
    if (trimmed.includes(':') && !trimmed.includes('×')) {
      continue
    }
    
    // Match patterns like: "Goblet Squat 3×12 @35lb"
    const match = trimmed.match(/([A-Za-z\s\-()]+?)\s+(\d+)×(\d+(?:-\d+)?|[\d.]+s|[\d.]+sec)\s*(?:@(\d+(?:\.\d+)?)\s*(lb|kg|BW|KB|band|time))?/i)
    
    if (match) {
      const [, name, sets, reps, weight, unit] = match
      exercises.push({
        name: name.trim(),
        sets: parseInt(sets),
        reps: reps.trim(),
        weight: weight ? parseFloat(weight) : 0,
        unit: unit ? unit.toLowerCase() : 'BW'
      })
    }
    
    // Also match patterns with "each" like "SL RDL 3×8 each (BW)"
    const eachMatch = trimmed.match(/([A-Za-z\s\-()]+?)\s+(\d+)×(\d+(?:-\d+)?)\s+each\s*(?:\(([A-Za-z0-9]+)\))?/i)
    if (eachMatch && !match) {
      const [, name, sets, reps, weightUnit] = eachMatch
      exercises.push({
        name: name.trim(),
        sets: parseInt(sets),
        reps: reps.trim(),
        weight: 0,
        unit: weightUnit ? weightUnit.toLowerCase() : 'BW'
      })
    }
    
    // Match time-based exercises like "Plank 3×30sec"
    const timeMatch = trimmed.match(/([A-Za-z\s\-()]+?)\s+(\d+)×(\d+sec)/i)
    if (timeMatch && !match && !eachMatch) {
      const [, name, sets, reps] = timeMatch
      exercises.push({
        name: name.trim(),
        sets: parseInt(sets),
        reps: reps.trim(),
        weight: 0,
        unit: 'time'
      })
    }
  }
  
  return exercises
}

async function importCSV() {
  console.log('🚀 Starting CSV import...\n')

  try {
    // Read CSV file
    const csvPath = process.argv[2] || './finalsurge-export.csv'
    console.log(`📄 Reading CSV from: ${csvPath}`)
    
    const fileContent = readFileSync(csvPath, 'utf-8')
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,  // ← ADD THIS LINE
      quote: '"',                 // ← ADD THIS LINE
      escape: '"'                 // ← ADD THIS LINE
    })

    console.log(`✅ Parsed ${records.length} records from CSV\n`)

    // Clear existing data (optional - comment out if you want to keep existing data)
    console.log('🗑️  Clearing existing workouts...')
    const { error: deleteError } = await supabase
      .from('workouts')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) console.warn('⚠️  Warning clearing data:', deleteError.message)

    let successCount = 0
    let errorCount = 0

    // Process each record
    for (const record of records) {
      try {
        const date = record['Date'] || record['date']
        if (!date) {
          console.warn('⚠️  Skipping record with no date:', record)
          continue
        }

        const weekNumber = getWeekNumber(date)
        const workoutType = getWorkoutType(
          record['Workout Name'] || record['title'] || '',
          record['Workout Type'] || record['type']
        )

        const workoutData = {
          date,
          week_number: weekNumber,
          workout_type: workoutType,
          title: record['Workout Name'] || record['title'] || 'Untitled',
          description: record['Description'] || record['description'] || '',
          duration_minutes: record['Duration'] ? parseInt(record['Duration']) : null,
          distance_miles: record['Distance'] ? parseFloat(record['Distance']) : null,
          elevation_gain_feet: record['Elevation Gain'] ? parseInt(record['Elevation Gain']) : null,
          intensity: record['Intensity'] || record['intensity'] || null,
          notes: record['Notes'] || record['notes'] || '',
          phase: PHASE_MAP[weekNumber.toString()] || 'General Prep'
        }

        // Insert workout
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select()
          .single()

        if (workoutError) {
          console.error(`❌ Error inserting workout for ${date}:`, workoutError.message)
          errorCount++
          continue
        }

        // Extract and insert exercises for strength workouts
        if (workoutType === 'strength' && workoutData.description) {
          const exercises = extractExercises(workoutData.description)
          
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
                  category: 'general',
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

      } catch (err: any) {
        console.error(`❌ Error processing record:`, err.message)
        errorCount++
      }
    }

    console.log('\n🎉 Import complete!')
    console.log(`✅ Successfully imported: ${successCount} workouts`)
    if (errorCount > 0) {
      console.log(`⚠️  Errors: ${errorCount}`)
    }

    // Verify data
    const { count } = await supabase
      .from('workouts')
      .select('*', { count: 'exact', head: true })

    console.log(`\n📊 Total workouts in database: ${count}`)

    // Show week breakdown
    const { data: weekCounts } = await supabase
      .from('workouts')
      .select('week_number')
      .order('week_number')

    if (weekCounts) {
      const weeks = weekCounts.reduce((acc: any, w: any) => {
        acc[w.week_number] = (acc[w.week_number] || 0) + 1
        return acc
      }, {})

      console.log('\n📅 Workouts per week:')
      Object.entries(weeks).forEach(([week, count]) => {
        console.log(`  Week ${week}: ${count} workouts`)
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