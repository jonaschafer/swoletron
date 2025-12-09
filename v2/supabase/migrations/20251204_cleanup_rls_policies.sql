-- Migration: Cleanup RLS Policies and Fix weekly_summary View
-- Date: 2024-12-04
-- Purpose: Remove all RLS policies from tables where RLS is disabled (single-user app)
--          and fix weekly_summary view to use SECURITY INVOKER

-- =============================================
-- 1. DROP ALL EXISTING RLS POLICIES
-- =============================================

-- Drop all policies from exercise_logs
DROP POLICY IF EXISTS "Allow all access to exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow all deletes on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow all inserts on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow all selects on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow all updates on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow everything on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Enable all for anon on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Enable all for authenticated on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Allow all operations on exercise_logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can view own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can insert own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can update own exercise logs" ON exercise_logs;
DROP POLICY IF EXISTS "Users can delete own exercise logs" ON exercise_logs;

-- Drop policies from exercises
DROP POLICY IF EXISTS "Allow public read access to exercises" ON exercises;
DROP POLICY IF EXISTS "Allow all operations on exercises" ON exercises;
DROP POLICY IF EXISTS "Only authenticated users can insert exercises" ON exercises;
DROP POLICY IF EXISTS "Only authenticated users can update exercises" ON exercises;
DROP POLICY IF EXISTS "Only authenticated users can delete exercises" ON exercises;

-- Drop policies from workout_completions
DROP POLICY IF EXISTS "Allow all access to workout_completions" ON workout_completions;
DROP POLICY IF EXISTS "Allow everything on workout_completions" ON workout_completions;
DROP POLICY IF EXISTS "Enable all for anon on workout_completions" ON workout_completions;
DROP POLICY IF EXISTS "Enable all for authenticated on workout_completions" ON workout_completions;
DROP POLICY IF EXISTS "Allow all operations on workout_completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can view own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can insert own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can update own workout completions" ON workout_completions;
DROP POLICY IF EXISTS "Users can delete own workout completions" ON workout_completions;

-- Drop policies from workout_exercises
DROP POLICY IF EXISTS "Allow public read access to workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Allow all operations on workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Only authenticated users can insert workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Only authenticated users can update workout_exercises" ON workout_exercises;
DROP POLICY IF EXISTS "Only authenticated users can delete workout_exercises" ON workout_exercises;

-- Drop policies from workouts
DROP POLICY IF EXISTS "Allow public read access to workouts" ON workouts;
DROP POLICY IF EXISTS "Allow all operations on workouts" ON workouts;
DROP POLICY IF EXISTS "Only authenticated users can insert workouts" ON workouts;
DROP POLICY IF EXISTS "Only authenticated users can update workouts" ON workouts;
DROP POLICY IF EXISTS "Only authenticated users can delete workouts" ON workouts;

-- =============================================
-- 2. ENSURE RLS IS DISABLED ON ALL TABLES
-- =============================================

-- Confirm RLS is disabled (single-user app, no authentication needed)
ALTER TABLE exercise_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions DISABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises DISABLE ROW LEVEL SECURITY;
ALTER TABLE workouts DISABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_library DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 3. FIX weekly_summary VIEW
-- =============================================

-- Fix weekly_summary view: Drop and recreate without SECURITY DEFINER
-- NOTE: To get the SELECT statement from the existing view:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Run: SELECT pg_get_viewdef('weekly_summary', true);
-- 3. Copy the SELECT statement from the result
-- 4. Uncomment and complete the CREATE VIEW statement below
-- 
-- Recreating the view will remove the SECURITY DEFINER property
-- (Views in PostgreSQL use the invoker's permissions by default)

DROP VIEW IF EXISTS weekly_summary;

-- Uncomment and complete this after getting the view definition:
CREATE VIEW weekly_summary AS
SELECT w.week_number,
    w.phase,
    count(DISTINCT w.id) AS total_workouts,
    count(DISTINCT wc.id) AS completed_workouts,
    round(count(DISTINCT wc.id)::numeric / count(DISTINCT w.id)::numeric * 100::numeric, 1) AS completion_percentage,
    sum(
        CASE
            WHEN w.workout_type = 'run'::text THEN w.distance_miles
            ELSE 0::numeric
        END) AS total_miles,
    sum(
        CASE
            WHEN w.workout_type = 'run'::text THEN w.elevation_gain_feet
            ELSE 0
        END) AS total_elevation,
    sum(
        CASE
            WHEN w.workout_type = 'strength'::text THEN w.duration_minutes
            ELSE 0
        END) AS total_strength_minutes
FROM workouts w
LEFT JOIN workout_completions wc ON w.id = wc.workout_id
GROUP BY w.week_number, w.phase
ORDER BY w.week_number;

-- =============================================
-- 4. VERIFICATION QUERIES
-- =============================================

-- Check that RLS is disabled on all tables
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises', 'exercise_library')
ORDER BY tablename;

-- Check that no policies exist
SELECT schemaname, tablename, policyname
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises', 'exercise_library')
ORDER BY tablename, policyname;

-- Check view security (after recreating)
-- SELECT viewname, viewowner, definition
-- FROM pg_views 
-- WHERE schemaname = 'public' 
-- AND viewname = 'weekly_summary';

