-- Migration: Exercise Library Feature
-- Date: 2024-12-20
-- Purpose: Create exercise_library table for PT-recommended exercises with multi-dimensional filtering

-- =============================================
-- 1. CREATE EXERCISE_LIBRARY TABLE
-- =============================================

CREATE TABLE exercise_library (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  
  -- Multi-dimensional tagging
  injury_areas text[],      -- ['ITBS', 'Ankle Stability', 'Patellar Tendon']
  body_parts text[],        -- ['glutes', 'hip flexors', 'ankles', 'quads']
  equipment text[],         -- ['resistance_band', 'bosu_ball', 'bodyweight', 'kettlebell']
  
  -- Media (Supabase Storage paths)
  demo_file_path text,      -- Primary video/GIF path
  external_video_url text,  -- Optional YouTube/ExRx fallback
  thumbnail_path text,      -- Optional thumbnail
  
  -- Metadata
  difficulty text CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  notes text,               -- PT-specific notes, form cues
  created_at timestamp DEFAULT now()
);

-- =============================================
-- 2. ADD LIBRARY REFERENCE TO EXERCISES TABLE
-- =============================================

-- Link scheduled exercises to library (optional, for future feature)
ALTER TABLE exercises 
  ADD COLUMN IF NOT EXISTS library_exercise_id uuid REFERENCES exercise_library(id);

-- =============================================
-- 3. DISABLE RLS FOR SINGLE-USER APP
-- =============================================

ALTER TABLE exercise_library DISABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. CREATE INDEXES FOR PERFORMANCE
-- =============================================

-- Index on name for search
CREATE INDEX IF NOT EXISTS idx_exercise_library_name ON exercise_library(name);

-- GIN indexes for array columns (for future query optimization)
CREATE INDEX IF NOT EXISTS idx_exercise_library_injury_areas ON exercise_library USING GIN(injury_areas);
CREATE INDEX IF NOT EXISTS idx_exercise_library_body_parts ON exercise_library USING GIN(body_parts);
CREATE INDEX IF NOT EXISTS idx_exercise_library_equipment ON exercise_library USING GIN(equipment);

-- =============================================
-- 5. VERIFICATION QUERIES
-- =============================================

-- Check table was created
SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'exercise_library'
ORDER BY ordinal_position;

-- Check library_exercise_id was added to exercises
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'exercises' 
AND column_name = 'library_exercise_id';

