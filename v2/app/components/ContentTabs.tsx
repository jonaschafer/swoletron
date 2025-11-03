'use client'

import { Calendar, FileText, Dumbbell, TrendingUp } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'

interface Tab {
  id: string
  label: string
  icon: typeof Calendar
  path: string
}

const tabs: Tab[] = [
  { id: 'schedule', label: 'Schedule', icon: Calendar, path: '/calendar' },
  { id: 'plan', label: 'Plan', icon: FileText, path: '/training-plan' },
  { id: 'exercises', label: 'Exercises', icon: Dumbbell, path: '/exercises' },
  { id: 'progress', label: 'Progress', icon: TrendingUp, path: '/progress' }
]

export function ContentTabs() {
  const pathname = usePathname()
  const router = useRouter()

  // Determine active tab based on pathname
  const getActiveTab = () => {
    if (pathname === '/calendar' || pathname === '/' || pathname === '/monthly') {
      return 'schedule'
    }
    if (pathname === '/training-plan') {
      return 'plan'
    }
    if (pathname === '/exercises') {
      return 'exercises'
    }
    if (pathname === '/progress') {
      return 'progress'
    }
    return 'schedule' // default
  }

  const activeTab = getActiveTab()

  const handleTabClick = (tab: Tab) => {
    // For schedule tab, preserve current view (week/month)
    if (tab.id === 'schedule') {
      if (pathname === '/monthly') {
        // Already on monthly view, stay there
        return
      } else {
        // Go to calendar (week view)
        router.push('/calendar')
      }
    } else {
      router.push(tab.path)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 p-1 rounded-lg flex gap-1 mb-4 border border-gray-200 dark:border-gray-700">
      {tabs.map((tab) => {
        const Icon = tab.icon
        const isActive = activeTab === tab.id
        
        return (
          <button
            key={tab.id}
            onClick={() => handleTabClick(tab)}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-md text-sm font-medium transition-all ${
              isActive
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon className="w-4 h-4" />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        )
      })}
    </div>
  )
}

