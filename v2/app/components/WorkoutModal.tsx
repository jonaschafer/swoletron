'use client'

import { useState, useEffect } from 'react'
import { useDebouncedCallback } from 'use-debounce'
import { Workout, markWorkoutComplete, markWorkoutIncomplete, getWorkoutCompletion, updateWorkoutCompletionNotes, createWorkoutCompletionWithNotes } from '@/lib/supabase'
import { Calendar } from 'lucide-react'
import { format, parseISO } from 'date-fns'
import svgPaths from './figma-imports/svg-ffy23aemzk'
import svgPathsCompleted from './figma-imports/svg-hrt1ddwggo'

interface WorkoutModalProps {
  workout: Workout | null
  isOpen: boolean
  onClose: () => void
  onCompletionChange?: (workoutId: number, completed: boolean) => void
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
  const date = parseISO(dateString)
  return format(date, 'MMMM d, yyyy')
}

function formatDescription(description: string | null): string[] {
  if (!description) return []
  return description.split(/[|]/).map(line => line.trim()).filter(line => line.length > 0)
}

// Distance badge component
function Frame2({ distance, isCompleted }: { distance?: string; isCompleted?: boolean }) {
  if (!distance) return null
  
  const bgColor = isCompleted ? 'bg-[#1139b0]' : 'bg-[#172859]'
  
  return (
    <div className={`${bgColor} box-border content-stretch flex flex-col gap-[10px] h-[36px] items-start justify-center overflow-clip p-[10px] relative rounded-[6px] shrink-0`}>
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{distance}</p>
    </div>
  )
}

// Close icon component
function Frame({ isCompleted }: { isCompleted?: boolean }) {
  if (isCompleted) {
    return (
      <div className="absolute left-1/2 size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Frame">
            <path d={svgPathsCompleted.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    )
  }
  
  return (
    <div className="absolute left-1/2 size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Frame">
          <path d="M18 6L6 18" id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6 6L18 18" id="Vector2" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  )
}

function Frame3({ onClose, isCompleted }: { onClose: () => void; isCompleted?: boolean }) {
  return (
    <div 
      onClick={onClose}
      className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
    >
      <Frame isCompleted={isCompleted} />
    </div>
  )
}

function Frame5({ distance, onClose, isCompleted }: { distance?: string; onClose: () => void; isCompleted?: boolean }) {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center right-[20px] top-[20px]">
      <Frame2 distance={distance} isCompleted={isCompleted} />
      <Frame3 onClose={onClose} isCompleted={isCompleted} />
    </div>
  )
}

function Frame8({ title, distance, onClose, bgColor, isCompleted }: { title: string; distance?: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  const headerBgColor = isCompleted 
    ? (bgColor === 'bg-[#1f3a8a]' ? 'bg-blue-600' : bgColor === 'bg-green-900' ? 'bg-green-600' : 'bg-red-600')
    : bgColor
  
  return (
    <div className={`${headerBgColor} h-[76px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full`}>
      <Frame5 distance={distance} onClose={onClose} isCompleted={isCompleted} />
      <div className="absolute flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] left-[20px] text-[21px] text-white top-[38.5px] translate-y-[-50%] w-[178px]">
        <p className="leading-[1.3]">{title}</p>
      </div>
    </div>
  )
}

function Frame1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Frame">
      <Calendar className="size-full text-white opacity-50" strokeWidth={1.5} />
    </div>
  )
}

function Frame10({ date }: { date: string }) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Frame1 />
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
    </div>
  )
}

function Frame9({ date }: { date: string }) {
  return (
    <div className="bg-gray-800 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-700 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center pl-[20px] pr-0 py-[24px] relative w-full">
          <Frame10 date={date} />
        </div>
      </div>
    </div>
  )
}

function Frame11({ title, date, distance, onClose, bgColor, isCompleted }: { title: string; date: string; distance?: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 title={title} distance={distance} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
      <Frame9 date={date} />
    </div>
  )
}

function Notes({ description }: { description: string[] }) {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Description</p>
      <div className="flex flex-col font-['Geist:Regular',sans-serif] justify-center leading-[1.5] relative shrink-0 text-[#f8fafd] text-[16px] md:text-[18px] w-full">
        {description.map((line, index) => (
          <p key={index} className={index === description.length - 1 ? '' : 'mb-0'}>{line}</p>
        ))}
      </div>
    </div>
  )
}

function Container({ notes, onNotesChange, saveStatus }: { notes: string; onNotesChange: (value: string) => void; saveStatus: 'saving' | 'saved' | null }) {
  return (
    <div className="relative rounded-[6px] shrink-0 w-full" data-name="container">
      {/* Save status indicator */}
      {saveStatus && (
        <div className="absolute top-[-24px] right-0 text-[13px] font-['Geist_Mono:Regular',sans-serif]">
          {saveStatus === 'saving' ? (
            <span className="text-gray-400">saving...</span>
          ) : (
            <span className="text-green-400">✓ Saved</span>
          )}
        </div>
      )}
      
      <div className="overflow-clip rounded-[inherit] size-full">
        <textarea
          value={notes}
          onChange={(e) => onNotesChange(e.target.value)}
          placeholder="Start typing..."
          className="box-border w-full resize-none bg-transparent text-white font-['Geist:Regular',sans-serif] text-[16px] md:text-[18px] leading-[20px] pb-[118px] pl-[16px] pr-[20px] pt-[22px] outline-none placeholder:opacity-50"
          rows={1}
        />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px]" />
    </div>
  )
}

