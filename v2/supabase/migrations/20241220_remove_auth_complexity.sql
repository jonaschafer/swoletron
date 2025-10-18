-- Migration: Remove Authentication Complexity for Single-User App
-- Date: 2024-12-20
-- Purpose: Simplify to single-user app by removing user_id columns and RLS policies

-- =============================================
-- 1. DROP USER_ID COLUMNS
-- =============================================

-- Remove user_id from workout_completions
ALTER TABLE workout_completions DROP COLUMN IF EXISTS user_id;

-- Remove user_id from exercise_logs  
ALTER TABLE exercise_logs DROP COLUMN IF EXISTS user_id;

-- =============================================
-- 2. DROP ALL EXISTING RLS POLICIES
-- =============================================

-- Drop all policies for workout_completions
DROP POLICY IF EXISTS "Users can view own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can insert own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can update own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can delete own workout completions" ON workout_completions;

-- Drop all policies for exercise_logs
DROP POLICY IF EXISTS "Users can view own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can insert own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can update own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can delete own exercise logs" ON exercise_logs;

-- Drop authenticated-only policies for workouts, exercises, workout_exercises
DROP POLICY IF EXISTS "Only authenticated users can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Only authenticated users can update workouts" ON workouts;
DROP POLICY IF EXISTS "Only authenticated users can delete workouts" ON workouts;

DROP POLICY IF EXISTS "Only authenticated users can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Only authenticated users can update exercises" ON exercises;
DROP POLICY IF EXISTS "Only authenticated users can delete exercises" ON exercises;

DROP POLICY IF EXISTS "Only authenticated users can insert workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Only authenticated users can update workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Only authenticated users can delete workout_exercises" ON workout_exercises;

-- =============================================
-- 3. CREATE SIMPLE "ALLOW ALL" POLICIES
-- =============================================

-- workout_completions: Allow all operations for everyone
CREATE POLICY "Allow all operations on workout_completions" ON workout_completions
    FOR ALL USING (true) WITH CHECK (true);

-- exercise_logs: Allow all operations for everyone  
CREATE POLICY "Allow all operations on exercise_logs" ON exercise_logs
    FOR ALL USING (true) WITH CHECK (true);

-- workouts: Allow all operations for everyone
CREATE POLICY "Allow all operations on workouts" ON workouts
    FOR ALL USING (true) WITH CHECK (true);

-- exercises: Allow all operations for everyone
CREATE POLICY "Allow all operations on exercises" ON exercises
    FOR ALL USING (true) WITH CHECK (true);

-- workout_exercises: Allow all operations for everyone
CREATE POLICY "Allow all operations on workout_exercises" ON workout_exercises
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 4. VERIFICATION QUERIES
-- =============================================

-- Check that user_id columns are gone
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('workout_completions', 'exercise_logs') 
AND column_name = 'user_id';

-- Check that RLS is still enabled but with simple policies
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises')
ORDER BY tablename, policyname;
