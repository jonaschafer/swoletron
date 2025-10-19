'use client'

import { useState } from 'react'
import FigmaExerciseCard from '@/app/components/FigmaExerciseCard'

// Mock data for testing
const mockExercises = [
  {
    name: "Overhead Press",
    planned_sets: 3,
    planned_reps: 8,
    planned_weight: 35
  },
  {
    name: "Bench Press",
    planned_sets: 4,
    planned_reps: 10,
    planned_weight: 135
  },
  {
    name: "Squats",
    planned_sets: 3,
    planned_reps: 12,
    planned_weight: 185
  }
]

export default function TestFigmaExercisePage() {
  const [exerciseLogs, setExerciseLogs] = useState<Record<string, { sets: number; reps: string; weight: number }>>({})

  const handleSave = (exerciseName: string, sets: number, reps: string, weight: number) => {
    console.log(`Saving ${exerciseName}: ${sets} sets, ${reps} reps, ${weight} lbs`)
    setExerciseLogs(prev => ({
      ...prev,
      [exerciseName]: { sets, reps, weight }
    }))
  }

  const handleDelete = (exerciseName: string) => {
    console.log(`Deleting log for ${exerciseName}`)
    setExerciseLogs(prev => {
      const newLogs = { ...prev }
      delete newLogs[exerciseName]
      return newLogs
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Figma Exercise Card Test</h1>
        
        <div className="space-y-4">
          {mockExercises.map((exercise) => {
            const existingLog = exerciseLogs[exercise.name] || null
            
            return (
              <FigmaExerciseCard
                key={exercise.name}
                exercise={exercise}
                existingLog={existingLog}
                onSave={(sets, reps, weight) => handleSave(exercise.name, sets, reps, weight)}
                onDelete={() => handleDelete(exercise.name)}
              />
            )
          })}
        </div>

        {/* Debug Info */}
        <div className="mt-8 p-4 bg-white rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-2">Current Logs:</h3>
          <pre className="text-sm text-gray-600">
            {JSON.stringify(exerciseLogs, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
