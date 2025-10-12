'use client'

import { useState, useEffect } from 'react'
import { WorkoutExercise, ExerciseLog, logExercise, getLatestExerciseLog, updateExerciseLog, deleteExerciseLog } from '@/lib/supabase'
import { Check } from 'lucide-react'

interface ExerciseLoggingProps {
  workoutExercise: WorkoutExercise
}

export function ExerciseLogging({ workoutExercise }: ExerciseLoggingProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [latestLog, setLatestLog] = useState<ExerciseLog | null>(null)
  
  // Form state - always editable
  const [setsCompleted, setSetsCompleted] = useState(0)
  const [repsCompleted, setRepsCompleted] = useState<number | ''>('')
  const [weightUsed, setWeightUsed] = useState<number | ''>('')
  const [weightUnit, setWeightUnit] = useState('lbs')

  useEffect(() => {
    loadLatestLog()
  }, [workoutExercise.id])

  const loadLatestLog = async () => {
    try {
      const log = await getLatestExerciseLog(workoutExercise.id)
      setLatestLog(log)
      
      if (log) {
        setSetsCompleted(log.sets_completed)
        setRepsCompleted(log.reps_completed || '')
        setWeightUsed(log.weight_used || '')
        setWeightUnit(log.weight_unit || 'lbs')
      } else {
        // Initialize with planned values
        setSetsCompleted(workoutExercise.sets || 0)
        setRepsCompleted(workoutExercise.reps || '')
        setWeightUsed(workoutExercise.weight || '')
        setWeightUnit(workoutExercise.weight_unit || 'lbs')
      }
    } catch (error) {
      console.error('Error loading latest exercise log:', error)
    }
  }

  const handleSave = async () => {
    if (!setsCompleted || setsCompleted <= 0) {
      alert('Please enter the number of sets completed')
      return
    }

    setIsLoading(true)
    try {
      const reps = typeof repsCompleted === 'number' ? repsCompleted : undefined
      const weight = typeof weightUsed === 'number' ? weightUsed : undefined

      if (latestLog) {
        // Update existing log
        await updateExerciseLog(
          latestLog.id,
          setsCompleted,
          reps,
          weight,
          weightUnit
        )
      } else {
        // Create new log
        await logExercise(
          workoutExercise.id,
          setsCompleted,
          reps,
          weight,
          weightUnit
        )
      }

      await loadLatestLog()
    } catch (error) {
      console.error('Error saving exercise log:', error)
      alert('Failed to save exercise log')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!latestLog || !confirm('Are you sure you want to delete this exercise log?')) {
      return
    }

    setIsLoading(true)
    try {
      await deleteExerciseLog(latestLog.id)
      await loadLatestLog()
    } catch (error) {
      console.error('Error deleting exercise log:', error)
      alert('Failed to delete exercise log')
    } finally {
      setIsLoading(false)
    }
  }

  const handleInputChange = (field: 'sets' | 'reps' | 'weight', value: string) => {
    switch (field) {
      case 'sets':
        const setsValue = value === '' ? 0 : parseInt(value) || 0
        setSetsCompleted(setsValue)
        break
      case 'reps':
        const repsValue = value === '' ? '' : parseInt(value) || ''
        setRepsCompleted(repsValue)
        break
      case 'weight':
        const weightValue = value === '' ? '' : parseInt(value) || ''
        setWeightUsed(weightValue)
        break
    }
  }

  return (
    <div className="bg-gray-50 rounded-lg p-3 sm:p-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
        {/* Exercise name and status */}
        <div className="flex flex-col gap-1">
          <h4 className="font-medium text-gray-900 text-sm sm:text-base">
            {workoutExercise.exercises?.name || 'Exercise'}
          </h4>
          <p className="text-xs sm:text-sm text-gray-500 opacity-75">
            {latestLog ? 'Logged' : 'Not logged'}
          </p>
        </div>
        
        {/* Input fields and action button */}
        <div className="flex items-center justify-between sm:justify-end gap-2 sm:gap-3">
          {/* Sets */}
          <div className="flex flex-col items-center gap-1">
            <div className="bg-white border border-gray-300 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <input
                type="number"
                min="0"
                value={setsCompleted}
                onChange={(e) => handleInputChange('sets', e.target.value)}
                className="font-medium text-sm sm:text-lg text-gray-900 text-center w-full h-full bg-transparent border-none outline-none flex items-center justify-center"
                placeholder="0"
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">Sets</span>
          </div>
          
          {/* Reps */}
          <div className="flex flex-col items-center gap-1">
            <div className="bg-white border border-gray-300 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <input
                type="number"
                min="0"
                value={repsCompleted}
                onChange={(e) => handleInputChange('reps', e.target.value)}
                className="font-medium text-sm sm:text-lg text-gray-900 text-center w-full h-full bg-transparent border-none outline-none flex items-center justify-center"
                placeholder="0"
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">Reps</span>
          </div>
          
          {/* Weight */}
          <div className="flex flex-col items-center gap-1">
            <div className="bg-white border border-gray-300 rounded-lg w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center">
              <input
                type="number"
                min="0"
                step="0.5"
                value={weightUsed}
                onChange={(e) => handleInputChange('weight', e.target.value)}
                className="font-medium text-sm sm:text-lg text-gray-900 text-center w-full h-full bg-transparent border-none outline-none flex items-center justify-center"
                placeholder="0"
              />
            </div>
            <span className="text-xs text-gray-600 font-medium">Weight</span>
          </div>
          
          {/* Action button */}
          <div className="flex flex-col items-center gap-1">
            <button
              onClick={handleSave}
              disabled={isLoading}
              className={`w-10 h-10 sm:w-12 sm:h-12 flex items-center justify-center rounded-lg transition-colors ${
                latestLog 
                  ? 'bg-green-500 text-white hover:bg-green-600' 
                  : 'bg-gray-200 text-gray-400 hover:bg-gray-300'
              } disabled:opacity-50`}
              title={latestLog ? 'Update log' : 'Save log'}
            >
              <Check className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            {latestLog && (
              <button
                onClick={handleDelete}
                disabled={isLoading}
                className="text-gray-400 hover:text-red-500 text-xs transition-colors disabled:opacity-50"
                title="Delete log"
              >
                Delete
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
