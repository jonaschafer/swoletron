'use client'

import { createContext, useContext, useEffect, useState, ReactNode } from 'react'

type Theme = 'light' | 'dark' | 'system'

interface ThemeContextType {
  theme: Theme
  effectiveTheme: 'light' | 'dark'
  setTheme: (theme: Theme) => void
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const THEME_STORAGE_KEY = 'swoletron-theme'

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('system')
  const [effectiveTheme, setEffectiveTheme] = useState<'light' | 'dark'>('light')
  const [mounted, setMounted] = useState(false)

  // Initialize theme from localStorage or system preference
  useEffect(() => {
    const storedTheme = localStorage.getItem(THEME_STORAGE_KEY) as Theme | null
    const initialTheme = storedTheme || 'system'
    setThemeState(initialTheme)
    
    // Calculate initial effective theme
    const getEffectiveTheme = (t: Theme): 'light' | 'dark' => {
      if (t === 'system') {
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
      }
      return t
    }
    
    const initialEffective = getEffectiveTheme(initialTheme)
    setEffectiveTheme(initialEffective)
    
    // Apply dark class immediately to prevent flash
    if (initialEffective === 'dark') {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
    
    setMounted(true)
  }, [])

  // Update effective theme when theme or system preference changes
  useEffect(() => {
    if (!mounted) return

    const updateEffectiveTheme = () => {
      const effective = theme === 'system'
        ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
        : theme
      
      setEffectiveTheme(effective)
      
      if (effective === 'dark') {
        document.documentElement.classList.add('dark')
      } else {
        document.documentElement.classList.remove('dark')
      }
    }

    updateEffectiveTheme()

    // Listen for system preference changes if theme is 'system'
    let mediaQuery: MediaQueryList | null = null
    if (theme === 'system') {
      mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
      const handleChange = () => updateEffectiveTheme()
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery?.removeEventListener('change', handleChange)
    }
  }, [theme, mounted])

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme)
    localStorage.setItem(THEME_STORAGE_KEY, newTheme)
  }

  return (
    <ThemeContext.Provider value={{ theme, effectiveTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

