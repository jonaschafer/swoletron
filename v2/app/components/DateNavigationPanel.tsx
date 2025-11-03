'use client'

import { ChevronLeft, ChevronRight } from 'lucide-react'
import { format } from 'date-fns'

interface DateNavigationPanelProps {
  startDate: Date
  endDate: Date
  onNavigate: (direction: 'prev' | 'next') => void
  onGoToStart?: () => void
  onGoToEnd?: () => void
  viewType: 'week' | 'month'
}

export function DateNavigationPanel({
  startDate,
  endDate,
  onNavigate,
  onGoToStart,
  onGoToEnd,
  viewType
}: DateNavigationPanelProps) {
  // Format date range without year
  const formatDateRange = () => {
    if (viewType === 'week') {
      const start = format(startDate, 'MMM d')
      const end = format(endDate, 'MMM d')
      return `${start} - ${end}`
    } else {
      // For month view, show month name only
      return format(startDate, 'MMMM')
    }
  }

  return (
    <div className="mb-6">
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {onGoToStart && (
              <button 
                onClick={onGoToStart}
                className="h-8 px-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-gray-900 dark:text-white transition-colors"
              >
                Start
              </button>
            )}
            <button 
              onClick={() => onNavigate('prev')}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex-1 text-center">
            <h2 className="hidden sm:block text-sm sm:text-base font-semibold text-gray-900 dark:text-white">
              {formatDateRange()}
            </h2>
          </div>
          
          <div className="flex items-center gap-2">
            <button 
              onClick={() => onNavigate('next')}
              className="h-8 w-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-900 dark:text-white transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            {onGoToEnd && (
              <button 
                onClick={onGoToEnd}
                className="h-8 px-3 text-sm rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 font-medium text-gray-900 dark:text-white transition-colors"
              >
                End
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

