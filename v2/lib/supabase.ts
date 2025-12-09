import { createClient } from '@supabase/supabase-js'
import { differenceInDays } from 'date-fns'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables!')
  console.error('URL:', supabaseUrl)
  console.error('Key exists:', !!supabaseKey)
  throw new Error('Missing required Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: false
  }
})

export interface Workout {
  id: number
  date: string
  week_number: number
  workout_type: 'run' | 'strength' | 'micro' | 'rest'
  title: string
  description: string | null
  duration_minutes: number | null
  distance_miles: number | null
  elevation_gain_feet: number | null
  intensity: string | null
  notes: string | null
  phase: string | null
}

export interface WorkoutCompletion {
  id: number
  workout_id: number
  completed_at: string
  notes: string | null
}

export interface Exercise {
  id: number
  name: string
  category: string
  description: string | null
  video_url: string | null
  library_exercise_id: string | null
}

export interface ExerciseLibraryEntry {
  id: string
  name: string
  description: string | null
  injury_areas: string[] | null
  body_parts: string[] | null
  equipment: string[] | null
  demo_file_path: string | null
  external_video_url: string | null
  thumbnail_path: string | null
  difficulty: 'beginner' | 'intermediate' | 'advanced' | null
  notes: string | null
  created_at: string
}

export interface WorkoutExercise {
  id: number
  workout_id: number
  exercise_id: number
  sets: number | null
  reps: number | null
  weight: number | null
  weight_unit: string | null
  order_index: number
  exercises?: Exercise
}

export interface ExerciseLog {
  id: string
  exercise_id: string | null
  workout_id: string | null
  sets_completed: number | null
  reps_completed: string[]; 
  weight_used: number | null
  weight_unit: string | null
  notes: string | null
  logged_at: string
}

/**
 * Parse text-based reps array to calculate average numeric reps
 * Handles: "10", "8", "30sec", "AMRAP", "10 reps", "10-12"
 * Returns 0 if no numeric reps found
 */
function calculateAvgReps(reps: string[]): number {
  const numericReps = reps
    .map(r => {
      // Extract first number if it's "10 reps" or "10-12"
      const match = r.match(/^(\d+)/);
      return match ? parseInt(match[1]) : NaN;
    })
    .filter(r => !isNaN(r));
  return numericReps.length > 0 
    ? numericReps.reduce((a, b) => a + b, 0) / numericReps.length 
    : 0;
}

/**
 * Normalize all weights to pounds for comparison
 * Converts kg to lb, leaves lb unchanged
 */
function normalizeWeight(weight: number, unit: string | null): number {
  if (!unit || !weight) return weight;
  return unit.toLowerCase() === 'kg' ? weight * 2.20462 : weight;
}

export async function getWorkoutsForWeek(startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) {
    console.error('Error fetching workouts:', error)
    return []
  }

  return data as Workout[]
}

export async function getWorkoutsForDate(date: string) {
  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .eq('date', date)
    .order('date')

  if (error) {
    console.error('Error fetching workouts for date:', error)
    return []
  }

  return data as Workout[]
}

export async function getTotalWorkoutCount() {
  const { count, error } = await supabase
    .from('workouts')
    .select('*', { count: 'exact', head: true })

  if (error) {
    console.error('Error fetching workout count:', error)
    return 0
  }

  return count || 0
}

export async function markWorkoutComplete(
  workoutId: number,
  notes?: string
) {
  const { data, error } = await supabase
    .from('workout_completions')
    .upsert(
      {
        workout_id: workoutId,
        notes: notes || null,
        completed_at: new Date().toISOString()
      },
      { onConflict: 'workout_id' }
    )
    .select()
    .single()

  if (error) {
    console.error('Error marking workout complete:', error)
    throw error
  }

  return data as WorkoutCompletion
}

export async function markWorkoutIncomplete(workoutId: number) {
  const { error } = await supabase
    .from('workout_completions')
    .delete()
    .eq('workout_id', workoutId)

  if (error) {
    console.error('Error marking workout incomplete:', error)
    throw error
  }
}

export async function getWorkoutCompletion(workoutId: number) {
  const { data, error } = await supabase
    .from('workout_completions')
    .select('*')
    .eq('workout_id', workoutId)
    .maybeSingle()

  if (error) {
    console.error('Error fetching workout completion:', error)
    return null
  }

  return data as WorkoutCompletion | null
}

