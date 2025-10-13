'use client'

import { useState, useEffect } from 'react'
import { Workout, ExerciseLog } from '@/lib/supabase'
import { 
  getWorkoutExercises, 
  parseExercisesFromWorkout,
  getExerciseLogsForWorkout,
  logExercise,
  updateExerciseLog,
  deleteExerciseLog,
  getLatestExerciseLog
} from '@/lib/supabase'
import { CheckCircle, Edit3, Trash2, Plus, X } from 'lucide-react'

interface ExerciseLogFormProps {
  workout: Workout
}

interface ParsedExercise {
  name: string
  sets: number
  reps: string
  weight: number
  unit: string
}

interface LogFormData {
  sets: number
  reps: number[]
  weight: number
  unit: string
  notes: string
}

export function ExerciseLogForm({ workout }: ExerciseLogFormProps) {
  const [exercises, setExercises] = useState<ParsedExercise[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<ExerciseLog[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedExercise, setExpandedExercise] = useState<string | null>(null)
  const [formData, setFormData] = useState<LogFormData>({
    sets: 0,
    reps: [],
    weight: 0,
    unit: 'lb',
    notes: ''
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadExerciseData()
  }, [workout.id])

  const loadExerciseData = async () => {
    try {
      setLoading(true)
      
      // Try to get exercises from workout_exercises table first
      const workoutExercises = await getWorkoutExercises(workout.id)
      
      if (workoutExercises.length > 0) {
        // Convert WorkoutExercise to ParsedExercise format
        const parsedExercises: ParsedExercise[] = workoutExercises.map(we => ({
          name: we.exercises?.name || 'Unknown Exercise',
          sets: we.sets || 0,
          reps: String(we.reps || 0),
          weight: we.weight || 0,
          unit: we.weight_unit || 'BW'
        }))
        setExercises(parsedExercises)
      } else {
        // Fallback: parse from workout notes
        const parsedExercises = parseExercisesFromWorkout(workout)
        setExercises(parsedExercises)
      }

      // Load existing logs
      const logs = await getExerciseLogsForWorkout(workout.id)
      setExerciseLogs(logs)
    } catch (error) {
      console.error('Error loading exercise data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getExerciseLog = (exerciseName: string) => {
    return exerciseLogs.find(log => log.exercise_name === exerciseName)
  }

  const handleStartLogging = (exercise: ParsedExercise) => {
    const existingLog = getExerciseLog(exercise.name)
    
    if (existingLog) {
      // Pre-fill form with existing log data
      setFormData({
        sets: existingLog.sets_completed,
        reps: existingLog.reps_completed || [],
        weight: existingLog.weight_used || 0,
        unit: existingLog.weight_unit || 'lb',
        notes: existingLog.notes || ''
      })
    } else {
      // Pre-fill form with planned workout data
      setFormData({
        sets: exercise.sets,
        reps: new Array(exercise.sets).fill(parseInt(exercise.reps) || 0),
        weight: exercise.weight,
        unit: exercise.unit,
        notes: ''
      })
    }
    
    setExpandedExercise(exercise.name)
  }

  const handleCancelLogging = () => {
    setExpandedExercise(null)
    setFormData({
      sets: 0,
      reps: [],
      weight: 0,
      unit: 'lb',
      notes: ''
    })
  }

  const handleSaveLog = async (exerciseName: string) => {
    try {
      setSaving(true)
      
      const existingLog = getExerciseLog(exerciseName)
      
      if (existingLog) {
        // Update existing log
        await updateExerciseLog(existingLog.id, {
          sets_completed: formData.sets,
          reps_completed: formData.reps,
          weight_used: formData.weight,
          weight_unit: formData.unit,
          notes: formData.notes
        })
      } else {
        // Create new log
        await logExercise({
          workout_id: workout.id,
          exercise_name: exerciseName,
          sets_completed: formData.sets,
          reps_completed: formData.reps,
          weight_used: formData.weight,
          weight_unit: formData.unit,
          notes: formData.notes
        })
      }
      
      // Refresh logs
      await loadExerciseData()
      handleCancelLogging()
    } catch (error) {
      console.error('Error saving exercise log:', error)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async (exerciseName: string) => {
    try {
      const existingLog = getExerciseLog(exerciseName)
      if (existingLog) {
        await deleteExerciseLog(existingLog.id)
        await loadExerciseData()
      }
    } catch (error) {
      console.error('Error deleting exercise log:', error)
    }
  }

  const updateReps = (index: number, value: number) => {
    const newReps = [...formData.reps]
    newReps[index] = value
    setFormData({ ...formData, reps: newReps })
  }

  const addRep = () => {
    setFormData({
      ...formData,
      reps: [...formData.reps, 0]
    })
  }

  const removeRep = (index: number) => {
    const newReps = formData.reps.filter((_, i) => i !== index)
    setFormData({ ...formData, reps: newReps })
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
        const existingLog = getExerciseLog(exercise.name)
        const isExpanded = expandedExercise === exercise.name
        
        return (
          <div key={exercise.name} className="border border-gray-200 rounded-lg p-4">
            {/* Exercise Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex-1">
                <h5 className="font-semibold text-gray-900">{exercise.name}</h5>
                <p className="text-sm text-gray-600">
                  Planned: {exercise.sets}×{exercise.reps} {exercise.weight > 0 ? `@ ${exercise.weight}${exercise.unit}` : exercise.unit}
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
                      onClick={() => handleDeleteLog(exercise.name)}
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
                  Reps: {existingLog.reps_completed?.join(', ')}
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
            {isExpanded && (
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
                      value={formData.sets}
                      onChange={(e) => setFormData({ ...formData, sets: parseInt(e.target.value) || 0 })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

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
                        value={formData.weight}
                        onChange={(e) => setFormData({ ...formData, weight: parseFloat(e.target.value) || 0 })}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <select
                        value={formData.unit}
                        onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
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

                {/* Reps */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700">
                      Reps per Set
                    </label>
                    <button
                      onClick={addRep}
                      className="text-blue-600 hover:text-blue-700 text-sm flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" />
                      Add Set
                    </button>
                  </div>
                  <div className="grid grid-cols-4 gap-2">
                    {formData.reps.map((rep, index) => (
                      <div key={index} className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          value={rep}
                          onChange={(e) => updateReps(index, parseInt(e.target.value) || 0)}
                          className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder={`Set ${index + 1}`}
                        />
                        {formData.reps.length > 1 && (
                          <button
                            onClick={() => removeRep(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="How did it feel? Any modifications?"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={2}
                  />
                </div>

                {/* Form Actions */}
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleSaveLog(exercise.name)}
                    disabled={saving || formData.sets === 0}
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
