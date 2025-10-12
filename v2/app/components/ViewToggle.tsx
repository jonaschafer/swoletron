'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Calendar, LayoutGrid } from 'lucide-react'

export function ViewToggle() {
  const pathname = usePathname()

  const isWeekly = pathname === '/calendar' || pathname === '/'
  const isMonthly = pathname === '/monthly'

  const activeClasses = 'bg-blue-600 text-white shadow-md'
  const inactiveClasses = 'bg-gray-200 text-gray-700 hover:bg-gray-300'

  return (
    <div className="flex rounded-lg overflow-hidden border border-gray-200">
      <Link href="/calendar" className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${isWeekly ? activeClasses : inactiveClasses}`}>
        <Calendar className="w-4 h-4" />
        <span className="hidden sm:inline">Weekly</span>
        <span className="sm:hidden">Week</span>
      </Link>
      <Link href="/monthly" className={`flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 text-sm font-medium transition-colors ${isMonthly ? activeClasses : inactiveClasses}`}>
        <LayoutGrid className="w-4 h-4" />
        <span className="hidden sm:inline">Monthly</span>
        <span className="sm:hidden">Month</span>
      </Link>
    </div>
  )
}