export async function getWorkoutCompletionsForWeek(
  startDate: string,
  endDate: string
) {
  const { data, error } = await supabase
    .from('workout_completions')
    .select(`
      *,
      workouts(*)
    `)
    .gte('workouts.date', startDate)
    .lte('workouts.date', endDate)

  if (error) {
    console.error('Error fetching workout completions:', error)
    return []
  }

  return data as (WorkoutCompletion & { workouts: Workout })[]
}

export async function getWorkoutExercises(workoutId: number) {
  const { data, error } = await supabase
    .from('workout_exercises')
    .select(`
      *,
      exercises(library_exercise_id, *)
    `)
    .eq('workout_id', workoutId)
    .order('order_index')

  if (error) {
    console.error('Error fetching workout exercises:', error)
    return []
  }

  return data as WorkoutExercise[]
}

export async function getWorkoutsForMonth(monthDate: Date) {
  const year = monthDate.getFullYear()
  const month = monthDate.getMonth()
  
  const startDate = new Date(year, month, 1).toISOString().split('T')[0]
  const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0]

  const { data, error } = await supabase
    .from('workouts')
    .select('*')
    .gte('date', startDate)
    .lte('date', endDate)
    .order('date')

  if (error) {
    console.error('Error fetching monthly workouts:', error)
    return []
  }

  return data as Workout[]
}

export async function logExercise(
  workoutExerciseId: number,
  setsCompleted: number,
  repsCompleted?: string[],
  weightUsed?: number,
  weightUnit?: string,
  notes?: string
) {
  console.log('=== logExercise() DEBUG START ===')
  console.log('Input parameters:', {
    workoutExerciseId,
    setsCompleted,
    repsCompleted,
    weightUsed,
    weightUnit,
    notes
  })

  // First, get the exercise_id from workout_exercises table
  const { data: workoutExercise, error: exerciseError } = await supabase
    .from('workout_exercises')
    .select('exercise_id, workout_id')
    .eq('id', workoutExerciseId)
    .single()

  console.log('Workout exercise lookup result:', { workoutExercise, exerciseError })

  if (exerciseError || !workoutExercise) {
    console.error('Error finding workout exercise:', exerciseError)
    throw new Error('Workout exercise not found')
  }

  // Convert reps to array format if it's a single number
  let repsArray = null
  if (repsCompleted !== undefined) {
    if (Array.isArray(repsCompleted)) {
      repsArray = repsCompleted
    } else {
      // If it's a single number, create an array with that number repeated for each set
      repsArray = Array(setsCompleted).fill(repsCompleted)
    }
  }

  const insertData = {
    exercise_id: workoutExercise.exercise_id,
    workout_id: workoutExercise.workout_id,
    sets_completed: setsCompleted,
    reps_completed: repsArray,
    weight_used: weightUsed || null,
    weight_unit: weightUnit || 'lbs',
    notes: notes || null
  }

  console.log('Data being inserted into exercise_logs:', insertData)

  const { data, error } = await supabase
    .from('exercise_logs')
    .insert(insertData)
    .select()
    .single()

  console.log('Supabase response:', { data, error })

  if (error) {
    console.error('Error logging exercise:', error)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    throw error
  }

  console.log('=== logExercise() DEBUG END ===')
  return data as ExerciseLog
}

export async function getExerciseLogs(workoutExerciseId: number) {
  // First get the exercise_id and workout_id from workout_exercises
  const { data: workoutExercise, error: exerciseError } = await supabase
    .from('workout_exercises')
    .select('exercise_id, workout_id')
    .eq('id', workoutExerciseId)
    .single()

  if (exerciseError || !workoutExercise) {
    console.error('Error finding workout exercise:', exerciseError)
    throw new Error('Workout exercise not found')
  }

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('exercise_id', workoutExercise.exercise_id)
    .eq('workout_id', workoutExercise.workout_id)
    .order('logged_at', { ascending: false })

  if (error) {
    console.error('Error fetching exercise logs:', error)
    throw error
  }

  return data as ExerciseLog[]
}

export async function getLatestExerciseLog(workoutExerciseId: number) {
  // First get the exercise_id and workout_id from workout_exercises
  const { data: workoutExercise, error: exerciseError } = await supabase
    .from('workout_exercises')
    .select('exercise_id, workout_id')
    .eq('id', workoutExerciseId)
    .single()

  if (exerciseError || !workoutExercise) {
    console.error('Error finding workout exercise:', exerciseError)
    return null
  }

  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('exercise_id', workoutExercise.exercise_id)
    .eq('workout_id', workoutExercise.workout_id)
    .order('logged_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (error) {
    console.error('Error fetching latest exercise log:', error)
    return null
  }

  return data as ExerciseLog | null
}

