'use client'

import { useState, useEffect, useRef } from 'react'
import { X, Play, ExternalLink } from 'lucide-react'
import { getExerciseLibraryEntry, ExerciseLibraryEntry } from '@/lib/supabase'

interface ExerciseLibraryModalProps {
  libraryExerciseId: string | null
  isOpen: boolean
  onClose: () => void
}

export function ExerciseLibraryModal({
  libraryExerciseId,
  isOpen,
  onClose
}: ExerciseLibraryModalProps) {
  const [exercise, setExercise] = useState<ExerciseLibraryEntry | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [videoError, setVideoError] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Helper function to convert YouTube URLs to embed format
  const convertYouTubeToEmbed = (url: string): string => {
    // Handle youtube.com/watch?v= format
    if (url.includes('youtube.com/watch?v=')) {
      return url.replace('watch?v=', 'embed/')
    }
    // Handle youtu.be short links
    if (url.includes('youtu.be/')) {
      const videoId = url.match(/youtu\.be\/([^&\n?#]+)/)?.[1]
      if (videoId) {
        return `https://www.youtube.com/embed/${videoId}`
      }
    }
    // Handle youtube.com/embed/ (already in embed format)
    if (url.includes('youtube.com/embed/')) {
      return url
    }
    // Fallback: try to extract video ID from any YouTube URL
    const videoIdMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/)
    if (videoIdMatch) {
      return `https://www.youtube.com/embed/${videoIdMatch[1]}`
    }
    return url
  }

  useEffect(() => {
    if (isOpen && libraryExerciseId) {
      loadLibraryEntry()
    } else {
      // Reset state when modal closes
      setExercise(null)
      setError(null)
      setVideoError(false)
    }
  }, [isOpen, libraryExerciseId])

  const loadLibraryEntry = async () => {
    if (!libraryExerciseId) return

    try {
      setLoading(true)
      setError(null)
      
      const entry = await getExerciseLibraryEntry(libraryExerciseId)
      
      if (!entry) {
        setError('Exercise library entry not found')
        return
      }
      
      setExercise(entry)
    } catch (err) {
      console.error('Error loading exercise library entry:', err)
      setError('Failed to load exercise library entry')
    } finally {
      setLoading(false)
    }
  }

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  // Determine video source and type
  const getVideoInfo = () => {
    if (!exercise) return null

    const hasSupabaseVideo = exercise.demo_file_path && supabaseUrl
    const hasExternalVideo = exercise.external_video_url
    const isExternalYouTube = hasExternalVideo && 
      (exercise.external_video_url.includes('youtube.com') || exercise.external_video_url.includes('youtu.be'))

    // Priority: Supabase Storage > YouTube embed > External link
    if (hasSupabaseVideo) {
      return {
        type: 'supabase' as const,
        url: `${supabaseUrl}/storage/v1/object/public/exercise-videos/${exercise.demo_file_path}`,
        originalUrl: exercise.external_video_url
      }
    }

    if (isExternalYouTube) {
      return {
        type: 'youtube' as const,
        url: convertYouTubeToEmbed(exercise.external_video_url!),
        originalUrl: exercise.external_video_url!
      }
    }

    if (hasExternalVideo) {
      return {
        type: 'external' as const,
        url: exercise.external_video_url!,
        originalUrl: exercise.external_video_url!
      }
    }

    return null
  }

  const videoInfo = getVideoInfo()

  // Render video player component
  const renderVideoPlayer = () => {
    if (!videoInfo) return null

    if (videoError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 min-h-[300px] rounded-lg">
          <div className="text-center">
            <Play className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Video not available</p>
          </div>
        </div>
      )
    }

    // YouTube embed with 16:9 aspect ratio
    if (videoInfo.type === 'youtube') {
      return (
        <div className="relative w-full" style={{ paddingBottom: '56.25%' /* 16:9 aspect ratio */ }}>
          <iframe
            src={videoInfo.url}
            className="absolute top-0 left-0 w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            title={`${exercise?.name} video`}
            onError={() => setVideoError(true)}
            loading="lazy"
          />
        </div>
      )
    }

    // Supabase Storage video (HTML5 video tag)
    if (videoInfo.type === 'supabase') {
      return (
        <video
          ref={videoRef}
          src={videoInfo.url}
          controls
          className="w-full h-full object-cover min-h-[300px] rounded-lg"
          onError={() => setVideoError(true)}
        >
          Your browser does not support the video tag.
        </video>
      )
    }

    // External non-YouTube video - show placeholder with link
    return (
      <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400 min-h-[300px] rounded-lg">
        <div className="text-center">
          <Play className="w-12 h-12 mx-auto mb-2" />
          <p className="text-sm mb-2">External video</p>
          <a
            href={videoInfo.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-blue-400 hover:text-blue-300 hover:underline"
          >
            <ExternalLink className="w-4 h-4" />
            Open video
          </a>
        </div>
      </div>
    )
  }

  const difficultyColors = {
    beginner: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    intermediate: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    advanced: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black bg-opacity-50 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="relative bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl h-full max-h-[90vh] flex flex-col transition-colors duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                {exercise?.name || 'Loading...'}
              </h2>
              {exercise?.difficulty && (
                <span
                  className={`inline-block mt-1 px-2 py-0.5 rounded text-xs font-medium ${difficultyColors[exercise.difficulty]}`}
                >
                  {exercise.difficulty}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-6 h-6 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-500"></div>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          ) : exercise ? (
            <>
              {/* Description */}
              {exercise.description && (
                <div>
                  <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">
                    Description:
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {exercise.description}
                  </p>
                </div>
              )}

              {/* Video Player */}
              {videoInfo && (
                <div className="space-y-2">
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
                    Video Demonstration:
                  </span>
                  <div className="w-full rounded-lg overflow-hidden bg-black">
                    {renderVideoPlayer()}
                  </div>
                  {videoInfo.type === 'youtube' && videoInfo.originalUrl && (
                    <a
                      href={videoInfo.originalUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Watch on YouTube
                    </a>
                  )}
                  {videoInfo.type === 'external' && !videoError && (
                    <a
                      href={videoInfo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Open in new tab
                    </a>
                  )}
                </div>
              )}

              {/* Tags */}
              <div className="space-y-2">
                {exercise.injury_areas && exercise.injury_areas.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Injury Areas:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.injury_areas.map((tag, idx) => (
                        <span
                          key={`injury-${idx}`}
                          className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.body_parts && exercise.body_parts.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Body Parts:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.body_parts.map((tag, idx) => (
                        <span
                          key={`body-${idx}`}
                          className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {exercise.equipment && exercise.equipment.length > 0 && (
                  <div>
                    <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                      Equipment:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {exercise.equipment.map((eq, idx) => (
                        <span
                          key={`equip-${idx}`}
                          className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                        >
                          {eq.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* PT Notes */}
              {exercise.notes && (
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                  <span className="text-xs font-medium text-blue-900 dark:text-blue-200 block mb-1">
                    PT Notes & Form Cues:
                  </span>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    {exercise.notes}
                  </p>
                </div>
              )}
            </>
          ) : null}
        </div>
      </div>
    </div>
  )
}
