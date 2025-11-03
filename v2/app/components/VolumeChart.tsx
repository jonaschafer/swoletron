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

interface VolumeChartProps {
  data: {
    week: number
    strengthVolume: number
    runMiles: number
  }[]
}

export function VolumeChart({ data }: VolumeChartProps) {
  if (data.length === 0) {
    return (
      <div className="text-center p-8 text-gray-500 dark:text-gray-400">
        <p>No volume data available.</p>
        <p className="text-sm mt-1">Start logging workouts to see volume trends.</p>
      </div>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 dark:text-white mb-2">
            Week {label}
          </p>
          {payload.map((entry: any) => (
            <p key={entry.name} className="text-sm" style={{ color: entry.color }}>
              {`${entry.name}: ${entry.value.toLocaleString()} ${entry.name === 'Strength Volume' ? 'lb' : 'mi'}`}
            </p>
          ))}
        </div>
      )
    }
    return null
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart
        data={data}
        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" className="dark:stroke-gray-700" />
        <XAxis
          dataKey="week"
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          label={{ value: 'Week', position: 'insideBottom', offset: -5, style: { textAnchor: 'middle' } }}
        />
        <YAxis
          yAxisId="left"
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          label={{ value: 'Strength Volume (lb)', angle: -90, position: 'insideLeft', style: { textAnchor: 'middle' } }}
        />
        <YAxis
          yAxisId="right"
          orientation="right"
          stroke="#6b7280"
          className="dark:stroke-gray-400"
          style={{ fontSize: '12px' }}
          label={{ value: 'Run Miles', angle: 90, position: 'insideRight', style: { textAnchor: 'middle' } }}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ paddingTop: '20px' }}
        />
        <Bar
          yAxisId="left"
          dataKey="strengthVolume"
          name="Strength Volume"
          fill="#ef4444"
          radius={[4, 4, 0, 0]}
        />
        <Bar
          yAxisId="right"
          dataKey="runMiles"
          name="Run Miles"
          fill="#3b82f6"
          radius={[4, 4, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  )
}

