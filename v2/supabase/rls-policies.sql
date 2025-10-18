-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SWOLETRON
-- =============================================
-- This file sets up simple security policies for a single-user app.
-- All operations are allowed for anonymous users.

-- =============================================
-- 1. ENABLE RLS ON ALL TABLES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE workouts ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercise_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE exercises ENABLE ROW LEVEL SECURITY;
ALTER TABLE workout_exercises ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 2. SIMPLE "ALLOW ALL" POLICIES FOR SINGLE-USER APP
-- =============================================

-- All tables: Allow all operations for everyone
CREATE POLICY "Allow all operations on workouts" ON workouts
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on exercises" ON exercises
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_exercises" ON workout_exercises
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on workout_completions" ON workout_completions
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Allow all operations on exercise_logs" ON exercise_logs
    FOR ALL USING (true) WITH CHECK (true);

-- =============================================
-- 3. VERIFICATION QUERIES
-- =============================================

-- Check which tables have RLS enabled
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises');

-- Check all policies for our tables
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies 
WHERE schemaname = 'public' 
AND tablename IN ('workouts', 'workout_completions', 'exercise_logs', 'exercises', 'workout_exercises')
ORDER BY tablename, policyname;

-- =============================================
-- 4. NOTES
-- =============================================
-- 
-- With these policies:
-- - Anonymous users (using anon key) can read and write to all tables
-- - No authentication required
-- - Perfect for single-user applications
-- - Simple and straightforward security model
