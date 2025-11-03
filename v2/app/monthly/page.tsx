'use client'

import { useState, useEffect } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { DateNavigationPanel } from '@/app/components/DateNavigationPanel'
import { ContentTabs } from '@/app/components/ContentTabs'
import { getWorkoutsForMonth, Workout, getWorkoutCompletion } from '@/lib/supabase'
import { getMonthCalendarGrid, getMonthDates, getMonthNameAndYear } from '@/lib/utils/date'
import { usePathname, useRouter } from 'next/navigation'
import { format, addMonths, isSameDay, startOfMonth, endOfMonth } from 'date-fns'

export default function MonthlyPage() {
  const pathname = usePathname()
  const router = useRouter()
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [completedWorkouts, setCompletedWorkouts] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  // Calculate monthly mileage
  const getMonthlyMileage = () => {
    const runWorkouts = workouts.filter(w => w.workout_type === 'run')
    const totalMiles = runWorkouts.reduce((sum, w) => sum + (w.distance_miles || 0), 0)
    return Math.round(totalMiles)
  }

  const monthlyMileage = getMonthlyMileage()
  const milesDisplay = `${monthlyMileage} miles`

  // Handle view change (week/month)
  const handleViewChange = (view: 'week' | 'month') => {
    if (view === 'week') {
      router.push('/calendar')
    }
    // If already on month view, stay here
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

  const goToStart = () => {
    // Go to October 2025 (start of the plan)
    setCurrentMonth(new Date(2025, 9, 1))
  }

  const goToEnd = () => {
    // Go to January 2026 (end of the plan)
    setCurrentMonth(new Date(2026, 0, 1))
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

  const getWorkoutColor = (type: string, isCompleted: boolean = false) => {
    if (isCompleted) {
      // Completed: bright/solid colors (matching weekly view completed state)
      switch (type) {
        case 'run':
          return {
            indicator: '#3b82f6', // blue-500
            bg: '#3b82f6', // blue-500
            border: '#3b82f6', // blue-500
            text: 'white'
          }
        case 'strength':
          return {
            indicator: '#ef4444', // red-500
            bg: '#ef4444', // red-500
            border: '#ef4444', // red-500
            text: 'white'
          }
        case 'micro':
          return {
            indicator: '#22c55e', // green-500
            bg: '#22c55e', // green-500
            border: '#22c55e', // green-500
            text: 'white'
          }
        case 'rest':
          return {
            indicator: '#9ca3af', // gray-400
            bg: '#f3f4f6', // gray-100
            border: '#e5e7eb', // gray-200
            text: '#1f2937' // gray-800
          }
        default:
          return {
            indicator: '#9ca3af',
            bg: '#f3f4f6',
            border: '#e5e7eb',
            text: '#1f2937'
          }
      }
    } else {
      // Incomplete: light colors (matching weekly view incomplete state)
      switch (type) {
        case 'run':
          return {
            indicator: '#3b82f6', // blue-500
            bg: '#eff6ff', // blue-50
            border: '#bfdbfe', // blue-200
            text: '#1e3a8a' // blue-900
          }
        case 'strength':
          return {
            indicator: '#ef4444', // red-500
            bg: '#fef2f2', // red-50
            border: '#fecaca', // red-200
            text: '#991b1b' // red-900
          }
        case 'micro':
          return {
            indicator: '#22c55e', // green-500
            bg: '#f0fdf4', // green-50
            border: '#bbf7d0', // green-200
            text: '#166534' // green-900
          }
        case 'rest':
          return {
            indicator: '#9ca3af', // gray-400
            bg: '#f9fafb', // gray-50
            border: '#e5e7eb', // gray-200
            text: '#4b5563' // gray-600
          }
        default:
          return {
            indicator: '#9ca3af',
            bg: '#f9fafb',
            border: '#e5e7eb',
            text: '#4b5563'
          }
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

  const monthStartDate = startOfMonth(currentMonth)
  const monthEndDate = endOfMonth(currentMonth)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <TopNavigationBar
          currentView="month"
          miles={milesDisplay}
          onViewChange={handleViewChange}
        />

        {/* Date Navigation Panel */}
        <DateNavigationPanel
          startDate={monthStartDate}
          endDate={monthEndDate}
          onNavigate={navigateMonth}
          onGoToStart={goToStart}
          onGoToEnd={goToEnd}
          viewType="month"
        />

        {/* Content Tabs */}
        <ContentTabs />

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
                              {(() => {
                                const colors = getWorkoutColor(workout.workout_type, isWorkoutCompleted)
                                return (
                                  <div 
                                    className="rounded px-1.5 py-0.5 flex items-center gap-1.5 min-w-0"
                                    style={{
                                      backgroundColor: colors.bg,
                                      border: `0.725px solid ${colors.border}`,
                                      color: colors.text
                                    }}
                                  >
                                    <div 
                                      className="w-0.5 rounded-full flex-shrink-0"
                                      style={{ 
                                        backgroundColor: colors.indicator,
                                        height: '8px'
                                      }}
                                    />
                                    <span className="text-xs capitalize truncate min-w-0 flex-1" style={{ color: colors.text }}>
                                      {workout.workout_type}
                                    </span>
                                    {isWorkoutCompleted && (
                                      <svg className="w-3 h-3 flex-shrink-0" style={{ color: colors.text }} fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                      </svg>
                                    )}
                                  </div>
                                )
                              })()}
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
