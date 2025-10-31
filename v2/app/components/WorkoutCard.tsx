'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutCompletion, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion } from '@/lib/supabase'
import { MapPin, Check, CheckCircle } from 'lucide-react'

interface WorkoutCardProps {
  workout: Workout
  onClick?: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
}

function formatWorkoutTitle(workout: Workout): string {
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
  
  // For run workouts, add miles where week number was
  if (workout.workout_type === 'run' && workout.distance_miles) {
    const miles = Math.round(workout.distance_miles)
    // If title doesn't already have miles, add them
    if (!title.toLowerCase().includes('mi') && !title.toLowerCase().includes('mile')) {
      title = `${title} - ${miles}mi`
    }
  }
  
  return title.trim()
}

export function WorkoutCard({ workout, onClick, onCompletionChange }: WorkoutCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function checkCompletion() {
      try {
        const completion = await getWorkoutCompletion(workout.id)
        setIsCompleted(!!completion)
      } catch (error) {
        console.error('Error checking workout completion:', error)
      }
    }
    checkCompletion()
  }, [workout])

  const handleCompletionToggle = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isLoading) return

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

  const getWorkoutTypeColor = (type: string) => {
    if (isCompleted) {
      // When completed, fill the entire block with the workout type color
      switch (type) {
        case 'run':
          return 'bg-blue-500 dark:bg-blue-600 text-white border-blue-500 dark:border-blue-600'
        case 'strength':
          return 'bg-red-500 dark:bg-red-600 text-white border-red-500 dark:border-red-600'
        case 'micro':
          return 'bg-green-500 dark:bg-green-600 text-white border-green-500 dark:border-green-600'
        case 'rest':
          return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
        default:
          return 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
      }
    } else {
      // When not completed, use light colors with borders
      switch (type) {
        case 'run':
          return 'bg-blue-50 dark:bg-blue-900 border-blue-200 dark:border-blue-700 text-blue-900 dark:text-blue-100'
        case 'strength':
          return 'bg-red-50 dark:bg-red-900 border-red-200 dark:border-red-700 text-red-900 dark:text-red-100'
        case 'micro':
          return 'bg-green-50 dark:bg-green-900 border-green-200 dark:border-green-700 text-green-900 dark:text-green-100'
        case 'rest':
          return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
        default:
          return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300'
      }
    }
  }

  return (
    <div 
      data-date={workout.date}
      className={`workout-card rounded-lg border-2 ${getWorkoutTypeColor(workout.workout_type)} cursor-pointer transition-all hover:shadow-md touch-manipulation w-full`}
      onClick={onClick || (() => setIsExpanded(!isExpanded))}
    >
      <div className="p-2 sm:p-3 w-full overflow-hidden">
        {/* Header Row - Workout type and checkbox */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="font-semibold text-sm sm:text-sm capitalize">
            {workout.workout_type}
          </span>
          {workout.workout_type !== 'rest' && (
            <button
              onClick={handleCompletionToggle}
              disabled={isLoading}
              className={`p-1 rounded-full transition-colors flex-shrink-0 ${
                isCompleted
                  ? 'text-white bg-white/20 dark:bg-white/20 hover:bg-white/30 dark:hover:bg-white/30'
                  : 'text-gray-400 dark:text-gray-500 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30'
              } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
              title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
            >
              {isCompleted ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <Check className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-sm sm:text-sm mb-1 break-words">
          {formatWorkoutTitle(workout)}
        </h3>
        
        {/* Description */}
        {workout.description && (
          <p className="text-sm opacity-80 mb-2 break-words line-clamp-2">
            {workout.description}
          </p>
        )}
        
        {/* Workout Metrics */}
        <div className="flex flex-wrap gap-1 sm:gap-2 text-sm">
          {workout.distance_miles && (
            <span className="flex items-center gap-1 bg-white/30 px-1 py-0.5 rounded text-sm">
              <MapPin className="w-3 h-3" />
              {workout.distance_miles}mi
            </span>
          )}
          {workout.elevation_gain_feet && (
            <span className="flex items-center gap-1 bg-white/30 px-1 py-0.5 rounded text-sm">
              <span>↗</span>
              {workout.elevation_gain_feet}ft
            </span>
          )}
          {workout.intensity && (
            <span className="px-2 py-1 bg-white/50 rounded text-sm font-medium">
              {workout.intensity}
            </span>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-current/20">
            {workout.notes && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">Notes:</p>
                <p className="text-sm opacity-80 break-words">{workout.notes}</p>
              </div>
            )}
            {workout.phase && (
              <div className="mb-2">
                <p className="text-sm font-medium mb-1">Phase:</p>
                <p className="text-sm opacity-80 break-words">{workout.phase}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
