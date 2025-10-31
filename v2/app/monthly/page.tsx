'use client'

import { useState, useEffect } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
import { ViewToggle } from '@/app/components/ViewToggle'
import { getWorkoutsForMonth, Workout, getWorkoutCompletion } from '@/lib/supabase'
import { getMonthCalendarGrid, getMonthDates, getMonthNameAndYear } from '@/lib/utils/date'
import { Calendar as CalendarIcon, FileText, LayoutGrid, ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { format, addMonths, isSameDay, differenceInDays } from 'date-fns'

export default function MonthlyPage() {
  const pathname = usePathname()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Determine active view
  const isWeekly = pathname === '/calendar' || pathname === '/'
  const isMonthly = pathname === '/monthly'

  // Calculate current week number (1-12)
  const getWeekNumber = () => {
    const startDate = new Date(2025, 9, 13) // October 13, 2025
    const today = new Date()
    const diffInDays = differenceInDays(today, startDate)
    const weekNumber = Math.floor(diffInDays / 7) + 1
    return Math.max(1, Math.min(12, weekNumber)) // Clamp between 1-12
  }

  // Calculate monthly mileage
  const getMonthlyMileage = () => {
    const runWorkouts = workouts.filter(w => w.workout_type === 'run')
    const totalMiles = runWorkouts.reduce((sum, w) => sum + (w.distance_miles || 0), 0)
    return Math.round(totalMiles)
  }

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true)
        setError(null)
        const data = await getWorkoutsForMonth(currentMonth)
        setWorkouts(data)
        
        // Fetch completion status for all workouts
        const completedSet = new Set<number>()
        for (const workout of data) {
          try {
            const completion = await getWorkoutCompletion(workout.id)
            if (completion) {
              completedSet.add(workout.id)
            }
          } catch (err) {
            console.error('Error checking completion:', err)
          }
        }
        setCompletedWorkouts(completedSet)
      } catch (err) {
        console.error('Failed to fetch workouts:', err)
        setError('Failed to load workouts.')
      } finally {
        setLoading(false)
      }
    }
    fetchWorkouts()
  }, [currentMonth])

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth(addMonths(currentMonth, direction === 'next' ? 1 : -1))
  }

  const goToCurrentMonth = () => {
    setCurrentMonth(new Date())
  }

  const isCurrentMonth = () => {
    const today = new Date()
    return format(today, 'yyyy-MM') === format(currentMonth, 'yyyy-MM')
  }

  const isToday = (date: string) => {
    return isSameDay(new Date(date), new Date())
  }

  const getWorkoutsForDay = (date: string) => {
    return workouts.filter(workout => workout.date === date)
  }

  const handleWorkoutClick = (workout: Workout) => {
    setSelectedWorkout(workout)
    setIsModalOpen(true)
  }

  const handleModalClose = () => {
    setIsModalOpen(false)
    setSelectedWorkout(null)
  }

  const handleCompletionChange = async (workoutId: number, completed: boolean) => {
    console.log(`Workout ${workoutId} ${completed ? 'completed' : 'marked incomplete'}`)
    // Update completion status in state
    setCompletedWorkouts(prev => {
      const newSet = new Set(prev)
      if (completed) {
        newSet.add(workoutId)
      } else {
        newSet.delete(workoutId)
      }
      return newSet
    })
  }

  const calendarGrid = getMonthCalendarGrid(currentMonth)
  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  const getWorkoutColor = (type: string) => {
    switch (type) {
      case 'run':
        return {
          indicator: '#0089d0',
          bg: 'rgba(228,244,226,0.5)',
          border: 'rgba(0,137,208,0.2)'
        }
      case 'strength':
        return {
          indicator: '#c53637',
          bg: 'rgba(228,244,226,0.5)',
          border: 'rgba(197,54,55,0.2)'
        }
      case 'micro':
        return {
          indicator: '#00aa6f',
          bg: 'rgba(228,244,226,0.5)',
          border: 'rgba(0,170,111,0.2)'
        }
      case 'rest':
        return {
          indicator: '#989fab',
          bg: 'white',
          border: 'rgba(152,159,171,0.2)'
        }
      default:
        return {
          indicator: '#989fab',
          bg: 'white',
          border: 'rgba(152,159,171,0.2)'
        }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-red-600 dark:text-red-400 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-500" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Post LNF Block</h1>
          </div>
          
          {/* Controls Row 1: Combined Button Group */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            {/* Combined Button Group */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 w-full sm:w-auto">
              {/* Current Month Button */}
              <button
                onClick={goToCurrentMonth}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  isCurrentMonth()
                    ? 'bg-blue-600 dark:bg-blue-500 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Today</span>
              </button>
              
              {/* Weekly Button */}
              <Link href="/calendar" className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 flex-1 sm:flex-none ${isWeekly ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Week</span>
              </Link>
              
              {/* Monthly Button */}
              <Link href="/monthly" className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-l border-gray-200 dark:border-gray-700 flex-1 sm:flex-none ${isMonthly ? 'bg-blue-600 dark:bg-blue-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'}`}>
                <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Month</span>
              </Link>
            </div>
            
            {/* Week Indicator and Plan Button */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium whitespace-nowrap">
                Week {getWeekNumber()} of 12
              </span>
              <Link
                href="/training-plan"
                className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-600 dark:bg-green-500 text-white hover:bg-green-700 dark:hover:bg-green-600 transition-colors text-xs sm:text-sm font-medium"
              >
                <FileText className="w-4 h-4 flex-shrink-0" />
                <span className="truncate">Plan</span>
              </Link>
            </div>
          </div>
          
          {/* Month Navigation */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 flex flex-col gap-2 transition-colors duration-200">
            {/* Navigation Row */}
            <div className="flex items-center w-full">
              {/* Previous Button */}
              <button
                onClick={() => navigateMonth('prev')}
                className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
              
              {/* Month Title */}
              <div className="flex-1 flex items-center justify-center px-2">
                <h2 className="text-sm font-semibold text-gray-900 dark:text-white text-center">
                  {getMonthNameAndYear(currentMonth)}
                </h2>
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => navigateMonth('next')}
                className="bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>
            
            {/* Monthly Mileage Display */}
            <div className="w-full">
              <div className="bg-blue-100 dark:bg-blue-900 rounded-full px-4 py-2 w-full flex justify-center">
                <span className="text-blue-800 dark:text-blue-100 font-bold text-sm">
                  {getMonthlyMileage()} miles
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white dark:bg-gray-800 border-[0.725px] border-gray-200 dark:border-gray-700 rounded-[10px] overflow-hidden transition-colors duration-200">
          {/* Weekday Headers - Mobile Optimized */}
          <div className="grid grid-cols-7 border-b border-gray-200 dark:border-gray-700 bg-gray-100/30 dark:bg-gray-700/30">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-2 text-center border-r border-gray-200 dark:border-gray-700 last:border-r-0">
                <span className="text-xs font-normal text-gray-400 dark:text-gray-500">
                  {day}
                </span>
              </div>
            ))}
          </div>

          {/* Calendar Days - Compact for Mobile */}
          <div className="grid grid-cols-7">
            {calendarGrid.map((day, index) => {
              const dayWorkouts = getWorkoutsForDay(day.date)
              
              return (
                <div
                  key={index}
                  className={`min-h-[80px] border-r border-b border-gray-200 dark:border-gray-700 p-2 ${
                    index % 7 === 6 ? 'border-r-0' : ''
                  } ${
                    !day.isCurrentMonth ? 'bg-gray-50 dark:bg-gray-900' : ''
                  } ${
                    isToday(day.date) ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                  }`}
                >
                  <div className="flex flex-col h-full">
                    {/* Day Number */}
                    <div className={`text-sm font-normal mb-1 ${
                      !day.isCurrentMonth ? 'text-gray-400 dark:text-gray-600' : 
                      'text-neutral-950 dark:text-white'
                    }`}>
                      {day.dayNumber}
                    </div>
                    
                    {/* Workout Indicator - Compact for Mobile - Show ALL workouts */}
                    {dayWorkouts.length > 0 && (
                      <div className="space-y-1">
                        {dayWorkouts.map((workout, workoutIndex) => {
                          const isWorkoutCompleted = completedWorkouts.has(workout.id)
                          
                          return (
                            <div 
                              key={workoutIndex}
                              onClick={() => handleWorkoutClick(workout)}
                              className="cursor-pointer"
                            >
                              {isWorkoutCompleted ? (
                                <div 
                                  className="rounded px-1.5 py-0.5 flex items-center gap-1.5 min-w-0"
                                  style={{
                                    backgroundColor: getWorkoutColor(workout.workout_type).bg,
                                    border: `0.725px solid ${getWorkoutColor(workout.workout_type).border}`
                                  }}
                                >
                                  <div 
                                    className="w-0.5 rounded-full flex-shrink-0"
                                    style={{ 
                                      backgroundColor: getWorkoutColor(workout.workout_type).indicator,
                                      height: '8px'
                                    }}
                                  />
                                  <span className="text-xs text-gray-800 dark:text-gray-200 capitalize truncate min-w-0 flex-1">
                                    {workout.workout_type}
                                  </span>
                                  <svg className="w-3 h-3 flex-shrink-0 text-gray-800 dark:text-gray-200" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div 
                                  className="rounded px-1.5 py-0.5 flex items-center gap-1.5 min-w-0 bg-white dark:bg-gray-800"
                                  style={{
                                    border: `0.725px solid ${getWorkoutColor(workout.workout_type).border}`
                                  }}
                                >
                                  <div 
                                    className="w-0.5 rounded-full flex-shrink-0"
                                    style={{ 
                                      backgroundColor: getWorkoutColor(workout.workout_type).indicator,
                                      height: '8px'
                                    }}
                                  />
                                  <span className="text-xs text-gray-800 dark:text-gray-200 capitalize truncate min-w-0 flex-1">
                                    {workout.workout_type}
                                  </span>
                                </div>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      <WorkoutModal
        workout={selectedWorkout}
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onCompletionChange={handleCompletionChange}
      />
    </div>
  )
}