export async function updateExerciseLog(
  logId: string,
  setsCompleted?: number,
  repsCompleted?: string[],
  weightUsed?: number,
  weightUnit?: string,
  notes?: string
) {
  const updateData: any = {}

  if (setsCompleted !== undefined) updateData.sets_completed = setsCompleted
  if (repsCompleted !== undefined) {
    if (Array.isArray(repsCompleted)) {
      updateData.reps_completed = repsCompleted
    } else if (setsCompleted !== undefined) {
      // If it's a single number, create an array with that number repeated for each set
      updateData.reps_completed = Array(setsCompleted).fill(repsCompleted)
    } else {
      updateData.reps_completed = [repsCompleted]
    }
  }
  if (weightUsed !== undefined) updateData.weight_used = weightUsed
  if (weightUnit !== undefined) updateData.weight_unit = weightUnit
  if (notes !== undefined) updateData.notes = notes

  const { data, error } = await supabase
    .from('exercise_logs')
    .update(updateData)
    .eq('id', logId)
    .select()
    .single()

  if (error) {
    console.error('Error updating exercise log:', error)
    throw error
  }

  return data as ExerciseLog
}

export async function deleteExerciseLog(logId: string) {
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    console.error('Error deleting exercise log:', error)
    throw error
  }
}

export async function updateWorkoutCompletionNotes(workoutId: number, notes: string) {
  const { error } = await supabase
    .from('workout_completions')
    .update({ notes })
    .eq('workout_id', workoutId)

  if (error) {
    console.error('Error updating workout completion notes:', error)
    throw error
  }
}

export async function createWorkoutCompletionWithNotes(workoutId: number, notes: string) {
  const { error } = await supabase
    .from('workout_completions')
    .upsert(
      {
        workout_id: workoutId,
        notes,
        completed_at: new Date().toISOString()
      },
      { onConflict: 'workout_id' }
    )

  if (error) {
    console.error('Error creating workout completion with notes:', error)
    throw error
  }
}

/**
 * Extended ExerciseLog type with joined workout and exercise data
 */
export interface ExerciseLogWithRelations extends ExerciseLog {
  workout: {
    date: string
    week_number: number
    title: string | null
  } | null
  exercise: {
    name: string
  } | null
}

/**
 * Get all logs for a specific exercise by exercise_id (number from Exercise table)
 * Returns logs with workout details (date, week_number) joined
 * 
 * IMPORTANT: exercise_id in logs is stored as string, so we need to convert
 */
export async function getExerciseHistory(exerciseId: number): Promise<ExerciseLogWithRelations[]> {
  // Convert number to string for querying exercise_logs table
  const exerciseIdStr = String(exerciseId)
  
  const { data, error } = await supabase
    .from('exercise_logs')
    .select(`
      *,
      workout:workouts(date, week_number, title),
      exercise:exercises(name)
    `)
    .eq('exercise_id', exerciseIdStr)
    .order('logged_at', { ascending: false })
  
  if (error) {
    console.error('Error fetching exercise history:', error)
    throw error
  }
  
  return (data || []) as ExerciseLogWithRelations[]
}

/**
 * Get PR (max weight) for an exercise
 */
export async function getExercisePR(exerciseId: number): Promise<number | null> {
  const exerciseIdStr = String(exerciseId)
  
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('weight_used')
    .eq('exercise_id', exerciseIdStr)
    .not('weight_used', 'is', null)
    .order('weight_used', { ascending: false })
    .limit(1)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching exercise PR:', error)
    throw error
  }
  
  return data?.weight_used || null
}

/**
 * Get all exercises that have been logged at least once
 * For future "Exercise Library" page
 * 
 * Uses a join to get exercise data directly, similar to getAllPRs
 */
