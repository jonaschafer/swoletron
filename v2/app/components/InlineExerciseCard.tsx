import React, { useState } from 'react';
import { Check } from 'lucide-react';

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

// Helper function to parse time from strings
const parseTime = (timeStr: string | number): number => {
  if (typeof timeStr === 'number') return timeStr;
  
  const str = String(timeStr).toLowerCase().trim();
  
  // Handle ranges like "8-10" or "15-20" - use the first number
  if (str.includes('-')) {
    const firstNum = parseInt(str.split('-')[0]);
    return firstNum;
  }
  
  // Handle "1min" format
  if (str.includes('min')) {
    const mins = parseInt(str.replace(/\D/g, ''));
    return mins * 60;
  }
  
  // Handle "30sec" format
  if (str.includes('sec')) {
    return parseInt(str.replace(/\D/g, ''));
  }
  
  // Handle plain numbers
  return parseInt(str) || 0;
};

// Helper function to display reps properly
const displayReps = (reps: string | number): string => {
  if (typeof reps === 'string' && reps.includes('-')) {
    // Keep range format for display: "8-10"
    return reps;
  }
  
  if (typeof reps === 'string' && (reps.includes('sec') || reps.includes('min'))) {
    // Format time: "30sec" → "30s"
    return formatTime(parseTime(reps));
  }
  
  return String(reps);
};

interface Exercise {
  name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight: number;
  reps?: string | number;
}

interface ExistingLog {
  sets: number;
  reps: number;
  weight: number;
}

interface InlineExerciseCardProps {
  exercise: Exercise;
  existingLog: ExistingLog | null;
  onSave: (sets: number, reps: number, weight: number) => void;
  onDelete: () => void;
}

