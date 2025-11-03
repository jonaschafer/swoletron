'use client'

import { useState, useRef, useEffect, ReactNode } from 'react'
import { ChevronDown, Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'
import { useRouter } from 'next/navigation'

interface ViewOption {
  id: 'week' | 'month'
  label: string
  miles: string
}

interface TopNavigationBarProps {
  currentView: 'week' | 'month'
  miles: string
  onViewChange?: (view: 'week' | 'month') => void
  customDropdown?: ReactNode // For custom dropdown content (e.g., Table of Contents)
  hideMiles?: boolean // Hide the miles indicator
  hideDropdown?: boolean // Hide the week/month dropdown
}

export function TopNavigationBar({ currentView, miles, onViewChange, customDropdown, hideMiles = false, hideDropdown = false }: TopNavigationBarProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const { effectiveTheme, setTheme } = useTheme()
  const router = useRouter()

  const views: ViewOption[] = [
    { id: 'week', label: 'Week', miles },
    { id: 'month', label: 'Month', miles }
  ]

  const currentViewOption = views.find(v => v.id === currentView) || views[0]

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  const handleViewSelect = (viewId: 'week' | 'month') => {
    setIsDropdownOpen(false)
    if (onViewChange) {
      onViewChange(viewId)
    } else {
      // Default navigation behavior
      if (viewId === 'week') {
        router.push('/calendar')
      } else {
        router.push('/monthly')
      }
    }
  }

  const toggleTheme = () => {
    if (effectiveTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  return (
    <div className="flex items-center justify-between mb-6">
      <h1 className="text-xl font-bold text-gray-900 dark:text-white">Post LNF</h1>
      
      <div className="flex items-center gap-2">
        {/* Miles Indicator */}
        {!hideMiles && (
          <div className="h-8 px-3 bg-white rounded-lg flex items-center border border-gray-200 dark:border-gray-700">
            <span className="text-gray-900 text-sm font-medium">{miles}</span>
          </div>
        )}
        
        {/* View Selector Dropdown or Custom Dropdown */}
        {hideDropdown ? null : customDropdown ? (
          // Render custom dropdown content (it already has its own container and button)
          customDropdown
        ) : (
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-2 h-8 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-colors"
            >
              <span>{currentViewOption.label}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            
            {isDropdownOpen && (
              <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 min-w-[120px]">
                {views.map((v) => (
                  <button
                    key={v.id}
                    onClick={() => handleViewSelect(v.id)}
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                      currentView === v.id 
                        ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium' 
                        : 'text-gray-900 dark:text-gray-100'
                    }`}
                  >
                    {v.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Dark Mode Toggle */}
        <button 
          onClick={toggleTheme}
          className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-colors"
          aria-label={effectiveTheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {effectiveTheme === 'dark' ? (
            <Sun className="w-4 h-4" />
          ) : (
            <Moon className="w-4 h-4" />
          )}
        </button>
      </div>
    </div>
  )
}
