'use client'

import { useState, useEffect } from 'react'
import { IndividualSetsExerciseCard } from '@/app/components/IndividualSetsExerciseCard'
import { WorkoutExercise } from '@/lib/supabase'
import { getWorkoutExercises } from '@/lib/supabase'

export default function TestIndividualSetsPage() {
  const [exercises, setExercises] = useState<WorkoutExercise[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadExercises()
  }, [])

  const loadExercises = async () => {
    try {
      setLoading(true)
      // Using workout ID 1 which should have exercises
      const workoutExercises = await getWorkoutExercises(1)
      setExercises(workoutExercises)
    } catch (error) {
      console.error('Error loading exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="bg-[#f2f2f2] relative size-full" style={{ width: '367px', height: '687px' }}>
      {/* Header - matches Figma Make exactly */}
      <div className="absolute content-stretch flex gap-[20px] items-start left-[34px] top-[50px] w-[297px]">
        <div className="basis-0 content-stretch flex flex-col font-['Inter_Tight:Medium',_sans-serif] font-medium gap-[13px] grow items-start leading-[0] min-h-px min-w-px relative shrink-0">
          <div className="flex flex-col justify-center relative shrink-0 text-[#1e1e1e] text-[22px] w-full">
            <p className="leading-[20px]">Lower Body</p>
          </div>
          <div className="flex flex-col justify-center relative shrink-0 text-[#8c9191] text-[14px] w-full">
            <p className="leading-[20px]">Thursday</p>
          </div>
        </div>
        <div className="bg-[#f53622] box-border content-stretch flex flex-col gap-[10px] items-center justify-center overflow-clip px-[11px] py-[10px] relative rounded-[300px] shrink-0">
          <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[13px] text-nowrap text-right text-white">
            <p className="leading-[20px] whitespace-pre">Finish</p>
          </div>
        </div>
      </div>

      {/* Exercise Cards - matches Figma Make positioning */}
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[24px] items-end px-[34px] py-[40px] relative size-full">
          <div className="space-y-4">
            {exercises.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No exercises found for this workout.</p>
                <p className="text-sm mt-2">Make sure you have exercises in workout ID 1</p>
              </div>
            ) : (
              exercises.map((exercise) => (
                <IndividualSetsExerciseCard
                  key={exercise.id}
                  exercise={exercise}
                  onLogUpdate={loadExercises}
                />
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
