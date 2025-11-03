'use client'

import { useState, useEffect, useRef } from 'react'
import { ChevronDown } from 'lucide-react'
import { TopNavigationBar } from '@/app/components/TopNavigationBar'
import { ContentTabs } from '@/app/components/ContentTabs'
import { useRouter } from 'next/navigation'

interface TableOfContentsItem {
  id: string
  text: string
  level: number
}

export default function TrainingPlanPage() {
  const router = useRouter()
  const [markdownContent, setMarkdownContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    fetch('/training-plan.md')
      .then(response => response.text())
      .then(content => {
        setMarkdownContent(content)
        setLoading(false)
      })
      .catch(error => {
        console.error('Error loading training plan:', error)
        setLoading(false)
      })
  }, [])

  // Enhanced markdown to HTML conversion with proper formatting
  const formatMarkdown = (content: string) => {
    let html = content
      // Headers with IDs for TOC
      .replace(/^# (.*$)/gim, '<h1 id="$1" class="text-3xl font-bold text-gray-900 dark:text-white mt-8 mb-4 first:mt-0">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 id="$1" class="text-2xl font-semibold text-gray-800 dark:text-gray-200 mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 id="$1" class="text-xl font-medium text-gray-700 dark:text-gray-300 mt-4 mb-2">$1</h3>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-900 dark:text-white">$1</strong>')
      
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-1 list-disc text-gray-700 dark:text-gray-300">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 mb-1 list-disc text-gray-700 dark:text-gray-300">$2</li>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-gray-300 dark:border-gray-700">')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">')
      .replace(/^(?!<[h|l|p|r])(.*$)/gim, '<p class="mb-3 text-gray-700 dark:text-gray-300 leading-relaxed">$1</p>')
    
    return html
  }

  // Extract table of contents from markdown content
  const extractTableOfContents = (content: string) => {
    const toc: TableOfContentsItem[] = []
    const lines = content.split('\n')
    
    lines.forEach(line => {
      const h2Match = line.match(/^## (.*)$/)
      if (h2Match) {
        const text = h2Match[1]
        const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
        toc.push({
          id,
          text,
          level: 2
        })
      }
    })
    
    return toc
  }

  // Update TOC when content changes
  useEffect(() => {
    if (markdownContent) {
      const toc = extractTableOfContents(markdownContent)
      setTableOfContents(toc)
    }
  }, [markdownContent])

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

  // Scroll to section
  const scrollToSection = (text: string) => {
    const id = text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  const handleViewChange = (view: 'week' | 'month') => {
    if (view === 'week') {
      router.push('/calendar')
    } else {
      router.push('/monthly')
    }
  }

  // Create custom dropdown for Table of Contents
  const tocDropdown = (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 h-8 px-3 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-medium hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 transition-colors"
      >
        <span>Table of Contents</span>
        <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isDropdownOpen && (
        <div className="absolute top-full right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-10 min-w-[200px] max-w-[300px]">
          <div className="max-h-64 overflow-y-auto">
            {tableOfContents.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  scrollToSection(item.text)
                  setIsDropdownOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-gray-900 dark:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors border-b border-gray-100 dark:border-gray-700 last:border-b-0"
              >
                {item.text}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 dark:border-blue-500"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 px-5 py-3 sm:p-6 transition-colors duration-200">
      <div className="max-w-7xl mx-auto">
        {/* Top Navigation Bar */}
        <TopNavigationBar
          currentView="week"
          miles="0 miles"
          onViewChange={handleViewChange}
          customDropdown={tableOfContents.length > 0 ? tocDropdown : undefined}
          hideMiles={true}
        />

        {/* Content Tabs */}
        <ContentTabs />

        {/* Content */}
        <div className="mt-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6 sm:p-8 transition-colors duration-200">
            <div 
              className="max-w-4xl mx-auto text-gray-700 dark:text-gray-300"
              dangerouslySetInnerHTML={{ __html: formatMarkdown(markdownContent) }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
