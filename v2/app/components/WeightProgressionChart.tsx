'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { format, parseISO } from 'date-fns'

interface WeightProgressionChartProps {
  data: {
    date: string
    [exerciseName: string]: number | string
  }[]
  exercises: string[]
}

const CHART_COLORS = [
  '#ef4444', // red (strength)
  '#3b82f6', // blue (run)
  '#10b981', // green (micro)
  '#f59e0b', // amber
  '#8b5cf6'  // purple
]

export function WeightProgressionChart({ data, exercises }: WeightProgressionChartProps) {
  if (data.length === 0 || exercises.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p>No weight data for selected exercises.</p>
        <p className="text-sm mt-1">Try selecting different exercises or adjusting the date range.</p>
      </div>
    )
  }

  // Format date for display
  const formatDate = (dateStr: string) => {
    try {
      return format(parseISO(dateStr), 'MMM d')
    } catch {
      return dateStr
    }
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            {format(parseISO(label), 'MMM d, yyyy')}
          </p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value} lb`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart
        data={data}
        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          dataKey="date"
          tickFormatter={formatDate}
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
        />
        <YAxis
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          label={{ value: 'Weight (lb)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
          iconType="line"
        />
        {exercises.map((exercise, index) => {
          // Check if this exercise has any data
          const hasData = data.some(d => d[exercise] !== undefined && typeof d[exercise] === 'number')
          if (!hasData) return null

          return (
            <Line
              key={exercise}
              type="monotone"
              dataKey={exercise}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
            />
          )
        })}
      </LineChart>
    </ResponsiveContainer>
  )
}

