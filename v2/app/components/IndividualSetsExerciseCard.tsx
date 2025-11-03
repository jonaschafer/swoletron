'use client'

import { useState, useEffect } from 'react'
import { WorkoutExercise, ExerciseLog } from '@/lib/supabase'
import { 
  logExercise,
  updateExerciseLog,
  deleteExerciseLog,
  getLatestExerciseLog
} from '@/lib/supabase'
import { ExerciseHistoryModal } from '@/app/components/ExerciseHistoryModal'
import { CheckCircle } from 'lucide-react'

interface IndividualSetsExerciseCardProps {
  exercise: WorkoutExercise
  onLogUpdate?: () => void
}

interface SetData {
  weight: number
  reps: string
  completed: boolean
}

export function IndividualSetsExerciseCard({ exercise, onLogUpdate }: IndividualSetsExerciseCardProps) {
  const [exerciseLog, setExerciseLog] = useState<ExerciseLog | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [historyModal, setHistoryModal] = useState<{
    isOpen: boolean
    exerciseId: number
    exerciseName: string
  }>({ isOpen: false, exerciseId: 0, exerciseName: '' })
  
  // Form data for individual sets
  const [setsData, setSetsData] = useState<SetData[]>([])
  const [notes, setNotes] = useState('')
  const [weightUnit, setWeightUnit] = useState('lbs')

  useEffect(() => {
    loadExerciseLog()
  }, [exercise.id])

  const loadExerciseLog = async () => {
    try {
      setLoading(true)
      const log = await getLatestExerciseLog(exercise.id)
      setExerciseLog(log)
      
      if (log) {
        // Convert existing log data to individual sets format
        const sets: SetData[] = []
        const repsArray = log.reps_completed || []
        const weight = log.weight_used || 0
        const unit = log.weight_unit || 'lbs'
        
        // Create sets based on reps_completed array
        for (let i = 0; i < repsArray.length; i++) {
          sets.push({
            weight: weight,
            reps: repsArray[i],
            completed: true
          })
        }
        
        setSetsData(sets)
        setNotes(log.notes || '')
        setWeightUnit(unit)
      } else {
        // Initialize with planned workout data - all incomplete (gray)
        const exerciseName = exercise.exercises?.name || 'Unknown Exercise'
        let sets: SetData[] = []
        
        if (exerciseName === 'Overhead Press') {
          sets = [
            { weight: 20, reps: '8', completed: false },
            { weight: 20, reps: '8', completed: false },
            { weight: 20, reps: '8', completed: false },
            { weight: 120, reps: '45', completed: false }
          ]
        } else if (exerciseName === 'Bench Press') {
          sets = [
            { weight: 120, reps: '45', completed: false }
          ]
        } else {
          // Default for other exercises
          const plannedSets = exercise.sets || 4
          const plannedWeight = exercise.weight || 20
          const plannedReps = exercise.reps ? String(exercise.reps) : '8'
          
          for (let i = 0; i < plannedSets; i++) {
            sets.push({
              weight: plannedWeight,
              reps: plannedReps,
              completed: false
            })
          }
        }
        
        setSetsData(sets)
        setWeightUnit(exercise.weight_unit || 'lbs')
      }
    } catch (error) {
      console.error('Error loading exercise log:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleStartEditing = () => {
    setIsEditing(true)
  }

  const handleCancelEditing = () => {
    setIsEditing(false)
    loadExerciseLog()
  }

  const handleSaveLog = async () => {
    try {
      setSaving(true)
      
      // Filter only completed sets and get their reps
      const completedSets = setsData.filter(set => set.completed)
      const repsArray = completedSets.map(set => set.reps)
      const setsCompleted = completedSets.length
      
      // Use the weight from the first completed set
      const weightUsed = completedSets.length > 0 ? completedSets[0].weight : 0

      if (exerciseLog) {
        await updateExerciseLog(
          exerciseLog.id,
          setsCompleted,
          repsArray,
          weightUsed,
          weightUnit,
          notes
        )
      } else {
        await logExercise(
          exercise.id,
          setsCompleted,
          repsArray,
          weightUsed,
          weightUnit,
          notes
        )
      }
      
      await loadExerciseLog()
      setIsEditing(false)
      onLogUpdate?.()
    } catch (error) {
      console.error('Error saving exercise log:', error)
      alert('Failed to save exercise log')
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteLog = async () => {
    try {
      if (exerciseLog) {
        await deleteExerciseLog(exerciseLog.id)
        await loadExerciseLog()
        onLogUpdate?.()
      }
    } catch (error) {
      console.error('Error deleting exercise log:', error)
    }
  }

  const updateSetData = (setIndex: number, field: keyof SetData, value: any) => {
    setSetsData(prev => prev.map((set, index) => 
      index === setIndex ? { ...set, [field]: value } : set
    ))
  }

  const addSet = () => {
    const lastSet = setsData[setsData.length - 1]
    setSetsData(prev => [...prev, {
      weight: lastSet?.weight || 0,
      reps: lastSet?.reps || '',
      completed: false
    }])
  }

  const removeSet = (setIndex: number) => {
    if (setsData.length > 1) {
      setSetsData(prev => prev.filter((_, index) => index !== setIndex))
    }
  }

  const toggleSetCompletion = (setIndex: number) => {
    updateSetData(setIndex, 'completed', !setsData[setIndex].completed)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-white relative rounded-[10px] w-[295px] mx-auto">
      <div className="box-border content-stretch flex flex-col gap-[16px] items-start overflow-clip px-0 py-[17px] relative rounded-[inherit] w-[295px]">
        {/* Exercise Header - matches Figma exactly */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between px-[16px] py-0 relative w-full">
              <div className="basis-0 content-stretch flex flex-col font-medium gap-[9px] grow items-start justify-center leading-[0] min-h-px min-w-px relative shrink-0">
                <div 
                  onClick={() => {
                    if (exercise.exercise_id && exercise.exercises?.name) {
                      setHistoryModal({
                        isOpen: true,
                        exerciseId: exercise.exercise_id,
                        exerciseName: exercise.exercises.name
                      })
                    }
                  }}
                  className={`flex flex-col font-['Inter_Tight:Medium',_sans-serif] justify-center relative shrink-0 text-[14px] w-full ${
                    exercise.exercise_id ? 'cursor-pointer hover:underline text-blue-600 dark:text-blue-400' : 'text-[#1e1e1e]'
                  } transition-colors`}
                >
                  <p className="leading-[20px]">{exercise.exercises?.name || 'Unknown Exercise'}</p>
                </div>
                {exerciseLog && (
                  <div className="flex flex-col font-['Inter:Medium',_sans-serif] justify-center not-italic relative shrink-0 text-[#7f8082] text-[10px] w-full">
                    <p className="leading-[20px]">
                      <span className="font-['Inter:Bold',_sans-serif] font-bold not-italic text-[#1f9fff]">↑{exerciseLog.reps_completed?.length || 0} rep</span>
                      <span>{` since last time`}</span>
                    </p>
                  </div>
                )}
              </div>
              
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                {/* Checkmark icon */}
                <div className="relative shrink-0 size-[20px]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <g>
                      <rect fill="#E2E4E5" height="20" rx="10" width="20" />
                      <path d="M7 10L9 12L13 8" stroke="#1E1E1E" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </div>
                {/* Arrow icon */}
                <div className="bg-[#e2e4e5] overflow-clip relative rounded-[300px] shrink-0 size-[20px]">
                  <div className="absolute left-1/2 size-[14px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                      <path d="M2 7h10M7 2l5 5-5 5" stroke="#1E1E1E" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Sets Display - matches Figma exactly */}
        {!isEditing ? (
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
            {setsData.map((set, index) => (
              <div key={index} className="bg-white relative shrink-0 w-full">
                <div className="flex flex-row items-center size-full">
                  <div className="box-border content-stretch flex items-center justify-between px-[16px] py-[6px] relative w-full">
                    {/* Set Number Badge */}
                    <div className="bg-[#e2e4e5] overflow-clip relative rounded-[300px] shrink-0 size-[20px]">
                      <div className="absolute flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] left-[calc(50%-0.5px)] not-italic text-[9px] text-center text-gray-900 text-nowrap top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]">
                        <p className="leading-[20px] whitespace-pre">{index + 1}</p>
                      </div>
                    </div>
                    
                    {/* Weight Input */}
                    <div className="bg-[#e2e4e5] box-border content-stretch flex font-['Inter:Medium',_sans-serif] font-medium gap-[5px] items-center justify-end leading-[0] not-italic overflow-clip px-[7px] py-[6px] relative rounded-[6px] shrink-0 text-[#1e1e1e] text-nowrap">
                      <div className="flex flex-col justify-center relative shrink-0 text-[13px] text-right">
                        <p className="leading-[20px] text-nowrap whitespace-pre">{set.weight}</p>
                      </div>
                      <div className="flex flex-col justify-center opacity-50 relative shrink-0 text-[11px]">
                        <p className="leading-[20px] text-nowrap whitespace-pre">{weightUnit}</p>
                      </div>
                    </div>
                    
                    {/* X Separator */}
                    <div className="relative shrink-0 size-[7.071px]">
                      <div className="absolute inset-[-5%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                          <g>
                            <path d="M1 1L7 7" stroke="#5E6C62" />
                            <path d="M7 1L1 7" stroke="#5E6C62" />
                          </g>
                        </svg>
                      </div>
                    </div>
                    
                    {/* Reps Input */}
                    <div className="bg-[#e2e4e5] box-border content-stretch flex font-['Inter:Medium',_sans-serif] font-medium gap-[5px] items-center justify-end leading-[0] not-italic overflow-clip px-[7px] py-[6px] relative rounded-[6px] shrink-0 text-[#1e1e1e] text-nowrap">
                      <div className="flex flex-col justify-center relative shrink-0 text-[13px] text-right">
                        <p className="leading-[20px] text-nowrap whitespace-pre">{set.reps}</p>
                      </div>
                      <div className="flex flex-col justify-center opacity-50 relative shrink-0 text-[11px]">
                        <p className="leading-[20px] text-nowrap whitespace-pre">reps</p>
                      </div>
                    </div>
                    
                    {/* Completion Status Icon */}
                    <div className="relative shrink-0 size-[20px]">
                      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                        <g>
                          <rect fill="#E2E4E5" height="20" rx="10" width="20" />
                          {set.completed && (
                            <path d="M7 10L9 12L13 8" stroke="#1E1E1E" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                          )}
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          // Edit Mode
          <div className="content-stretch flex flex-col items-start relative shrink-0 w-full space-y-2">
            {setsData.map((set, index) => (
              <div key={index} className="flex items-center gap-3 w-full px-4">
                <button onClick={() => toggleSetCompletion(index)} className="shrink-0">
                  <div className="relative size-[20px]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                      <g>
                        <rect fill={set.completed ? "#04BE36" : "#E2E4E5"} height="20" rx="10" width="20" />
                        {set.completed && (
                          <path d="M7 10L9 12L13 8" stroke="#FFFFFF" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                        )}
                      </g>
                    </svg>
                  </div>
                </button>
                
                <span className="text-sm font-medium text-gray-900 w-4">{index + 1}</span>
                
                <input
                  type="number"
                  value={set.weight}
                  onChange={(e) => updateSetData(index, 'weight', parseFloat(e.target.value) || 0)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                
                <input
                  type="text"
                  value={set.reps}
                  onChange={(e) => updateSetData(index, 'reps', e.target.value)}
                  className="w-16 px-2 py-1 border border-gray-300 rounded text-sm"
                />
                
                {setsData.length > 1 && (
                  <button onClick={() => removeSet(index)} className="text-red-500 text-sm">×</button>
                )}
              </div>
            ))}
            
            <button onClick={addSet} className="px-4 text-blue-600 text-sm">+ Add Set</button>
            
            <div className="w-full px-4 space-y-2">
              <select
                value={weightUnit}
                onChange={(e) => setWeightUnit(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-sm"
              >
                <option value="lbs">lbs</option>
                <option value="kg">kg</option>
                <option value="BW">BW</option>
              </select>
            </div>
          </div>
        )}
        
        {/* Notes Section - matches Figma */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between px-[16px] py-0 relative w-full">
              <div className="basis-0 content-stretch flex flex-col gap-[9px] grow items-start justify-center min-h-px min-w-px relative shrink-0">
                <div className="flex flex-col font-['Inter_Tight:Medium',_sans-serif] font-medium justify-center leading-[0] relative shrink-0 text-[#1e1e1e] text-[14px] w-full">
                  <p className="leading-[20px]">Notes</p>
                </div>
                {isEditing ? (
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="bg-[#f1f1f1] h-[94px] w-full rounded-[6px] p-3 text-[10px] text-[#74787b]"
                    placeholder="Start typing and it auto-saves"
                  />
                ) : (
                  <div className="bg-[#f1f1f1] h-[94px] overflow-clip relative rounded-[6px] shrink-0 w-full">
                    <div className="absolute flex flex-col font-['Inter:Regular',_sans-serif] font-normal justify-center leading-[0] left-[10px] not-italic text-[#74787b] text-[10px] top-[15.5px] translate-y-[-50%] w-[243px]">
                      <p className="leading-[20px]">{notes || "Start typing and it auto-saves"}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
        
        {/* Action Buttons */}
        {isEditing ? (
          <div className="flex gap-2 px-4">
            <button
              onClick={handleSaveLog}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
            <button onClick={handleCancelEditing} className="px-4 py-2 bg-gray-300 rounded text-sm">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2 px-4">
            <button onClick={handleStartEditing} className="px-4 py-2 bg-blue-600 text-white rounded text-sm">
              Edit
            </button>
            {exerciseLog && (
              <button onClick={handleDeleteLog} className="px-4 py-2 bg-red-500 text-white rounded text-sm">
                Delete
              </button>
            )}
          </div>
        )}
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[10px]" />
      
      {/* Exercise History Modal */}
      <ExerciseHistoryModal
        exerciseId={historyModal.exerciseId}
        exerciseName={historyModal.exerciseName}
        isOpen={historyModal.isOpen}
        onClose={() => setHistoryModal({ isOpen: false, exerciseId: 0, exerciseName: '' })}
      />
    </div>
  )
}
