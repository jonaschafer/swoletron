'use client'

import { useState, useEffect } from 'react'
import { X, Star, ArrowUp, ArrowDown, ArrowRight, ExternalLink } from 'lucide-react'
import { getExerciseHistory, getExercisePR, ExerciseLogWithRelations } from '@/lib/supabase'
import { format, parseISO } from 'date-fns'
import { useRouter } from 'next/navigation'

interface ExerciseHistoryModalProps {
  exerciseId: number
  exerciseName: string
  isOpen: boolean
  onClose: () => void
}

function calculateProgression(
  currentWeight: number | null,
  previousWeight: number | null,
  weightUnit: string | null
): {
  arrow: '↑' | '↓' | '→'
  diff: string
  color: string
} {
  if (!currentWeight || !previousWeight) {
    return { arrow: '→', diff: '', color: 'text-gray-500 dark:text-gray-400' }
  }

  const unit = weightUnit || 'lb'
  const difference = Math.abs(currentWeight - previousWeight)

  if (currentWeight > previousWeight) {
    return {
      arrow: '↑',
      diff: `(+${difference.toFixed(1)} ${unit})`,
      color: 'text-green-600 dark:text-green-400'
    }
  } else if (currentWeight < previousWeight) {
    return {
      arrow: '↓',
      diff: `(-${difference.toFixed(1)} ${unit})`,
      color: 'text-red-600 dark:text-red-400'
    }
  } else {
    return {
      arrow: '→',
      diff: '',
      color: 'text-gray-500 dark:text-gray-400'
    }
  }
}

function formatReps(reps: string[]): string {
  if (!reps || reps.length === 0) return 'N/A'
  
  // Format as "3 × 12, 10, 8" or "2 × 30sec"
  if (reps.length === 1) {
    return reps[0]
  }
  return `${reps.length} × ${reps.join(', ')}`
}

export function ExerciseHistoryModal({
  exerciseId,
  exerciseName,
  isOpen,
  onClose
}: ExerciseHistoryModalProps) {
  const [logs, setLogs] = useState<ExerciseLogWithRelations[]>([])
  const [pr, setPR] = useState<number | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (isOpen && exerciseId) {
      loadHistory()
    } else {
      // Reset state when modal closes
      setLogs([])
      setPR(null)
      setError(null)
    }
  }, [isOpen, exerciseId])

  const loadHistory = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const [historyData, prData] = await Promise.all([
        getExerciseHistory(exerciseId),
        getExercisePR(exerciseId)
      ])
      
      setLogs(historyData)
      setPR(prData)
    } catch (err) {
      console.error('Error loading exercise history:', err)
      setError('Failed to load exercise history')
    } finally {
      setLoading(false)
    }
  }

  const handleViewWorkout = (workoutId: string | null) => {
    if (!workoutId) return
    
    // Convert string workout_id to number for navigation
    const workoutIdNum = parseInt(workoutId, 10)
    if (isNaN(workoutIdNum)) return
    
    // Close this modal first
    onClose()
    
    // Navigate to calendar with workout query param
    router.push(`/calendar?workout=${workoutIdNum}`)
  }

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

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[90vh] flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {exerciseName}
              </h2>
              {pr !== null && (
                <div className="flex items-center gap-2 mt-1">
                  <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    PR: {pr} {logs[0]?.weight_unit || 'lb'}
                  </span>
                </div>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-600 dark:text-gray-400">
                No history yet. Log your first workout!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log, index) => {
                const previousLog = index < logs.length - 1 ? logs[index + 1] : null
                const progression = calculateProgression(
                  log.weight_used,
                  previousLog?.weight_used || null,
                  log.weight_unit
                )

                const isPR = log.weight_used !== null && log.weight_used === pr

                return (
                  <div
                    key={log.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-800 transition-colors"
                  >
                    {/* Date and Week */}
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        {log.workout?.week_number && log.workout?.date ? (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            Week {log.workout.week_number} · {format(parseISO(log.workout.date), 'MMM d, yyyy')}
                          </span>
                        ) : log.workout?.date ? (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {format(parseISO(log.workout.date), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {format(parseISO(log.logged_at), 'MMM d, yyyy')}
                          </span>
                        )}
                      </div>
                      {log.workout_id && (
                        <button
                          onClick={() => handleViewWorkout(log.workout_id)}
                          className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                        >
                          View Workout
                          <ExternalLink className="w-3 h-3" />
                        </button>
                      )}
                    </div>

                    {/* Sets and Reps */}
                    <div className="mb-2">
                      <span className="text-base font-medium text-gray-900 dark:text-white">
                        {log.sets_completed || 0} sets × {formatReps(log.reps_completed || [])}
                      </span>
                    </div>

                    {/* Weight and Progression */}
                    {log.weight_used !== null && log.weight_used > 0 && (
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-base font-semibold text-gray-900 dark:text-white">
                          {log.weight_used} {log.weight_unit || 'lb'}
                        </span>
                        {progression.arrow !== '→' && (
                          <div className={`flex items-center gap-1 ${progression.color}`}>
                            {progression.arrow === '↑' && <ArrowUp className="w-4 h-4" />}
                            {progression.arrow === '↓' && <ArrowDown className="w-4 h-4" />}
                            <span className="text-sm">{progression.diff}</span>
                          </div>
                        )}
                        {isPR && (
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                            <span className="text-xs text-yellow-600 dark:text-yellow-400 font-medium">
                              PR
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Notes */}
                    {log.notes && (
                      <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                          {log.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

