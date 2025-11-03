'use client'

import { useState, useEffect } from 'react'
import { getWeightProgression, getWeeklyVolume, getAllPRs, getProgressSummary, getAllLoggedExercises } from '@/lib/supabase'
import { subWeeks, format } from 'date-fns'
import { ProgressStats } from '@/app/components/ProgressStats'
import { ChartFilters } from '@/app/components/ChartFilters'
import { WeightProgressionChart } from '@/app/components/WeightProgressionChart'
import { VolumeChart } from '@/app/components/VolumeChart'
import { PRsChart } from '@/app/components/PRsChart'
import { BarChart3 } from 'lucide-react'

export default function ProgressPage() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalExerciseLogs: number
    completedWorkouts: number
    totalPRs: number
    currentWeek: number
  } | null>(null)
  const [weightProgression, setWeightProgression] = useState<{ date: string; [exerciseName: string]: number | string }[]>([])
  const [weeklyVolume, setWeeklyVolume] = useState<{ week: number; strengthVolume: number; runMiles: number }[]>([])
  const [prs, setPRs] = useState<{ exercise: string; weight: number; unit: string; date: string }[]>([])
  const [availableExercises, setAvailableExercises] = useState<string[]>([])

  // Filter state
  const [dateRange, setDateRange] = useState<'4weeks' | '8weeks' | '12weeks' | 'all'>('12weeks')
  const [selectedExercises, setSelectedExercises] = useState<string[]>([])

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        setError(null)

        // Calculate date range
        const today = new Date()
        let startDate: string | undefined
        if (dateRange !== 'all') {
          const weeks = parseInt(dateRange.replace('weeks', ''))
          const start = subWeeks(today, weeks)
          startDate = format(start, 'yyyy-MM-dd')
        }

        // Fetch all data in parallel, but handle errors individually
        const [summaryData, allExercises, volumeData, prsData] = await Promise.allSettled([
          getProgressSummary(),
          getAllLoggedExercises(),
          getWeeklyVolume(startDate),
          getAllPRs()
        ]).then(results => [
          results[0].status === 'fulfilled' ? results[0].value : { totalExerciseLogs: 0, completedWorkouts: 0, totalPRs: 0, currentWeek: 1 },
          results[1].status === 'fulfilled' ? results[1].value : [],
          results[2].status === 'fulfilled' ? results[2].value : [],
          results[3].status === 'fulfilled' ? results[3].value : []
        ])

        setStats(summaryData)
        setAvailableExercises(allExercises.map(e => e.name))
        setWeeklyVolume(volumeData)
        setPRs(prsData)

        // Fetch weight progression if exercises selected, otherwise fetch all
        const exercisesToFetch = selectedExercises.length > 0 
          ? selectedExercises 
          : allExercises.map(e => e.name)
        
        const weightData = await getWeightProgression(exercisesToFetch, startDate)
        setWeightProgression(weightData)

        // Auto-select all exercises on initial load
        if (selectedExercises.length === 0 && allExercises.length > 0) {
          setSelectedExercises(allExercises.map(e => e.name))
        }
      } catch (err) {
        console.error('Error fetching progress data:', err)
        console.error('Error details:', JSON.stringify(err, null, 2))
        const errorMessage = err instanceof Error 
          ? err.message 
          : (err && typeof err === 'object' && 'message' in err)
          ? String(err.message)
          : 'Unknown error - check console for details'
        setError(`Failed to load progress data: ${errorMessage}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [dateRange]) // Re-fetch when date range changes

  useEffect(() => {
    // Re-fetch weight progression when exercises change
    async function updateWeightProgression() {
      if (selectedExercises.length === 0) {
        setWeightProgression([])
        return
      }

      try {
        const today = new Date()
        let startDate: string | undefined
        if (dateRange !== 'all') {
          const weeks = parseInt(dateRange.replace('weeks', ''))
          const start = subWeeks(today, weeks)
          startDate = format(start, 'yyyy-MM-dd')
        }

        const weightData = await getWeightProgression(selectedExercises, startDate)
        setWeightProgression(weightData)
      } catch (err) {
        console.error('Error fetching weight progression:', err)
      }
    }

    updateWeightProgression()
  }, [selectedExercises, dateRange])

  if (loading) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center min-h-[400px]">
            <p className="text-gray-600 dark:text-gray-400">Loading progress data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-4">
          <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 dark:text-blue-500" />
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">
            Progress Dashboard
          </h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <ProgressStats
            totalExerciseLogs={stats.totalExerciseLogs}
            completedWorkouts={stats.completedWorkouts}
            totalPRs={stats.totalPRs}
            currentWeek={stats.currentWeek}
          />
        )}

        {/* Filters */}
        <ChartFilters
          dateRange={dateRange}
          selectedExercises={selectedExercises}
          availableExercises={availableExercises}
          onDateRangeChange={(range) => setDateRange(range as typeof dateRange)}
          onExercisesChange={setSelectedExercises}
        />

        {/* Weight Progression Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weight Progression
          </h2>
          <WeightProgressionChart
            data={weightProgression}
            exercises={selectedExercises}
          />
        </div>

        {/* Weekly Volume Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Weekly Volume
          </h2>
          <VolumeChart data={weeklyVolume} />
        </div>

        {/* PRs Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Personal Records
          </h2>
          <PRsChart data={prs} />
        </div>
      </div>
    </div>
  )
}

