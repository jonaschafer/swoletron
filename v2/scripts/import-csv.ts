// scripts/import-csv.ts
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

async function importCSV() {
  console.log('🚀 Starting CSV import...\n')

  try {
    // Read CSV file - use workouts.csv
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
      .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all
    
    if (deleteError) {
      console.warn('⚠️  Warning clearing data:', deleteError.message)
    } else {
      console.log('✅ Old data cleared\n')
    }

    let successCount = 0
    let errorCount = 0

    // Process each record
    for (const record of records) {
      try {
        // Map CSV columns to database columns
        const weekNumber = parseInt(record.week)
        const phase = PHASE_MAP[weekNumber.toString()] || 'General Prep'

        // Parse workout type - map variations to clean types
        let workoutType = record.workout_type?.toLowerCase() || 'run'
        
        // Determine if it's a main strength session or micro-dose
        const description = record.description || ''
        const exercises = record.exercises || ''
        
        // Micro-doses have exercises but are lighter work
        if (exercises && (
          record.day_of_week === 'Monday' || 
          record.day_of_week === 'Wednesday'
        )) {
          workoutType = 'micro'
        } else if (exercises && record.workout_type?.toLowerCase().includes('strength')) {
          workoutType = 'strength'
        }

        const workoutData = {
          date: record.date,
          week_number: weekNumber,
          workout_type: workoutType,
          title: `${record.workout_type} - Week ${weekNumber}`,
          description: description,
          duration_minutes: record.duration ? parseInt(record.duration) : null,
          distance_miles: record.distance ? parseFloat(record.distance) : null,
          elevation_gain_feet: null, // Not in your CSV
          intensity: null, // Not in your CSV
          notes: exercises || '', // Store exercises in notes for now
          phase: phase
        }

        // Insert workout
        const { data: workout, error: workoutError } = await supabase
          .from('workouts')
          .insert(workoutData)
          .select()
          .single()

        if (workoutError) {
          console.error(`❌ Error inserting workout for ${record.date}:`, workoutError.message)
          errorCount++
          continue
        }

        console.log(`  ✓ Week ${weekNumber}, ${record.day_of_week}: ${workoutType}`)
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

    // Show strength session count
    const { data: strengthWorkouts } = await supabase
      .from('workouts')
      .select('workout_type, week_number')
      .eq('workout_type', 'strength')

    console.log(`\n💪 Main strength sessions: ${strengthWorkouts?.length || 0}`)
    console.log('   (Should be 24 total - 2 per week for 12 weeks)')

    console.log('\n✨ Database is ready! You can now start the app.\n')

  } catch (error: any) {
    console.error('\n💥 Fatal error:', error.message)
    console.error(error.stack)
    process.exit(1)
  }
}

// Run import
importCSV()
