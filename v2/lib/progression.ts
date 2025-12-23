import { differenceInDays } from 'date-fns'
import { getLastExercisePerformance } from './supabase'
import type { ExerciseLog, WorkoutExercise } from './supabase'

export type ExerciseType = 'strength' | 'hypertrophy' | 'endurance' | 'time_based'
export type Phase = 'recovery' | 'general_prep' | 'max_strength' | 'power' | 'taper'

export interface ProgressionSuggestion {
  suggestedWeight: number | null
  suggestedReps: string[]
  reasoning: string
  progressionApplied: boolean
}

// Default progression settings (stored in localStorage)
const PROGRESSION_DEFAULTS = {
  enabled: true,
  strengthIncrement: 5,      // lbs
  hypertrophyIncrement: 2.5, // lbs
  enduranceRepIncrement: 2,  // reps
  timeIncrementPercent: 15   // %
}

// Get progression settings from localStorage
function getProgressionSettings() {
  if (typeof window === 'undefined') return PROGRESSION_DEFAULTS
  
  try {
    const stored = localStorage.getItem('progression_settings')
    if (stored) {
      return { ...PROGRESSION_DEFAULTS, ...JSON.parse(stored) }
    }
  } catch (error) {
    console.error('Error reading progression settings:', error)
  }
  
  return PROGRESSION_DEFAULTS
}

// Get phase from workout date
export function getPhaseFromDate(workoutDate: Date): Phase {
  const PLAN_START = new Date('2025-10-13')
  const daysSinceStart = differenceInDays(workoutDate, PLAN_START)
  const weekNumber = Math.floor(daysSinceStart / 7) + 1
  
  if (weekNumber <= 2) return 'recovery'
  if (weekNumber <= 6) return 'general_prep'
  if (weekNumber <= 9) return 'max_strength'
  if (weekNumber <= 11) return 'power'
  return 'taper'
}

// Infer exercise type from target reps
export function inferExerciseType(targetReps: string | number | null): ExerciseType {
  if (!targetReps) return 'hypertrophy' // default
  
  const repsStr = String(targetReps)
  
  // Check for time-based
  if (/sec|min/.test(repsStr)) {
    return 'time_based'
  }
  
  // Extract numeric value (handle "8-10" by taking first number)
  const match = repsStr.match(/^(\d+)/)
  if (!match) return 'hypertrophy' // default
  
  const numReps = parseInt(match[1])
  
  if (numReps <= 8) return 'strength'
  if (numReps <= 15) return 'hypertrophy'
  return 'endurance'
}

// Parse reps string to numeric value for comparison
function parseRepsForComparison(reps: string): number {
  // Handle time-based: "30sec" -> 30, "1min" -> 60
  if (reps.includes('min')) {
    const mins = parseInt(reps.replace(/\D/g, '')) || 0
    return mins * 60
  }
  if (reps.includes('sec') || /^\d+s$/.test(reps)) {
    return parseInt(reps.replace(/\D/g, '')) || 0
  }
  
  // Handle ranges: "8-10" -> 8
  if (reps.includes('-')) {
    return parseInt(reps.split('-')[0]) || 0
  }
  
  // Plain number
  return parseInt(reps.replace(/\D/g, '')) || 0
}

// Check if a set is considered "completed" (≥80% of target)
function isSetCompleted(loggedReps: string, targetReps: string): boolean {
  const logged = parseRepsForComparison(loggedReps)
  const target = parseRepsForComparison(targetReps)
  
  if (target === 0) return false
  
  // For time-based, require at least 80% of duration
  // For rep-based, require at least 80% of reps
  return logged >= (target * 0.8)
}

// Check if exercise is time-based
export function isTimeBasedExercise(reps: string | number | null): boolean {
  if (!reps) return false
  const repsStr = String(reps)
  return /sec|min/.test(repsStr)
}

// Apply phase modifier to increment
function applyPhaseModifier(baseIncrement: number, phase: Phase): number {
  const modifiers: Record<Phase, number> = {
    recovery: 0.5,        // 50% of normal
    general_prep: 1.0,    // 100% (standard)
    max_strength: 1.5,     // 150% (aggressive)
    power: 0.75,          // 75% (maintain/reduce)
    taper: 0.5            // 50% (reduce volume)
  }
  
  return baseIncrement * (modifiers[phase] || 1.0)
}

