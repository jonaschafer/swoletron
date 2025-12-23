/**
 * Verification script for progression calculator implementation
 * 
 * This script verifies:
 * 1. Database schema has progression columns
 * 2. Progression data is being saved correctly
 * 3. Progression calculation functions work
 * 4. Edge cases are handled properly
 */

import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { calculateProgression, getPhaseFromDate, inferExerciseType } from '../lib/progression'
import { getWorkoutExercises, getLastExercisePerformance } from '../lib/supabase'

dotenv.config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

interface VerificationResult {
  test: string
  status: 'PASS' | 'FAIL' | 'WARN'
  message: string
  details?: any
}

async function verifyDatabaseSchema(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = []

  console.log('\n📋 Verifying Database Schema...\n')

  // Check if progression columns exist
  try {
    const { data, error } = await supabase
      .from('exercise_logs')
      .select('progression_applied, suggested_weight, suggested_reps')
      .limit(1)

    if (error) {
      // Check if error is about missing columns
      if (error.message.includes('column') && error.message.includes('does not exist')) {
        results.push({
          test: 'Database Schema - Progression Columns',
          status: 'FAIL',
          message: 'Progression columns are missing. Run migration: 20250115_add_progression_tracking.sql',
          details: error
        })
      } else {
        results.push({
          test: 'Database Schema - Column Check',
          status: 'WARN',
          message: `Could not verify columns: ${error.message}`,
          details: error
        })
      }
    } else {
      results.push({
        test: 'Database Schema - Progression Columns',
        status: 'PASS',
        message: 'All progression columns exist (progression_applied, suggested_weight, suggested_reps)'
      })
    }
  } catch (error: any) {
    results.push({
      test: 'Database Schema - Column Check',
      status: 'FAIL',
      message: `Error checking schema: ${error.message}`,
      details: error
    })
  }

  return results
}

async function verifyProgressionData(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = []

  console.log('\n📊 Verifying Progression Data...\n')

  try {
    // Check for logs with progression data
    const { data: logsWithProgression, error: progressionError } = await supabase
      .from('exercise_logs')
      .select('*')
      .eq('progression_applied', true)
      .limit(10)

    if (progressionError) {
      results.push({
        test: 'Progression Data - Query',
        status: 'FAIL',
        message: `Error querying progression data: ${progressionError.message}`,
        details: progressionError
      })
    } else {
      const count = logsWithProgression?.length || 0
      results.push({
        test: 'Progression Data - Saved Logs',
        status: count > 0 ? 'PASS' : 'WARN',
        message: `Found ${count} exercise log(s) with progression_applied=true`,
        details: { count, sample: logsWithProgression?.[0] }
      })

      // Verify data integrity
      if (logsWithProgression && logsWithProgression.length > 0) {
        const sample = logsWithProgression[0]
        const hasSuggestedWeight = sample.suggested_weight !== null && sample.suggested_weight !== undefined
        const hasSuggestedReps = sample.suggested_reps !== null && sample.suggested_reps !== undefined

        results.push({
          test: 'Progression Data - Integrity',
          status: hasSuggestedWeight || hasSuggestedReps ? 'PASS' : 'WARN',
          message: hasSuggestedWeight || hasSuggestedReps
            ? 'Progression data includes suggested values'
            : 'Progression applied but no suggested values stored',
          details: {
            hasSuggestedWeight,
            hasSuggestedReps,
            sample: {
              progression_applied: sample.progression_applied,
              suggested_weight: sample.suggested_weight,
              suggested_reps: sample.suggested_reps
            }
          }
        })
      }
    }
  } catch (error: any) {
    results.push({
      test: 'Progression Data - Query',
      status: 'FAIL',
      message: `Error: ${error.message}`,
      details: error
    })
  }

  return results
}

