'use client'

import { useState, useEffect } from 'react'
import { Workout, WorkoutCompletion, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion } from '@/lib/supabase'
import { Clock, MapPin, Check, CheckCircle } from 'lucide-react'

interface WorkoutCardProps {
  workout: Workout
  onClick?: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
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
  }, [workout.id])

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
    switch (type) {
      case 'run':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'strength':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'micro':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'rest':
        return 'bg-gray-100 text-gray-800 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <div 
      className={`workout-card bg-white rounded-lg border-2 ${getWorkoutTypeColor(workout.workout_type)} cursor-pointer transition-all hover:shadow-md touch-manipulation w-full`}
      onClick={onClick || (() => setIsExpanded(!isExpanded))}
    >
      <div className="p-2 sm:p-3 w-full overflow-hidden">
        {/* Header Row - Workout type and checkbox */}
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="font-semibold text-xs sm:text-sm capitalize">
            {workout.workout_type}
          </span>
          <button
            onClick={handleCompletionToggle}
            disabled={isLoading}
            className={`p-1 rounded-full transition-colors flex-shrink-0 ${
              isCompleted
                ? 'text-green-600 bg-green-100'
                : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
            } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
            title={isCompleted ? 'Mark as incomplete' : 'Mark as complete'}
          >
            {isCompleted ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <Check className="w-4 h-4" />
            )}
          </button>
        </div>
        
        {/* Title */}
        <h3 className="font-bold text-xs sm:text-sm mb-1 break-words">
          {workout.title}
        </h3>
        
        {/* Duration */}
        {workout.duration_minutes && (
          <div className="flex items-center gap-1 mb-2">
            <Clock className="w-3 h-3 flex-shrink-0" />
            <span className="text-xs opacity-80">
              {workout.duration_minutes} minutes
            </span>
          </div>
        )}
        
        {/* Description */}
        {workout.description && (
          <p className="text-xs opacity-80 mb-2 break-words line-clamp-2">
            {workout.description}
          </p>
        )}
        
        {/* Workout Metrics */}
        <div className="flex flex-wrap gap-1 sm:gap-2 text-xs">
          {workout.distance_miles && (
            <span className="flex items-center gap-1 bg-white/30 px-1 py-0.5 rounded text-xs">
              <MapPin className="w-3 h-3" />
              {workout.distance_miles}mi
            </span>
          )}
          {workout.elevation_gain_feet && (
            <span className="flex items-center gap-1 bg-white/30 px-1 py-0.5 rounded text-xs">
              <span>↗</span>
              {workout.elevation_gain_feet}ft
            </span>
          )}
          {workout.intensity && (
            <span className="px-2 py-1 bg-white/50 rounded text-xs font-medium">
              {workout.intensity}
            </span>
          )}
        </div>
        
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-current/20">
            {workout.notes && (
              <div className="mb-2">
                <p className="text-xs font-medium mb-1">Notes:</p>
                <p className="text-xs opacity-80 break-words">{workout.notes}</p>
              </div>
            )}
            {workout.phase && (
              <div className="mb-2">
                <p className="text-xs font-medium mb-1">Phase:</p>
                <p className="text-xs opacity-80 break-words">{workout.phase}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
