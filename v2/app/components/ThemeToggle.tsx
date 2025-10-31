'use client'

import { Sun, Moon } from 'lucide-react'
import { useTheme } from './ThemeProvider'

export function ThemeToggle() {
  const { effectiveTheme, setTheme } = useTheme()

  const toggleTheme = () => {
    // Toggle between light and dark (skip system mode for manual toggle)
    if (effectiveTheme === 'dark') {
      setTheme('light')
    } else {
      setTheme('dark')
    }
  }

  const getIcon = () => {
    // Show icon based on what will happen when clicked (not current state)
    // If currently dark, show sun (to switch to light)
    // If currently light, show moon (to switch to dark)
    if (effectiveTheme === 'dark') {
      return <Sun className="w-4 h-4" />
    } else {
      return <Moon className="w-4 h-4" />
    }
  }

  const getLabel = () => {
    if (effectiveTheme === 'dark') {
      return 'Switch to light mode'
    } else {
      return 'Switch to dark mode'
    }
  }

  return (
    <button
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 p-2 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md hover:shadow-lg transition-all duration-200 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300"
      aria-label={getLabel()}
      title={getLabel()}
    >
      {getIcon()}
    </button>
  )
}

