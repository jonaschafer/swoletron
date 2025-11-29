import { useState } from 'react';
import svgPaths from "./imports/svg-da2r1zm9to";
import checkedSvgPaths from "./imports/svg-checked";
import { WorkoutModal } from "./components/WorkoutModal";
import { MicroStrengthModal } from "./components/MicroStrengthModal";

// ========== RUN CARDS =========
// Desktop Run Card Components
function RunDesktopTitle() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Hills</p>
      </div>
    </div>
  );
}

function RunDesktopCheckUnchecked() {
  return (
    <div className="absolute left-[126px] size-[15px] top-[16px]" data-name="check">
      <div className="absolute inset-[-3.75%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <g id="check">
            <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RunDesktopCheckChecked() {
  return (
    <div className="absolute left-[126px] size-[15px] top-[16px]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check">
            <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RunDesktopFrame({ checked }: { checked: boolean }) {
  return (
    <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <RunDesktopTitle />
          {checked ? <RunDesktopCheckChecked /> : <RunDesktopCheckUnchecked />}
        </div>
      </div>
    </div>
  );
}

function RunDesktopDate() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Sun, Nov 5</p>
    </div>
  );
}

function RunDesktopFrame1({ checked }: { checked: boolean }) {
  return (
    <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <RunDesktopDate />
        </div>
      </div>
    </div>
  );
}

function RunDesktopDistance() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">6 miles</p>
    </div>
  );
}

function RunDesktopFrame2({ checked }: { checked: boolean }) {
  return (
    <div className={`${checked ? 'bg-[#1d4ed8]' : 'bg-[#2e50b4]'} relative shrink-0 w-full`}>
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <RunDesktopDistance />
        </div>
      </div>
    </div>
  );
}

function RunDesktopFrame5({ checked }: { checked: boolean }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <RunDesktopFrame checked={checked} />
      <RunDesktopFrame1 checked={checked} />
      <RunDesktopFrame2 checked={checked} />
    </div>
  );
}

function RunDesktopCard({ checked, onClick }: { checked: boolean; onClick: () => void }) {
  return (
    <div 
      onClick={onClick}
      className={`${checked ? 'bg-[#1f2937]' : 'bg-[#1f3a8a]'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[165px] cursor-pointer`} 
      data-name="types"
    >
      <RunDesktopFrame5 checked={checked} />
    </div>
  );
}

// Mobile Run Card Components
function RunMobileTitle() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Hills</p>
      </div>
    </div>
  );
}

