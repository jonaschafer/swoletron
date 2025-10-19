'use client'

import { useState, useEffect } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
import { ViewToggle } from '@/app/components/ViewToggle'
import { WeeklyNavigationCard } from '@/app/components/WeeklyNavigationCard'
import { getWorkoutsForWeek, Workout } from '@/lib/supabase'
import { getWeekDates, getWeekDays, formatDate } from '@/lib/utils/date'
import { Calendar as CalendarIcon, FileText, Calendar, LayoutGrid } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
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

export default function CalendarPage() {
  const pathname = usePathname()
  const [currentWeek, setCurrentWeek] = useState(
    getCurrentWeekDate(new Date(2025, 9, 13))
  )
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Determine active view
  const isWeekly = pathname === '/calendar' || pathname === '/'
  const isMonthly = pathname === '/monthly'

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

  useEffect(() => {
    const scrollToToday = () => {
      // Only run on mobile
      if (window.innerWidth >= 768) {
        console.log('Desktop detected, skipping mobile scroll');
        return;
      }
      
      const today = format(new Date(), 'yyyy-MM-dd');
      console.log('Looking for date:', today);
      
      // Debug: log all data-date attributes
      const allCards = document.querySelectorAll('[data-date]');
      console.log('All workout cards found:', allCards.length);
      allCards.forEach((card, i) => {
        console.log(`Card ${i}:`, card.getAttribute('data-date'));
      });
      
      const todayElement = document.querySelector(`[data-date="${today}"]`) as HTMLElement;
      
      console.log('Mobile scroll debug:', { 
        today, 
        elementFound: !!todayElement,
        windowWidth: window.innerWidth
      });
      
      if (!todayElement) {
        console.log('Today element NOT FOUND');
        return;
      }
      
      // Find the horizontal scroll container - need to go up the DOM tree
      // Look for the container with overflow-x-auto class
      const scrollContainer = todayElement.closest('.overflow-x-auto') as HTMLElement;
      
      console.log('Scroll container:', scrollContainer);
      console.log('Scroll container classes:', scrollContainer?.className);
      
      if (scrollContainer) {
        const elementLeft = todayElement.offsetLeft;
        const containerWidth = scrollContainer.clientWidth;
        const elementWidth = todayElement.clientWidth;
        
        const scrollPosition = elementLeft - (containerWidth / 2) + (elementWidth / 2);
        
        console.log('Scroll calculation:', {
          elementLeft,
          containerWidth,
          elementWidth,
          scrollPosition
        });
        
        scrollContainer.scrollTo({
          left: scrollPosition,
          behavior: 'smooth'
        });
      } else {
        console.log('Scroll container with overflow-x-auto NOT FOUND');
      }
    };

    const timer = setTimeout(scrollToToday, 500);
    
    return () => clearTimeout(timer);
  }, [currentWeek, workouts]);

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
  }

  const goToCurrentWeek = () => {
    setCurrentWeek(new Date(2025, 9, 13))
  }

  const isCurrentWeek = () => {
    const { startDate, endDate } = getWeekDates(currentWeek)
    const today = new Date().toISOString().split('T')[0]
    return today >= startDate && today <= endDate
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
              {/* First Week Button */}
              <button
                onClick={goToCurrentWeek}
                className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors flex-1 sm:flex-none ${
                  isCurrentWeek()
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                <CalendarIcon className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
                <span className="truncate">First Week</span>
              </button>
              
              {/* Weekly Button */}
              <Link href="/calendar" className={`flex items-center justify-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 text-xs sm:text-sm font-medium transition-colors border-l border-gray-200 flex-1 sm:flex-none ${isWeekly ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}>
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 flex-shrink-0" />
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
          
          {/* Week Navigation */}
          <WeeklyNavigationCard
            currentWeek={currentWeek}
            weeklyMileage={getWeeklyMileage()}
            onNavigateWeek={navigateWeek}
          />
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 mb-6">
          {weekDays.map((day) => (
                <div key={day.date} className="space-y-2 border-r border-gray-200 pr-4 last:border-r-0 last:pr-0">
              <div className="mb-3">
                <h3 className="text-sm font-medium text-gray-600 uppercase tracking-wide">
                  {day.dayName}
                </h3>
                <p className="text-2xl font-bold text-gray-900">{day.dayNumber}</p>
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
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3">
                  <div className="mb-3">
                    <h3 className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                      {day.dayName}
                    </h3>
                    <p className="text-xl font-bold text-gray-900">{day.dayNumber}</p>
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
