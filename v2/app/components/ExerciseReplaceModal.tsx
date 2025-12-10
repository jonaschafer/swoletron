'use client'

import { useState, useEffect, useMemo } from 'react'
import { X, Search } from 'lucide-react'
import { ExerciseLibraryCard } from '@/app/components/ExerciseLibraryCard'
import { getExerciseLibrary, ExerciseLibraryEntry, BODY_REGION_GROUPS } from '@/lib/supabase'

interface ExerciseReplaceModalProps {
  isOpen: boolean
  onClose: () => void
  currentExerciseName: string
  onReplace: (libraryExerciseId: string) => void
}

export function ExerciseReplaceModal({
  isOpen,
  onClose,
  currentExerciseName,
  onReplace
}: ExerciseReplaceModalProps) {
  const [exercises, setExercises] = useState<ExerciseLibraryEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadExercises()
    }
  }, [isOpen])

  const loadExercises = async () => {
    try {
      setLoading(true)
      const data = await getExerciseLibrary()
      setExercises(data)
    } catch (error) {
      console.error('Failed to load exercises:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filter exercises based on search
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) {
      return exercises
    }

    const query = searchQuery.toLowerCase().trim()
    return exercises.filter(ex =>
      ex.name.toLowerCase().includes(query) ||
      ex.description?.toLowerCase().includes(query)
    )
  }, [exercises, searchQuery])

  const handleExerciseClick = (exercise: ExerciseLibraryEntry) => {
    onReplace(exercise.id)
    onClose()
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
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 rounded-[10px] w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-700">
          <div>
            <h2 className="text-2xl font-semibold text-white">
              Replace Exercise
            </h2>
            <p className="text-sm text-gray-400 mt-1">
              Replacing: <span className="font-medium text-white">{currentExerciseName}</span>
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-700"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-6 border-b border-gray-700">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search exercises by name or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
          </div>
        </div>

        {/* Exercise Grid */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-400">Loading exercises...</p>
            </div>
          ) : filteredExercises.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-400">
                {searchQuery ? 'No exercises found matching your search.' : 'No exercises available.'}
              </p>
            </div>
          ) : (
            <>
              <div className="mb-4 text-sm text-gray-400">
                Showing {filteredExercises.length} {filteredExercises.length === 1 ? 'exercise' : 'exercises'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredExercises.map((exercise) => (
                  <div
                    key={exercise.id}
                    onClick={() => handleExerciseClick(exercise)}
                    className="cursor-pointer transform transition-transform hover:scale-[1.02]"
                  >
                    <ExerciseLibraryCard
                      exercise={exercise}
                      onInjuryAreaClick={() => {}} // Disable filter clicks in replace modal
                      onBodyPartClick={() => {}}
                      onEquipmentClick={() => {}}
                    />
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-700 bg-gray-800">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg font-medium transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  )
}

