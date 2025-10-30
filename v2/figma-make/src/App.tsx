import { useState, useEffect } from 'react';
import svgPaths from "./imports/svg-85lpxnamv2";

interface Set {
  id: number;
  weight: number;
  reps: number | string; // Can be number or "AMAP"
  unit: 'reps' | 'sec';
  completed: boolean;
}

interface Exercise {
  id: number;
  name: string;
  improvementText?: string;
  sets: Set[];
  notes: string;
  expanded: boolean;
}

interface Workout {
  name: string;
  day: string;
  exercises: Exercise[];
}

export default function App() {
  const [workout, setWorkout] = useState<Workout>({
    name: "Lower Body",
    day: "Thursday",
    exercises: [
      {
        id: 1,
        name: "Overhead Press",
        improvementText: "↑1 rep since last time",
        sets: [
          { id: 1, weight: 20, reps: 30, unit: 'sec', completed: false },
          { id: 2, weight: 20, reps: 30, unit: 'sec', completed: false },
          { id: 3, weight: 20, reps: "AMAP", unit: 'reps', completed: false },
          { id: 4, weight: 120, reps: 45, unit: 'reps', completed: false },
        ],
        notes: "",
        expanded: true,
      },
      {
        id: 2,
        name: "Bench Press",
        sets: [
          { id: 5, weight: 120, reps: 45, unit: 'reps', completed: false },
        ],
        notes: "",
        expanded: true,
      },
    ],
  });

  const toggleSetCompletion = (exerciseId: number, setId: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId ? { ...set, completed: !set.completed } : set
              ),
            }
          : ex
      ),
    }));
  };

  const toggleExerciseExpansion = (exerciseId: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, expanded: !ex.expanded } : ex
      ),
    }));
  };

  const updateSetValue = (exerciseId: number, setId: number, field: 'weight' | 'reps', value: number | string) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? {
              ...ex,
              sets: ex.sets.map(set =>
                set.id === setId ? { ...set, [field]: value } : set
              ),
            }
          : ex
      ),
    }));
  };

  const isExerciseComplete = (exercise: Exercise) => {
    return exercise.sets.every(set => set.completed);
  };

  const isWorkoutComplete = () => {
    return workout.exercises.every(ex => isExerciseComplete(ex));
  };

  const updateNotes = (exerciseId: number, notes: string) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId ? { ...ex, notes } : ex
      ),
    }));
  };

  const deleteSet = (exerciseId: number, setId: number) => {
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex =>
        ex.id === exerciseId
          ? { ...ex, sets: ex.sets.filter(set => set.id !== setId) }
          : ex
      ),
    }));
  };

  const toggleAllSets = (exerciseId: number) => {
    setWorkout(prev => {
      const exercise = prev.exercises.find(ex => ex.id === exerciseId);
      if (!exercise) return prev;
      
      const allComplete = exercise.sets.every(set => set.completed);
      
      return {
        ...prev,
        exercises: prev.exercises.map(ex =>
          ex.id === exerciseId
            ? {
                ...ex,
                sets: ex.sets.map(set => ({ ...set, completed: !allComplete })),
              }
            : ex
        ),
      };
    });
  };

  const toggleAllWorkoutSets = () => {
    const workoutComplete = isWorkoutComplete();
    
    setWorkout(prev => ({
      ...prev,
      exercises: prev.exercises.map(ex => ({
        ...ex,
        sets: ex.sets.map(set => ({ ...set, completed: !workoutComplete })),
      })),
    }));
  };

  return (
    <div className="bg-[#f2f2f2] relative size-full" data-name="wrapper">
      <div className="flex flex-col items-end size-full">
        <div className="box-border content-stretch flex flex-col gap-[30px] items-end px-[20px] md:px-[43px] py-[50px] relative size-full">
          {/* Header */}
          <div className="content-stretch flex gap-[25px] items-start relative shrink-0 w-full">
            <div className="basis-0 content-stretch flex flex-col font-['Inter_Tight:Medium',_sans-serif] font-medium gap-[16px] grow items-start leading-[0] min-h-px min-w-px relative shrink-0 m-[0px]">
              <div className="flex flex-col justify-center relative shrink-0 text-[#1e1e1e] text-[28px] w-full">
                <p className="leading-[25px]">{workout.name}</p>
              </div>
              <div className="flex flex-col justify-center relative shrink-0 text-[#8c9191] text-[18px] w-full">
                <p className="leading-[25px]">{workout.day}</p>
              </div>
            </div>
            <button 
              onClick={toggleAllWorkoutSets}
              className={`${
                isWorkoutComplete() ? 'bg-[#04be36] hover:bg-[#03a02e]' : 'bg-[#f53622] hover:bg-[#d92f1d]'
              } box-border content-stretch flex flex-col gap-[13px] items-center justify-center overflow-clip px-[14px] py-[13px] relative rounded-[300px] shrink-0 transition-colors`}
            >
              <div className="flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] not-italic relative shrink-0 text-[16px] text-nowrap text-right text-white">
                <p className="leading-[25px] whitespace-pre">{isWorkoutComplete() ? 'Done' : 'Finish'}</p>
              </div>
            </button>
          </div>

          {/* Exercises */}
          {workout.exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              isComplete={isExerciseComplete(exercise)}
              onToggleSet={toggleSetCompletion}
              onToggleExpansion={toggleExerciseExpansion}
              onToggleAllSets={toggleAllSets}
              onUpdateSetValue={updateSetValue}
              onUpdateNotes={updateNotes}
              onDeleteSet={deleteSet}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

interface ExerciseCardProps {
  exercise: Exercise;
  isComplete: boolean;
  onToggleSet: (exerciseId: number, setId: number) => void;
  onToggleExpansion: (exerciseId: number) => void;
  onToggleAllSets: (exerciseId: number) => void;
  onUpdateSetValue: (exerciseId: number, setId: number, field: 'weight' | 'reps', value: number | string) => void;
  onUpdateNotes: (exerciseId: number, notes: string) => void;
  onDeleteSet: (exerciseId: number, setId: number) => void;
}

function ExerciseCard({
  exercise,
  isComplete,
  onToggleSet,
  onToggleExpansion,
  onToggleAllSets,
  onUpdateSetValue,
  onUpdateNotes,
  onDeleteSet,
}: ExerciseCardProps) {
  const [localNotes, setLocalNotes] = useState(exercise.notes);
  const [saveStatus, setSaveStatus] = useState<'typing' | 'saved' | 'idle'>('idle');

  // Debounced auto-save effect
  useEffect(() => {
    setLocalNotes(exercise.notes);
  }, [exercise.notes]);

  useEffect(() => {
    if (localNotes === exercise.notes) {
      if (saveStatus === 'typing') {
        setSaveStatus('saved');
        setTimeout(() => setSaveStatus('idle'), 2000);
      }
      return;
    }

    setSaveStatus('typing');
    const timer = setTimeout(() => {
      onUpdateNotes(exercise.id, localNotes);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 500);

    return () => clearTimeout(timer);
  }, [localNotes, exercise.id, exercise.notes, onUpdateNotes, saveStatus]);

  return (
    <div className="bg-white relative rounded-[13px] shrink-0 w-full" data-name="container">
      <div className="box-border content-stretch flex flex-col gap-[20px] items-start overflow-clip px-0 py-[21px] relative rounded-[inherit] w-full">
        {/* Exercise Header */}
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between px-[20px] py-0 relative w-full">
              <div className="basis-0 content-stretch flex flex-col font-medium gap-[11px] grow items-start justify-center leading-[0] min-h-px min-w-px relative shrink-0">
                <div className="flex flex-col font-['Inter_Tight:Medium',_sans-serif] justify-center relative shrink-0 text-[#1e1e1e] text-[18px] w-full">
                  <p className="leading-[25px] text-[24px]">{exercise.name}</p>
                </div>
                {exercise.improvementText && (
                  <div className="flex flex-col font-['Inter:Medium',_sans-serif] justify-center not-italic relative shrink-0 text-[#7f8082] text-[13px] w-full">
                    <p className="leading-[25px] text-[15px]">
                      <span className="font-['Inter:Bold',_sans-serif] font-bold not-italic text-[#1f9fff]">{exercise.improvementText.split(' ')[0]}</span>
                      <span>{` ${exercise.improvementText.split(' ').slice(1).join(' ')}`}</span>
                    </p>
                  </div>
                )}
              </div>
              <div className="content-stretch flex gap-[10px] items-center relative shrink-0">
                <button
                  onClick={() => onToggleAllSets(exercise.id)}
                  className="relative shrink-0 size-[25px] hover:opacity-70 transition-opacity"
                >
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
                    <g id="Frame 29">
                      <rect fill={isComplete ? "#04BE36" : "var(--fill-0, #E2E4E5)"} height="20" rx="10" width="20" />
                      <path d={svgPaths.p16bb2580} id="Vector" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" />
                    </g>
                  </svg>
                </button>
                <button
                  onClick={() => onToggleExpansion(exercise.id)}
                  className="bg-[#e2e4e5] overflow-clip relative rounded-[300px] shrink-0 size-[25px] hover:bg-[#d0d2d3] transition-colors"
                >
                  <div className="absolute left-1/2 size-[18px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]">
                    <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 14 14">
                      <path d={svgPaths.pa23a80} id="Vector" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Sets */}
        {exercise.expanded && (
          <>
            <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
              {exercise.sets.map((set, index) => {
                // Check if this is the last completed set in a sequence
                const isLastInCompletedSequence = set.completed && 
                  (index === exercise.sets.length - 1 || !exercise.sets[index + 1]?.completed);
                
                return (
                  <SetRow
                    key={set.id}
                    set={set}
                    setNumber={index + 1}
                    exerciseId={exercise.id}
                    isLastInCompletedSequence={isLastInCompletedSequence}
                    onToggle={onToggleSet}
                    onUpdateValue={onUpdateSetValue}
                    onDelete={onDeleteSet}
                  />
                );
              })}
            </div>

            {/* Notes */}
            <div className="relative shrink-0 w-full">
              <div className="flex flex-row items-center size-full">
                <div className="box-border content-stretch flex items-center justify-between px-[20px] py-0 relative w-full">
                  <div className="basis-0 content-stretch flex flex-col gap-[11px] grow items-start justify-center min-h-px min-w-px relative shrink-0">
                    <div className="flex flex-row items-baseline justify-between font-['Inter_Tight:Medium',_sans-serif] font-medium leading-[0] relative shrink-0 text-[#1e1e1e] text-[18px] w-full">
                      <p className="leading-[25px]">Notes</p>
                      {saveStatus === 'saved' && (
                        <span className="font-['Inter:Regular',_sans-serif] font-normal text-[13px] text-[#04be36]">
                          Saved
                        </span>
                      )}
                    </div>
                    <div className="bg-[#f1f1f1] overflow-clip relative rounded-[8px] shrink-0 w-full">
                      <textarea
                        className="bg-transparent w-full h-[118px] px-[13px] py-[10px] font-['Inter:Regular',_sans-serif] font-normal text-[13px] text-[#1e1e1e] resize-none focus:outline-none placeholder:text-[#74787b]"
                        placeholder="Start typing and it auto-saves"
                        value={localNotes}
                        onChange={(e) => setLocalNotes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
      <div aria-hidden="true" className="absolute border border-[rgba(0,0,0,0.1)] border-solid inset-0 pointer-events-none rounded-[13px]" />
    </div>
  );
}

interface SetRowProps {
  set: Set;
  setNumber: number;
  exerciseId: number;
  isLastInCompletedSequence: boolean;
  onToggle: (exerciseId: number, setId: number) => void;
  onUpdateValue: (exerciseId: number, setId: number, field: 'weight' | 'reps', value: number | string) => void;
  onDelete: (exerciseId: number, setId: number) => void;
}

function SetRow({ set, setNumber, exerciseId, isLastInCompletedSequence, onToggle, onUpdateValue, onDelete }: SetRowProps) {
  const [editingWeight, setEditingWeight] = useState(false);
  const [editingReps, setEditingReps] = useState(false);

  const isSpecialValue = set.reps === "AMAP" || set.reps === "ALAP";

  return (
    <div className={`relative shrink-0 w-full ${
      isLastInCompletedSequence ? 'bg-[#aeeabe]' : 
      set.completed ? 'bg-[rgba(53,203,93,0.4)]' : 
      'bg-white'
    }`}>
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between px-[20px] py-[8px] relative w-full">
          {/* Set Number */}
          <div className={`${set.completed ? 'bg-[#04be36]' : 'bg-[#e2e4e5]'} overflow-clip relative rounded-[300px] shrink-0 size-[25px]`}>
            <div className={`absolute flex flex-col font-['Inter:Medium',_sans-serif] font-medium justify-center leading-[0] left-1/2 not-italic text-[11px] text-center ${set.completed ? 'text-[#1e1e1e]' : 'text-[#1e1e1e]'} text-nowrap top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]`}>
              <p className="leading-[25px] whitespace-pre text-[13px]">{setNumber}</p>
            </div>
          </div>

          {/* Weight */}
          {editingWeight && !set.completed ? (
            <input
              type="number"
              className="bg-[#e2e4e5] box-border px-[9px] py-[8px] rounded-[8px] w-[75px] font-['Inter:Medium',_sans-serif] font-medium text-[16px] text-[#1e1e1e] text-right focus:outline-none focus:ring-2 focus:ring-[#1f9fff]"
              value={set.weight}
              onChange={(e) => onUpdateValue(exerciseId, set.id, 'weight', parseInt(e.target.value) || 0)}
              onFocus={(e) => e.target.select()}
              onBlur={() => setEditingWeight(false)}
              autoFocus
            />
          ) : (
            <button
              onClick={() => !set.completed && setEditingWeight(true)}
              className={`${set.completed ? '' : 'bg-[#e2e4e5] hover:bg-[#d0d2d3]'} box-border content-stretch flex font-['Inter:Medium',_sans-serif] font-medium gap-[6px] items-center justify-end leading-[0] not-italic overflow-clip px-[9px] py-[8px] relative rounded-[8px] shrink-0 text-[#1e1e1e] text-nowrap transition-colors`}
            >
              <div className="flex flex-col justify-center relative shrink-0 text-[16px] text-right">
                <p className="leading-[25px] text-nowrap whitespace-pre">{set.weight}</p>
              </div>
              <div className="flex flex-col justify-center opacity-50 relative shrink-0 text-[14px]">
                <p className="leading-[25px] text-nowrap whitespace-pre">lbs</p>
              </div>
            </button>
          )}

          {/* Multiply Icon */}
          <div className="relative shrink-0 size-[9px]">
            <div className="absolute inset-[-5%]">
              <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 8 8">
                <g id="Group 1">
                  <path d={svgPaths.p14620000} id="Vector 7" stroke={set.completed ? "var(--stroke-0, #5D5D5F)" : "var(--stroke-0, #5E6C62)"} />
                  <path d={svgPaths.p391d6680} id="Vector 8" stroke={set.completed ? "var(--stroke-0, #5D5D5F)" : "var(--stroke-0, #5E6C62)"} />
                </g>
              </svg>
            </div>
          </div>

          {/* Reps */}
          {editingReps && !set.completed ? (
            <input
              type="text"
              className="bg-[#e2e4e5] box-border px-[9px] py-[8px] rounded-[8px] w-[75px] font-['Inter:Medium',_sans-serif] font-medium text-[16px] text-[#1e1e1e] text-right focus:outline-none focus:ring-2 focus:ring-[#1f9fff]"
              value={set.reps}
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                // Accept AMAP, ALAP, or numbers
                if (value === "AMAP" || value === "ALAP" || value === "" || /^\d+$/.test(value)) {
                  onUpdateValue(exerciseId, set.id, 'reps', value === "" ? 0 : (isNaN(Number(value)) ? value : parseInt(value)));
                }
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => setEditingReps(false)}
              autoFocus
            />
          ) : (
            <button
              onClick={() => !set.completed && setEditingReps(true)}
              className={`${set.completed ? '' : 'bg-[#e2e4e5] hover:bg-[#d0d2d3]'} box-border content-stretch flex font-['Inter:Medium',_sans-serif] font-medium gap-[6px] items-center justify-end leading-[0] not-italic overflow-clip px-[9px] py-[8px] relative rounded-[8px] shrink-0 text-[#1e1e1e] text-nowrap transition-colors`}
            >
              <div className="flex flex-col justify-center relative shrink-0 text-[16px] text-right">
                <p className="leading-[25px] text-nowrap whitespace-pre">{set.reps}</p>
              </div>
              {!isSpecialValue && (
                <div className="flex flex-col justify-center opacity-50 relative shrink-0 text-[14px]">
                  <p className="leading-[25px] text-nowrap whitespace-pre">{set.unit}</p>
                </div>
              )}
            </button>
          )}

          {/* Complete Checkbox */}
          <button
            onClick={() => onToggle(exerciseId, set.id)}
            className="relative shrink-0 size-[25px] hover:opacity-70 transition-opacity"
          >
            <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 20 20">
              <g id="Frame 29">
                {set.completed ? (
                  <>
                    <rect fill="#04BE36" height="20" rx="10" width="20" />
                    <path d={svgPaths.p20a2a700} id="Vector" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" />
                  </>
                ) : (
                  <>
                    <rect fill="var(--fill-0, #E2E4E5)" height="20" rx="10" width="20" />
                    <path d={svgPaths.p20a2a700} id="Vector" stroke="var(--stroke-0, #1E1E1E)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.33333" />
                  </>
                )}
              </g>
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