function RunMobileCheckUnchecked() {
  return (
    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]" data-name="check">
      <div className="absolute inset-[-3.75%]">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
          <g id="check">
            <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RunMobileCheckChecked() {
  return (
    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check">
            <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function RunMobileFrame({ checked, onCircleClick }: { checked: boolean; onCircleClick: () => void }) {
  return (
    <div 
      onClick={(e) => {
        e.stopPropagation();
        onCircleClick();
      }}
      className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
    >
      {checked ? <RunMobileCheckChecked /> : <RunMobileCheckUnchecked />}
    </div>
  );
}

function RunMobileFrame1({ checked, onCircleClick }: { checked: boolean; onCircleClick: () => void }) {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
      <RunMobileFrame checked={checked} onCircleClick={onCircleClick} />
    </div>
  );
}

function RunMobileFrame2({ checked, onCircleClick }: { checked: boolean; onCircleClick: () => void }) {
  return (
    <div className={`${checked ? '' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
          <RunMobileTitle />
          <RunMobileFrame1 checked={checked} onCircleClick={onCircleClick} />
        </div>
      </div>
    </div>
  );
}

function RunMobileDate() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Sun, Nov 5</p>
    </div>
  );
}

function RunMobileFrame3({ checked }: { checked: boolean }) {
  return (
    <div className={`${checked ? '' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
          <RunMobileDate />
        </div>
      </div>
    </div>
  );
}

function RunMobileDistance() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">6 miles</p>
    </div>
  );
}

function RunMobileFrame4({ checked }: { checked: boolean }) {
  return (
    <div className={`${checked ? '' : 'bg-[#2e50b4]'} relative shrink-0 w-full`}>
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
          <RunMobileDistance />
        </div>
      </div>
    </div>
  );
}

function RunMobileFrame7({ checked, onCircleClick }: { checked: boolean; onCircleClick: () => void }) {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <RunMobileFrame2 checked={checked} onCircleClick={onCircleClick} />
      <RunMobileFrame3 checked={checked} />
      <RunMobileFrame4 checked={checked} />
    </div>
  );
}

function RunMobileCard({ checked, onCircleClick, onCardClick }: { checked: boolean; onCircleClick: () => void; onCardClick: () => void }) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px] cursor-pointer`} 
      data-name="types"
    >
      <RunMobileFrame7 checked={checked} onCircleClick={onCircleClick} />
    </div>
  );
}

// Mobile Micro Card Components (similar structure with micro colors)
function MicroMobileCard({ checked, onCircleClick, onCardClick }: { checked: boolean; onCircleClick: () => void; onCardClick: () => void }) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-green-600' : 'bg-green-900'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className={`${checked ? '' : 'bg-green-900'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">ITBS, Hip Flexors</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCircleClick();
                  }}
                  className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
                >
                  {checked ? (
                    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
                          <g><path d={checkedSvgPaths.pe1d9c80} stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" /></g>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                      <div className="absolute inset-[-3.75%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                          <g><path d={svgPaths.p232d3540} opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" /></g>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`${checked ? '' : 'bg-green-900'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Wed, Nov 5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Strength Card Components (similar structure with strength colors)
function StrengthMobileCard({ checked, onCircleClick, onCardClick }: { checked: boolean; onCircleClick: () => void; onCardClick: () => void }) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-red-600' : 'bg-red-900'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className={`${checked ? '' : 'bg-red-900'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">Lower body</p>
                </div>
              </div>
              <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
                <div 
                  onClick={(e) => {
                    e.stopPropagation();
                    onCircleClick();
                  }}
                  className="overflow-clip relative rounded-[6px] shrink-0 size-[36px] cursor-pointer"
                >
                  {checked ? (
                    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
                          <g><path d={checkedSvgPaths.pe1d9c80} stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" /></g>
                        </svg>
                      </div>
                    </div>
                  ) : (
                    <div className="absolute right-[2px] size-[15px] top-[calc(50%-0.5px)] translate-y-[-50%]">
                      <div className="absolute inset-[-3.75%]">
                        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                          <g><path d={svgPaths.p232d3540} opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" /></g>
                        </svg>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`${checked ? '' : 'bg-red-900'} relative shrink-0 w-full`}>
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Sun, Nov 5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Rest Card Components
function RestMobileCard() {
  return (
    <div 
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[300px]" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex items-center justify-between p-[20px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[21px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">Rest</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-row items-center size-full">
            <div className="box-border content-stretch flex gap-[20px] items-center px-[20px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Sun, Nov 5</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function App() {
  const [view, setView] = useState<'mobile' | 'desktop'>('mobile');
  const [cardType, setCardType] = useState<'run' | 'micro' | 'strength' | 'rest'>('run');
  const [checked, setChecked] = useState(false);
  const [showDayView, setShowDayView] = useState(false);
  const [showWeekView, setShowWeekView] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#0f172a] flex flex-col items-center justify-center p-8 gap-8">
      {/* View Mode Toggle */}
      <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
        <button
          onClick={() => {
            setShowDayView(false);
            setShowWeekView(false);
          }}
          className={`px-4 py-2 rounded-md transition ${
            !showDayView && !showWeekView
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Individual Cards
        </button>
        <button
          onClick={() => {
            setShowDayView(true);
            setShowWeekView(false);
          }}
          className={`px-4 py-2 rounded-md transition ${
            showDayView && !showWeekView
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Mobile Day View
        </button>
        <button
          onClick={() => {
            setShowDayView(false);
            setShowWeekView(true);
          }}
          className={`px-4 py-2 rounded-md transition ${
            showWeekView
              ? 'bg-blue-600 text-white' 
              : 'text-gray-400 hover:text-white'
          }`}
        >
          Desktop Week View
        </button>
      </div>

      {showWeekView ? (
        <DesktopWeekView />
      ) : !showDayView ? (
        <>
          {/* Card Type Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => {
                setCardType('run');
                setChecked(false);
              }}
              className={`px-4 py-2 rounded-md transition ${
                cardType === 'run' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Run
            </button>
            <button
              onClick={() => {
                setCardType('micro');
                setChecked(false);
              }}
              className={`px-4 py-2 rounded-md transition ${
                cardType === 'micro' 
                  ? 'bg-green-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Micro
            </button>
            <button
              onClick={() => {
                setCardType('strength');
                setChecked(false);
              }}
              className={`px-4 py-2 rounded-md transition ${
                cardType === 'strength' 
                  ? 'bg-red-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Strength
            </button>
            <button
              onClick={() => {
                setCardType('rest');
                setChecked(false);
              }}
              className={`px-4 py-2 rounded-md transition ${
                cardType === 'rest' 
                  ? 'bg-gray-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Rest
            </button>
          </div>

          {/* View Toggle */}
          <div className="flex gap-2 bg-gray-800 p-1 rounded-lg">
            <button
              onClick={() => setView('mobile')}
              className={`px-4 py-2 rounded-md transition ${
                view === 'mobile' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Mobile
            </button>
            <button
              onClick={() => setView('desktop')}
              className={`px-4 py-2 rounded-md transition ${
                view === 'desktop' 
                  ? 'bg-blue-600 text-white' 
                  : 'text-gray-400 hover:text-white'
              }`}
            >
              Desktop
            </button>
          </div>

          {/* Card display */}
          <div className="flex items-center justify-center">
            {cardType === 'run' ? (
              view === 'mobile' ? (
                <RunMobileCard 
                  checked={checked} 
                  onCircleClick={() => setChecked(!checked)}
                  onCardClick={() => setModalOpen(true)}
                />
              ) : (
                <RunDesktopCard checked={checked} onClick={() => setChecked(!checked)} />
              )
            ) : cardType === 'micro' ? (
              view === 'mobile' ? (
                <MicroMobileCard 
                  checked={checked} 
                  onCircleClick={() => setChecked(!checked)}
                  onCardClick={() => setModalOpen(true)}
                />
              ) : (
                <RunDesktopCard checked={checked} onClick={() => setChecked(!checked)} />
              )
            ) : cardType === 'strength' ? (
              view === 'mobile' ? (
                <StrengthMobileCard 
                  checked={checked} 
                  onCircleClick={() => setChecked(!checked)}
                  onCardClick={() => setModalOpen(true)}
                />
              ) : (
                <RunDesktopCard checked={checked} onClick={() => setChecked(!checked)} />
              )
            ) : (
              view === 'mobile' ? (
                <RestMobileCard />
              ) : (
                <RunDesktopCard checked={false} onClick={() => {}} />
              )
            )}
          </div>

          {/* Info */}
          <div className="text-gray-400 text-sm text-center">
            <p className="mb-2 text-white">{cardType === 'run' ? 'Run Workout' : cardType === 'micro' ? 'Micro Workout' : cardType === 'strength' ? 'Strength Workout' : 'Rest Day'}</p>
            {view === 'mobile' ? (
              <div>
                <p>Mobile: 300px wide, 21px title, 20px padding</p>
                <p>Circle in 36px icon box</p>
                <p className="mt-2 text-blue-400">Click circle to toggle, card to open modal</p>
              </div>
            ) : (
              <div>
                <p>Desktop: 165px wide, 17px title, 14px/16px padding</p>
                <p>Circle absolutely positioned</p>
                <p className="mt-2 text-blue-400">Click the card to toggle completion</p>
              </div>
            )}
          </div>

          <WorkoutModal
            isOpen={modalOpen}
            onClose={() => setModalOpen(false)}
            onMarkComplete={() => setChecked(!checked)}
            workoutType={cardType as 'run' | 'micro' | 'strength'}
            title={cardType === 'run' ? 'Hills' : cardType === 'micro' ? 'ITBS, Hip Flexors' : 'Lower body'}
            date="Tue, Nov 4"
            distance={cardType === 'run' ? '9 miles' : undefined}
            description={['Belmont hill repeats', '4-6×90sec @ RPE 7', '2 mi WU/CD']}
            isCompleted={checked}
          />
        </>
      ) : (
        <MobileDayView />
      )}
    </div>
  );
}

function MobileDayView() {
  const [workouts, setWorkouts] = useState({
    run: false,
    micro: false,
    strength: false
  });
  const [modalOpen, setModalOpen] = useState<'run' | 'micro' | 'strength' | null>(null);

  return (
    <>
      <div className="flex flex-col gap-4 w-full max-w-[300px]">
        <div className="flex justify-start mb-4">
          <DateHeader />
        </div>
        
        <div className="flex flex-col gap-3">
          <RunMobileCard 
            checked={workouts.run} 
            onCircleClick={() => setWorkouts({...workouts, run: !workouts.run})}
            onCardClick={() => setModalOpen('run')}
          />
          <MicroMobileCard 
            checked={workouts.micro} 
            onCircleClick={() => setWorkouts({...workouts, micro: !workouts.micro})}
            onCardClick={() => setModalOpen('micro')}
          />
          <StrengthMobileCard 
            checked={workouts.strength} 
            onCircleClick={() => setWorkouts({...workouts, strength: !workouts.strength})}
            onCardClick={() => setModalOpen('strength')}
          />
          <RestMobileCard />
        </div>
      </div>

      <WorkoutModal
        isOpen={modalOpen === 'run'}
        onClose={() => setModalOpen(null)}
        onMarkComplete={() => setWorkouts({...workouts, run: !workouts.run})}
        workoutType="run"
        title="Hills"
        date="Tue, Nov 4"
        distance="9 miles"
        description={['Belmont hill repeats', '4-6×90sec @ RPE 7', '2 mi WU/CD']}
        isCompleted={workouts.run}
      />
      <MicroStrengthModal
        isOpen={modalOpen === 'micro'}
        onClose={() => setModalOpen(null)}
        onMarkComplete={() => setWorkouts({...workouts, micro: !workouts.micro})}
        workoutType="micro"
        title="ITBS, Hip Flexors"
        date="Wed, Nov 5"
        exercises={[
          {
            name: 'Plank with shoulder taps',
            sets: [
              { reps: '16', weight: '195', completed: false },
              { reps: '16', weight: '195', completed: false },
              { reps: '16', weight: '195', completed: false }
            ]
          }
        ]}
        description="Group run with the fellas at TTT. This week see about doing hill repeats on Stairway and Hell, with stairs. Go for 3 repeats."
        isCompleted={workouts.micro}
      />
      <MicroStrengthModal
        isOpen={modalOpen === 'strength'}
        onClose={() => setModalOpen(null)}
        onMarkComplete={() => setWorkouts({...workouts, strength: !workouts.strength})}
        workoutType="strength"
        title="Lower body"
        date="Sun, Nov 5"
        exercises={[
          {
            name: 'Squats',
            sets: [
              { reps: '10', weight: '225', completed: false },
              { reps: '10', weight: '225', completed: false },
              { reps: '10', weight: '225', completed: false }
            ]
          }
        ]}
        description="Focus on lower body strength. Keep form tight and controlled throughout each rep."
        isCompleted={workouts.strength}
      />
    </>
  );
}

function DateHeader() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start leading-[1.3] relative text-nowrap text-white whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">Mon</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">3</p>
    </div>
  );
}

// Desktop Week View Component
function DesktopWeekView() {
  const [workouts, setWorkouts] = useState({
    mon: { micro: false, rest: false },
    tue: { run: false, strength: false },
    wed: { run: false, micro: false },
    thu: { run: false, strength: false },
    fri: { run: false },
    sat: { rest: false },
    sun: { run: false }
  });
  const [modalOpen, setModalOpen] = useState<{type: 'run' | 'micro' | 'strength', day: string, title: string, date: string, distance?: string} | null>(null);

  return (
    <>
      <div className="w-full overflow-x-auto">
        <div className="min-w-max flex gap-0 bg-gray-900 p-8">
          {/* Monday - Column 1 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">Mon</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">3</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
              <MicroDesktopCard
                checked={workouts.mon.micro}
                onCheckClick={() => setWorkouts({...workouts, mon: {...workouts.mon, micro: !workouts.mon.micro}})}
                onCardClick={() => setModalOpen({type: 'micro', day: 'mon', title: 'Ankle, core, ITBS', date: 'Mon, Nov 3'})}
                title="Ankle, core, ITBS"
                date="Mon, Nov 3"
              />
              <RestDesktopCard date="Mon, Nov 3" />
            </div>
          </div>

          {/* Tuesday - Column 2 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">tue</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">4</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
              <RunDesktopCardDynamic
                checked={workouts.tue.run}
                onCheckClick={() => setWorkouts({...workouts, tue: {...workouts.tue, run: !workouts.tue.run}})}
                onCardClick={() => setModalOpen({type: 'run', day: 'tue', title: 'Hills', date: 'Tue, Nov 4', distance: '9 miles'})}
                title="Hills"
                date="Tue, Nov 4"
                distance="9 miles"
              />
              <StrengthDesktopCard
                checked={workouts.tue.strength}
                onCheckClick={() => setWorkouts({...workouts, tue: {...workouts.tue, strength: !workouts.tue.strength}})}
                onCardClick={() => setModalOpen({type: 'strength', day: 'tue', title: 'Lower body', date: 'Tue, Nov 4'})}
                title="Lower body"
                date="Tue, Nov 4"
              />
            </div>
          </div>

          {/* Wednesday - Column 3 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">wed</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">5</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
              <RunDesktopCardDynamic
                checked={workouts.wed.run}
                onCheckClick={() => setWorkouts({...workouts, wed: {...workouts.wed, run: !workouts.wed.run}})}
                onCardClick={() => setModalOpen({type: 'run', day: 'wed', title: 'Easy', date: 'Wed, Nov 5', distance: '6 miles'})}
                title="Easy"
                date="Wed, Nov 5"
                distance="6 miles"
              />
              <MicroDesktopCard
                checked={workouts.wed.micro}
                onCheckClick={() => setWorkouts({...workouts, wed: {...workouts.wed, micro: !workouts.wed.micro}})}
                onCardClick={() => setModalOpen({type: 'micro', day: 'wed', title: 'ITBS, Hip Flexors', date: 'Wed, Nov 5'})}
                title="ITBS, Hip Flexors"
                date="Wed, Nov 5"
              />
            </div>
          </div>

          {/* Thursday - Column 4 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">thu</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">6</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
              <RunDesktopCardDynamic
                checked={workouts.thu.run}
                onCheckClick={() => setWorkouts({...workouts, thu: {...workouts.thu, run: !workouts.thu.run}})}
                onCardClick={() => setModalOpen({type: 'run', day: 'thu', title: 'Intervals', date: 'Thu, Nov 6', distance: '7 miles'})}
                title="Intervals"
                date="Thu, Nov 6"
                distance="7 miles"
              />
              <StrengthDesktopCard
                checked={workouts.thu.strength}
                onCheckClick={() => setWorkouts({...workouts, thu: {...workouts.thu, strength: !workouts.thu.strength}})}
                onCardClick={() => setModalOpen({type: 'strength', day: 'thu', title: 'Upper body', date: 'Thu, Nov 6'})}
                title="Upper body"
                date="Thu, Nov 6"
              />
            </div>
          </div>

          {/* Friday - Column 5 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">fri</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">7</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-1/2 top-[66px] translate-x-[-50%] w-[155px]">
              <RunDesktopCardDynamic
                checked={workouts.fri.run}
                onCheckClick={() => setWorkouts({...workouts, fri: {...workouts.fri, run: !workouts.fri.run}})}
                onCardClick={() => setModalOpen({type: 'run', day: 'fri', title: 'Easy', date: 'Fri, Nov 7', distance: '4 miles'})}
                title="Easy"
                date="Fri, Nov 7"
                distance="4 miles"
              />
            </div>
          </div>

          {/* Saturday - Column 6 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-1/2 text-nowrap text-white top-0 translate-x-[-50%] w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">sat</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">8</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
              <RestDesktopCard date="Sat, Nov 8" />
            </div>
          </div>

          {/* Sunday - Column 7 */}
          <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
            <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-1/2 text-nowrap text-white top-0 translate-x-[-50%] w-[157px] whitespace-pre">
              <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">sun</p>
              <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">9</p>
            </div>
            <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-1/2 top-[66px] translate-x-[-50%] w-[155px]">
              <RunDesktopCardDynamic
                checked={workouts.sun.run}
                onCheckClick={() => setWorkouts({...workouts, sun: {...workouts.sun, run: !workouts.sun.run}})}
                onCardClick={() => setModalOpen({type: 'run', day: 'sun', title: 'Long', date: 'Sun, Nov 9', distance: '15 miles'})}
                title="Long"
                date="Sun, Nov 9"
                distance="15 miles"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      {modalOpen?.type === 'run' && (
        <WorkoutModal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          onMarkComplete={() => {
            const day = modalOpen.day as keyof typeof workouts;
            setWorkouts({...workouts, [day]: {...workouts[day], run: !workouts[day].run}});
          }}
          workoutType="run"
          title={modalOpen.title}
          date={modalOpen.date}
          distance={modalOpen.distance}
          description={['Belmont hill repeats', '4-6×90sec @ RPE 7', '2 mi WU/CD']}
          isCompleted={workouts[modalOpen.day as keyof typeof workouts].run as boolean}
        />
      )}
      {(modalOpen?.type === 'micro' || modalOpen?.type === 'strength') && (
        <MicroStrengthModal
          isOpen={true}
          onClose={() => setModalOpen(null)}
          onMarkComplete={() => {
            const day = modalOpen.day as keyof typeof workouts;
            const workoutType = modalOpen.type as 'micro' | 'strength';
            setWorkouts({...workouts, [day]: {...workouts[day], [workoutType]: !workouts[day][workoutType]}});
          }}
          workoutType={modalOpen.type}
          title={modalOpen.title}
          date={modalOpen.date}
          exercises={[
            {
              name: modalOpen.type === 'micro' ? 'Plank with shoulder taps' : 'Squats',
              sets: [
                { reps: '16', weight: '195', completed: false },
                { reps: '16', weight: '195', completed: false },
                { reps: '16', weight: '195', completed: false }
              ]
            }
          ]}
          description={modalOpen.type === 'micro' ? 'Group run with the fellas at TTT. This week see about doing hill repeats on Stairway and Hell, with stairs. Go for 3 repeats.' : 'Focus on form and controlled movements throughout each rep.'}
          isCompleted={workouts[modalOpen.day as keyof typeof workouts][modalOpen.type] as boolean}
        />
      )}
    </>
  );
}

// ========== DESKTOP CARDS =========
// Desktop Micro Card Components
function MicroDesktopCard({ 
  checked, 
  onCheckClick,
  onCardClick, 
  title, 
  date 
}: { 
  checked: boolean; 
  onCheckClick: () => void;
  onCardClick: () => void; 
  title: string; 
  date: string; 
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-green-600' : 'bg-green-900'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">{title}</p>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckClick();
                }}
                className="absolute left-[126px] size-[15px] top-[16px] cursor-pointer" 
                data-name="check"
              >
                <div className="absolute inset-[-3.75%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    <g id="check">
                      {checked ? (
                        <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
                      ) : (
                        <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop Strength Card Components
function StrengthDesktopCard({ 
  checked, 
  onCheckClick,
  onCardClick, 
  title, 
  date 
}: { 
  checked: boolean; 
  onCheckClick: () => void;
  onCardClick: () => void; 
  title: string; 
  date: string; 
}) {
  return (
    <div 
      onClick={onCardClick}
      className={`${checked ? 'bg-red-600' : 'bg-red-900'} content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px] cursor-pointer`} 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">{title}</p>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckClick();
                }}
                className="absolute left-[126px] size-[15px] top-[16px] cursor-pointer" 
                data-name="check"
              >
                <div className="absolute inset-[-3.75%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    <g id="check">
                      {checked ? (
                        <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
                      ) : (
                        <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Desktop Rest Card Components
function RestDesktopCard({ date }: { date: string }) {
  return (
    <div 
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px]" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className="relative shrink-0 w-full">
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Rest</p>
              </div>
            </div>
          </div>
        </div>
        <div className="relative shrink-0 w-full">
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Updated RunDesktopCard to accept dynamic content
function RunDesktopCardDynamic({ 
  checked, 
  onCheckClick,
  onCardClick, 
  title, 
  date, 
  distance 
}: { 
  checked: boolean; 
  onCheckClick: () => void;
  onCardClick: () => void; 
  title: string; 
  date: string; 
  distance: string; 
}) {
  return (
    <div 
      onClick={onCardClick}
      className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] w-[155px] cursor-pointer" 
      data-name="types"
    >
      <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
        <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="size-full">
            <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
                <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
                  <p className="leading-[1.3] whitespace-pre">{title}</p>
                </div>
              </div>
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  onCheckClick();
                }}
                className="absolute left-[126px] size-[15px] top-[16px] cursor-pointer" 
                data-name="check"
              >
                <div className="absolute inset-[-3.75%]">
                  <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 17 17">
                    <g id="check">
                      {checked ? (
                        <path d={checkedSvgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
                      ) : (
                        <path d={svgPaths.p232d3540} id="circle" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.125" />
                      )}
                    </g>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className={`${checked ? 'bg-[#2563eb]' : 'bg-[#1f3a8a]'} relative shrink-0 w-full`}>
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{date}</p>
              </div>
            </div>
          </div>
        </div>
        <div className={`${checked ? 'bg-[#1d4ed8]' : 'bg-[#172859]'} relative shrink-0 w-full`}>
          <div className="flex flex-col justify-center size-full">
            <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
              <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
                <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">{distance}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}