import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseKey)

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
  id: number
  workout_id: number
  exercise_name: string
  sets_completed: number
  reps_completed: number[] | null
  weight_used: number | null
  weight_unit: string | null
  notes: string | null
  completed_at: string
  created_at: string
  updated_at: string
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
    .insert({
      workout_id: workoutId,
      notes: notes || null,
      completed_at: new Date().toISOString()
    })
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
    .single()

  if (error && error.code !== 'PGRST116') {
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
      exercises(*)
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

export async function logExercise(data: {
  workout_id: number
  exercise_name: string
  sets_completed: number
  reps_completed: number[]
  weight_used: number
  weight_unit: string
  notes?: string
}) {
  const { data: result, error } = await supabase
    .from('exercise_logs')
    .insert({
      workout_id: data.workout_id,
      exercise_name: data.exercise_name,
      sets_completed: data.sets_completed,
      reps_completed: data.reps_completed,
      weight_used: data.weight_used,
      weight_unit: data.weight_unit,
      notes: data.notes || null,
      completed_at: new Date().toISOString()
    })
    .select()
    .single()

  if (error) {
    console.error('Error logging exercise:', error)
    throw error
  }

  return result as ExerciseLog
}

export async function getExerciseLogsForWorkout(workout_id: number) {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('workout_id', workout_id)
    .order('completed_at', { ascending: false })

  if (error) {
    console.error('Error fetching exercise logs:', error)
    throw error
  }

  return data as ExerciseLog[]
}

export async function getLatestExerciseLog(workout_id: number, exercise_name: string) {
  const { data, error } = await supabase
    .from('exercise_logs')
    .select('*')
    .eq('workout_id', workout_id)
    .eq('exercise_name', exercise_name)
    .order('completed_at', { ascending: false })
    .limit(1)
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest exercise log:', error)
    return null
  }

  return data as ExerciseLog | null
}

export async function updateExerciseLog(
  logId: number,
  data: {
    sets_completed?: number
    reps_completed?: number[]
    weight_used?: number
    weight_unit?: string
    notes?: string
  }
) {
  const updateData: any = {
    updated_at: new Date().toISOString()
  }

  if (data.sets_completed !== undefined) updateData.sets_completed = data.sets_completed
  if (data.reps_completed !== undefined) updateData.reps_completed = data.reps_completed
  if (data.weight_used !== undefined) updateData.weight_used = data.weight_used
  if (data.weight_unit !== undefined) updateData.weight_unit = data.weight_unit
  if (data.notes !== undefined) updateData.notes = data.notes

  const { data: result, error } = await supabase
    .from('exercise_logs')
    .update(updateData)
    .eq('id', logId)
    .select()
    .single()

  if (error) {
    console.error('Error updating exercise log:', error)
    throw error
  }

  return result as ExerciseLog
}

export async function deleteExerciseLog(logId: number) {
  const { error } = await supabase
    .from('exercise_logs')
    .delete()
    .eq('id', logId)

  if (error) {
    console.error('Error deleting exercise log:', error)
    throw error
  }
}

// Parse exercises from workout description/notes
export function parseExercisesFromWorkout(workout: Workout): Array<{
  name: string
  sets: number
  reps: string
  weight: number
  unit: string
}> {
  const exercises: Array<{
    name: string
    sets: number
    reps: string
    weight: number
    unit: string
  }> = []
  
  // Get exercises from workout_exercises table if available
  if (workout.id) {
    // This will be populated by getWorkoutExercises function
    return exercises
  }
  
  // Fallback: parse from notes field if workout_exercises not available
  const notes = workout.notes || ''
  if (!notes) return exercises
  
  // Split by comma and process each exercise
  const exerciseStrings = notes.split(',').map(ex => ex.trim())
  
  for (const exerciseStr of exerciseStrings) {
    // Match patterns like: "Bosu balance: 2×30sec each leg" or "Goblet Squat: 3×12 @ 35lb"
    const match = exerciseStr.match(/([^:]+):\s*(\d+)×(\d+(?:sec|min|-\d+)?)\s*(?:each\s+\w+)?\s*(?:@\s*(\d+(?:\.\d+)?)\s*(lb|kg|BW|time))?/i)
    
    if (match) {
      const [, name, sets, reps, weight, unit] = match
      exercises.push({
        name: name.trim(),
        sets: parseInt(sets),
        reps: reps.trim(),
        weight: weight ? parseFloat(weight) : 0,
        unit: unit ? unit.toLowerCase() : 'BW'
      })
    } else {
      // Try to match simpler patterns without time units
      const simpleMatch = exerciseStr.match(/([^:]+):\s*(\d+)×(\d+)/)
      if (simpleMatch) {
        const [, name, sets, reps] = simpleMatch
        exercises.push({
          name: name.trim(),
          sets: parseInt(sets),
          reps: reps.trim(),
          weight: 0,
          unit: 'BW'
        })
      }
    }
  }
  
  return exercises
}
