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
const parseTime = (timeStr: string): number => {
  const str = String(timeStr).toLowerCase();
  
  if (str.includes('min')) {
    const mins = parseInt(str);
    return mins * 60;
  }
  
  if (str.includes('sec')) {
    return parseInt(str);
  }
  
  return parseInt(str) || 0;
};

interface Exercise {
  name: string;
  planned_sets: number;
  planned_reps: number;
  planned_weight: number;
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
  // Detect if this is a time-based exercise
  const isTimeBased = exercise.planned_reps && 
    (String(exercise.planned_reps).includes('sec') || 
     String(exercise.planned_reps).includes('min'));

  // Initialize with parsed time values if time-based
  const initialReps = existingLog?.reps || 
    (exercise.planned_reps 
      ? (isTimeBased ? parseTime(exercise.planned_reps) : exercise.planned_reps)
      : 0);

  const [sets, setSets] = useState(existingLog?.sets || exercise.planned_sets);
  const [reps, setReps] = useState(initialReps);
  const [weight, setWeight] = useState(existingLog?.weight || exercise.planned_weight);
  const [isLoading, setIsLoading] = useState(false);
  
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
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  appearance: 'none'
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
                  style={{
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                />
              ) : (
                <input
                  type="number"
                  inputMode="numeric"
                  value={reps}
                  onChange={(e) => setReps(parseInt(e.target.value) || 0)}
                  onFocus={(e) => e.target.select()}
                  className="w-full text-center text-xl font-semibold text-black bg-transparent border-none outline-none"
                  style={{
                    MozAppearance: 'textfield',
                    WebkitAppearance: 'none',
                    appearance: 'none'
                  }}
                  min="0"
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
                  MozAppearance: 'textfield',
                  WebkitAppearance: 'none',
                  appearance: 'none'
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
