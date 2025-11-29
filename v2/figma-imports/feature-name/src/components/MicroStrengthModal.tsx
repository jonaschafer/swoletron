import svgPaths from "../imports/svg-ffy23aemzk";
import svgPathsCompleted from "../imports/svg-hrt1ddwggo";
import svgPathsExercise from "../imports/svg-sh7hrytu9k";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface Exercise {
  name: string;
  sets: Array<{
    reps: string;
    weight: string;
    completed: boolean;
  }>;
}

interface MicroStrengthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkComplete: () => void;
  workoutType: 'micro' | 'strength';
  title: string;
  date: string;
  exercises: Exercise[];
  description: string;
  isCompleted?: boolean;
}

function Frame({ isCompleted }: { isCompleted?: boolean }) {
  if (isCompleted) {
    return (
      <div className="absolute left-1/2 size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
          <g id="Frame">
            <path d={svgPathsCompleted.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          </g>
        </svg>
      </div>
    );
  }
  
  return (
    <div className="absolute left-1/2 size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Frame">
          <path d="M18 6L6 18" id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
          <path d="M6 6L18 18" id="Vector2" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Frame3({ onClose, isCompleted }: { onClose: () => void; isCompleted?: boolean }) {
  return (
    <div 
      onClick={onClose}
      className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
    >
      <Frame isCompleted={isCompleted} />
    </div>
  );
}

function Frame5({ onClose, isCompleted }: { onClose: () => void; isCompleted?: boolean }) {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center right-[20px] top-[20px]">
      <Frame3 onClose={onClose} isCompleted={isCompleted} />
    </div>
  );
}

function Frame8({ title, onClose, bgColor, isCompleted }: { title: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  const headerBgColor = isCompleted 
    ? (bgColor === 'bg-green-900' ? 'bg-green-600' : 'bg-red-600')
    : bgColor;
  
  return (
    <div className={`${headerBgColor} h-[76px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full`}>
      <Frame5 onClose={onClose} isCompleted={isCompleted} />
      <div className="absolute flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] left-[20px] text-[21px] text-white top-[38.5px] translate-y-[-50%] w-[178px]">
        <p className="leading-[1.3]">{title}</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Frame">
      <Calendar className="size-full text-white opacity-50" strokeWidth={1.5} />
    </div>
  );
}

function Frame10({ date }: { date: string }) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Frame1 />
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
    </div>
  );
}

function Frame9({ date }: { date: string }) {
  return (
    <div className="bg-gray-800 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-700 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center pl-[20px] pr-0 py-[24px] relative w-full">
          <Frame10 date={date} />
        </div>
      </div>
    </div>
  );
}

function Frame11({ title, date, onClose, bgColor, isCompleted }: { title: string; date: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 title={title} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
      <Frame9 date={date} />
    </div>
  );
}

function SetNumber({ number, completed }: { number: number; completed: boolean }) {
  return (
    <div 
      className={`${completed ? 'bg-[rgba(0,0,0,0.1)]' : ''} box-border content-stretch flex items-center justify-center px-[14px] py-0 relative rounded-[8px] shrink-0 size-[36px]`}
      data-name="set"
    >
      {!completed && <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />}
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">{number}</p>
      </div>
    </div>
  );
}

function Rep({ value, onChange, completed }: { value: string; onChange: (value: string) => void; completed: boolean }) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${completed ? 'bg-[rgba(0,0,0,0.1)]' : 'bg-gray-700'} box-border content-stretch flex h-[36px] items-center justify-center overflow-clip px-[14px] py-[10px] rounded-[8px] shrink-0 w-[96px] font-['Geist:Regular',sans-serif] font-normal leading-[0] text-[14px] text-center text-white border-none outline-none focus:ring-2 focus:ring-gray-500`}
      data-name="rep"
    />
  );
}

function XIcon({ completed }: { completed: boolean }) {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="x">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="x">
          <path 
            d={svgPathsExercise.p2efb2b00} 
            id="Vector" 
            opacity="0.5" 
            stroke={completed ? "rgba(17, 0, 0, 0.5)" : "white"} 
            strokeLinecap="round" 
            strokeLinejoin="round" 
            strokeWidth="1.5" 
          />
        </g>
      </svg>
    </div>
  );
}

function Weight({ value, onChange, completed }: { value: string; onChange: (value: string) => void; completed: boolean }) {
  return (
    <div className={`${completed ? 'bg-[rgba(0,0,0,0.1)]' : 'bg-gray-700'} box-border content-stretch flex font-['Geist:Regular',sans-serif] font-normal h-[36px] items-center justify-between leading-[0] overflow-clip px-[14px] py-[10px] rounded-[8px] shrink-0 text-[14px] text-nowrap text-white w-[96px]`} data-name="weight">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="flex flex-col justify-center bg-transparent border-none outline-none text-white w-[50px]"
      />
      <div className="flex flex-col justify-center opacity-50 relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">lbs</p>
      </div>
    </div>
  );
}

function RepWeight({ reps, weight, onRepsChange, onWeightChange, completed }: { reps: string; weight: string; onRepsChange: (value: string) => void; onWeightChange: (value: string) => void; completed: boolean }) {
  return (
    <div className="content-stretch flex gap-[30px] items-center relative shrink-0" data-name="rep weight">
      <Rep value={reps} onChange={onRepsChange} completed={completed} />
      <XIcon completed={completed} />
      <Weight value={weight} onChange={onWeightChange} completed={completed} />
    </div>
  );
}

function CheckCircle({ completed, onClick, workoutType }: { completed: boolean; onClick: () => void; workoutType: 'micro' | 'strength' }) {
  const bgColor = completed 
    ? 'bg-[rgba(0,0,0,0.1)]' 
    : (workoutType === 'micro' ? 'bg-green-600' : 'bg-red-600');
  
  return (
    <div 
      onClick={onClick}
      className={`${bgColor} overflow-clip relative rounded-[9999px] shrink-0 size-[36px] cursor-pointer transition`} 
      data-name="Component 2"
    >
      <div className="absolute left-[calc(50%+0.5px)] size-[15px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="check">
        <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
            <g id="check">
              <path d={svgPathsExercise.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
            </g>
          </svg>
        </div>
      </div>
    </div>
  );
}

function ExerciseRow({ 
  setNumber, 
  reps, 
  weight, 
  completed, 
  onRepsChange, 
  onWeightChange, 
  onToggleComplete,
  workoutType
}: { 
  setNumber: number; 
  reps: string; 
  weight: string; 
  completed: boolean; 
  onRepsChange: (value: string) => void; 
  onWeightChange: (value: string) => void; 
  onToggleComplete: () => void;
  workoutType: 'micro' | 'strength';
}) {
  const bgColor = workoutType === 'micro' ? 'bg-green-900' : 'bg-red-900';
  
  return (
    <div className="relative" data-name="row-container">
      {completed && (
        <div className={`absolute ${bgColor} h-[54px] left-1/2 top-0 translate-x-[-50%] w-[445px]`} />
      )}
      <div className="box-border content-stretch flex gap-[20px] items-center px-0 py-[9px] relative rounded-[8px] shrink-0" data-name="row">
        <SetNumber number={setNumber} completed={completed} />
        <RepWeight reps={reps} weight={weight} onRepsChange={onRepsChange} onWeightChange={onWeightChange} completed={completed} />
        <CheckCircle completed={completed} onClick={onToggleComplete} workoutType={workoutType} />
      </div>
    </div>
  );
}

function ExerciseContainer({ exercise, onUpdateSet, workoutType }: { exercise: Exercise; onUpdateSet: (setIndex: number, field: 'reps' | 'weight' | 'completed', value: string | boolean) => void; workoutType: 'micro' | 'strength' }) {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">{exercise.name}</p>
      </div>
      <div className="content-stretch flex flex-col gap-px items-start relative shrink-0" data-name="rows">
        {exercise.sets.map((set, index) => (
          <ExerciseRow
            key={index}
            setNumber={index + 1}
            reps={set.reps}
            weight={set.weight}
            completed={set.completed}
            onRepsChange={(value) => onUpdateSet(index, 'reps', value)}
            onWeightChange={(value) => onUpdateSet(index, 'weight', value)}
            onToggleComplete={() => onUpdateSet(index, 'completed', !set.completed)}
            workoutType={workoutType}
          />
        ))}
      </div>
      <div className="h-[8px] shrink-0 w-full" data-name="Rectangle" />
    </div>
  );
}

function NotesSection({ notes, onChange }: { notes: string; onChange: (value: string) => void }) {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0 w-full md:w-[388px]" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Notes</p>
      <div className="relative rounded-[6px] shrink-0 w-full" data-name="container">
        <textarea
          value={notes}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Start typing..."
          className="w-full bg-transparent border border-gray-600 rounded-[6px] px-[16px] py-[22px] text-white font-['Geist:Regular',sans-serif] text-[18px] leading-[20px] min-h-[160px] resize-none outline-none focus:border-gray-500 placeholder:opacity-50"
        />
      </div>
    </div>
  );
}

function Frame4({ onMarkComplete, isCompleted, workoutType }: { onMarkComplete: () => void; isCompleted?: boolean; workoutType: 'micro' | 'strength' }) {
  const buttonBgColor = isCompleted 
    ? (workoutType === 'micro' ? 'bg-green-600' : 'bg-red-600')
    : 'bg-gray-700';
  const buttonText = isCompleted ? 'Completed' : 'Mark complete';
  const hoverClass = isCompleted ? '' : 'hover:bg-gray-600';
  
  return (
    <div 
      onClick={onMarkComplete}
      className={`${buttonBgColor} h-[50px] relative rounded-[10px] shrink-0 w-full md:w-[388px] cursor-pointer ${hoverClass} transition`}
    >
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[50px] items-center justify-center px-[27px] py-[14px] relative w-full">
          <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] md:text-[16px] text-center text-nowrap text-white whitespace-pre">{buttonText}</p>
        </div>
      </div>
    </div>
  );
}

export function MicroStrengthModal({
  isOpen,
  onClose,
  onMarkComplete,
  workoutType,
  title,
  date,
  exercises: initialExercises,
  description,
  isCompleted
}: MicroStrengthModalProps) {
  const [exercises, setExercises] = useState(initialExercises);
  const [notes, setNotes] = useState('');
  
  useEffect(() => {
    setExercises(initialExercises);
  }, [initialExercises]);
  
  // Auto-save notes
  useEffect(() => {
    const timer = setTimeout(() => {
      // In a real app, this would save to backend or local storage
      console.log('Auto-saving notes:', notes);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [notes]);
  
  const handleUpdateSet = (exerciseIndex: number, setIndex: number, field: 'reps' | 'weight' | 'completed', value: string | boolean) => {
    setExercises(prev => {
      const newExercises = [...prev];
      const exercise = { ...newExercises[exerciseIndex] };
      const sets = [...exercise.sets];
      sets[setIndex] = { ...sets[setIndex], [field]: value };
      exercise.sets = sets;
      newExercises[exerciseIndex] = exercise;
      return newExercises;
    });
  };
  
  if (!isOpen) return null;
  
  const bgColor = workoutType === 'micro' ? 'bg-green-900' : 'bg-red-900';
  
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-hidden rounded-[10px] w-full max-w-[428px] max-h-[90vh]" data-name="types">
        <Frame11 title={title} date={date} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
        
        <div className="overflow-y-auto w-full flex-1">
          <div className="box-border content-stretch flex flex-col gap-[50px] items-start pb-[20px] pt-[16px] px-[20px] relative shrink-0">
            {/* Exercises Section */}
            <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0" data-name="notes">
              <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Exercises</p>
              {exercises.map((exercise, index) => (
                <ExerciseContainer
                  key={index}
                  exercise={exercise}
                  onUpdateSet={(setIndex, field, value) => handleUpdateSet(index, setIndex, field, value)}
                  workoutType={workoutType}
                />
              ))}
            </div>
            
            {/* Description Section */}
            <div className="content-stretch flex flex-col font-normal gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
              <p className="font-['Geist_Mono:Regular',sans-serif] leading-[1.3] min-w-full opacity-50 relative shrink-0 text-[13px] text-white w-[min-content]">Description</p>
              <div className="flex flex-col font-['Geist:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#f8fafd] text-[18px] w-full">
                <p className="leading-[1.5]">{description}</p>
              </div>
            </div>
            
            {/* Notes Section */}
            <NotesSection notes={notes} onChange={setNotes} />
          </div>
        </div>
        
        {/* Bottom Button */}
        <div className="bg-gray-800 box-border content-stretch flex flex-col gap-[10px] items-start pb-[20px] pt-0 px-[20px] relative shrink-0 w-full">
          <Frame4 onMarkComplete={onMarkComplete} isCompleted={isCompleted} workoutType={workoutType} />
        </div>
      </div>
    </div>
  );
}