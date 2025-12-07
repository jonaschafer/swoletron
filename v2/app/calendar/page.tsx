'use client'

import { useState, useEffect, Suspense, useMemo, useCallback } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
import { MicroStrengthModal } from '@/app/components/MicroStrengthModal'
import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { DateNavigationPanel } from '@/app/components/DateNavigationPanel'
import { ContentTabs } from '@/app/components/ContentTabs'
import { getWorkoutsForWeek, Workout } from '@/lib/supabase'
import { getWeekDates, getWeekDays } from '@/lib/utils/date'
import { usePathname, useSearchParams, useRouter } from 'next/navigation'
import { format, differenceInDays } from 'date-fns'

function getCurrentWeekDate(startDate: Date): Date {
  const today = new Date();
  const diffInDays = differenceInDays(today, startDate);
  const weekNumber = Math.floor(diffInDays / 7);
  
  // Calculate the date for the current week (clamp between 0-11 for the 12-week plan)
  const clampedWeek = Math.max(0, Math.min(11, weekNumber));
  const currentWeekDate = new Date(startDate);
  currentWeekDate.setDate(startDate.getDate() + (clampedWeek * 7));
  
  return currentWeekDate;
}

function CalendarPageContent() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()
  const [currentWeek, setCurrentWeek] = useState(
    getCurrentWeekDate(new Date(2025, 9, 13))
  )
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [pendingWorkoutSelection, setPendingWorkoutSelection] = useState<{
    weekStart: string
    position: 'first' | 'last'
  } | null>(null)

  const sortedWorkouts = useMemo(() => {
    if (workouts.length === 0) {
      return []
    }

    return [...workouts].sort((a, b) => {
      if (a.date === b.date) {
        return a.id - b.id
      }
      return a.date.localeCompare(b.date)
    })
  }, [workouts])

  // Calculate weekly mileage
  const getWeeklyMileage = () => {
    const weekWorkouts = workouts.filter(w => {
      // Get the week number for the current week
      const { startDate, endDate } = getWeekDates(currentWeek)
      return w.date >= startDate && w.date <= endDate
    })
    const runWorkouts = weekWorkouts.filter(w => w.workout_type === 'run')
    const totalMiles = runWorkouts.reduce((sum, w) => sum + (w.distance_miles || 0), 0)
    return Math.round(totalMiles) // Round to nearest whole number
  }

  const weeklyMileage = getWeeklyMileage()
  const milesDisplay = `${weeklyMileage} miles`

  // Handle view change (week/month)
  const handleViewChange = (view: 'week' | 'month') => {
    if (view === 'month') {
      router.push('/monthly')
    }
    // If already on week view, stay here
  }

  useEffect(() => {
    async function fetchWorkouts() {
      try {
        setLoading(true)
        setError(null)
        const { startDate, endDate } = getWeekDates(currentWeek)
        const data = await getWorkoutsForWeek(startDate, endDate)
        setWorkouts(data)
      } catch (err) {
        console.error('Failed to fetch workouts:', err)
        setError('Failed to load workouts.')
      } finally {
        setLoading(false)
      }
    }
    fetchWorkouts()
  }, [currentWeek])

  // Handle workout query parameter
  useEffect(() => {
    const workoutIdParam = searchParams.get('workout')
    if (workoutIdParam && workouts.length > 0) {
      const workoutId = parseInt(workoutIdParam, 10)
      if (!isNaN(workoutId)) {
        // Try to find workout in current week's workouts
        const workout = workouts.find(w => w.id === workoutId)
        
        if (workout) {
          // Found in current week, open modal
          setSelectedWorkout(workout)
          setIsModalOpen(true)
        } else {
          // Not in current week, need to fetch it and navigate to its week
          // For now, we'll try to load a broader range or fetch the specific workout
          // This is a simplified approach - could be enhanced to fetch just that workout
          // and navigate to its week
          console.log(`Workout ${workoutId} not found in current week`)
        }
      }
    }
  }, [searchParams, workouts])

  useEffect(() => {
    const scrollToToday = () => {
      if (window.innerWidth >= 768) {
        return;
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const scrollContainer = document.getElementById('mobile-scroll-container');
      
      if (!scrollContainer) {
        return;
      }
      
      const todayElement = scrollContainer.querySelector(`[data-date="${today}"]`) as HTMLElement;
      
      if (!todayElement) {
        return;
      }
      
      // Scroll to center the today element
      const elementLeft = todayElement.offsetLeft;
      const containerWidth = scrollContainer.clientWidth;
      const elementWidth = todayElement.clientWidth;
      const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
    };

    // Wait for workouts to load and DOM to render
    if (!loading && workouts.length > 0) {
      const timer = setTimeout(scrollToToday, 300);
      return () => clearTimeout(timer);
    }
  }, [currentWeek, workouts, loading]);

  const navigateWeek = useCallback(
    (direction: 'prev' | 'next', options?: { pendingSelection?: 'first' | 'last' }) => {
      setCurrentWeek(prevWeek => {
        const newDate = new Date(prevWeek)
        newDate.setDate(prevWeek.getDate() + (direction === 'next' ? 7 : -7))

        if (options?.pendingSelection) {
          const { startDate: newWeekStart } = getWeekDates(newDate)
          setPendingWorkoutSelection({
            weekStart: newWeekStart,
            position: options.pendingSelection
          })
        } else {
          setPendingWorkoutSelection(null)
        }

        return newDate
      })
    },
    []
  )

  const goToStart = () => {
    setPendingWorkoutSelection(null)
    setCurrentWeek(new Date(2025, 9, 13))
  }

  const goToEnd = () => {
    // Go to week 12 (11 weeks after start)
    const startDate = new Date(2025, 9, 13)
    const endWeek = new Date(startDate)
    endWeek.setDate(startDate.getDate() + (11 * 7))
    setPendingWorkoutSelection(null)
    setCurrentWeek(endWeek)
  }

  const moveWithinWeek = useCallback(
    (direction: 1 | -1) => {
      if (!selectedWorkout || sortedWorkouts.length === 0 || pendingWorkoutSelection) {
        return
      }

      const currentIndex = sortedWorkouts.findIndex(w => w.id === selectedWorkout.id)
      const fallbackIndex = direction > 0 ? 0 : sortedWorkouts.length - 1

      if (currentIndex === -1) {
        const fallbackWorkout = sortedWorkouts[fallbackIndex]
        if (fallbackWorkout) {
          setSelectedWorkout(fallbackWorkout)
          if (!isModalOpen) {
            setIsModalOpen(true)
          }
        }
        return
      }

      const nextIndex = currentIndex + direction

      if (nextIndex >= 0 && nextIndex < sortedWorkouts.length) {
        const nextWorkout = sortedWorkouts[nextIndex]
        setSelectedWorkout(nextWorkout)
        if (!isModalOpen) {
          setIsModalOpen(true)
        }
        return
      }

      navigateWeek(direction > 0 ? 'next' : 'prev', {
        pendingSelection: direction > 0 ? 'first' : 'last'
      })
    },
    [selectedWorkout, sortedWorkouts, pendingWorkoutSelection, isModalOpen, navigateWeek]
  )

  useEffect(() => {
    if (!pendingWorkoutSelection) {
      return
    }

    const { startDate: currentWeekStart } = getWeekDates(currentWeek)

    if (currentWeekStart !== pendingWorkoutSelection.weekStart) {
      return
    }

    if (sortedWorkouts.length === 0) {
      setPendingWorkoutSelection(null)
      setSelectedWorkout(null)
      setIsModalOpen(false)
      return
    }

    const nextWorkout =
      pendingWorkoutSelection.position === 'first'
        ? sortedWorkouts[0]
        : sortedWorkouts[sortedWorkouts.length - 1]

    if (nextWorkout) {
      setSelectedWorkout(nextWorkout)
      setIsModalOpen(true)
    } else {
      setSelectedWorkout(null)
      setIsModalOpen(false)
    }

    setPendingWorkoutSelection(null)
  }, [pendingWorkoutSelection, currentWeek, sortedWorkouts])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented) {
        return
      }

      const target = event.target as HTMLElement | null
      if (target) {
        const tagName = target.tagName.toLowerCase()
        const isInteractiveElement =
          tagName === 'input' ||
          tagName === 'textarea' ||
          tagName === 'select' ||
          target.isContentEditable

        if (isInteractiveElement) {
          return
        }
      }

      if (event.key === 'ArrowRight') {
        if (selectedWorkout) {
          event.preventDefault()
          moveWithinWeek(1)
        } else if (!pendingWorkoutSelection) {
          event.preventDefault()
          navigateWeek('next')
        }
      } else if (event.key === 'ArrowLeft') {
        if (selectedWorkout) {
          event.preventDefault()
          moveWithinWeek(-1)
        } else if (!pendingWorkoutSelection) {
          event.preventDefault()
          navigateWeek('prev')
        }
      }
    }

    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedWorkout, moveWithinWeek, pendingWorkoutSelection, navigateWeek])

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
    // Refresh the workouts data to show updated completion status
    try {
      const { startDate, endDate } = getWeekDates(currentWeek)
      const data = await getWorkoutsForWeek(startDate, endDate)
      setWorkouts(data)
    } catch (err) {
      console.error('Failed to refresh workouts:', err)
    }
  }

  const weekDays = getWeekDays(currentWeek)

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

  const { startDate, endDate } = getWeekDates(currentWeek)
  const weekStartDate = new Date(startDate)
  const weekEndDate = new Date(endDate)

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <TopNavigationBar
          currentView="week"
          miles={milesDisplay}
          onViewChange={handleViewChange}
        />

        {/* Content Tabs */}
        <ContentTabs />

        {/* Date Navigation Panel */}
        <DateNavigationPanel
          startDate={weekStartDate}
          endDate={weekEndDate}
          onNavigate={navigateWeek}
          onGoToStart={goToStart}
          onGoToEnd={goToEnd}
          viewType="week"
        />

        {/* Desktop Calendar Grid */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 mb-6">
          {weekDays.map((day) => (
                <div key={day.date} className="space-y-2 border-r border-gray-200 dark:border-gray-700 pr-4 last:border-r-0 last:pr-0">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                  {day.dayName}
                </h3>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{day.dayNumber}</p>
              </div>
              <div className="space-y-2 w-full">
                {getWorkoutsForDay(day.date).map((workout) => (
                  <WorkoutCard
                    key={workout.id}
                    workout={workout}
                    onClick={() => handleWorkoutClick(workout)}
                    onCompletionChange={handleCompletionChange}
                    variant="desktop"
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory" id="mobile-scroll-container">
            {weekDays.map((day) => (
              <div key={day.date} className="flex-shrink-0 w-80 snap-center" data-date={day.date}>
                <div className="mb-3">
                  <h3 className="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
                    {day.dayName}
                  </h3>
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{day.dayNumber}</p>
                </div>
                <div className="space-y-2 w-full">
                  {getWorkoutsForDay(day.date).map((workout) => (
                    <WorkoutCard
                      key={workout.id}
                      workout={workout}
                      onClick={() => handleWorkoutClick(workout)}
                      onCompletionChange={handleCompletionChange}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Workout Detail Modal */}
      {selectedWorkout && (
        <>
          {selectedWorkout.workout_type === 'run' ? (
            <WorkoutModal
              workout={selectedWorkout}
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onCompletionChange={handleCompletionChange}
            />
          ) : (selectedWorkout.workout_type === 'micro' || selectedWorkout.workout_type === 'strength') ? (
            <MicroStrengthModal
              workout={selectedWorkout}
              isOpen={isModalOpen}
              onClose={handleModalClose}
              onCompletionChange={handleCompletionChange}
            />
          ) : null}
        </>
      )}
    </div>
  )
}

export default function CalendarPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    }>
      <CalendarPageContent />
    </Suspense>
  )
}
