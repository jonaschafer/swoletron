'use client'

import { useState } from 'react'
import { ExternalLink } from 'lucide-react'

type ProgrammeExercise = {
  name: string
  url: string
  slug: string
  id: number
}

interface ProgrammeExerciseEmbedProps {
  exercise: ProgrammeExercise
}

export function ProgrammeExerciseEmbed({ exercise }: ProgrammeExerciseEmbedProps) {
  const [iframeError, setIframeError] = useState(false)

  const programmeUrl = exercise.url

  // Programme.app exercise URLs are typically: https://programme.app/exercises/{slug}/{id}
  // We'll embed the full page in an iframe to get their complete embed component
  // with GIF/video support and all their features

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200">
      {/* Programme.app Embed */}
      <div className="w-full" style={{ minHeight: '400px' }}>
        {iframeError ? (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gray-100 dark:bg-gray-900 text-gray-400 min-h-[400px] p-4">
            <p className="text-sm mb-2">Unable to load Programme.app embed</p>
            <a
              href={programmeUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
            >
              <ExternalLink className="w-4 h-4" />
              View on Programme.app
            </a>
          </div>
        ) : (
          <iframe
            src={programmeUrl}
            className="w-full h-full border-0"
            style={{ minHeight: '400px', height: '600px' }}
            allow="fullscreen; autoplay; clipboard-write; encrypted-media; picture-in-picture"
            title={`${exercise.name} - Programme.app`}
            onError={() => setIframeError(true)}
            loading="lazy"
            sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-presentation"
          />
        )}
      </div>

      {/* Exercise Info Footer */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
        <h3 className="font-semibold text-gray-900 dark:text-white text-base mb-1">
          {exercise.name}
        </h3>
        <a
          href={programmeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline mt-2"
        >
          <ExternalLink className="w-3 h-3" />
          Open on Programme.app
        </a>
      </div>
    </div>
  )
}