// Calculate time-based progression
function calculateTimeProgression(
  lastDuration: string,
  targetDuration: string,
  phase: Phase
): { suggestedDuration: string; reasoning: string } {
  const lastSeconds = parseRepsForComparison(lastDuration)
  const targetSeconds = parseRepsForComparison(targetDuration)
  
  const settings = getProgressionSettings()
  const baseIncrement = lastSeconds * (settings.timeIncrementPercent / 100)
  const adjustedIncrement = applyPhaseModifier(baseIncrement, phase)
  const suggestedSeconds = Math.round(lastSeconds + adjustedIncrement)
  
  // Format back to original format
  let suggestedDuration: string
  if (lastDuration.includes('min')) {
    const mins = Math.round(suggestedSeconds / 60)
    suggestedDuration = `${mins}min`
  } else {
    suggestedDuration = `${suggestedSeconds}sec`
  }
  
  const reasoning = `Last time: ${lastDuration} → +${Math.round(adjustedIncrement)}sec (${settings.timeIncrementPercent}% × ${phase} phase)`
  
  return { suggestedDuration, reasoning }
}

// Calculate strength progression (3-8 reps)
function calculateStrengthProgression(
  lastWeight: number,
  lastReps: string[],
  targetReps: string,
  phase: Phase,
  weightUnit: string
): { suggestedWeight: number; reasoning: string } {
  const settings = getProgressionSettings()
  const baseIncrement = settings.strengthIncrement
  const adjustedIncrement = applyPhaseModifier(baseIncrement, phase)
  const suggestedWeight = Math.round((lastWeight + adjustedIncrement) * 10) / 10
  
  const avgLastReps = lastReps.reduce((sum, r) => sum + parseRepsForComparison(r), 0) / lastReps.length
  const targetRepsNum = parseRepsForComparison(targetReps)
  
  // Check if all sets were completed at target
  const allCompleted = lastReps.every(r => isSetCompleted(r, targetReps))
  
  let reasoning: string
  if (allCompleted && avgLastReps >= targetRepsNum * 0.95) {
    reasoning = `Last time: ${lastWeight}${weightUnit} × ${lastReps.length} sets (all completed) → +${adjustedIncrement.toFixed(1)}${weightUnit} (strength increment)`
  } else if (avgLastReps >= targetRepsNum * 0.8) {
    reasoning = `Last time: ${lastWeight}${weightUnit} (within 1-2 reps) → keep same weight`
    return { suggestedWeight: lastWeight, reasoning }
  } else {
    // Reduce weight 5-10%
    const reduction = lastWeight * 0.05
    const reducedWeight = Math.round((lastWeight - reduction) * 10) / 10
    reasoning = `Last time: ${lastWeight}${weightUnit} (missed by 3+ reps) → reduce to ${reducedWeight}${weightUnit} (-5%)`
    return { suggestedWeight: reducedWeight, reasoning }
  }
  
  return { suggestedWeight, reasoning }
}

// Calculate hypertrophy progression (8-15 reps)
function calculateHypertrophyProgression(
  lastWeight: number,
  lastReps: string[],
  targetReps: string,
  phase: Phase,
  weightUnit: string
): { suggestedWeight: number; suggestedReps?: string[]; reasoning: string } {
  const settings = getProgressionSettings()
  const baseIncrement = settings.hypertrophyIncrement
  const adjustedIncrement = applyPhaseModifier(baseIncrement, phase)
  
  const avgLastReps = lastReps.reduce((sum, r) => sum + parseRepsForComparison(r), 0) / lastReps.length
  const targetRepsNum = parseRepsForComparison(targetReps)
  
  // Check if all sets were completed at target
  const allCompleted = lastReps.every(r => isSetCompleted(r, targetReps))
  
  if (allCompleted && avgLastReps >= targetRepsNum * 0.95) {
    // Increase weight
    const suggestedWeight = Math.round((lastWeight + adjustedIncrement) * 10) / 10
    const reasoning = `Last time: ${lastWeight}${weightUnit} × ${lastReps.length} sets (all completed) → +${adjustedIncrement.toFixed(1)}${weightUnit} (hypertrophy increment)`
    return { suggestedWeight, reasoning }
  } else if (avgLastReps >= targetRepsNum * 0.85) {
    // Keep same weight, aim for full reps
    const reasoning = `Last time: ${lastWeight}${weightUnit} (within 1-2 reps) → keep same weight`
    return { suggestedWeight: lastWeight, reasoning }
  } else {
    // Reduce weight 5-10%
    const reduction = lastWeight * 0.05
    const reducedWeight = Math.round((lastWeight - reduction) * 10) / 10
    const reasoning = `Last time: ${lastWeight}${weightUnit} (missed by 3+ reps) → reduce to ${reducedWeight}${weightUnit} (-5%)`
    return { suggestedWeight: reducedWeight, reasoning }
  }
}