function Notes1({ notes, onNotesChange, saveStatus }: { notes: string; onNotesChange: (value: string) => void; saveStatus: 'saving' | 'saved' | null }) {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Notes</p>
      <Container notes={notes} onNotesChange={onNotesChange} saveStatus={saveStatus} />
    </div>
  )
}

function Frame6({ description, notes, onNotesChange, saveStatus }: { description: string[]; notes: string; onNotesChange: (value: string) => void; saveStatus: 'saving' | 'saved' | null }) {
  return (
    <div className="box-border content-stretch flex flex-col gap-[50px] items-start pb-[70px] pt-[16px] px-[20px] relative shrink-0 w-full">
      <Notes description={description} />
      <Notes1 notes={notes} onNotesChange={onNotesChange} saveStatus={saveStatus} />
    </div>
  )
}

function Frame4({ onMarkComplete, isCompleted, workoutType }: { onMarkComplete: () => void; isCompleted?: boolean; workoutType: string }) {
  const buttonBgColor = isCompleted 
    ? (workoutType === 'run' ? 'bg-blue-600' : workoutType === 'micro' ? 'bg-green-600' : 'bg-red-600')
    : 'bg-gray-700'
  const buttonText = isCompleted ? 'Completed' : 'Mark complete'
  const hoverClass = isCompleted ? '' : 'hover:bg-gray-600'
  
  return (
    <div 
      onClick={onMarkComplete}
      className={`${buttonBgColor} h-[50px] relative rounded-[10px] shrink-0 w-full cursor-pointer ${hoverClass} transition`}
    >
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[50px] items-center justify-center px-[20px] md:px-[27px] py-[14px] relative w-full">
          <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] md:text-[16px] text-center text-nowrap text-white whitespace-pre">{buttonText}</p>
        </div>
      </div>
    </div>
  )
}

function Frame7({ onMarkComplete, isCompleted, workoutType }: { onMarkComplete: () => void; isCompleted?: boolean; workoutType: string }) {
  return (
    <div className="bg-gray-800 box-border content-stretch flex flex-col gap-[10px] items-start pb-[20px] pt-0 px-[20px] relative shrink-0 w-full">
      <Frame4 onMarkComplete={onMarkComplete} isCompleted={isCompleted} workoutType={workoutType} />
    </div>
  )
}

export function WorkoutModal({ workout, isOpen, onClose, onCompletionChange }: WorkoutModalProps) {
  const [isCompleted, setIsCompleted] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [notes, setNotes] = useState('')
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | null>(null)

  useEffect(() => {
    if (workout && isOpen) {
      loadWorkoutData()
    }
  }, [workout, isOpen])

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

  const loadWorkoutData = async () => {
    if (!workout) return

    try {
      const completion = await getWorkoutCompletion(workout.id)
      setIsCompleted(!!completion)
      setNotes(completion?.notes || '')
    } catch (error) {
      console.error('Error loading workout completion:', error)
    }
  }

  const handleCompletionToggle = async () => {
    if (!workout || isLoading) return

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

  const debouncedSaveNotes = useDebouncedCallback(
    async (newNotes: string) => {
      if (!workout) return
      
      setSaveStatus('saving')
      
      try {
        // Check if workout has a completion record
        const completion = await getWorkoutCompletion(workout.id)
        
        if (completion) {
          // Update existing completion with new notes
          await updateWorkoutCompletionNotes(workout.id, newNotes)
        } else {
          // Create new completion record with just notes
          await createWorkoutCompletionWithNotes(workout.id, newNotes)
        }
        
        setSaveStatus('saved')
        // Reset to null after 2 seconds
        setTimeout(() => setSaveStatus(null), 2000)
      } catch (error) {
        console.error('Error saving notes:', error)
        setSaveStatus(null)
      }
    },
    1000 // Wait 1 second after user stops typing
  )

  const handleNotesChange = (newNotes: string) => {
    setNotes(newNotes)
    if (newNotes.length === 0) {
      setSaveStatus(null)
      return
    }
    setSaveStatus('saving')
    debouncedSaveNotes(newNotes)
  }

  if (!isOpen || !workout) return null

  const bgColor = workout.workout_type === 'run' 
    ? 'bg-[#1f3a8a]' 
    : workout.workout_type === 'micro' 
    ? 'bg-green-900' 
    : 'bg-red-900'

  const title = formatWorkoutTitle(workout)
  const date = formatDate(workout.date)
  const distance = workout.distance_miles ? `${workout.distance_miles} miles` : undefined
  const description = formatDescription(workout.description)

  return (
      <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto"
        onClick={onClose}
      >
        <div 
          onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-hidden relative rounded-[10px] max-w-[343px] md:max-w-[428px] w-full max-h-[90vh] my-auto" 
        data-name="types"
      >
        <Frame11 title={title} date={date} distance={distance} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
        <div className="overflow-y-auto w-full flex-1 min-h-0">
          <Frame6 description={description} notes={notes} onNotesChange={handleNotesChange} saveStatus={saveStatus} />
        </div>
        <Frame7 onMarkComplete={handleCompletionToggle} isCompleted={isCompleted} workoutType={workout.workout_type} />
      </div>
    </div>
  )
}
