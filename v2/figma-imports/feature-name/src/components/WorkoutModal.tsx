import svgPaths from "../imports/svg-ffy23aemzk";
import svgPathsCompleted from "../imports/svg-hrt1ddwggo";
import { Calendar } from "lucide-react";
import { useState, useEffect } from "react";

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onMarkComplete: () => void;
  workoutType: 'run' | 'micro' | 'strength';
  title: string;
  date: string;
  distance?: string;
  description: string[];
  isCompleted?: boolean;
}

function Frame2({ distance, isCompleted }: { distance?: string; isCompleted?: boolean }) {
  if (!distance) return null;
  
  const bgColor = isCompleted ? 'bg-[#1139b0]' : 'bg-[#172859]';
  
  return (
    <div className={`${bgColor} box-border content-stretch flex flex-col gap-[10px] h-[36px] items-start justify-center overflow-clip p-[10px] relative rounded-[6px] shrink-0`}>
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{distance}</p>
    </div>
  );
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

function Frame5({ distance, onClose, isCompleted }: { distance?: string; onClose: () => void; isCompleted?: boolean }) {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center right-[20px] top-[20px]">
      <Frame2 distance={distance} isCompleted={isCompleted} />
      <Frame3 onClose={onClose} isCompleted={isCompleted} />
    </div>
  );
}

function Frame8({ title, distance, onClose, bgColor, isCompleted }: { title: string; distance?: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  const headerBgColor = isCompleted 
    ? (bgColor === 'bg-[#1f3a8a]' ? 'bg-blue-600' : bgColor === 'bg-green-900' ? 'bg-green-600' : 'bg-red-600')
    : bgColor;
  
  return (
    <div className={`${headerBgColor} h-[76px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full`}>
      <Frame5 distance={distance} onClose={onClose} isCompleted={isCompleted} />
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

function Frame11({ title, date, distance, onClose, bgColor, isCompleted }: { title: string; date: string; distance?: string; onClose: () => void; bgColor: string; isCompleted?: boolean }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 title={title} distance={distance} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
      <Frame9 date={date} />
    </div>
  );
}

function Notes({ description }: { description: string[] }) {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Description</p>
      <div className="flex flex-col font-['Geist:Regular',sans-serif] justify-center leading-[1.5] relative shrink-0 text-[#f8fafd] text-[16px] md:text-[18px] w-full">
        {description.map((line, index) => (
          <p key={index} className={index === description.length - 1 ? '' : 'mb-0'}>{line}</p>
        ))}
      </div>
    </div>
  );
}

function Container() {
  const [notes, setNotes] = useState('');
  const [saveStatus, setSaveStatus] = useState<'saving' | 'saved' | null>(null);

  useEffect(() => {
    if (notes.length === 0) {
      setSaveStatus(null);
      return;
    }

    // Show "saving..." immediately when typing
    setSaveStatus('saving');

    // After 1 second of no typing, show "saved"
    const timer = setTimeout(() => {
      setSaveStatus('saved');
    }, 1000);

    return () => clearTimeout(timer);
  }, [notes]);

  return (
    <div className="relative rounded-[6px] shrink-0 w-full" data-name="container">
      {/* Save status indicator */}
      {saveStatus && (
        <div className="absolute top-[-24px] right-0 text-[13px] font-['Geist_Mono:Regular',sans-serif]">
          {saveStatus === 'saving' ? (
            <span className="text-gray-400">saving...</span>
          ) : (
            <span className="text-green-400">✓ Saved</span>
          )}
        </div>
      )}
      
      <div className="overflow-clip rounded-[inherit] size-full">
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Start typing..."
          className="box-border w-full resize-none bg-transparent text-white font-['Geist:Regular',sans-serif] text-[16px] md:text-[18px] leading-[20px] pb-[118px] pl-[16px] pr-[20px] pt-[22px] outline-none placeholder:opacity-50"
          rows={1}
        />
      </div>
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px]" />
    </div>
  );
}

function Notes1() {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Notes</p>
      <Container />
    </div>
  );
}

function Frame6({ description }: { description: string[] }) {
  return (
    <div className="box-border content-stretch flex flex-col gap-[50px] items-start pb-[70px] pt-[16px] px-[20px] relative shrink-0 w-[343px] md:w-[428px]">
      <Notes description={description} />
      <Notes1 />
    </div>
  );
}

function Frame4({ onMarkComplete, isCompleted, workoutType }: { onMarkComplete: () => void; isCompleted?: boolean; workoutType: string }) {
  const buttonBgColor = isCompleted 
    ? (workoutType === 'run' ? 'bg-blue-600' : workoutType === 'micro' ? 'bg-green-600' : 'bg-red-600')
    : 'bg-gray-700';
  const buttonText = isCompleted ? 'Completed' : 'Mark complete';
  const hoverClass = isCompleted ? '' : 'hover:bg-gray-600';
  
  return (
    <div 
      onClick={onMarkComplete}
      className={`${buttonBgColor} h-[50px] relative rounded-[10px] shrink-0 w-full cursor-pointer ${hoverClass} transition`}
    >
      <div className="flex flex-row items-center justify-center overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] h-[50px] items-center justify-center px-[27px] py-[14px] relative w-full">
          <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] md:text-[16px] text-center text-nowrap text-white whitespace-pre">{buttonText}</p>
        </div>
      </div>
    </div>
  );
}

function Frame7({ onMarkComplete, isCompleted, workoutType }: { onMarkComplete: () => void; isCompleted?: boolean; workoutType: string }) {
  return (
    <div className="bg-gray-800 box-border content-stretch flex flex-col gap-[10px] items-start pb-[20px] pt-0 px-[20px] relative shrink-0 w-[343px] md:w-[428px]">
      <Frame4 onMarkComplete={onMarkComplete} isCompleted={isCompleted} workoutType={workoutType} />
    </div>
  );
}

export function WorkoutModal({ isOpen, onClose, onMarkComplete, workoutType, title, date, distance, description, isCompleted }: WorkoutModalProps) {
  if (!isOpen) return null;

  const bgColor = workoutType === 'run' 
    ? 'bg-[#1f3a8a]' 
    : workoutType === 'micro' 
    ? 'bg-green-900' 
    : 'bg-red-900';

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div 
        onClick={(e) => e.stopPropagation()}
        className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] max-w-[343px] md:max-w-[428px] w-full" 
        data-name="types"
      >
        <Frame11 title={title} date={date} distance={distance} onClose={onClose} bgColor={bgColor} isCompleted={isCompleted} />
        <Frame6 description={description} />
        <Frame7 onMarkComplete={onMarkComplete} isCompleted={isCompleted} workoutType={workoutType} />
      </div>
    </div>
  );
}