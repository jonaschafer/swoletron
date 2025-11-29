'use client'

import { useState, useEffect } from 'react'
import { Workout, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion } from '@/lib/supabase'
import { format } from 'date-fns'
import svgPaths from './figma-imports/svg-da2r1zm9to'
import checkedSvgPaths from './figma-imports/svg-checked'

interface WorkoutCardProps {
  workout: Workout
  onClick?: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
  variant?: 'mobile' | 'desktop'
}

function formatWorkoutTitle(workout: Workout): string {
  // For run workouts, simplify titles to avoid cutoff
  if (workout.workout_type === 'run') {
    const titleLower = workout.title.toLowerCase()
    const descLower = workout.description?.toLowerCase() || ''
    
    // Check for interval/hill repeat patterns
    if (titleLower.includes('interval') || titleLower.includes('hill') || titleLower.includes('repeat') || 
        descLower.includes('interval') || descLower.includes('hill') || descLower.includes('repeat')) {
      return 'Intervals'
    }
    
    // Check for easy/recovery patterns
    if (titleLower.includes('easy') || titleLower.includes('recovery') || 
        descLower.includes('easy') || descLower.includes('recovery')) {
      return 'Easy'
    }
    
    // Check for tempo patterns
    if (titleLower.includes('tempo') || descLower.includes('tempo')) {
      return 'Tempo'
    }
    
    // Check for long run patterns
    if (titleLower.includes('long') || descLower.includes('long run')) {
      return 'Long'
    }
    
    // Check for track/speed patterns
    if (titleLower.includes('track') || titleLower.includes('speed') || descLower.includes('track')) {
      return 'Track'
    }
    
    // Default: use simplified title
    let title = workout.title
    title = title.replace(/\s*-\s*Week\s+\d+/i, '')
    title = title.replace(/\s*-\s*\d+mi/i, '')
    title = title.replace(/\s*\d+mi\s*/i, '')
    title = title.replace(/^(Run|Group Run|Easy Run|Long Run|Tempo Run|Interval Run)\s*/i, '')
    title = title.replace(/\s*(Recovery|Pace|Run)$/i, '')
    
    // If still too long or complex, default to first meaningful word
    if (title.length > 15 || title.split(' ').length > 2) {
      const words = title.split(' ')
      if (words.length > 0) {
        return words[0].charAt(0).toUpperCase() + words[0].slice(1)
      }
    }
    
    return title.trim() || 'Run'
  }
  
  // For micro workouts, always return "Micro"
  if (workout.workout_type === 'micro') {
    return 'Micro'
  }
  
  // For strength workouts, simplify
  if (workout.workout_type === 'strength') {
    const lower = workout.title.toLowerCase()

    // Always collapse to just "Lower Body" or "Upper Body" when present
    if (lower.includes('lower body')) {
      return 'Lower Body'
    }
    if (lower.includes('upper body')) {
      return 'Upper Body'
    }

    // Fallback for other strength variants (e.g. core), still strip noisy suffixes
    let title = workout.title
    title = title.replace(/^Strength\s*-?\s*/i, '')
    title = title.replace(/^Core Strength\s*-?\s*/i, 'Core')
    // Remove explicit "Week X" even without a dash
    title = title.replace(/\s*-?\s*Week\s+\d+/i, '')
    return title.trim()
  }
  
  return workout.title.trim()
}

function formatDate(dateString: string): string {
  const date = new Date(dateString)
  return format(date, 'EEE, MMM d')
}

// Check icon component
function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <div className="absolute inset-[-3.75%]">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
        <g id="check">
          {checked ? (
            <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          ) : (
            <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
          )}
        </g>
      </svg>
    </div>
  )
}

