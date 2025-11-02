import React, { useState, useEffect, useRef } from 'react';
import { Check, CheckCircle } from 'lucide-react';
import { useDebouncedCallback } from 'use-debounce';

// Helper function to format time
const formatTime = (seconds: number): string => {
  if (seconds < 60) {
    return `${seconds}s`;
  } else if (seconds % 60 === 0) {
    return `${seconds / 60}min`;
  } else {
    return `${seconds}s`;
  }
};

// Helper function to parse time from strings to seconds
const parseTime = (timeStr: string | number): number => {
  if (typeof timeStr === 'number') return timeStr;
  
  const str = String(timeStr).toLowerCase().trim();
  
  // Handle ranges like "8-10" - use the first number
  if (str.includes('-')) {
    const firstNum = parseInt(str.split('-')[0]);
    return firstNum;
  }
  
  // Handle "1min" format
  if (str.includes('min')) {
    const mins = parseInt(str.replace(/\D/g, ''));
    return mins * 60;
  }
  
  // Handle "30sec" or "30s" format
  if (str.includes('sec') || (str.match(/\d+/) && !str.includes('-'))) {
    const num = parseInt(str.replace(/\D/g, ''));
    // If it's a small number without "min", treat as seconds
    if (num < 120 && !str.includes('min')) {
      return num;
    }
    return num;
  }
  
  // Handle plain numbers
  return parseInt(str) || 0;
};

// Helper function to normalize reps input (supports "30s", "30sec", "1min", "12", etc.)
const normalizeRepsInput = (input: string): string => {
  const trimmed = input.trim();
  
  // If it's already a time format, normalize it
  if (trimmed.includes('sec') || trimmed.includes('min')) {
    return trimmed;
  }
  
  // If it ends with 's' and is a number, assume seconds
  if (/^\d+s$/.test(trimmed)) {
    const num = parseInt(trimmed);
    if (num < 60) {
      return `${num}s`;
    } else if (num % 60 === 0) {
      return `${num / 60}min`;
    }
    return trimmed;
  }
  
  // Plain number or range - return as is
  return trimmed;
};

interface Exercise {
  name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight: number;
  reps?: string | number;
  weight_unit?: string;
}

interface ExistingLog {
  sets: number;
  reps: string | string[];
  weight: number;
  weight_unit?: string;
}

interface SetData {
  reps: string;
  weight: number;
  completed: boolean;
}

interface InlineExerciseCardProps {
  exercise: Exercise;
  existingLog: ExistingLog | null;
  onSave: (setsData: SetData[], weightUnit: string) => void;
  onDelete: () => void;
}

