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
  id: string
  user_id: string | null
  exercise_id: string | null
  workout_id: string | null
  sets_completed: number | null
  reps_completed: number[] | null
  weight_used: number | null
  weight_unit: string | null
  notes: string | null
  logged_at: string
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

export async function logExercise(
  workoutExerciseId: number,
  setsCompleted: number,
  repsCompleted?: number | number[],
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
    .single()

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching latest exercise log:', error)
    return null
  }

  return data as ExerciseLog | null
}

export async function updateExerciseLog(
  logId: string,
  setsCompleted?: number,
  repsCompleted?: number | number[],
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