// Mobile Run Card
function RunMobileCard({ 
  checked, 
  title, 
  date, 
  distance, 
  onCircleClick, 
  onCardClick 
}: { 
  checked: boolean
  title: string
  date: string
  distance?: string
  onCircleClick: () => void
  onCardClick: () => void
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        {/* Title row */}
        <div className={`${checked ? '' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">{title}</p>
                </div>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  onCircleClick()
                }}
                className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
              >
                <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                  <CheckIcon checked={checked} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Date row */}
        <div className={`${checked ? '' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Distance row */}
        {distance && (
          <div className={`${checked ? '' : 'bg-[#2e50b4]'} relative shrink-0 w-full`}>
            <div className="flex flex-row items-center size-full">
              <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{distance}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Mobile Micro/Strength Card
function MicroStrengthMobileCard({ 
  checked, 
  title, 
  date, 
  onCircleClick, 
  onCardClick,
  bgColor,
  checkedBgColor
}: { 
  checked: boolean
  title: string
  date: string
  onCircleClick: () => void
  onCardClick: () => void
  bgColor: string
  checkedBgColor: string
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? checkedBgColor : bgColor} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        {/* Title row */}
        <div className={`${checked ? '' : bgColor} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">{title}</p>
                </div>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  onCircleClick()
                }}
                className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
              >
                <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                  <CheckIcon checked={checked} />
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Date row */}
        <div className={`${checked ? '' : bgColor} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Mobile Rest Card
function RestMobileCard({ date }: { date: string }) {
  return (
    <div 
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px]" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">Rest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Desktop Run Card
function RunDesktopCard({ 
  checked, 
  title, 
  date, 
  distance, 
  onCheckClick, 
  onCardClick 
}: { 
  checked: boolean
  title: string
  date: string
  distance?: string
  onCheckClick: () => void
  onCardClick: () => void
}) {
  return (
    <div 
      onClick={onCardClick}
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px] cursor-pointer" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        {/* Title row */}
        <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">{title}</p>
                </div>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  onCheckClick()
                }}
                className="absolute left-[126px] size-[15px] top-[16px] cursor-pointer" 
                data-name="check"
              >
                <CheckIcon checked={checked} />
              </div>
            </div>
          </div>
        </div>
        {/* Date row */}
        <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
        {/* Distance row */}
        {distance && (
          <div className={`${checked ? 'bg-[#1d4ed8]' : 'bg-[#172859]'} relative shrink-0 w-full`}>
            <div className="flex flex-col justify-center size-full">
              <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
                <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                  <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{distance}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// Desktop Micro/Strength Card
function MicroStrengthDesktopCard({ 
  checked, 
  title, 
  date, 
  onCheckClick, 
  onCardClick,
  bgColor,
  checkedBgColor
}: { 
  checked: boolean
  title: string
  date: string
  onCheckClick: () => void
  onCardClick: () => void
  bgColor: string
  checkedBgColor: string
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? checkedBgColor : bgColor} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        {/* Title row */}
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">{title}</p>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation()
                  onCheckClick()
                }}
                className="absolute left-[126px] size-[15px] top-[16px] cursor-pointer" 
                data-name="check"
              >
                <CheckIcon checked={checked} />
              </div>
            </div>
          </div>
        </div>
        {/* Date row */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// Desktop Rest Card
function RestDesktopCard({ date }: { date: string }) {
  return (
    <div 
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px]" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Rest</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export function WorkoutCard({ workout, onClick, onCompletionChange, variant = 'mobile' }: WorkoutCardProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    async function checkCompletion() {
      try {
        const completion = await getWorkoutCompletion(workout.id)
        setIsCompleted(!!completion)
      } catch (error) {
        console.error('Error checking workout completion:', error)
      }
    }
    checkCompletion()
  }, [workout])

  const handleCompletionToggle = async (e?: React.MouseEvent) => {
    if (e) {
    e.stopPropagation()
    }
    if (isLoading) return

    setIsLoading(true)
    try {
      if (isCompleted) {
        await markWorkoutIncomplete(workout.id)
        setIsCompleted(false)
        onCompletionChange?.(workout.id, false)
      } else {
        await markWorkoutComplete(workout.id)
        setIsCompleted(true)
        onCompletionChange?.(workout.id, true)
      }
    } catch (error) {
      console.error('Error toggling workout completion:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const title = formatWorkoutTitle(workout)
  const date = formatDate(workout.date)
  const distance = workout.distance_miles ? `${workout.distance_miles} miles` : undefined

  if (workout.workout_type === 'rest') {
    return variant === 'mobile' 
      ? <RestMobileCard date={date} />
      : <RestDesktopCard date={date} />
  }

  if (workout.workout_type === 'run') {
    return variant === 'mobile' 
      ? (
        <RunMobileCard
          checked={isCompleted}
          title={title}
          date={date}
          distance={distance}
          onCircleClick={handleCompletionToggle}
          onCardClick={onClick || (() => {})}
        />
      )
      : (
        <RunDesktopCard
          checked={isCompleted}
          title={title}
          date={date}
          distance={distance}
          onCheckClick={handleCompletionToggle}
          onCardClick={onClick || (() => {})}
        />
      )
  }

  // Micro or Strength
  const isMicro = workout.workout_type === 'micro'
  const bgColor = isMicro ? 'bg-green-900' : 'bg-red-900'
  const checkedBgColor = isMicro ? 'bg-green-600' : 'bg-red-600'

  return variant === 'mobile'
    ? (
      <MicroStrengthMobileCard
        checked={isCompleted}
        title={title}
        date={date}
        onCircleClick={handleCompletionToggle}
        onCardClick={onClick || (() => {})}
        bgColor={bgColor}
        checkedBgColor={checkedBgColor}
      />
    )
    : (
      <MicroStrengthDesktopCard
        checked={isCompleted}
        title={title}
        date={date}
        onCheckClick={handleCompletionToggle}
        onCardClick={onClick || (() => {})}
        bgColor={bgColor}
        checkedBgColor={checkedBgColor}
      />
  )
}