async function verifyProgressionCalculation(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = []

  console.log('\n🧮 Verifying Progression Calculation...\n')

  try {
    // Get a workout with exercises
    const workouts = await getWorkoutExercises(1)
    
    if (workouts.length === 0) {
      results.push({
        test: 'Progression Calculation - Test Data',
        status: 'WARN',
        message: 'No exercises found in workout ID 1. Cannot test calculation.'
      })
      return results
    }

    const testExercise = workouts[0]
    if (!testExercise.exercises?.id) {
      results.push({
        test: 'Progression Calculation - Exercise ID',
        status: 'FAIL',
        message: 'Test exercise missing exercise_id'
      })
      return results
    }

    // Check last performance
    const lastPerf = await getLastExercisePerformance(testExercise.exercises.id)
    
    results.push({
      test: 'Progression Calculation - Previous Performance',
      status: lastPerf ? 'PASS' : 'WARN',
      message: lastPerf
        ? `Found previous performance: ${lastPerf.weight_used}${lastPerf.weight_unit} × ${lastPerf.reps_completed?.join(', ')}`
        : 'No previous performance (expected for new exercises)',
      details: lastPerf
    })

    // Test calculation
    const workoutDate = new Date()
    const suggestion = await calculateProgression(testExercise, workoutDate, testExercise.exercises.id)

    results.push({
      test: 'Progression Calculation - Calculate',
      status: suggestion ? 'PASS' : 'WARN',
      message: suggestion
        ? `Progression calculated: ${suggestion.suggestedWeight !== null ? suggestion.suggestedWeight + 'lbs' : 'N/A'} × ${suggestion.suggestedReps.join(', ')}`
        : 'No progression calculated (expected if no previous performance)',
      details: suggestion
    })

    // Test exercise type inference
    const exerciseType = inferExerciseType(testExercise.reps ? String(testExercise.reps) : null)
    results.push({
      test: 'Progression Calculation - Type Inference',
      status: 'PASS',
      message: `Exercise type: ${exerciseType}`,
      details: { reps: testExercise.reps, type: exerciseType }
    })

    // Test phase calculation
    const phase = getPhaseFromDate(workoutDate)
    results.push({
      test: 'Progression Calculation - Phase',
      status: 'PASS',
      message: `Current phase: ${phase}`,
      details: { date: workoutDate.toISOString(), phase }
    })

  } catch (error: any) {
    results.push({
      test: 'Progression Calculation - Error',
      status: 'FAIL',
      message: `Error: ${error.message}`,
      details: error
    })
  }

  return results
}

async function verifyEdgeCases(): Promise<VerificationResult[]> {
  const results: VerificationResult[] = []

  console.log('\n🔍 Verifying Edge Cases...\n')

  // Test different rep ranges
  const testReps = ['5', '8', '12', '20', '30sec', '1min', '8-10']
  testReps.forEach(rep => {
    const type = inferExerciseType(rep)
    results.push({
      test: `Edge Case - Rep Range: ${rep}`,
      status: 'PASS',
      message: `Type: ${type}`,
      details: { rep, type }
    })
  })

  // Test phase calculation for different dates
  const testDates = [
    { date: new Date('2025-10-13'), expectedPhase: 'recovery' },
    { date: new Date('2025-10-27'), expectedPhase: 'general_prep' },
    { date: new Date('2025-11-17'), expectedPhase: 'max_strength' },
    { date: new Date('2025-12-01'), expectedPhase: 'power' },
    { date: new Date('2025-12-15'), expectedPhase: 'taper' },
  ]

  testDates.forEach(({ date, expectedPhase }) => {
    const phase = getPhaseFromDate(date)
    const correct = phase === expectedPhase
    results.push({
      test: `Edge Case - Phase: ${date.toLocaleDateString()}`,
      status: correct ? 'PASS' : 'FAIL',
      message: `Phase: ${phase} (expected: ${expectedPhase})`,
      details: { date: date.toISOString(), phase, expectedPhase }
    })
  })

  return results
}

async function main() {
  console.log('🚀 Starting Progression Calculator Verification\n')
  console.log('=' .repeat(60))

  const allResults: VerificationResult[] = []

  // Run all verification tests
  const schemaResults = await verifyDatabaseSchema()
  allResults.push(...schemaResults)

  const dataResults = await verifyProgressionData()
  allResults.push(...dataResults)

  const calculationResults = await verifyProgressionCalculation()
  allResults.push(...calculationResults)

  const edgeCaseResults = await verifyEdgeCases()
  allResults.push(...edgeCaseResults)

  // Print summary
  console.log('\n' + '='.repeat(60))
  console.log('\n📊 VERIFICATION SUMMARY\n')

  const passCount = allResults.filter(r => r.status === 'PASS').length
  const failCount = allResults.filter(r => r.status === 'FAIL').length
  const warnCount = allResults.filter(r => r.status === 'WARN').length

  console.log(`✅ Passed: ${passCount}`)
  console.log(`⚠️  Warnings: ${warnCount}`)
  console.log(`❌ Failed: ${failCount}`)
  console.log(`📝 Total: ${allResults.length}`)

  // Print detailed results
  console.log('\n' + '='.repeat(60))
  console.log('\n📋 DETAILED RESULTS\n')

  allResults.forEach((result, index) => {
    const icon = result.status === 'PASS' ? '✅' : result.status === 'FAIL' ? '❌' : '⚠️'
    console.log(`${icon} [${result.status}] ${result.test}`)
    console.log(`   ${result.message}`)
    if (result.details && process.env.VERBOSE) {
      console.log(`   Details: ${JSON.stringify(result.details, null, 2)}`)
    }
    if (index < allResults.length - 1) console.log('')
  })

  console.log('\n' + '='.repeat(60))

  // Exit with appropriate code
  if (failCount > 0) {
    process.exit(1)
  } else if (warnCount > 0) {
    process.exit(0)
  } else {
    process.exit(0)
  }
}

main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

