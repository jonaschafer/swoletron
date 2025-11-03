'use client'

import { Activity, CheckCircle, Trophy, Calendar } from 'lucide-react'

interface ProgressStatsProps {
  totalExerciseLogs: number
  completedWorkouts: number
  totalPRs: number
  currentWeek: number
}

export function ProgressStats({
  totalExerciseLogs,
  completedWorkouts,
  totalPRs,
  currentWeek
}: ProgressStatsProps) {
  const stats = [
    {
      label: 'Total Logs',
      value: totalExerciseLogs.toLocaleString(),
      icon: Activity,
      color: 'text-blue-600 dark:text-blue-400'
    },
    {
      label: 'Workouts Done',
      value: completedWorkouts.toLocaleString(),
      icon: CheckCircle,
      color: 'text-green-600 dark:text-green-400'
    },
    {
      label: 'Personal Records',
      value: totalPRs.toLocaleString(),
      icon: Trophy,
      color: 'text-amber-600 dark:text-amber-400'
    },
    {
      label: 'Current Week',
      value: `${currentWeek} of 12`,
      icon: Calendar,
      color: 'text-purple-600 dark:text-purple-400'
    }
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat) => {
        const Icon = stat.icon
        return (
          <div
            key={stat.label}
            className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5"
          >
            <div className="flex items-center justify-between mb-2">
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${stat.color}`} />
            </div>
            <div className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {stat.value}
            </div>
            <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              {stat.label}
            </div>
          </div>
        )
      })}
    </div>
  )
}

