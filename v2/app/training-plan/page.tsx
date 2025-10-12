'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar, List, ChevronDown } from 'lucide-react'
import Link from 'next/link'

interface TableOfContentsItem {
  id: string
  text: string
  level: number
}

export default function TrainingPlanPage() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [tableOfContents, setTableOfContents] = useState<TableOfContentsItem[]>([])
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)

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
      .replace(/^# (.*$)/gim, '<h1 id="$1" class="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 id="$1" class="text-2xl font-semibold text-gray-800 mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 id="$1" class="text-xl font-medium text-gray-700 mt-4 mb-2">$1</h3>')
      
      // Bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>')
      
      // Lists
      .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-1 list-disc">$1</li>')
      .replace(/^(\d+)\. (.*$)/gim, '<li class="ml-4 mb-1 list-disc">$2</li>')
      
      // Horizontal rules
      .replace(/^---$/gim, '<hr class="my-6 border-gray-300">')
      
      // Paragraphs
      .replace(/\n\n/g, '</p><p class="mb-3 text-gray-700 leading-relaxed">')
      .replace(/^(?!<[h|l|p|r])(.*$)/gim, '<p class="mb-3 text-gray-700 leading-relaxed">$1</p>')
    
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
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element
      if (!target.closest('.toc-dropdown')) {
        setIsDropdownOpen(false)
      }
    }

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen])

  // Scroll to section
  const scrollToSection = (id: string) => {
    const element = document.getElementById(id)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">Post LNF Block</h1>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Link 
                href="/calendar"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="text-sm font-medium">Calendar</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sticky Table of Contents */}
      {tableOfContents.length > 0 && (
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="relative py-3 toc-dropdown">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900 transition-colors"
              >
                <List className="w-4 h-4" />
                <span>Table of Contents</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-gray-200 rounded-lg shadow-lg z-20">
                  <div className="max-h-64 overflow-y-auto">
                    {tableOfContents.map((item) => (
                      <button
                        key={item.id}
                        onClick={() => {
                          scrollToSection(item.text)
                          setIsDropdownOpen(false)
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors border-b border-gray-100 last:border-b-0"
                      >
                        {item.text}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sm:p-8">
          <div 
            className="prose prose-gray max-w-none"
            dangerouslySetInnerHTML={{ __html: formatMarkdown(markdownContent) }}
          />
        </div>
      </div>
    </div>
  )
}
