'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Workout, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion, getWorkoutExercises, logExercise, getLatestExerciseLog, deleteExerciseLog, WorkoutExercise, ExerciseLog, updateWorkoutCompletionNotes, createWorkoutCompletionWithNotes } from '@/lib/supabase'
import InlineExerciseCard from '@/app/components/InlineExerciseCard'
import { ExerciseHistoryModal } from '@/app/components/ExerciseHistoryModal'
import { ExerciseLibraryModal } from '@/app/components/ExerciseLibraryModal'
import { X, Clock, MapPin, TrendingUp, Activity, Check, CheckCircle, Dumbbell, Play, Calendar } from 'lucide-react'
import { format } from 'date-fns'

interface WorkoutModalProps {
  workout: Workout | null
  isOpen: boolean
  onClose: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
}

function formatWorkoutTitle(workout: Workout): string {
  // Prefer description as title if it exists and is meaningful
  if (workout.description && workout.description.trim()) {
    let desc = workout.description.trim()
    
    // Take first part if pipe-separated
    desc = desc.split('|')[0].trim()
    
    // Smart parsing: Extract meaningful title from generic descriptions
    // Handle patterns like "Group Run (6-8mi, 1500-2000ft)" -> "Group Run"
    const parentheticalMatch = desc.match(/^(.+?)\s*\([^)]*\)\s*$/)
    if (parentheticalMatch) {
      const beforeParens = parentheticalMatch[1].trim()
      const inParens = desc.match(/\(([^)]+)\)/)?.[1] || ''
      
      // Check if parentheses contain only metrics (numbers with units like mi, ft, min, etc.)
      const isOnlyMetrics = /^[\d\s\-,]+(mi|mile|ft|feet|min|minutes?|sec|seconds?|lb|lbs?|kg|%|\/)/i.test(inParens)
      
      if (isOnlyMetrics && beforeParens.length > 0) {
        desc = beforeParens
      }
    }
    
    // Remove common generic prefixes/suffixes that are redundant with workout type
    desc = desc.replace(/^(Run|Group Run|Easy Run|Long Run|Tempo Run|Interval Run)\s+/i, '')
    
    // Remove time/duration patterns that are redundant (since we removed duration display)
    desc = desc.replace(/\d+\s*-\s*\d+\s*(min|minutes?|hour|hours?)/gi, '')
    desc = desc.replace(/(?<!×\s*)\b\d+\s*(min|minutes?|hour|hours?)\b/gi, '')
    
    // Clean up extra whitespace
    desc = desc.replace(/\s+/g, ' ').trim()
    
    // If we still have meaningful content after cleaning, use it
    if (desc.length > 0 && desc.length < 60) { // Reasonable length check
      // Capitalize first letter
      desc = desc.charAt(0).toUpperCase() + desc.slice(1)
      return desc
    }
  }
  
  // Fallback to formatted title if description doesn't exist or isn't useful
  let title = workout.title
  
  // Remove " - Week X" pattern
  title = title.replace(/\s*-\s*Week\s+\d+/i, '')
  
  // Remove "Strength" from the beginning if it's a strength workout
  if (workout.workout_type === 'strength') {
    title = title.replace(/^Strength\s*-?\s*/i, '')
    title = title.replace(/^Lower Body Strength\s*-?\s*/i, 'Lower Body')
    title = title.replace(/^Core Strength\s*-?\s*/i, 'Core')
    title = title.replace(/^Upper Body Strength\s*-?\s*/i, 'Upper Body')
  }
  
  // Remove distance from title (it's shown in the badge)
  if (workout.workout_type === 'run') {
    title = title.replace(/\s*-\s*\d+mi/i, '')
    title = title.replace(/\s*\d+mi\s*/i, '')
  }
  
  return title.trim()
}