// Calculate endurance progression (15+ reps)
function calculateEnduranceProgression(
  lastWeight: number,
  lastReps: string[],
  targetReps: string,
  phase: Phase,
  weightUnit: string
): { suggestedReps: string[]; reasoning: string } {
  const settings = getProgressionSettings()
  const baseIncrement = settings.enduranceRepIncrement
  const adjustedIncrement = Math.round(applyPhaseModifier(baseIncrement, phase))
  
  const avgLastReps = lastReps.reduce((sum, r) => sum + parseRepsForComparison(r), 0) / lastReps.length
  const targetRepsNum = parseRepsForComparison(targetReps)
  
  // Check if all sets were completed at target
  const allCompleted = lastReps.every(r => isSetCompleted(r, targetReps))
  
  if (allCompleted && avgLastReps >= targetRepsNum * 0.95) {
    // Increase reps
    const suggestedReps = lastReps.map(r => {
      const currentReps = parseRepsForComparison(r)
      return String(currentReps + adjustedIncrement)
    })
    const reasoning = `Last time: ${lastReps.length} sets (all completed) → +${adjustedIncrement} reps per set (endurance increment)`
    return { suggestedReps, reasoning }
  } else {
    // Keep same reps
    const reasoning = `Last time: ${lastReps.join(', ')} (didn't complete all sets) → keep same reps`
    return { suggestedReps: lastReps, reasoning }
  }
}

// Main progression calculation function
export async function calculateProgression(
  workoutExercise: WorkoutExercise,
  workoutDate: Date,
  exerciseId: number
): Promise<ProgressionSuggestion | null> {
  const settings = getProgressionSettings()
  if (!settings.enabled) {
    return null
  }
  
  // Get last performance for this exercise (across all workouts)
  const lastLog = await getLastExercisePerformance(exerciseId)
  
  if (!lastLog) {
    // No previous log - use planned values
    return null
  }
  
  // Need at least weight or reps to calculate progression
  if (!lastLog.weight_used && (!lastLog.reps_completed || lastLog.reps_completed.length === 0)) {
    return null
  }
  
  // Get phase from workout date
  const phase = getPhaseFromDate(workoutDate)
  
  // Get target reps and weight from workout exercise
  const targetReps = workoutExercise.reps ? String(workoutExercise.reps) : '8'
  const targetWeight = workoutExercise.weight || 0
  const weightUnit = workoutExercise.weight_unit || 'lbs'
  
  // Infer exercise type
  const exerciseType = inferExerciseType(targetReps)
  
  // Get last performance values
  const lastWeight = lastLog.weight_used || 0
  const lastReps = lastLog.reps_completed || []
  const lastWeightUnit = lastLog.weight_unit || 'lbs'
  
  // Normalize weight units (simplified - assume same unit for now)
  // TODO: Add proper unit conversion if needed
  
  // Calculate progression based on exercise type
  if (exerciseType === 'time_based') {
    if (lastReps.length === 0) return null
    const lastDuration = lastReps[0] || targetReps
    const result = calculateTimeProgression(lastDuration, targetReps, phase)
    return {
      suggestedWeight: null,
      suggestedReps: [result.suggestedDuration],
      reasoning: result.reasoning,
      progressionApplied: false
    }
  } else if (exerciseType === 'strength') {
    if (!lastWeight || lastReps.length === 0) return null
    const result = calculateStrengthProgression(lastWeight, lastReps, targetReps, phase, weightUnit)
    return {
      suggestedWeight: result.suggestedWeight,
      suggestedReps: lastReps, // Keep same rep scheme
      reasoning: result.reasoning,
      progressionApplied: false
    }
  } else if (exerciseType === 'hypertrophy') {
    if (!lastWeight || lastReps.length === 0) return null
    const result = calculateHypertrophyProgression(lastWeight, lastReps, targetReps, phase, weightUnit)
    return {
      suggestedWeight: result.suggestedWeight,
      suggestedReps: result.suggestedReps || lastReps,
      reasoning: result.reasoning,
      progressionApplied: false
    }
  } else {
    // endurance
    if (lastReps.length === 0) return null
    const result = calculateEnduranceProgression(lastWeight, lastReps, targetReps, phase, weightUnit)
    return {
      suggestedWeight: lastWeight || 0, // Keep same weight for endurance
      suggestedReps: result.suggestedReps,
      reasoning: result.reasoning,
      progressionApplied: false
    }
  }
}