export default function InlineExerciseCard({
  exercise,
  existingLog,
  onSave,
  onDelete
}: InlineExerciseCardProps) {
  // Detect if this is a time-based exercise by checking exercise.reps
  const isTimeBased = exercise.reps && 
    (typeof exercise.reps === 'string' && 
     !exercise.reps.includes('-') && 
     (exercise.reps.includes('sec') || exercise.reps.includes('min')));

  const [setsData, setSetsData] = useState<SetData[]>(() => {
    const plannedSets = exercise.planned_sets || 1;
    const plannedReps = exercise.reps 
      ? (typeof exercise.reps === 'string' ? exercise.reps : String(exercise.reps))
      : String(exercise.planned_reps || 0);
    const plannedWeight = exercise.planned_weight || 0;

    if (existingLog) {
      const repsArray = Array.isArray(existingLog.reps) 
        ? existingLog.reps 
        : (existingLog.reps ? [existingLog.reps] : []);
      
      const sets: SetData[] = [];
      for (let i = 0; i < plannedSets; i++) {
        if (i < repsArray.length) {
          sets.push({
            reps: repsArray[i],
            weight: existingLog.weight || plannedWeight,
            completed: true
          });
        } else {
          sets.push({
            reps: plannedReps,
            weight: existingLog.weight || plannedWeight,
            completed: false
          });
        }
      }
      return sets;
    } else {
      const sets: SetData[] = [];
      for (let i = 0; i < plannedSets; i++) {
        sets.push({
          reps: plannedReps,
          weight: plannedWeight,
          completed: false
        });
      }
      return sets;
    }
  });
  
  const [weightUnit, setWeightUnit] = useState(existingLog?.weight_unit || exercise.weight_unit || 'lb');
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const isInitialMount = useRef(true);
  const isUpdatingFromProps = useRef(false);
  const previousSetsDataRef = useRef<string>('');

  // Helper to serialize setsData for comparison
  const serializeSetsData = (data: SetData[]) => {
    return JSON.stringify(data.map(s => ({ reps: s.reps, weight: s.weight, completed: s.completed })));
  };

  // Update sets data when exercise or existingLog changes
  useEffect(() => {
    const plannedSets = exercise.planned_sets || 1;
    const plannedReps = exercise.reps 
      ? (typeof exercise.reps === 'string' ? exercise.reps : String(exercise.reps))
      : String(exercise.planned_reps || 0);
    const plannedWeight = exercise.planned_weight || 0;

    isUpdatingFromProps.current = true;

    if (existingLog) {
      const repsArray = Array.isArray(existingLog.reps) 
        ? existingLog.reps 
        : (existingLog.reps ? [existingLog.reps] : []);
      
      const sets: SetData[] = [];
      for (let i = 0; i < plannedSets; i++) {
        if (i < repsArray.length) {
          sets.push({
            reps: repsArray[i],
            weight: existingLog.weight || plannedWeight,
            completed: true
          });
        } else {
          sets.push({
            reps: plannedReps,
            weight: existingLog.weight || plannedWeight,
            completed: false
          });
        }
      }
      setSetsData(sets);
      previousSetsDataRef.current = serializeSetsData(sets);
    } else {
      const sets: SetData[] = [];
      for (let i = 0; i < plannedSets; i++) {
        sets.push({
          reps: plannedReps,
          weight: plannedWeight,
          completed: false
        });
      }
      setSetsData(sets);
      previousSetsDataRef.current = serializeSetsData(sets);
    }
    setWeightUnit(existingLog?.weight_unit || exercise.weight_unit || 'lb');

    // Reset the flag after a brief delay to allow state to settle
    setTimeout(() => {
      isUpdatingFromProps.current = false;
    }, 100);
  }, [exercise.planned_sets, exercise.planned_reps, exercise.planned_weight, exercise.reps, exercise.weight_unit, existingLog]);

  const isLogged = existingLog !== null;

  const updateSetData = (index: number, field: keyof SetData, value: any) => {
    setSetsData(prev => prev.map((set, i) => 
      i === index ? { ...set, [field]: value } : set
    ));
  };

  const toggleSetCompletion = (index: number) => {
    updateSetData(index, 'completed', !setsData[index].completed);
  };

  // Auto-save function (debounced)
  const debouncedSave = useDebouncedCallback(
    async (setsDataToSave: SetData[], weightUnitToSave: string) => {
      const hasCompletedSets = setsDataToSave.some(set => set.completed);
      
      // Only save if there are completed sets or if there's an existing log (to update)
      if (!hasCompletedSets && !isLogged) {
        return;
      }

      setSaveStatus('saving');
      try {
        await onSave(setsDataToSave, weightUnitToSave);
        setSaveStatus('saved');
        // Reset to idle after 2 seconds
        setTimeout(() => setSaveStatus('idle'), 2000);
      } catch (error) {
        console.error('Error auto-saving exercise log:', error);
        setSaveStatus('idle');
      }
    },
    1000 // Wait 1 second after user stops making changes
  );

  // Auto-save when setsData or weightUnit changes (skip initial mount and prop updates)
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      previousSetsDataRef.current = serializeSetsData(setsData);
      return;
    }

    // Don't auto-save if the update came from props (existingLog change)
    if (isUpdatingFromProps.current) {
      previousSetsDataRef.current = serializeSetsData(setsData);
      return;
    }

    // Only save if data actually changed
    const currentSerialized = serializeSetsData(setsData);
    if (currentSerialized === previousSetsDataRef.current) {
      return;
    }

    previousSetsDataRef.current = currentSerialized;
    debouncedSave(setsData, weightUnit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [setsData, weightUnit]);

  const hasCompletedSets = setsData.some(set => set.completed);

  return (
    <div className="flex flex-col gap-3 w-full">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-black dark:text-white leading-7">
            {exercise.name}
          </h3>
        </div>
        
        {/* Per-Set Rows */}
        <div className="flex flex-col gap-2 w-full">
          {setsData.map((set, index) => (
            <div 
              key={index} 
              className={`
                flex items-center gap-2 p-2 rounded-lg transition-colors
                ${set.completed ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : 'bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}
              `}
            >
              {/* Set Number */}
              <div className={`
                flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm shrink-0
                ${set.completed 
                  ? 'bg-green-500 dark:bg-green-600 text-white' 
                  : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300'
                }
              `}>
                {index + 1}
              </div>

              {/* Reps Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="text"
                  inputMode="numeric"
                  value={set.reps}
                  onChange={(e) => {
                    const value = normalizeRepsInput(e.target.value);
                    updateSetData(index, 'reps', value);
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder={isTimeBased ? "30s" : "12"}
                  className={`
                    w-full px-3 py-2 rounded-lg border-2 text-center text-base font-semibold
                    ${set.completed 
                      ? 'bg-white dark:bg-gray-700 border-green-300 dark:border-green-600 text-black dark:text-white' 
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white'
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  `}
                />
              </div>

              {/* Weight Input */}
              <div className="flex-1 min-w-0">
                <input
                  type="number"
                  inputMode="numeric"
                  value={set.weight || ''}
                  onChange={(e) => updateSetData(index, 'weight', parseFloat(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className={`
                    w-full px-3 py-2 rounded-lg border-2 text-center text-base font-semibold
                    ${set.completed 
                      ? 'bg-white dark:bg-gray-700 border-green-300 dark:border-green-600 text-black dark:text-white' 
                      : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-black dark:text-white'
                    }
                    focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400
                  `}
                  min="0"
                  step="0.5"
                />
              </div>

              {/* Completion Checkbox */}
              <button
                onClick={() => toggleSetCompletion(index)}
                className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 shrink-0 transition-colors
                  ${set.completed 
                    ? 'bg-green-500 dark:bg-green-600 border-green-600 dark:border-green-700' 
                    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600'
                  }
                  hover:border-blue-400 dark:hover:border-blue-500
                `}
                aria-label={set.completed ? 'Mark set incomplete' : 'Mark set complete'}
              >
                {set.completed && (
                  <Check className="w-6 h-6 text-white stroke-[3]" />
                )}
              </button>
            </div>
          ))}
        </div>

        {/* Save Status */}
        <div className="flex items-center pt-2">
          {saveStatus === 'saving' && (
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400 dark:border-gray-500"></div>
              <span>Saving...</span>
            </div>
          )}
          {saveStatus === 'saved' && (
            <div className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
              <CheckCircle className="w-4 h-4" />
              <span>Saved</span>
            </div>
          )}
        </div>
    </div>
  );
}
