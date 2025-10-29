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
import { format, addMonths, isSameDay } from 'date-fns'

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold mb-2">Error</p>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white px-5 py-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Post LNF Block</h1>
          </div>
          
          {/* Controls Row 1: Combined Button Group */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3">
            {/* Combined Button Group */}
            <div className="flex rounded-lg overflow-hidden border border-gray-200 w-full sm:w-auto">
              {/* Current Month Button */}
              <button
                onClick={goToCurrentMonth}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  isCurrentMonth()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Today</span>
              </button>
              
              {/* Weekly Button */}
              <Link href="/calendar" className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-l border-gray-200 flex-1 sm:flex-none ${isWeekly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Week</span>
              </Link>
              
              {/* Monthly Button */}
              <Link href="/monthly" className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-l border-gray-200 flex-1 sm:flex-none ${isMonthly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <LayoutGrid className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">Month</span>
              </Link>
            </div>
            
            {/* Plan Button */}
            <Link
              href="/training-plan"
              className="flex items-center justify-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-xs sm:text-sm font-medium w-full sm:w-auto"
            >
              <FileText className="w-4 h-4 flex-shrink-0" />
              <span className="truncate">Plan</span>
            </Link>
          </div>
          
          {/* Month Navigation */}
          <div className="bg-white border border-gray-200 rounded-lg p-3 flex flex-col gap-2">
            {/* Navigation Row */}
            <div className="flex items-center w-full">
              {/* Previous Button */}
              <button
                onClick={() => navigateMonth('prev')}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {/* Month Title */}
              <div className="flex-1 flex items-center justify-center px-2">
                <h2 className="text-sm font-semibold text-gray-900 text-center">
                  {getMonthNameAndYear(currentMonth)}
                </h2>
              </div>
              
              {/* Next Button */}
              <button
                onClick={() => navigateMonth('next')}
                className="bg-gray-50 hover:bg-gray-100 rounded-lg px-3 py-2 flex items-center justify-center transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
            
            {/* Monthly Mileage Display */}
            <div className="w-full">
              <div className="bg-blue-100 rounded-full px-4 py-2 w-full flex justify-center">
                <span className="text-blue-800 font-bold text-sm">
                  {getMonthlyMileage()} miles
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="bg-white border-[0.725px] border-gray-200 rounded-[10px] overflow-hidden">
          {/* Weekday Headers - Mobile Optimized */}
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-100/30">
            {weekDays.map((day) => (
              <div key={day} className="px-2 py-2 text-center border-r border-gray-200 last:border-r-0">
                <span className="text-xs font-normal text-gray-400">
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
                  className={`min-h-[80px] border-r border-b border-gray-200 p-2 ${
                    index % 7 === 6 ? 'border-r-0' : ''
                  } ${
                    !day.isCurrentMonth ? 'bg-gray-50' : ''
                  } ${
                    isToday(day.date) ? 'bg-blue-50' : ''
                  }`}
                >
                  <div className="flex flex-col h-full">
                    {/* Day Number */}
                    <div className={`text-sm font-normal mb-1 ${
                      !day.isCurrentMonth ? 'text-gray-400' : 
                      'text-neutral-950'
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
                                  <span className="text-xs text-gray-800 capitalize truncate min-w-0 flex-1">
                                    {workout.workout_type}
                                  </span>
                                  <svg className="w-3 h-3 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                  </svg>
                                </div>
                              ) : (
                                <div 
                                  className="rounded px-1.5 py-0.5 flex items-center gap-1.5 min-w-0"
                                  style={{
                                    backgroundColor: 'white',
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
                                  <span className="text-xs text-gray-800 capitalize truncate min-w-0 flex-1">
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
