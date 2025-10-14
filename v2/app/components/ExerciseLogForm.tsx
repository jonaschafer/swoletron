'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutExercise, ExerciseLog } from '@/lib/supabase'
import { 
  getWorkoutExercises, 
  logExercise,
  updateExerciseLog,
  deleteExerciseLog,
  getLatestExerciseLog
} from '@/lib/supabase'
import { CheckCircle, Edit3, Trash2, Plus, X } from 'lucide-react'

interface ExerciseLogFormProps {
  workout: Workout
}

export function ExerciseLogForm({ workout }: ExerciseLogFormProps) {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<Record<number, ExerciseLog>>({})
  const [loading, setLoading] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<number | null>(null)
  const [saving, setSaving] = useState(false)

  // Form data for each exercise
  const [formData, setFormData] = useState<Record<number, {
    sets: number
    reps: number
    weight: number
    unit: string
    notes: string
  }>>({})

  useEffect(() => {
    loadExerciseData()
  }, [workout.id])

  const loadExerciseData = async () => {
    try {
      setLoading(true)
      
      // Get exercises from workout_exercises table
      const workoutExercises = await getWorkoutExercises(workout.id)
      setExercises(workoutExercises)

      // Load existing logs for each exercise
      const logs: Record<number, ExerciseLog> = {}
      for (const exercise of workoutExercises) {
        try {
          const log = await getLatestExerciseLog(exercise.id)
          if (log) {
            logs[exercise.id] = log
          }
        } catch (error) {
          console.error(`Error loading log for exercise ${exercise.id}:`, error)
        }
      }
      setExerciseLogs(logs)
    } catch (error) {
      console.error('Error loading exercise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExerciseLog = (exerciseId: number) => {
    return exerciseLogs[exerciseId]
  }

  const handleStartLogging = (exercise: WorkoutExercise) => {
    const existingLog = getExerciseLog(exercise.id)
    
    if (existingLog) {
      // Pre-fill form with existing log data
      setFormData(prev => ({
        ...prev,
        [exercise.id]: {
          sets: existingLog.sets_completed,
          reps: existingLog.reps_completed || 0,
          weight: existingLog.weight_used || 0,
          unit: existingLog.weight_unit || 'lb',
          notes: existingLog.notes || ''
        }
      }))
    } else {
      // Pre-fill form with planned workout data
      setFormData(prev => ({
        ...prev,
        [exercise.id]: {
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          weight: exercise.weight || 0,
          unit: exercise.weight_unit || 'lb',
          notes: ''
        }
      }))
    }
    
    setExpandedExercise(exercise.id)
  }

  const handleCancelLogging = () => {
    setExpandedExercise(null)
  }

  const handleSaveLog = async (exercise: WorkoutExercise) => {
    try {
      setSaving(true)
      
      const data = formData[exercise.id]
      if (!data) return

      const existingLog = getExerciseLog(exercise.id)
      
      if (existingLog) {
        // Update existing log
        await updateExerciseLog(
          existingLog.id,
          data.sets,
          data.reps,
          data.weight,
          data.unit,
          data.notes
        )
      } else {
        // Create new log
        await logExercise(
          exercise.id,
          data.sets,
          data.reps,
          data.weight,
          data.unit,
          data.notes
        )
      }
      
      // Refresh logs
      await loadExerciseData()
      handleCancelLogging()
    } catch (error) {
      console.error('Error saving exercise log:', error)
      alert('Failed to save exercise log')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async (exerciseId: number) => {
    try {
      const existingLog = getExerciseLog(exerciseId)
      if (existingLog) {
        await deleteExerciseLog(existingLog.id)
        await loadExerciseData()
      }
    } catch (error) {
      console.error('Error deleting exercise log:', error)
    }
  }

  const updateFormData = (exerciseId: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value
      }
    }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (exercises.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No exercises found for this workout.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h4 className="text-lg font-semibold text-gray-900 mb-4">Exercise Logging</h4>
      
      {exercises.map((exercise) => {
        const existingLog = getExerciseLog(exercise.id)
        const isExpanded = expandedExercise === exercise.id
        const data = formData[exercise.id]
        
        return (
          <div key={exercise.id} className="border border-gray-200 rounded-lg p-4">
            {/* Exercise Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">
                  {exercise.exercises?.name || 'Unknown Exercise'}
                </h5>
                <p className="text-sm text-gray-600">
                  Planned: {exercise.sets}×{exercise.reps} {exercise.weight && exercise.weight > 0 ? `@ ${exercise.weight}${exercise.weight_unit}` : exercise.weight_unit}
                </p>
              </div>
              
              <div className="flex items-center gap-2">
                {existingLog && (
                  <div className="flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">Logged</span>
                  </div>
                )}
                
                <div className="flex gap-1">
                  {existingLog && (
                    <button
                      onClick={() => handleDeleteLog(exercise.id)}
                      className="p-1 text-red-500 hover:text-red-700 transition-colors"
                      title="Delete log"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  
                  <button
                    onClick={() => handleStartLogging(exercise)}
                    disabled={isExpanded}
                    className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
                      existingLog
                        ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    } ${isExpanded ? 'opacity-50 cursor-not-allowed' : ''}`}
                  >
                    {existingLog ? (
                      <div className="flex items-center gap-1">
                        <Edit3 className="w-3 h-3" />
                        Edit Log
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <Plus className="w-3 h-3" />
                        Log Exercise
                      </div>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Existing Log Display */}
            {existingLog && !isExpanded && (
              <div className="bg-green-50 border border-green-200 rounded p-3">
                <p className="text-sm font-medium text-green-800">
                  Completed: {existingLog.sets_completed} sets
                </p>
                <p className="text-sm text-green-700">
                  Reps: {existingLog.reps_completed}
                  {existingLog.weight_used && existingLog.weight_used > 0 && 
                    ` @ ${existingLog.weight_used}${existingLog.weight_unit}`
                  }
                </p>
                {existingLog.notes && (
                  <p className="text-sm text-green-700 mt-1">Notes: {existingLog.notes}</p>
                )}
              </div>
            )}

            {/* Logging Form */}
            {isExpanded && data && (
              <div className="bg-gray-50 border border-gray-200 rounded p-4 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* Sets */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sets Completed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={data.sets}
                      onChange={(e) => updateFormData(exercise.id, 'sets', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Reps */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reps Completed
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={data.reps}
                      onChange={(e) => updateFormData(exercise.id, 'reps', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Weight */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Weight
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={data.weight}
                        onChange={(e) => updateFormData(exercise.id, 'weight', parseFloat(e.target.value) || 0)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={data.unit}
                        onChange={(e) => updateFormData(exercise.id, 'unit', e.target.value)}
                        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="lb">lb</option>
                        <option value="kg">kg</option>
                        <option value="BW">BW</option>
                        <option value="band">band</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={data.notes}
                    onChange={(e) => updateFormData(exercise.id, 'notes', e.target.value)}
                    placeholder="How did it feel? Any modifications?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveLog(exercise)}
                    disabled={saving || data.sets === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Saving...
                      </>
                    ) : (
                      'Save Log'
                    )}
                  </button>
                  <button
                    onClick={handleCancelLogging}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
