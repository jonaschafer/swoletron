'use client'

import { useState, useEffect, Suspense } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
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
      const allTodayElements = document.querySelectorAll(`[data-date="${today}"]`);
      
      // Find the visible one
      let visibleCard: HTMLElement | undefined;
      allTodayElements.forEach((element) => {
        const htmlElement = element as HTMLElement;
        if (htmlElement.offsetWidth > 0 && htmlElement.offsetHeight > 0) {
          visibleCard = htmlElement;
        }
      });
      
      if (!visibleCard) {
        return;
      }
      
      // Walk up the DOM tree to find horizontal scroll container
      let current: HTMLElement | null = visibleCard.parentElement;
      let level = 1;
      let scrollContainer: HTMLElement | null = null;
      
      while (current && level <= 5) {
        const classes = current.className || '';
        
        // Look for horizontal scroll indicators
        if (classes.includes('overflow-x') || 
            (classes.includes('flex') && classes.includes('gap') && !classes.includes('space-y'))) {
          scrollContainer = current;
          break;
        }
        
        current = current.parentElement;
        level++;
      }
      
      if (!scrollContainer) {
        return;
      }
      
      // Now scroll!
      const elementLeft = visibleCard.offsetLeft;
      const containerWidth = scrollContainer.clientWidth;
      const elementWidth = visibleCard.clientWidth;
      const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
      
      scrollContainer.scrollTo({
        left: scrollPosition,
        behavior: 'smooth'
      });
      
    };

    const timer = setTimeout(scrollToToday, 500);
    
    return () => clearTimeout(timer);
  }, [currentWeek, workouts]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const goToStart = () => {
    setCurrentWeek(new Date(2025, 9, 13))
  }

  const goToEnd = () => {
    // Go to week 12 (11 weeks after start)
    const startDate = new Date(2025, 9, 13)
    const endWeek = new Date(startDate)
    endWeek.setDate(startDate.getDate() + (11 * 7))
    setCurrentWeek(endWeek)
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

        {/* Date Navigation Panel */}
        <DateNavigationPanel
          startDate={weekStartDate}
          endDate={weekEndDate}
          onNavigate={navigateWeek}
          onGoToStart={goToStart}
          onGoToEnd={goToEnd}
          viewType="week"
        />

        {/* Content Tabs */}
        <ContentTabs />

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
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile Horizontal Scroll */}
        <div className="md:hidden">
          <div className="flex gap-3 overflow-x-auto pb-4 snap-x snap-mandatory">
            {weekDays.map((day) => (
              <div key={day.date} className="flex-shrink-0 w-80 snap-center">
                <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3">
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
              </div>
            ))}
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
