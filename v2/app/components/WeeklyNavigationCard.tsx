'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface WeeklyNavigationCardProps {
  currentWeek: Date
  weeklyMileage: number
  onNavigateWeek: (direction: 'prev' | 'next') => void
}

export function WeeklyNavigationCard({ 
  currentWeek, 
  weeklyMileage, 
  onNavigateWeek 
}: WeeklyNavigationCardProps) {
  const weekEndDate = new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000)
  const weekTitle = `${format(currentWeek, 'MMM d')} - ${format(weekEndDate, 'MMM d, yyyy')}`

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 transition-colors duration-200">
      {/* Navigation Row */}
      <div className="flex items-center w-full">
        {/* Previous Button */}
        <button
          onClick={() => onNavigateWeek('prev')}
          className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
        
        {/* Week Title */}
        <div className="flex-1 flex items-center justify-center px-2">
          <h2 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
            {weekTitle}
          </h2>
        </div>
        
        {/* Next Button */}
        <button
          onClick={() => onNavigateWeek('next')}
          className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
        </button>
      </div>
      
      {/* Weekly Mileage Display */}
      <div className="w-full">
        <div className="bg-blue-100 dark:bg-blue-900 rounded-full px-4 py-2 w-full flex justify-center">
          <span className="text-blue-800 dark:text-blue-100 font-bold text-sm">
            {weeklyMileage} miles
          </span>
        </div>
      </div>
    </div>
  )
}