export async function getAllLoggedExercises(): Promise<Exercise[]> {
  // Query exercise_logs with join to exercises to get exercise data directly
  // Only select name to avoid UUID parsing issues (same approach as getAllPRs)
  const { data: logData, error: logError } = await supabase
    .from('exercise_logs')
    .select('exercise_id, exercise:exercises(name)')
    .not('exercise_id', 'is', null)
  
  if (logError) {
    console.error('Error fetching logged exercises:', logError)
    // If join fails, fall back to getting unique exercise_ids and querying separately
    // This handles cases where exercise_id type doesn't match exercises.id
    const { data: idData, error: idError } = await supabase
      .from('exercise_logs')
      .select('exercise_id')
      .not('exercise_id', 'is', null)
    
    if (idError) {
      console.error('Error fetching exercise IDs:', idError)
      return []
    }
    
    // Get unique exercise IDs and try to query exercises table
    const uniqueIds = [...new Set((idData || []).map(l => l.exercise_id).filter((id): id is string => id !== null))]
    if (uniqueIds.length === 0) return []
    
    // Try to parse as numbers first (if exercises.id is numeric)
    const numericIds = uniqueIds
      .map(id => {
        const num = parseInt(id, 10)
        return isNaN(num) ? null : num
      })
      .filter((id): id is number => id !== null)
    
    if (numericIds.length === 0) return []
    
    const { data: exercises, error: exError } = await supabase
      .from('exercises')
      .select('*')
      .in('id', numericIds)
      .order('name')
    
    if (exError) {
      console.error('Error fetching exercises:', exError)
      return []
    }
    
    return (exercises || []) as Exercise[]
  }
  
  if (!logData || logData.length === 0) return []
  
  // Extract unique exercises from the joined data by name
  const exerciseNameSet = new Set<string>()
  const exercises: Exercise[] = []
  
  for (const log of logData) {
    const exercise = log.exercise as any
    if (exercise && exercise.name && !exerciseNameSet.has(exercise.name)) {
      exerciseNameSet.add(exercise.name)
      // Since we don't have full exercise data, create minimal Exercise objects
      // The filter only needs names anyway
      exercises.push({
        id: 0, // Placeholder - not used for filtering
        name: exercise.name,
        category: '',
        description: null,
        video_url: null,
        library_exercise_id: null
      })
    }
  }
  
  // Sort by name
  return exercises.sort((a, b) => a.name.localeCompare(b.name))
}

/**
 * Get weight progression data for selected exercises over time
 * Returns data grouped by date with exercise names as keys
 */
