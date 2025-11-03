'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'

interface PRsChartProps {
  data: {
    exercise: string
    weight: number
    unit: string
    date: string
  }[]
}

export function PRsChart({ data }: PRsChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p>No PRs recorded yet.</p>
        <p className="text-sm mt-1">Start logging exercises with weights to see your personal records.</p>
      </div>
    )
  }

  // Limit to top 10 PRs for readability and normalize weights
  const displayData = data.slice(0, 10).map(pr => ({
    ...pr,
    normalizedWeight: pr.unit.toLowerCase() === 'kg' ? pr.weight * 2.20462 : pr.weight
  }))

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white mb-1">
            {data.exercise}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {`${data.weight} ${data.unit}`}
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
            {new Date(data.date).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric'
            })}
          </p>
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={Math.max(300, displayData.length * 30)}>
      <BarChart
        layout="vertical"
        data={displayData}
        margin={{ top: 5, right: 30, left: 100, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          type="number"
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          label={{ value: 'Weight (lb)', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
        />
        <YAxis
          type="category"
          dataKey="exercise"
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          width={90}
        />
        <Tooltip content={<CustomTooltip />} />
        <Bar
          dataKey="normalizedWeight"
          fill="#ef4444"
          radius={[0, 4, 4, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