export default function InlineExerciseCard({
  exercise,
  existingLog,
  onSave,
  onDelete
}: InlineExerciseCardProps) {
  // Detect if this is a time-based exercise by checking exercise.reps
  // Ranges (like "8-10") are NOT time-based
  const isTimeBased = exercise.reps && 
    (typeof exercise.reps === 'string' && 
     !exercise.reps.includes('-') && 
     (exercise.reps.includes('sec') || exercise.reps.includes('min')));

  // Initialize with parsed values
  const initialReps = existingLog?.reps || 
    (exercise.reps 
      ? (typeof exercise.reps === 'string' && (exercise.reps.includes('sec') || exercise.reps.includes('min'))
          ? parseTime(exercise.reps)  // Convert "30sec" to 30
          : parseTime(exercise.reps)) // Parse ranges or plain numbers
      : exercise.planned_reps || 0);

  const [sets, setSets] = useState(existingLog?.sets || exercise.planned_sets);
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(existingLog?.weight || exercise.planned_weight);
  const [isLoading, setIsLoading] = useState(false);
  
  // For ranges, we need to track both the display value and the internal numeric value
  const isRange = typeof exercise.reps === 'string' && exercise.reps.includes('-');
  const [displayReps, setDisplayReps] = useState(
    isRange ? exercise.reps : (isTimeBased ? formatTime(reps) : String(reps))
  );
  
  const isLogged = existingLog !== null;

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await onSave(sets, reps, weight);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      await onDelete();
    } finally {
      setIsLoading(false);
    }
  };

  const handleAction = () => {
    if (isLogged) {
      handleDelete();
    } else {
      handleSave();
    }
  };

  return (
    <div className={`
      border rounded-lg px-5 py-3 w-full
      ${isLogged 
        ? 'bg-[#f1fdf4] border-[#baf8d0]' 
        : 'bg-white border-gray-200'
      }
    `}>
      <div className="flex flex-col gap-4 w-full">
        {/* Header Section */}
        <div className="flex flex-col w-full">
          <h3 className="text-lg font-semibold text-black leading-7">
            {exercise.name}
          </h3>
          <p className={`
            text-sm leading-5
            ${isLogged ? 'text-[#17803d]' : 'text-gray-500'}
          `}>
            {isLogged ? "Logged" : "Not logged"}
          </p>
        </div>
        
        {/* Input Section */}
        <div className="flex gap-2 w-full">
          {/* Sets Input */}
          <div className="basis-0 flex flex-col grow items-center">
            <div className="bg-white border-2 border-gray-300 h-12 w-full rounded-lg flex items-center justify-center px-0.5 py-3">
              <input
                type="number"
                inputMode="numeric"
                value={sets}
                onChange={(e) => setSets(parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-xl font-semibold text-black bg-transparent border-none outline-none"
                style={{
                  appearance: 'textfield'
                }}
                min="0"
              />
            </div>
            <div className="pt-1">
              <p className="text-xs text-gray-600 whitespace-nowrap">Sets</p>
            </div>
          </div>

          {/* Reps Input */}
          <div className="basis-0 flex flex-col grow items-center">
            <div className="bg-white border-2 border-gray-300 h-12 w-full rounded-lg flex items-center justify-center px-0.5 py-3">
              {isTimeBased ? (
                <input
                  type="text"
                  inputMode="numeric"
                  value={formatTime(reps)}
                  onChange={(e) => {
                    // Parse input like "30s" or "1min" back to seconds
                    const value = e.target.value.replace(/[^\d]/g, '');
                    setReps(parseInt(value) || 0);
                  }}
                  onFocus={(e) => e.target.select()}
                  placeholder="30s"
                  className="w-full text-center text-xl font-semibold text-black bg-transparent border-none outline-none"
                />
              ) : (
                <input
                  type={isRange ? "text" : "number"}
                  inputMode="numeric"
                  value={isRange ? displayReps : reps}
                  onChange={(e) => {
                    if (isRange) {
                      // For ranges, allow editing the range format
                      const newValue = e.target.value;
                      setDisplayReps(newValue);
                      setReps(parseTime(newValue)); // Store the first number for internal use
                    } else {
                      setReps(parseInt(e.target.value) || 0);
                    }
                  }}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center text-xl font-semibold text-black bg-transparent border-none outline-none"
                  style={{
                    appearance: 'textfield'
                  }}
                  min="0"
                  placeholder={isRange ? "8-10" : "12"}
                />
              )}
            </div>
            <div className="pt-1">
              <p className="text-xs text-gray-600 whitespace-nowrap">
                {isTimeBased ? "Duration" : "Reps"}
              </p>
            </div>
          </div>

          {/* Weight Input */}
          <div className="basis-0 flex flex-col grow items-center">
            <div className="bg-white border-2 border-gray-300 h-12 w-full rounded-lg flex items-center justify-center px-0.5 py-3">
              <input
                type="number"
                inputMode="numeric"
                value={weight}
                onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
                onFocus={(e) => e.target.select()}
                className="w-full text-center text-xl font-semibold text-black bg-transparent border-none outline-none"
                style={{
                  appearance: 'textfield'
                }}
                min="0"
              />
            </div>
            <div className="pt-1">
              <p className="text-xs text-gray-600 whitespace-nowrap">Weight</p>
            </div>
          </div>

          {/* Action Button */}
          <div className="basis-0 flex flex-col grow items-center">
            <button
              onClick={handleAction}
              disabled={isLoading}
              className={`
                h-12 w-full rounded-lg flex items-center justify-center border-2
                ${isLoading 
                  ? 'bg-white border-gray-300 cursor-not-allowed' 
                  : isLogged 
                    ? 'bg-[#31f16e] border-[rgba(0,0,0,0.2)] hover:bg-[#2ae05f]' 
                    : 'bg-white border-gray-300 hover:border-gray-400'
                }
                transition-colors duration-200
              `}
              title={isLoading ? "Processing..." : isLogged ? "Unlog exercise" : "Log exercise"}
            >
              {isLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-400"></div>
              ) : (
                <Check className={`w-4 h-4 ${isLogged ? 'text-[#171717]' : 'text-gray-400'}`} />
              )}
            </button>
            <div className="h-5 w-10" />
          </div>
        </div>
      </div>
    </div>
  );
}
