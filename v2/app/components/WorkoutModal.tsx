'use client'

import { useState, useEffect } from 'react'
import { Workout, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion, getWorkoutExercises, logExercise, getLatestExerciseLog, deleteExerciseLog, WorkoutExercise, ExerciseLog } from '@/lib/supabase'
import InlineExerciseCard from '@/app/components/InlineExerciseCard'
import { X, Clock, MapPin, TrendingUp, Activity, Check, CheckCircle, Dumbbell, Play } from 'lucide-react'

interface WorkoutModalProps {
  workout: Workout | null
  isOpen: boolean
  onClose: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
}

export function WorkoutModal({ workout, isOpen, onClose, onCompletionChange }: WorkoutModalProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<Map<number, ExerciseLog>>(new Map())

  useEffect(() => {
    if (workout && isOpen) {
      loadWorkoutData()
    }
  }, [workout, isOpen])

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const loadWorkoutData = async () => {
    if (!workout) return

    // Load completion status
    try {
      const completion = await getWorkoutCompletion(workout.id)
      setIsCompleted(!!completion)
      setNotes(completion?.notes || '')
    } catch (error) {
      console.error('Error loading workout completion:', error)
    }

    // Load exercises for strength/micro workouts
    if (workout.workout_type === 'strength' || workout.workout_type === 'micro') {
      try {
        const workoutExercises = await getWorkoutExercises(workout.id)
        setExercises(workoutExercises)

        // Load existing logs for each exercise
        const logsMap = new Map<number, ExerciseLog>()
        for (const exercise of workoutExercises) {
          try {
            const latestLog = await getLatestExerciseLog(exercise.id)
            if (latestLog) {
              logsMap.set(exercise.id, latestLog)
            }
          } catch (error) {
            console.error(`Error loading log for exercise ${exercise.id}:`, error)
          }
        }
        setExerciseLogs(logsMap)
      } catch (error) {
        console.error('Error loading workout exercises:', error)
      }
    }
  }

  const handleCompletionToggle = async () => {
    if (!workout || isLoading) return

    setIsLoading(true)
    try {
      if (isCompleted) {
        await markWorkoutIncomplete(workout.id)
        setIsCompleted(false)
        onCompletionChange?.(workout.id, false)
      } else {
        await markWorkoutComplete(workout.id)
        setIsCompleted(true)
        onCompletionChange?.(workout.id, true)
      }
    } catch (error) {
      console.error('Error toggling workout completion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveLog = async (workoutExerciseId: number, sets: number, reps: number, weight: number) => {
    try {
      // Convert single reps number to array format for database storage
      const repsArray = repsToArray(reps, sets)
      const newLog = await logExercise(workoutExerciseId, sets, repsArray, weight)
      
      // Update the logs map with the new log
      setExerciseLogs(prev => {
        const newMap = new Map(prev)
        newMap.set(workoutExerciseId, newLog)
        return newMap
      })
    } catch (error) {
      console.error('Error saving exercise log:', error)
      throw error // Re-throw to let InlineExerciseCard handle the error
    }
  }

  const handleDeleteLog = async (workoutExerciseId: number) => {
    const existingLog = exerciseLogs.get(workoutExerciseId)
    if (!existingLog) return

    try {
      await deleteExerciseLog(existingLog.id)
      
      // Remove the log from the map
      setExerciseLogs(prev => {
        const newMap = new Map(prev)
        newMap.delete(workoutExerciseId)
        return newMap
      })
    } catch (error) {
      console.error('Error deleting exercise log:', error)
      throw error // Re-throw to let InlineExerciseCard handle the error
    }
  }

  // Helper functions for reps array conversion
  const repsToArray = (reps: number, sets: number) => new Array(sets).fill(reps);
  const arrayToReps = (repsArray: number[]) => repsArray[0] || 0;

  const getLogForExercise = (workoutExerciseId: number) => {
    const log = exerciseLogs.get(workoutExerciseId)
    if (!log) return null
    
    return {
      sets: log.sets_completed || 0,
      reps: Array.isArray(log.reps_completed) ? arrayToReps(log.reps_completed) : log.reps_completed || 0,
      weight: log.weight_used || 0
    }
  }

  const getWorkoutTypeIcon = (type: string) => {
    switch (type) {
      case 'run':
        return <Play className="w-6 h-6" />
      case 'strength':
        return <Dumbbell className="w-6 h-6" />
      case 'micro':
        return <Activity className="w-6 h-6" />
      case 'rest':
        return <Clock className="w-6 h-6" />
      default:
        return <Clock className="w-6 h-6" />
    }
  }

  const getWorkoutTypeColor = (type: string) => {
    switch (type) {
      case 'run':
        return 'bg-blue-100 text-blue-800'
      case 'strength':
        return 'bg-red-100 text-red-800'
      case 'micro':
        return 'bg-green-100 text-green-800'
      case 'rest':
        return 'bg-gray-100 text-gray-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (!isOpen || !workout) return null

  return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="relative bg-white rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getWorkoutTypeColor(workout.workout_type)}`}>
              {getWorkoutTypeIcon(workout.workout_type)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                {workout.title}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <span className="capitalize">{workout.workout_type}</span>
                {workout.phase && (
                  <>
                    <span>•</span>
                    <span>{workout.phase}</span>
                  </>
                )}
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Completion Button */}
        {workout.workout_type !== 'rest' && (
          <div className="p-4 sm:p-6 border-b border-gray-200">
            <div className="flex justify-center sm:justify-center">
              <button
                onClick={handleCompletionToggle}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                } ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isCompleted ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Completed
                  </>
                ) : (
                  <>
                    <Check className="w-5 h-5" />
                    Mark Complete
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* Workout Details */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {workout.duration_minutes && (
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{workout.duration_minutes}min</p>
                  <p className="text-xs text-gray-600">Duration</p>
                </div>
              </div>
            )}
            {workout.distance_miles && (
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{workout.distance_miles}mi</p>
                  <p className="text-xs text-gray-600">Distance</p>
                </div>
              </div>
            )}
            {workout.elevation_gain_feet && (
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{workout.elevation_gain_feet}ft</p>
                  <p className="text-xs text-gray-600">Elevation</p>
                </div>
              </div>
            )}
            {workout.intensity && (
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{workout.intensity}</p>
                  <p className="text-xs text-gray-600">Intensity</p>
                </div>
              </div>
            )}
          </div>

          {/* Description OR Exercise Logging - not both */}
          {(workout.workout_type === 'strength' || workout.workout_type === 'micro') ? (
            /* Show Exercise Logging for Strength/Micro Workouts */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Exercises</h3>
              <div className="space-y-3">
                {exercises.map(exercise => (
                  <InlineExerciseCard
                    key={exercise.id}
                    exercise={{
                      name: exercise.exercises?.name || 'Unknown Exercise',
                      planned_sets: exercise.sets || 0,
                      planned_reps: exercise.reps || 0,
                      planned_weight: exercise.weight || 0
                    }}
                    existingLog={getLogForExercise(exercise.id)}
                    onSave={(sets, reps, weight) => handleSaveLog(exercise.id, sets, reps, weight)}
                    onDelete={() => handleDeleteLog(exercise.id)}
                  />
                ))}
              </div>
            </div>
          ) : workout.description ? (
            /* Show Description for workouts without structured exercises */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Description</h3>
              <div className="text-gray-700 leading-relaxed">
                {workout.description.split(/[|]/).map((line, index) => {
                  const trimmedLine = line.trim();
                  if (!trimmedLine) return null;
                  return (
                    <p key={index} className="mb-1">
                      {trimmedLine}
                    </p>
                  );
                })}
              </div>
            </div>
          ) : null}

          {/* Notes */}
          <div className="space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-3">Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about your workout..."
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
