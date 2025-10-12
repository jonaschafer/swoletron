'use client'

import { useState, useEffect } from 'react'
import { WorkoutCard } from '@/app/components/WorkoutCard'
import { WorkoutModal } from '@/app/components/WorkoutModal'
import { ViewToggle } from '@/app/components/ViewToggle'
import { getWorkoutsForWeek, Workout } from '@/lib/supabase'
import { getWeekDates, getWeekDays, formatDate } from '@/lib/utils/date'
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, FileText } from 'lucide-react'
import Link from 'next/link'

export default function CalendarPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2025, 9, 13))
  const [workouts, setWorkouts] = useState<Workout[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

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

  const handleCompletionChange = (workoutId: number, completed: boolean) => {
    console.log(`Workout ${workoutId} ${completed ? 'completed' : 'marked incomplete'}`)
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
    <div className="min-h-screen bg-gray-50 p-3 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 sm:mb-6">
          {/* Title */}
          <div className="flex items-center gap-2 mb-4">
            <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Training Calendar</h1>
          </div>
          
          {/* Controls Row 1: View Toggle and Plan Button */}
          <div className="flex items-center justify-between mb-3">
            <ViewToggle />
            <Link
              href="/training-plan"
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors text-sm font-medium"
            >
              <FileText className="w-4 h-4" />
              <span className="hidden sm:inline">See Full Plan</span>
              <span className="sm:hidden">Plan</span>
            </Link>
          </div>
          
          {/* Controls Row 2: First Week Button */}
          <div className="flex justify-center mb-4">
            <button
              onClick={goToCurrentWeek}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                isCurrentWeek()
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <CalendarIcon className="w-4 h-4" />
              <span>First Week</span>
            </button>
          </div>
          
          {/* Week Navigation */}
          <div className="flex items-center justify-between bg-white rounded-lg border border-gray-200 p-3">
            <button
              onClick={() => navigateWeek('prev')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <ChevronLeft className="w-4 h-4" />
              <span className="hidden sm:inline">Previous Week</span>
              <span className="sm:hidden">Prev</span>
            </button>
            
            <div className="text-center flex-1 px-2">
              <h2 className="text-sm sm:text-base font-semibold text-gray-900">
                {formatDate(currentWeek, 'MMM d')} - {formatDate(new Date(currentWeek.getTime() + 6 * 24 * 60 * 60 * 1000), 'MMM d, yyyy')}
              </h2>
            </div>
            
            <button
              onClick={() => navigateWeek('next')}
              className="flex items-center gap-1 px-3 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors text-sm font-medium"
            >
              <span className="hidden sm:inline">Next Week</span>
              <span className="sm:hidden">Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Desktop Calendar Grid */}
        <div className="hidden md:grid md:grid-cols-7 gap-4 mb-6">
          {weekDays.map((day) => (
            <div key={day.date} className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
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
