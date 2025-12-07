'use client'

import { useState, useRef, useEffect } from 'react'
import { ChevronDown, ChevronUp, Play, ExternalLink } from 'lucide-react'
import { ExerciseLibraryEntry } from '@/lib/supabase'

interface ExerciseLibraryCardProps {
  exercise: ExerciseLibraryEntry
  onInjuryAreaClick?: (area: string) => void
  onBodyPartClick?: (bodyPart: string) => void
  onEquipmentClick?: (equipment: string) => void
}

export function ExerciseLibraryCard({ 
  exercise, 
  onInjuryAreaClick,
  onBodyPartClick,
  onEquipmentClick 
}: ExerciseLibraryCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [videoError, setVideoError] = useState(false)
  const [thumbnailError, setThumbnailError] = useState(false)
  const [videoThumbnail, setVideoThumbnail] = useState<string | null>(null)
  const [autoPlayVideo, setAutoPlayVideo] = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const thumbnailVideoRef = useRef<HTMLVideoElement>(null)

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

  // Get thumbnail URL - supports both Supabase Storage, external URLs, and auto-generated YouTube thumbnails
  const getThumbnailUrl = () => {
    if (exercise.thumbnail_path) {
      // Check if it's already a full URL (external)
      if (exercise.thumbnail_path.startsWith('http://') || exercise.thumbnail_path.startsWith('https://')) {
        return exercise.thumbnail_path
      }
      // Otherwise, construct Supabase Storage URL
      if (supabaseUrl) {
        return `${supabaseUrl}/storage/v1/object/public/exercise-videos/${exercise.thumbnail_path}`
      }
    }
    
    // Fallback: Generate YouTube thumbnail if video URL is YouTube
    if (videoUrl && isYouTube) {
      const videoId = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)?.[1]
      if (videoId) {
        return `https://img.youtube.com/vi/${videoId}/mqdefault.jpg` // medium quality thumbnail
      }
    }
    
    return null
  }

  const thumbnailUrl = getThumbnailUrl()
  const finalThumbnailUrl = thumbnailUrl || videoThumbnail

  // Extract first frame from video for non-YouTube videos
  useEffect(() => {
    if (!thumbnailUrl && videoUrl && !isYouTube && videoRef.current && !videoThumbnail) {
      const video = videoRef.current
      
      const captureFrame = () => {
        try {
          const canvas = document.createElement('canvas')
          canvas.width = video.videoWidth || 640
          canvas.height = video.videoHeight || 360
          const ctx = canvas.getContext('2d')
          
          if (ctx && video.videoWidth > 0 && video.videoHeight > 0) {
            ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
            setVideoThumbnail(dataUrl)
          }
        } catch (error) {
          console.error('Error capturing video frame:', error)
        }
      }

      const handleLoadedData = () => {
        if (video.videoWidth > 0 && video.videoHeight > 0) {
          captureFrame()
        }
      }

      const handleLoadedMetadata = () => {
        // Seek to first frame (0.1 seconds in)
        video.currentTime = 0.1
      }

      video.addEventListener('loadeddata', handleLoadedData)
      video.addEventListener('loadedmetadata', handleLoadedMetadata)
      video.addEventListener('seeked', captureFrame)

      // Load the video
      video.load()

      return () => {
        video.removeEventListener('loadeddata', handleLoadedData)
        video.removeEventListener('loadedmetadata', handleLoadedMetadata)
        video.removeEventListener('seeked', captureFrame)
      }
    }
  }, [thumbnailUrl, videoUrl, isYouTube, videoThumbnail])

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

  // Handle thumbnail click - expand card and play video
  const handleThumbnailClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (videoUrl) {
      setAutoPlayVideo(true)
      setIsExpanded(true)
    }
  }

  // Auto-play video when expanded via thumbnail click
  useEffect(() => {
    if (autoPlayVideo && isExpanded && thumbnailVideoRef.current && videoUrl) {
      if (isYouTube) {
        // YouTube videos autoplay via iframe
        return
      } else {
        thumbnailVideoRef.current.play().catch(err => {
          console.error('Error playing video:', err)
        })
      }
    }
    
    // Reset autoPlayVideo when card collapses
    if (!isExpanded && autoPlayVideo) {
      setAutoPlayVideo(false)
    }
  }, [autoPlayVideo, isExpanded, videoUrl, isYouTube])

  // Render video player component
  const renderVideoPlayer = (autoPlay: boolean = false, ref?: React.RefObject<HTMLVideoElement | null>) => {
    if (!videoUrl) return null

    if (videoError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-gray-800 text-gray-400">
          <div className="text-center">
            <Play className="w-12 h-12 mx-auto mb-2" />
            <p className="text-sm">Video not available</p>
          </div>
        </div>
      )
    }

    if (isYouTube) {
      const embedUrl = videoUrl.replace('watch?v=', 'embed/').replace('youtu.be/', 'youtube.com/embed/') + (autoPlay ? '&autoplay=1' : '')
      return (
        <iframe
          src={embedUrl}
          className="w-full h-full min-h-[150px]"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title={`${exercise.name} video`}
          onError={() => setVideoError(true)}
        />
      )
    }

    return (
      <video
        ref={ref}
        src={videoUrl}
        controls
        autoPlay={autoPlay}
        className="w-full h-full object-cover min-h-[150px]"
        onError={() => setVideoError(true)}
      >
        Your browser does not support the video tag.
      </video>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden transition-all duration-200 hover:shadow-lg">
      {/* Collapsed Header */}
      <div
        className="cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {/* Thumbnail - Full Width at Top */}
        <div className="w-full h-[150px] bg-gray-100 dark:bg-gray-700 overflow-hidden relative group border-b border-gray-200 dark:border-gray-700 group-hover:border-blue-300 dark:group-hover:border-blue-600 transition-colors duration-300">
          {isExpanded && autoPlayVideo && videoUrl ? (
            // Show video player in thumbnail position when expanded via thumbnail click
            renderVideoPlayer(true, thumbnailVideoRef)
          ) : finalThumbnailUrl && !thumbnailError ? (
            <img
              src={finalThumbnailUrl}
              alt={exercise.name}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 cursor-pointer"
              onError={() => setThumbnailError(true)}
              onClick={handleThumbnailClick}
            />
          ) : (
            <div 
              className="w-full h-full flex items-center justify-center text-gray-400 dark:text-gray-500 cursor-pointer"
              onClick={handleThumbnailClick}
            >
              <Play className="w-12 h-12" />
            </div>
          )}
          {/* Hidden video element for frame extraction (non-YouTube videos only) */}
          {!thumbnailUrl && !isYouTube && videoUrl && (
            <video
              ref={videoRef}
              src={videoUrl}
              className="hidden"
              preload="metadata"
              muted
              playsInline
            />
          )}
          {/* Overlay gradient for better text readability if needed */}
          {!isExpanded && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          )}
        </div>

        {/* Content */}
        <div className="p-4">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-gray-900 dark:text-white text-base flex-1">
              {exercise.name}
            </h3>
            {exercise.difficulty && (
              <span
                className={`px-2 py-0.5 rounded text-xs font-medium flex-shrink-0 ${difficultyColors[exercise.difficulty]}`}
              >
                {exercise.difficulty}
              </span>
            )}
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

          {/* Tags - Truncated */}
          <div className="mt-2 flex flex-wrap gap-1.5 text-xs">
            {injuryTags.visible.length > 0 && (
              <>
                {injuryTags.visible.map((tag, idx) => (
                  <button
                    key={`injury-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onInjuryAreaClick?.(tag)
                    }}
                    className="px-2 py-0.5 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                    title={`Filter by ${tag}`}
                  >
                    {tag}
                  </button>
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
                  <button
                    key={`body-${idx}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onBodyPartClick?.(tag)
                    }}
                    className="px-2 py-0.5 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
                    title={`Filter by ${tag}`}
                  >
                    {tag}
                  </button>
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
                <button
                  key={`equip-${idx}`}
                  onClick={(e) => {
                    e.stopPropagation()
                    onEquipmentClick?.(eq)
                  }}
                  className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                  title={`Filter by ${eq.replace(/_/g, ' ')}`}
                >
                  {eq.replace(/_/g, ' ')}
                </button>
              ))}
              {exercise.equipment.length > 3 && (
                <span className="px-2 py-0.5 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs">
                  +{exercise.equipment.length - 3}
                </span>
              )}
            </div>
          )}
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
                    <button
                      key={`injury-full-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onInjuryAreaClick?.(tag)
                      }}
                      className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors cursor-pointer"
                      title={`Filter by ${tag}`}
                    >
                      {tag}
                    </button>
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
                    <button
                      key={`body-full-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onBodyPartClick?.(tag)
                      }}
                      className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 rounded text-xs hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors cursor-pointer"
                      title={`Filter by ${tag}`}
                    >
                      {tag}
                    </button>
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
                    <button
                      key={`equip-full-${idx}`}
                      onClick={(e) => {
                        e.stopPropagation()
                        onEquipmentClick?.(eq)
                      }}
                      className="px-2 py-1 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-300 rounded text-xs hover:bg-gray-300 dark:hover:bg-gray-500 transition-colors cursor-pointer"
                      title={`Filter by ${eq.replace(/_/g, ' ')}`}
                    >
                      {eq.replace(/_/g, ' ')}
                    </button>
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
                {renderVideoPlayer()}
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

