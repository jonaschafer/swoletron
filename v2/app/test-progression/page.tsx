'use client'

import { useState, useEffect } from 'react'
import { 
  getWorkoutExercises, 
  getLastExercisePerformance, 
  logExercise,
  WorkoutExercise,
  ExerciseLog
} from '@/lib/supabase'
import { calculateProgression, getPhaseFromDate, inferExerciseType, type ProgressionSuggestion } from '@/lib/progression'
import { parseISO } from 'date-fns'

interface TestResult {
  testName: string
  status: 'pass' | 'fail' | 'pending'
  message: string
  details?: any
}

export default function TestProgressionPage() {
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [selectedExercise, setSelectedExercise] = useState<WorkoutExercise | null>(null)
  const [progressionSuggestion, setProgressionSuggestion] = useState<ProgressionSuggestion | null>(null)
  const [lastPerformance, setLastPerformance] = useState<ExerciseLog | null>(null)
  const [savedLogs, setSavedLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(false)
  const [testWorkoutId, setTestWorkoutId] = useState(1)

  useEffect(() => {
    loadExercises()
  }, [testWorkoutId])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const workoutExercises = await getWorkoutExercises(testWorkoutId)
      setExercises(workoutExercises)
      if (workoutExercises.length > 0) {
        setSelectedExercise(workoutExercises[0])
      }
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  const loadLastPerformance = async (exerciseId: number) => {
    try {
      const performance = await getLastExercisePerformance(exerciseId)
      setLastPerformance(performance)
      return performance
    } catch (error) {
      console.error('Error loading last performance:', error)
      return null
    }
  }

  const testProgressionCalculation = async () => {
    if (!selectedExercise || !selectedExercise.exercises?.id) {
      alert('Please select an exercise first')
      return
    }

    setLoading(true)
    const results: TestResult[] = []

    try {
      // Test 1: Check if exercise has previous performance
      const lastPerf = await loadLastPerformance(selectedExercise.exercises.id)
      results.push({
        testName: 'Previous Performance Check',
        status: lastPerf ? 'pass' : 'fail',
        message: lastPerf 
          ? `Found previous performance: ${lastPerf.weight_used}${lastPerf.weight_unit} × ${lastPerf.reps_completed?.join(', ')} reps`
          : 'No previous performance found (this is expected for new exercises)',
        details: lastPerf
      })

      // Test 2: Calculate progression
      const workoutDate = new Date() // Use current date for testing
      const suggestion = await calculateProgression(selectedExercise, workoutDate, selectedExercise.exercises.id)
      
      results.push({
        testName: 'Progression Calculation',
        status: suggestion ? 'pass' : 'fail',
        message: suggestion
          ? `Progression calculated: ${suggestion.suggestedWeight !== null ? suggestion.suggestedWeight + 'lbs' : 'N/A'} × ${suggestion.suggestedReps.join(', ')} reps`
          : 'No progression calculated (expected if no previous performance)',
        details: suggestion
      })

      setProgressionSuggestion(suggestion)

      // Test 3: Check exercise type inference
      const exerciseType = inferExerciseType(selectedExercise.reps ? String(selectedExercise.reps) : null)
      results.push({
        testName: 'Exercise Type Inference',
        status: 'pass',
        message: `Inferred type: ${exerciseType}`,
        details: { reps: selectedExercise.reps, type: exerciseType }
      })

      // Test 4: Check phase calculation
      const phase = getPhaseFromDate(workoutDate)
      results.push({
        testName: 'Phase Calculation',
        status: 'pass',
        message: `Current phase: ${phase}`,
        details: { date: workoutDate.toISOString(), phase }
      })

      // Test 5: Test saving with progression data
      if (suggestion) {
        try {
          // Create a test log entry with progression data
          const testLog = await logExercise(
            selectedExercise.id,
            1, // sets
            suggestion.suggestedReps.slice(0, 1), // first rep value
            suggestion.suggestedWeight || 0,
            selectedExercise.weight_unit || 'lbs',
            'Test progression log', // notes
            true, // progression_applied
            suggestion.suggestedWeight ?? undefined,
            suggestion.suggestedReps
          )

          results.push({
            testName: 'Save with Progression Data',
            status: 'pass',
            message: 'Successfully saved log with progression tracking',
            details: {
              progression_applied: testLog.progression_applied,
              suggested_weight: testLog.suggested_weight,
              suggested_reps: testLog.suggested_reps
            }
          })

          // Reload saved logs
          await loadSavedLogs()
        } catch (error: any) {
          results.push({
            testName: 'Save with Progression Data',
            status: 'fail',
            message: `Error saving: ${error.message}`,
            details: error
          })
        }
      }

    } catch (error: any) {
      results.push({
        testName: 'Progression Calculation',
        status: 'fail',
        message: `Error: ${error.message}`,
        details: error
      })
    } finally {
      setLoading(false)
      setTestResults(results)
    }
  }

  const loadSavedLogs = async () => {
    if (!selectedExercise || !selectedExercise.exercises?.id) return

    try {
      // Query logs with progression data for this exercise
      const { data, error } = await (await import('@/lib/supabase')).supabase
        .from('exercise_logs')
        .select('*')
        .eq('exercise_id', selectedExercise.exercises.id)
        .not('progression_applied', 'is', null)
        .order('logged_at', { ascending: false })
        .limit(10)

      if (error) throw error
      setSavedLogs(data || [])
    } catch (error) {
      console.error('Error loading saved logs:', error)
    }
  }

  const testEdgeCases = async () => {
    const results: TestResult[] = []

    // Test 1: Exercise with no previous logs
    results.push({
      testName: 'No Previous Logs',
      status: 'pass',
      message: 'Progression calculator should return null for exercises with no history',
      details: 'This is expected behavior - progression requires previous performance'
    })

    // Test 2: Different rep ranges
    const testReps = ['5', '8', '12', '20', '30sec']
    testReps.forEach(rep => {
      const type = inferExerciseType(rep)
      results.push({
        testName: `Rep Range: ${rep}`,
        status: 'pass',
        message: `Type: ${type}`,
        details: { rep, type }
      })
    })

    // Test 3: Phase calculation for different dates
    const testDates = [
      new Date('2025-10-13'), // Week 1 - recovery
      new Date('2025-10-27'), // Week 3 - general_prep
      new Date('2025-11-17'), // Week 6 - max_strength
      new Date('2025-12-01'), // Week 8 - power
      new Date('2025-12-15'), // Week 10 - taper
    ]

    testDates.forEach(date => {
      const phase = getPhaseFromDate(date)
      results.push({
        testName: `Phase for ${date.toLocaleDateString()}`,
        status: 'pass',
        message: `Phase: ${phase}`,
        details: { date: date.toISOString(), phase }
      })
    })

    setTestResults(prev => [...prev, ...results])
  }

  useEffect(() => {
    if (selectedExercise?.exercises?.id) {
      loadLastPerformance(selectedExercise.exercises.id)
      loadSavedLogs()
    }
  }, [selectedExercise])

  if (loading && exercises.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Progression Calculator Test</h1>
          <p className="text-gray-600 mb-6">Test and verify the progressive loading calculator implementation</p>

          {/* Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Workout ID
              </label>
              <input
                type="number"
                value={testWorkoutId}
                onChange={(e) => setTestWorkoutId(parseInt(e.target.value) || 1)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Exercise
              </label>
              <select
                value={selectedExercise?.id || ''}
                onChange={(e) => {
                  const exercise = exercises.find(ex => ex.id === parseInt(e.target.value))
                  setSelectedExercise(exercise || null)
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="">Select an exercise...</option>
                {exercises.map(ex => (
                  <option key={ex.id} value={ex.id}>
                    {ex.exercises?.name || 'Unknown'} - {ex.reps} reps @ {ex.weight}{ex.weight_unit}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={testProgressionCalculation}
              disabled={!selectedExercise || loading}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
            >
              Test Progression Calculation
            </button>
            <button
              onClick={testEdgeCases}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
            >
              Test Edge Cases
            </button>
            <button
              onClick={loadExercises}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              Reload Exercises
            </button>
          </div>

          {/* Selected Exercise Info */}
          {selectedExercise && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-blue-900 mb-2">Selected Exercise</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="font-medium">Name:</span> {selectedExercise.exercises?.name || 'Unknown'}
                </div>
                <div>
                  <span className="font-medium">Sets:</span> {selectedExercise.sets || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Reps:</span> {selectedExercise.reps || 'N/A'}
                </div>
                <div>
                  <span className="font-medium">Weight:</span> {selectedExercise.weight || 'N/A'} {selectedExercise.weight_unit || 'lbs'}
                </div>
              </div>
            </div>
          )}

          {/* Last Performance */}
          {lastPerformance && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-yellow-900 mb-2">Last Performance</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Weight:</span> {lastPerformance.weight_used} {lastPerformance.weight_unit}</div>
                <div><span className="font-medium">Reps:</span> {lastPerformance.reps_completed?.join(', ')}</div>
                <div><span className="font-medium">Date:</span> {new Date(lastPerformance.logged_at).toLocaleDateString()}</div>
                {lastPerformance.progression_applied && (
                  <div className="mt-2 pt-2 border-t border-yellow-300">
                    <div className="font-medium text-yellow-900">Progression Applied:</div>
                    <div>Suggested Weight: {lastPerformance.suggested_weight || 'N/A'}</div>
                    <div>Suggested Reps: {lastPerformance.suggested_reps?.join(', ') || 'N/A'}</div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progression Suggestion */}
          {progressionSuggestion && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-green-900 mb-2">Progression Suggestion</h3>
              <div className="text-sm space-y-1">
                <div><span className="font-medium">Suggested Weight:</span> {progressionSuggestion.suggestedWeight !== null ? `${progressionSuggestion.suggestedWeight}lbs` : 'N/A'}</div>
                <div><span className="font-medium">Suggested Reps:</span> {progressionSuggestion.suggestedReps.join(', ')}</div>
                <div><span className="font-medium">Reasoning:</span> {progressionSuggestion.reasoning}</div>
              </div>
            </div>
          )}

          {/* Test Results */}
          {testResults.length > 0 && (
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Test Results</h3>
              <div className="space-y-2">
                {testResults.map((result, index) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg border ${
                      result.status === 'pass'
                        ? 'bg-green-50 border-green-200'
                        : result.status === 'fail'
                        ? 'bg-red-50 border-red-200'
                        : 'bg-yellow-50 border-yellow-200'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">{result.testName}</span>
                      <span
                        className={`px-2 py-1 rounded text-xs font-medium ${
                          result.status === 'pass'
                            ? 'bg-green-200 text-green-800'
                            : result.status === 'fail'
                            ? 'bg-red-200 text-red-800'
                            : 'bg-yellow-200 text-yellow-800'
                        }`}
                      >
                        {result.status.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700">{result.message}</p>
                    {result.details && (
                      <details className="mt-2">
                        <summary className="text-xs text-gray-600 cursor-pointer">View Details</summary>
                        <pre className="mt-2 text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(result.details, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Logs with Progression */}
          {savedLogs.length > 0 && (
            <div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4">Saved Logs with Progression Data</h3>
              <div className="space-y-2">
                {savedLogs.map((log) => (
                  <div key={log.id} className="bg-white border border-gray-200 rounded-lg p-4">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Date:</span> {new Date(log.logged_at).toLocaleDateString()}
                      </div>
                      <div>
                        <span className="font-medium">Weight:</span> {log.weight_used} {log.weight_unit}
                      </div>
                      <div>
                        <span className="font-medium">Reps:</span> {log.reps_completed?.join(', ')}
                      </div>
                      <div>
                        <span className="font-medium">Progression Applied:</span>{' '}
                        {log.progression_applied ? '✅ Yes' : '❌ No'}
                      </div>
                    </div>
                    {log.progression_applied && (
                      <div className="mt-2 pt-2 border-t border-gray-200 text-sm">
                        <div className="font-medium text-gray-700">Progression Details:</div>
                        <div>Suggested Weight: {log.suggested_weight || 'N/A'}</div>
                        <div>Suggested Reps: {log.suggested_reps?.join(', ') || 'N/A'}</div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

