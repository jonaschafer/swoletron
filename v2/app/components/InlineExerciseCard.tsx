import React, { useState } from 'react';
import { Check, Loader2 } from 'lucide-react';

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
  const [sets, setSets] = useState(existingLog?.sets || exercise.planned_sets);
  const [reps, setReps] = useState(existingLog?.reps || exercise.planned_reps);
  const [weight, setWeight] = useState(existingLog?.weight || exercise.planned_weight);
  const [isLoading, setIsLoading] = useState(false);
  
  const isLogged = existingLog !== null;
  const isLoggedText = isLogged ? "Logged" : "Not logged";

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

  return (
    <div className={`
      p-3 rounded-lg border
      ${isLogged 
        ? 'bg-green-50 border-green-200' 
        : 'bg-white border-gray-200'
      }
    `}>
      {/* Exercise name and status */}
      <div className="mb-3">
        <span className="font-medium text-gray-900">
          {exercise.name}
        </span>
        <span className={`
          text-sm block mt-1
          ${isLogged ? 'text-green-700' : 'text-gray-500'}
        `}>
          {isLoggedText}
        </span>
      </div>

      {/* Input boxes and action button */}
      <div className="flex items-center justify-between gap-2">
        {/* Sets input */}
        <div className="flex flex-col items-center flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={sets}
            onChange={(e) => setSets(parseInt(e.target.value) || 0)}
            className="w-full max-w-16 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            min="0"
          />
          <span className="text-xs text-gray-500 mt-1">Sets</span>
        </div>

        {/* Reps input */}
        <div className="flex flex-col items-center flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={reps}
            onChange={(e) => setReps(parseInt(e.target.value) || 0)}
            className="w-full max-w-16 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            min="0"
          />
          <span className="text-xs text-gray-500 mt-1">Reps</span>
        </div>

        {/* Weight input */}
        <div className="flex flex-col items-center flex-1">
          <input
            type="number"
            inputMode="numeric"
            value={weight}
            onChange={(e) => setWeight(parseInt(e.target.value) || 0)}
            className="w-full max-w-16 h-12 text-center text-xl font-semibold border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:outline-none"
            style={{
              MozAppearance: 'textfield',
              WebkitAppearance: 'none',
              appearance: 'none'
            }}
            min="0"
          />
          <span className="text-xs text-gray-500 mt-1">Weight</span>
        </div>

        {/* Action button */}
        <button
          onClick={isLogged ? handleDelete : handleSave}
          disabled={isLoading}
          className={`
            w-10 h-10 rounded-full flex items-center justify-center ml-2 flex-shrink-0
            ${isLoading 
              ? 'bg-gray-300 cursor-not-allowed' 
              : isLogged 
                ? 'bg-green-500 hover:bg-green-600 text-white' 
                : 'bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-500'
            }
            transition-colors duration-200
          `}
          title={isLoading ? "Processing..." : isLogged ? "Unlog exercise" : "Log exercise"}
        >
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Check className={`w-5 h-5 ${isLogged ? 'text-white' : 'text-gray-500'}`} />
          )}
        </button>
      </div>
    </div>
  );
}