export async function getWeightProgression(
  exerciseNames: string[],
  startDate?: string,
  endDate?: string
): Promise<{ date: string; [exerciseName: string]: number | string }[]> {
  if (exerciseNames.length === 0) return []

  // First, get exercise IDs from names
  const { data: exercises, error: exerciseError } = await supabase
    .from('exercises')
    .select('id, name')
    .in('name', exerciseNames)

  if (exerciseError) {
    console.error('Error fetching exercises:', exerciseError)
    return []
  }

  if (!exercises || exercises.length === 0) return []

  const exerciseIds = exercises.map(e => String(e.id))
  const exerciseNameMap = new Map(exercises.map(e => [String(e.id), e.name]))

  // Query exercise_logs with filters
  let query = supabase
    .from('exercise_logs')
    .select('logged_at, weight_used, weight_unit, exercise_id')
    .in('exercise_id', exerciseIds)
    .not('exercise_id', 'is', null)
    .not('weight_used', 'is', null)

  if (startDate) {
    query = query.gte('logged_at', startDate)
  }
  if (endDate) {
    query = query.lte('logged_at', endDate)
  }

  const { data, error } = await query.order('logged_at', { ascending: true })

  if (error) {
    console.error('Error fetching weight progression:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Group by date and exercise, normalize weights
  const dateMap = new Map<string, Map<string, number[]>>()

  for (const log of data) {
    const date = log.logged_at.split('T')[0] // Get just the date part
    const exerciseName = exerciseNameMap.get(log.exercise_id || '')
    if (!exerciseName) continue

    const normalizedWeight = normalizeWeight(log.weight_used || 0, log.weight_unit)

    if (!dateMap.has(date)) {
      dateMap.set(date, new Map())
    }
    const exerciseMap = dateMap.get(date)!
    if (!exerciseMap.has(exerciseName)) {
      exerciseMap.set(exerciseName, [])
    }
    exerciseMap.get(exerciseName)!.push(normalizedWeight)
  }

  // Calculate average weight per exercise per date
  const result: { date: string; [exerciseName: string]: number | string }[] = []
  const allDates = Array.from(dateMap.keys()).sort()

  for (const date of allDates) {
    const entry: { date: string; [exerciseName: string]: number | string } = { date }
    const exerciseMap = dateMap.get(date)!

    for (const exerciseName of exerciseNames) {
      const weights = exerciseMap.get(exerciseName)
      if (weights && weights.length > 0) {
        const avgWeight = weights.reduce((a, b) => a + b, 0) / weights.length
        entry[exerciseName] = Math.round(avgWeight * 10) / 10 // Round to 1 decimal
      }
    }

    result.push(entry)
  }

  return result
}

/**
 * Get weekly volume data (strength volume + run miles)
 * Groups by week_number from workouts table
 */
export async function getWeeklyVolume(
  startDate?: string,
  endDate?: string
): Promise<{ week: number; strengthVolume: number; runMiles: number }[]> {
  // Get strength volume: exercise_logs joined with workouts
  // Note: Can't filter on joined fields directly, so we fetch all and filter client-side
  // Use left join instead of inner join to handle potential missing workouts
  const { data: logsData, error: logsError } = await supabase
    .from('exercise_logs')
    .select(`
      sets_completed,
      reps_completed,
      weight_used,
      weight_unit,
      workout_id,
      workout:workouts(week_number, date)
    `)
    .not('exercise_id', 'is', null)
    .not('workout_id', 'is', null)

  if (logsError) {
    console.error('Error fetching exercise logs for volume:', logsError)
    console.error('Full error:', JSON.stringify(logsError, null, 2))
    throw logsError
  }

  // Calculate strength volume per week, filtering by date if needed
  const weekVolumeMap = new Map<number, number>()

  if (logsData) {
    for (const log of logsData) {
      // Access the joined workout data
      // Supabase returns joined data as an object (not array) for one-to-one relationships
      const workout = (log as any).workout
      if (!workout || workout === null || !workout.week_number || !workout.date) {
        // Skip logs without valid workout data
        continue
      }

      // Filter by date range if specified
      if (startDate && workout.date < startDate) continue
      if (endDate && workout.date > endDate) continue

      const sets = log.sets_completed || 0
      const reps = calculateAvgReps(log.reps_completed || [])
      const weight = normalizeWeight(log.weight_used || 0, log.weight_unit)
      const volume = sets * reps * weight

      const currentVolume = weekVolumeMap.get(workout.week_number) || 0
      weekVolumeMap.set(workout.week_number, currentVolume + volume)
    }
  }

  // Get run miles per week
  let runsQuery = supabase
    .from('workouts')
    .select('week_number, distance_miles, date')
    .eq('workout_type', 'run')

  if (startDate) {
    runsQuery = runsQuery.gte('date', startDate)
  }
  if (endDate) {
    runsQuery = runsQuery.lte('date', endDate)
  }

  const { data: runsData, error: runsError } = await runsQuery

  if (runsError) {
    console.error('Error fetching run data:', runsError)
    // Don't throw - return empty array so we at least show strength volume
  }

  const weekMilesMap = new Map<number, number>()

  if (runsData) {
    for (const workout of runsData) {
      const week = workout.week_number
      const miles = workout.distance_miles || 0
      const currentMiles = weekMilesMap.get(week) || 0
      weekMilesMap.set(week, currentMiles + miles)
    }
  }

  // Merge results
  const allWeeks = new Set([...weekVolumeMap.keys(), ...weekMilesMap.keys()])
  const result: { week: number; strengthVolume: number; runMiles: number }[] = []

  for (const week of allWeeks) {
    result.push({
      week,
      strengthVolume: Math.round(weekVolumeMap.get(week) || 0),
      runMiles: Math.round((weekMilesMap.get(week) || 0) * 10) / 10 // Round to 1 decimal
    })
  }

  return result.sort((a, b) => a.week - b.week)
}

/**
 * Get all personal records (max weight per exercise)
 * Returns sorted by weight descending
 */
export async function getAllPRs(): Promise<{
  exercise: string
  weight: number
  unit: string
  date: string
}[]> {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('exercise_id, weight_used, weight_unit, logged_at, exercise:exercises(name)')
    .not('exercise_id', 'is', null)
    .not('weight_used', 'is', null)
  
  if (error) {
    console.error('Error fetching PRs:', error)
    return []
  }

  if (!data || data.length === 0) return []

  // Group by exercise and find max normalized weight
  const exercisePRMap = new Map<
    string,
    { weight: number; normalizedWeight: number; unit: string; date: string; exerciseName: string }
  >()

  for (const log of data) {
    const exercise = log.exercise as any
    const exerciseName = exercise?.name || 'Unknown'
    const exerciseId = log.exercise_id || ''

    const normalizedWeight = normalizeWeight(log.weight_used || 0, log.weight_unit)
    const existing = exercisePRMap.get(exerciseId)

    if (!existing || normalizedWeight > existing.normalizedWeight) {
      exercisePRMap.set(exerciseId, {
        weight: log.weight_used || 0,
        normalizedWeight,
        unit: log.weight_unit || 'lb',
        date: log.logged_at.split('T')[0],
        exerciseName
      })
    }
  }

  // Convert to array and sort by normalized weight descending
  const result = Array.from(exercisePRMap.values())
    .map(pr => ({
      exercise: pr.exerciseName,
      weight: pr.weight,
      unit: pr.unit,
      date: pr.date
    }))
    .sort((a, b) => {
      const aNorm = normalizeWeight(a.weight, a.unit)
      const bNorm = normalizeWeight(b.weight, b.unit)
      return bNorm - aNorm
    })

  return result
}

/**
 * Get progress summary statistics
 */
export async function getProgressSummary(): Promise<{
  totalExerciseLogs: number
  completedWorkouts: number
  totalPRs: number
  currentWeek: number
}> {
  // Count exercise logs
  const { count: logCount, error: logError } = await supabase
    .from('exercise_logs')
    .select('*', { count: 'exact', head: true })

  if (logError) {
    console.error('Error counting exercise logs:', logError)
  }

  // Count workout completions
  const { count: completionCount, error: completionError } = await supabase
    .from('workout_completions')
    .select('*', { count: 'exact', head: true })

  if (completionError) {
    console.error('Error counting workout completions:', completionError)
  }

  // Count unique exercises with logs (for PR count)
  const { data: exerciseData, error: exerciseError } = await supabase
    .from('exercise_logs')
    .select('exercise_id')
    .not('exercise_id', 'is', null)

  if (exerciseError) {
    console.error('Error counting PRs:', exerciseError)
  }

  const uniqueExercises = new Set(
    (exerciseData || []).map(log => log.exercise_id).filter((id): id is string => id !== null)
  )

  // Calculate current week (from Oct 13, 2025)
  const startDate = new Date(2025, 9, 13) // October 13, 2025
  const today = new Date()
  const diffInDays = differenceInDays(today, startDate)
  const weekNumber = Math.floor(diffInDays / 7) + 1
  const currentWeek = Math.max(1, Math.min(12, weekNumber))

  return {
    totalExerciseLogs: logCount || 0,
    completedWorkouts: completionCount || 0,
    totalPRs: uniqueExercises.size,
    currentWeek
  }
}

// =============================================
// EXERCISE LIBRARY
// =============================================

/**
 * Predefined body region groupings for filtering
 */
export const BODY_REGION_GROUPS: Record<string, string[]> = {
  'Lower Leg & Ankle': ['ankles', 'calves', 'feet', 'achilles'],
  'Knee & Hip': ['glutes', 'quads', 'hip flexors', 'hamstrings'],
  'Core & Balance': ['core', 'abs', 'lower back']
}

/**
 * Fetch all exercises from the exercise library
 * Returns all exercises ordered by name (client-side filtering will be used)
 */
export async function getExerciseLibrary(): Promise<ExerciseLibraryEntry[]> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .order('name')
  
  if (error) {
    console.error('Error fetching exercise library:', error)
    throw error
  }
  
  return data || []
}

/**
 * Fetch all Programme.app exercises from the scraped JSON file
 * Returns all exercises with their URLs for embedding
 * Note: This is a client-side function that calls the API route
 */
export async function getAllProgrammeExercises(): Promise<Array<{
  name: string
  url: string
  slug: string
  id: number
}>> {
  try {
    // Use absolute URL for client-side fetch
    const baseUrl = typeof window !== 'undefined' 
      ? window.location.origin 
      : process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const response = await fetch(`${baseUrl}/api/programme-exercises`, {
      cache: 'no-store' // Always fetch fresh data
    })
    if (!response.ok) {
      throw new Error('Failed to fetch programme exercises')
    }
    return await response.json()
  } catch (error) {
    console.error('Error fetching programme exercises:', error)
    return []
  }
}

/**
 * Fetch a single exercise library entry by UUID
 * Returns null if not found
 */
export async function getExerciseLibraryEntry(libraryExerciseId: string): Promise<ExerciseLibraryEntry | null> {
  const { data, error } = await supabase
    .from('exercise_library')
    .select('*')
    .eq('id', libraryExerciseId)
    .maybeSingle()
  
  if (error) {
    console.error('Error fetching exercise library entry:', error)
    return null
  }
  
  return data as ExerciseLibraryEntry | null
}

