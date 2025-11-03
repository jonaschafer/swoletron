'use client'

import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { ContentTabs } from '@/app/components/ContentTabs'
import { useRouter } from 'next/navigation'

export default function ExercisesPage() {
  const router = useRouter()

  const handleViewChange = (view: 'week' | 'month') => {
    if (view === 'week') {
      router.push('/calendar')
    } else {
      router.push('/monthly')
    }
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <TopNavigationBar
          currentView="week"
          miles="0 miles"
          onViewChange={handleViewChange}
          hideMiles={true}
          hideDropdown={true}
        />

        {/* Content Tabs */}
        <ContentTabs />

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 mt-4 border border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-semibold mb-2 text-gray-900 dark:text-white">Exercise Library</h2>
          <p className="text-gray-600 dark:text-gray-400">All exercises with descriptions (TBD)...</p>
        </div>
      </div>
    </div>
  )
}

