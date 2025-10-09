-- =============================================
-- ROW LEVEL SECURITY (RLS) POLICIES FOR SWOLETRON
-- =============================================
-- This file sets up proper security policies to protect sensitive data
-- while allowing public access to workout schedules and exercises.

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
-- 2. PUBLIC TABLES (READ-ONLY FOR ANON)
-- =============================================

-- WORKOUTS TABLE: Public read access, no write access for anon
CREATE POLICY "Anyone can view workouts" ON workouts
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert workouts" ON workouts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update workouts" ON workouts
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete workouts" ON workouts
    FOR DELETE USING (auth.role() = 'authenticated');

-- EXERCISES TABLE: Public read access, no write access for anon
CREATE POLICY "Anyone can view exercises" ON exercises
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert exercises" ON exercises
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update exercises" ON exercises
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete exercises" ON exercises
    FOR DELETE USING (auth.role() = 'authenticated');

-- WORKOUT_EXERCISES TABLE: Public read access, no write access for anon
CREATE POLICY "Anyone can view workout_exercises" ON workout_exercises
    FOR SELECT USING (true);

CREATE POLICY "Only authenticated users can insert workout_exercises" ON workout_exercises
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can update workout_exercises" ON workout_exercises
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Only authenticated users can delete workout_exercises" ON workout_exercises
    FOR DELETE USING (auth.role() = 'authenticated');

-- =============================================
-- 3. USER-SPECIFIC TABLES (USER CAN ONLY ACCESS OWN DATA)
-- =============================================

-- WORKOUT_COMPLETIONS TABLE: Users can only access their own completions
CREATE POLICY "Users can view own workout completions" ON workout_completions
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own workout completions" ON workout_completions
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own workout completions" ON workout_completions
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own workout completions" ON workout_completions
    FOR DELETE USING (auth.uid()::text = user_id);

-- EXERCISE_LOGS TABLE: Users can only access their own exercise logs
CREATE POLICY "Users can view own exercise logs" ON exercise_logs
    FOR SELECT USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert own exercise logs" ON exercise_logs
    FOR INSERT WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update own exercise logs" ON exercise_logs
    FOR UPDATE USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete own exercise logs" ON exercise_logs
    FOR DELETE USING (auth.uid()::text = user_id);

-- =============================================
-- 4. VERIFICATION QUERIES
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
-- 5. TEST QUERIES (Run these to verify security)
-- =============================================

-- Test 1: Anonymous user should be able to read workouts but not write
-- SELECT * FROM workouts LIMIT 5; -- Should work
-- INSERT INTO workouts (title, date) VALUES ('Test', '2024-01-01'); -- Should fail

-- Test 2: Anonymous user should NOT be able to access workout_completions
-- SELECT * FROM workout_completions; -- Should return empty or error

-- Test 3: Anonymous user should NOT be able to access exercise_logs  
-- SELECT * FROM exercise_logs; -- Should return empty or error

-- =============================================
-- 6. NOTES
-- =============================================
-- 
-- With these policies:
-- - Anonymous users (using anon key) can ONLY read public data (workouts, exercises, workout_exercises)
-- - Anonymous users CANNOT write to any table
-- - Anonymous users CANNOT access user-specific data (workout_completions, exercise_logs)
-- - Authenticated users can only access their own user-specific data
-- - The service_role key bypasses RLS entirely (use with caution)
--
-- This makes your leaked keys much safer since they can only access public data!
