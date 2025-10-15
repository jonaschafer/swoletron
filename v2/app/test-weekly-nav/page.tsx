'use client'

import { useState } from 'react'
import { WeeklyNavigationCard } from '@/app/components/WeeklyNavigationCard'

export default function TestWeeklyNavPage() {
  const [currentWeek, setCurrentWeek] = useState(new Date(2025, 9, 13)) // Oct 13, 2025
  const [weeklyMileage, setWeeklyMileage] = useState(33)

  const handleNavigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentWeek)
    newDate.setDate(newDate.getDate() + (direction === 'next' ? 7 : -7))
    setCurrentWeek(newDate)
    
    // Simulate different mileage for different weeks
    const randomMileage = Math.floor(Math.random() * 20) + 25 // 25-45 miles
    setWeeklyMileage(randomMileage)
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-md mx-auto space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Weekly Navigation Test</h1>
          <p className="text-gray-600">Testing the new WeeklyNavigationCard component</p>
        </div>

        {/* Test the component */}
        <WeeklyNavigationCard
          currentWeek={currentWeek}
          weeklyMileage={weeklyMileage}
          onNavigateWeek={handleNavigateWeek}
        />

        {/* Debug info */}
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <h3 className="font-semibold text-gray-900 mb-2">Debug Info:</h3>
          <p className="text-sm text-gray-600">
            Current Week: {currentWeek.toDateString()}
          </p>
          <p className="text-sm text-gray-600">
            Weekly Mileage: {weeklyMileage} miles
          </p>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h3 className="font-semibold text-blue-900 mb-2">Instructions:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Click the left/right arrows to navigate weeks</li>
            <li>• Notice how the mileage changes randomly for demo</li>
            <li>• The component matches the Figma design</li>
            <li>• This is mobile-optimized</li>
          </ul>
        </div>

        {/* Navigation back to main app */}
        <div className="text-center">
          <a 
            href="/calendar" 
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            ← Back to Calendar
          </a>
        </div>
      </div>
    </div>
  )
}
