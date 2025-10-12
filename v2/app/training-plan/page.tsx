'use client'

import { useState, useEffect } from 'react'
import { ArrowLeft, Calendar } from 'lucide-react'
import Link from 'next/link'

export default function TrainingPlanPage() {
  const [markdownContent, setMarkdownContent] = useState('')
  const [loading, setLoading] = useState(true)

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

  // Simple markdown to HTML conversion for basic formatting
  const formatMarkdown = (content: string) => {
    return content
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold text-gray-900 mt-8 mb-4 first:mt-0">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-semibold text-gray-800 mt-6 mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-medium text-gray-700 mt-4 mb-2">$1</h3>')
      .replace(/^\- (.*$)/gim, '<li class="ml-4 mb-1">$1</li>')
      .replace(/^\*\* (.*$)/gim, '<p class="font-semibold text-gray-700 mb-2">$1</p>')
      .replace(/^---$/gim, '<hr class="my-6 border-gray-300">')
      .replace(/\n\n/g, '</p><p class="mb-3">')
      .replace(/^(?!<[h|l|p|r])(.*$)/gim, '<p class="mb-3">$1</p>')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <Link 
                href="/calendar"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
                Back to Calendar
              </Link>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Calendar className="w-5 h-5" />
              <span className="text-sm font-medium">Training Plan</span>
            </div>
          </div>
        </div>
      </div>

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