export function WorkoutModal({ workout, isOpen, onClose, onCompletionChange }: WorkoutModalProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle')
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [exerciseLogs, setExerciseLogs] = useState<Map<number, ExerciseLog>>(new Map())
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean
    exerciseId: number
    exerciseName: string
  }>({ isOpen: false, exerciseId: 0, exerciseName: '' })
  const [libraryModal, setLibraryModal] = useState<{
    isOpen: boolean
    libraryExerciseId: string | null
  }>({ isOpen: false, libraryExerciseId: null })

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

  const debouncedSaveNotes = useDebouncedCallback(
    async (newNotes: string) => {
      if (!workout) return
      
      setSaveStatus('saving')
      
      try {
        // Check if workout has a completion record
        const completion = await getWorkoutCompletion(workout.id)
        
        if (completion) {
          // Update existing completion with new notes
          await updateWorkoutCompletionNotes(workout.id, newNotes)
        } else {
          // Create new completion record with just notes
          await createWorkoutCompletionWithNotes(workout.id, newNotes)
        }
        
        setSaveStatus('saved')
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000)
      } catch (error) {
        console.error('Error saving notes:', error)
        setSaveStatus('idle')
      }
    },
    1000 // Wait 1 second after user stops typing
  )

  const handleSaveLog = async (workoutExerciseId: number, setsData: Array<{ reps: string; weight: number; completed: boolean }>, weightUnit: string) => {
    try {
      // Filter only completed sets and extract their reps
      const completedSets = setsData.filter(set => set.completed)
      const setsCompleted = completedSets.length
      const repsArray = completedSets.map(set => set.reps)
      
      // Use weight from first completed set (or average if needed, but first is simpler)
      const weightUsed = completedSets.length > 0 ? completedSets[0].weight : 0
      
      const newLog = await logExercise(workoutExerciseId, setsCompleted, repsArray, weightUsed, weightUnit)
      
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

  const getLogForExercise = (workoutExerciseId: number) => {
    const log = exerciseLogs.get(workoutExerciseId)
    if (!log) return null
    
    return {
      sets: log.sets_completed || 0,
      reps: Array.isArray(log.reps_completed) ? log.reps_completed : (log.reps_completed ? [String(log.reps_completed)] : []),
      weight: log.weight_used || 0,
      weight_unit: log.weight_unit || 'lb'
    }
  }

  const handleExerciseClick = (exerciseId: number, exerciseName: string) => {
    setHistoryModal({
      isOpen: true,
      exerciseId,
      exerciseName
    })
  }

  const handleLibraryClick = (libraryExerciseId: string) => {
    setLibraryModal({
      isOpen: true,
      libraryExerciseId
    })
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
        return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-100'
      case 'strength':
        return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100'
      case 'micro':
        return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100'
      case 'rest':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
    }
  }

  if (!isOpen || !workout) return null

  return (
      <div 
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-3xl h-full max-h-[90vh] flex flex-col transition-colors duration-200"
          onClick={(e) => e.stopPropagation()}
        >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getWorkoutTypeColor(workout.workout_type)}`}>
              {getWorkoutTypeIcon(workout.workout_type)}
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {formatWorkoutTitle(workout)}
              </h2>
              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
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
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Completion Button */}
        {workout.workout_type !== 'rest' && (
          <div className="p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex justify-center sm:justify-center">
              <button
                onClick={handleCompletionToggle}
                disabled={isLoading}
                className={`flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-lg font-medium transition-colors ${
                  isCompleted
                    ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-100 hover:bg-green-200 dark:hover:bg-green-800'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
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
          <div className="flex justify-between md:justify-start md:gap-4 mb-6 flex-wrap">
            {workout.distance_miles && (
              <div className="flex items-center gap-2 md:w-[168px] shrink-0 h-[30px]">
                <div className="bg-[#e1ebff] rounded-[4.8px] md:rounded-[6px] size-[24px] md:size-[30px] flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-gray-800" />
                </div>
                <div className="flex flex-col gap-[1px]">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white leading-5">{workout.distance_miles}mi</p>
                  <p className="text-[10px] md:text-xs font-normal text-gray-600 dark:text-gray-400 leading-4">Distance</p>
                </div>
              </div>
            )}
            {workout.elevation_gain_feet && (
              <div className="flex items-center gap-2 md:w-[168px] shrink-0 h-[30px]">
                <div className="bg-[#ffe1f1] rounded-[4.8px] md:rounded-[6px] size-[24px] md:size-[30px] flex items-center justify-center shrink-0">
                  <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-gray-800" />
                </div>
                <div className="flex flex-col gap-[1px]">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white leading-5">{workout.elevation_gain_feet}ft</p>
                  <p className="text-[10px] md:text-xs font-normal text-gray-600 dark:text-gray-400 leading-4">Elevation</p>
                </div>
              </div>
            )}
            {workout.intensity && (
              <div className="flex items-center gap-2 md:w-[168px] shrink-0 h-[30px]">
                <div className="bg-[#feffe1] rounded-[4.8px] md:rounded-[6px] size-[24px] md:size-[30px] flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-gray-800" />
                </div>
                <div className="flex flex-col gap-[1px]">
                  <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white leading-5">{workout.intensity}</p>
                  <p className="text-[10px] md:text-xs font-normal text-gray-600 dark:text-gray-400 leading-4">Intensity</p>
                </div>
              </div>
            )}
            <div className="flex items-center gap-2 md:w-[168px] shrink-0 h-[30px]">
              <div className="bg-[#e1fff1] rounded-[4.8px] md:rounded-[6px] size-[24px] md:size-[30px] flex items-center justify-center shrink-0">
                <Calendar className="w-4 h-4 md:w-5 md:h-5 text-gray-900 dark:text-gray-800" />
              </div>
              <div className="flex flex-col gap-[1px]">
                <p className="text-xs md:text-sm font-medium text-gray-900 dark:text-white leading-5">
                  <span className="md:hidden">{format(new Date(workout.date), 'MMM d, yyyy')}</span>
                  <span className="hidden md:inline">{format(new Date(workout.date), 'MMMM d, yyyy')}</span>
                </p>
                <p className="text-[10px] md:text-xs font-normal text-gray-600 dark:text-gray-400 leading-4">Date</p>
              </div>
            </div>
          </div>

          {/* Description OR Exercise Logging - not both */}
          {(workout.workout_type === 'strength' || workout.workout_type === 'micro') ? (
            /* Show Exercise Logging for Strength/Micro Workouts */
            <div className="space-y-3">
              {exercises.map(exercise => (
                <InlineExerciseCard
                  key={exercise.id}
                  exercise={{
                    name: exercise.exercises?.name || 'Unknown Exercise',
                    planned_sets: exercise.sets || 0,
                    planned_reps: exercise.reps || 0,
                    planned_weight: exercise.weight || 0,
                    reps: exercise.reps !== null ? String(exercise.reps) : undefined,
                    weight_unit: exercise.weight_unit || 'lb'
                  }}
                  exerciseId={exercise.exercise_id}
                  existingLog={getLogForExercise(exercise.id)}
                  onSave={(setsData, weightUnit) => handleSaveLog(exercise.id, setsData, weightUnit)}
                  onDelete={() => handleDeleteLog(exercise.id)}
                  onExerciseClick={handleExerciseClick}
                  libraryExerciseId={exercise.exercises?.library_exercise_id || null}
                  onLibraryClick={handleLibraryClick}
                />
              ))}
            </div>
          ) : workout.description ? (
            /* Show Description for workouts without structured exercises */
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h3>
              <div className="text-gray-700 dark:text-gray-300 leading-relaxed">
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
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Notes</h3>
                {saveStatus === 'saving' && (
                  <span className="text-sm text-gray-500 dark:text-gray-400">Saving...</span>
                )}
                {saveStatus === 'saved' && (
                  <span className="text-sm text-green-600 dark:text-green-400">✓ Saved</span>
                )}
              </div>
              <textarea
                value={notes}
                onChange={(e) => {
                  const newValue = e.target.value
                  setNotes(newValue)
                  debouncedSaveNotes(newValue)
                }}
                placeholder="Add notes about your workout..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
                rows={3}
              />
            </div>
          </div>
        </div>
      </div>
      
      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        exerciseId={historyModal.exerciseId}
        exerciseName={historyModal.exerciseName}
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, exerciseId: 0, exerciseName: '' })}
      />
      
      {/* Exercise Library Modal */}
      <ExerciseLibraryModal
        libraryExerciseId={libraryModal.libraryExerciseId}
        isOpen={libraryModal.isOpen}
        onClose={() => setLibraryModal({ isOpen: false, libraryExerciseId: null })}
      />
    </div>
  )
}
