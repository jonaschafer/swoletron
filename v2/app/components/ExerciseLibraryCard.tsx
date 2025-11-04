'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp, Play, ExternalLink } from 'lucide-react'
import { ExerciseLibraryEntry } from '@/lib/supabase'

interface ExerciseLibraryCardProps {
  exercise: ExerciseLibraryEntry
}

export function ExerciseLibraryCard({ exercise }: ExerciseLibraryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // Construct video URL
  const getVideoUrl = () => {
    if (exercise.demo_file_path && supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/exercise-videos/${exercise.demo_file_path}`
    }
    return exercise.external_video_url || null
  }

  const videoUrl = getVideoUrl()
  const isYouTube = videoUrl?.includes('youtube.com') || videoUrl?.includes('youtu.be')
  const isExternal = !!exercise.external_video_url && !isYouTube

  // Get thumbnail URL
  const getThumbnailUrl = () => {
    if (exercise.thumbnail_path && supabaseUrl) {
      return `${supabaseUrl}/storage/v1/object/public/exercise-videos/${exercise.thumbnail_path}`
    }
    return null
  }

  const thumbnailUrl = getThumbnailUrl()

  // Truncate tags for collapsed view
  const getTruncatedTags = (tags: string[] | null, maxVisible: number = 2) => {
    if (!tags || tags.length === 0) return { visible: [], remaining: 0 }
    if (tags.length <= maxVisible) return { visible: tags, remaining: 0 }
    return { visible: tags.slice(0, maxVisible), remaining: tags.length - maxVisible }
  }

  const injuryTags = getTruncatedTags(exercise.injury_areas)
  const bodyTags = getTruncatedTags(exercise.body_parts)
  const equipmentTags = getTruncatedTags(exercise.equipment)

  const difficultyColors = {
    beginner: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    intermediate: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    advanced: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-md">
      {/* Collapsed Header */}
      <div
        className="p-4 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-start gap-3">
          {/* Thumbnail/Placeholder */}
          <div className="flex-shrink-0 w-20 h-20 rounded-lg bg-gray-100 dark:bg-gray-700 overflow-hidden">
            {thumbnailUrl && !thumbnailError ? (
              <img
                src={thumbnailUrl}
                alt={exercise.name}
                className="w-full h-full object-cover"
                onError={() => setThumbnailError(true)}
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500">
                <Play className="w-8 h-8" />
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h3 className="font-semibold text-gray-900 dark:text-white text-base">
                {exercise.name}
              </h3>
              {exercise.difficulty && (
                <span
                  className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${difficultyColors[exercise.difficulty]}`}
                >
                  {exercise.difficulty}
                </span>
              )}
            </div>

            {/* Tags - Truncated */}
            <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
              {injuryTags.visible.length > 0 && (
                <>
                  {injuryTags.visible.map((tag, idx) => (
                    <span
                      key={`injury-${idx}`}
                      className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {injuryTags.remaining > 0 && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      +{injuryTags.remaining} more
                    </span>
                  )}
                </>
              )}
              {bodyTags.visible.length > 0 && (
                <>
                  {bodyTags.visible.map((tag, idx) => (
                    <span
                      key={`body-${idx}`}
                      className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded"
                    >
                      {tag}
                    </span>
                  ))}
                  {bodyTags.remaining > 0 && !injuryTags.remaining && (
                    <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                      +{bodyTags.remaining} more
                    </span>
                  )}
                </>
              )}
            </div>

            {/* Equipment badges */}
            {exercise.equipment && exercise.equipment.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1.5">
                {exercise.equipment.slice(0, 3).map((eq, idx) => (
                  <span
                    key={`equip-${idx}`}
                    className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                  >
                    {eq.replace(/_/g, ' ')}
                  </span>
                ))}
                {exercise.equipment.length > 3 && (
                  <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                    +{exercise.equipment.length - 3}
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Expand/Collapse Icon */}
          <button
            className="flex-shrink-0 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation()
              setIsExpanded(!isExpanded)
            }}
          >
            {isExpanded ? (
              <ChevronUp className="w-5 h-5" />
            ) : (
              <ChevronDown className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-gray-200 dark:border-gray-700 px-4 py-4 space-y-4">
          {/* Description */}
          {exercise.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {exercise.description}
            </p>
          )}

          {/* All Tags */}
          <div className="space-y-2">
            {exercise.injury_areas && exercise.injury_areas.length > 0 && (
              <div>
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                  Injury Areas:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {exercise.injury_areas.map((tag, idx) => (
                    <span
                      key={`injury-full-${idx}`}
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
                      key={`body-full-${idx}`}
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
                      key={`equip-full-${idx}`}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs"
                    >
                      {eq.replace(/_/g, ' ')}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Video Player */}
          {videoUrl && (
            <div className="space-y-2">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400 block">
                Video Demonstration:
              </span>
              <div className="rounded-lg overflow-hidden bg-black">
                {videoError ? (
                  <div className="w-full aspect-video flex items-center justify-center bg-gray-800 text-gray-400">
                    <div className="text-center">
                      <Play className="w-12 h-12 mx-auto mb-2" />
                      <p className="text-sm">Video not available</p>
                    </div>
                  </div>
                ) : isYouTube ? (
                  <iframe
                    src={videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/')}
                    className="w-full aspect-video"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    title={`${exercise.name} video`}
                    onError={() => setVideoError(true)}
                  />
                ) : (
                  <video
                    src={videoUrl}
                    controls
                    className="w-full aspect-video"
                    onError={() => setVideoError(true)}
                  >
                    Your browser does not support the video tag.
                  </video>
                )}
              </div>
              {isExternal && !videoError && (
                <a
                  href={videoUrl}
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

          {/* Future: Add to Workout button */}
          <button
            className="w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors"
            disabled
            title="Feature coming soon"
          >
            Add to Workout
          </button>
        </div>
      )}
    </div>
  )
}

