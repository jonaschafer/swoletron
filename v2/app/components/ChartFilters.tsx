'use client'

import { useState } from 'react'
import { X } from 'lucide-react'

interface ChartFiltersProps {
  dateRange: '4weeks' | '8weeks' | '12weeks' | 'all'
  selectedExercises: string[]
  availableExercises: string[]
  onDateRangeChange: (range: string) => void
  onExercisesChange: (exercises: string[]) => void
}

export function ChartFilters({
  dateRange,
  selectedExercises,
  availableExercises,
  onDateRangeChange,
  onExercisesChange
}: ChartFiltersProps) {
  const [isExerciseDropdownOpen, setIsExerciseDropdownOpen] = useState(false)

  const handleExerciseToggle = (exerciseName: string) => {
    if (selectedExercises.includes(exerciseName)) {
      onExercisesChange(selectedExercises.filter(e => e !== exerciseName))
    } else {
      onExercisesChange([...selectedExercises, exerciseName])
    }
  }

  const handleSelectAll = () => {
    onExercisesChange([...availableExercises])
  }

  const handleClearAll = () => {
    onExercisesChange([])
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row gap-4">
        {/* Date Range Filter */}
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Date Range
          </label>
          <select
            value={dateRange}
            onChange={(e) => onDateRangeChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
          >
            <option value="4weeks">Last 4 Weeks</option>
            <option value="8weeks">Last 8 Weeks</option>
            <option value="12weeks">Last 12 Weeks</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Exercise Multi-Select */}
        <div className="flex-1 relative">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Exercises
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsExerciseDropdownOpen(!isExerciseDropdownOpen)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent text-left flex items-center justify-between"
            >
              <span className="truncate">
                {selectedExercises.length === 0
                  ? 'Select exercises'
                  : `${selectedExercises.length} selected`}
              </span>
              <svg
                className={`w-5 h-5 transition-transform ${isExerciseDropdownOpen ? 'rotate-180' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {isExerciseDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsExerciseDropdownOpen(false)}
                />
                <div className="absolute z-20 mt-1 w-full bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                  <div className="p-2 border-b border-gray-200 dark:border-gray-600 flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="flex-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAll}
                      className="flex-1 px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                    >
                      Clear All
                    </button>
                  </div>
                  <div className="p-2">
                    {availableExercises.length === 0 ? (
                      <p className="text-sm text-gray-500 dark:text-gray-400 px-2 py-1">
                        No exercises available
                      </p>
                    ) : (
                      availableExercises.map((exercise) => (
                        <label
                          key={exercise}
                          className="flex items-center px-2 py-2 hover:bg-gray-50 dark:hover:bg-gray-600 rounded cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedExercises.includes(exercise)}
                            onChange={() => handleExerciseToggle(exercise)}
                            className="w-4 h-4 text-blue-600 dark:text-blue-400 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-400 bg-white dark:bg-gray-700"
                          />
                          <span className="ml-2 text-sm text-gray-900 dark:text-white">
                            {exercise}
                          </span>
                        </label>
                      ))
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Selected Exercises Tags - moved below the filters */}
      {selectedExercises.length > 0 && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Selected ({selectedExercises.length})
          </label>
          <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto">
            {selectedExercises.map((exercise) => (
              <span
                key={exercise}
                className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 text-xs rounded"
              >
                {exercise}
                <button
                  type="button"
                  onClick={() => handleExerciseToggle(exercise)}
                  className="hover:text-blue-600 dark:hover:text-blue-400"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

