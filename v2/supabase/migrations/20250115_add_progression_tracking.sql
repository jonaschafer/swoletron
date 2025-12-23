-- Add progression tracking columns to exercise_logs
ALTER TABLE exercise_logs 
ADD COLUMN IF NOT EXISTS progression_applied boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS suggested_weight decimal,
ADD COLUMN IF NOT EXISTS suggested_reps text[];

-- Add comment for documentation
COMMENT ON COLUMN exercise_logs.progression_applied IS 'Whether the user accepted the auto-suggested progression values';
COMMENT ON COLUMN exercise_logs.suggested_weight IS 'The weight that was suggested by the progression calculator';
COMMENT ON COLUMN exercise_logs.suggested_reps IS 'The reps that were suggested by the progression calculator';


