import svgPaths from "./svg-u8dlhbe1ua";

function Frame17() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Ankle, core, ITBS</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute left-[12px] size-[23.57px] top-0" data-name="Frame">
      <div className="absolute bottom-[-1.82%] left-[-2.73%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 25 24">
          <g id="Frame">
            <g id="Frame_2"></g>
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="relative rounded-[6px] shrink-0 size-[36px]">
      <Frame />
    </div>
  );
}

function Frame6() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
      <Frame3 />
    </div>
  );
}

function Frame9() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame17 />
          <Frame6 />
        </div>
      </div>
    </div>
  );
}

function Frame12() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Mon, Nov 3</p>
    </div>
  );
}

function Frame10() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame12 />
        </div>
      </div>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame9 />
      <Frame10 />
    </div>
  );
}

function Check() {
  return (
    <div className="absolute right-[13.64px] size-[15px] top-[16px]" data-name="check">
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

function Types() {
  return (
    <div className="bg-green-900 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] shrink-0 w-full" data-name="types">
      <Frame11 />
      <Check />
    </div>
  );
}

function Frame18() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Rest</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="absolute left-[12px] size-[23.57px] top-0" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Frame">
          <path d={svgPaths.p135f5280} id="Vector" opacity="0" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
        </g>
      </svg>
    </div>
  );
}

function Frame4() {
  return (
    <div className="overflow-clip relative rounded-[6px] shrink-0 size-[36px]">
      <Frame1 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
      <Frame4 />
    </div>
  );
}

function Frame14() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame18 />
          <Frame7 />
        </div>
      </div>
    </div>
  );
}

function Frame15() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Mon, Nov 3</p>
    </div>
  );
}

function Frame16() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame15 />
        </div>
      </div>
    </div>
  );
}

function Frame19() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame14 />
      <Frame16 />
    </div>
  );
}

function Types1() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] shrink-0 w-full" data-name="types">
      <Frame19 />
    </div>
  );
}

function Frame30() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
      <Types />
      <Types1 />
    </div>
  );
}

function Date() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">Mon</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">3</p>
    </div>
  );
}

function Frame20() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Frame30 />
      <Date />
    </div>
  );
}

function Frame31() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Hills</p>
      </div>
    </div>
  );
}

function Check1() {
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

function Frame32() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame31 />
          <Check1 />
        </div>
      </div>
    </div>
  );
}

function Frame33() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Tue, Nov 4</p>
    </div>
  );
}

function Frame34() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame33 />
        </div>
      </div>
    </div>
  );
}

function Frame13() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">9 miles</p>
    </div>
  );
}

function Frame35() {
  return (
    <div className="bg-[#172859] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame13 />
        </div>
      </div>
    </div>
  );
}

function Frame36() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame32 />
      <Frame34 />
      <Frame35 />
    </div>
  );
}

function Types2() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] shrink-0 w-full" data-name="types">
      <Frame36 />
    </div>
  );
}

function Frame37() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Lower body</p>
    </div>
  );
}

function Check2() {
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

function Frame38() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame37 />
          <Check2 />
        </div>
      </div>
    </div>
  );
}

function Frame39() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Tue, Nov 4</p>
    </div>
  );
}

function Frame40() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame39 />
        </div>
      </div>
    </div>
  );
}

function Frame41() {
  return (
    <div className="bg-red-900 content-stretch flex flex-col items-start relative rounded-[10px] shrink-0 w-full">
      <Frame38 />
      <Frame40 />
    </div>
  );
}

function Frame29() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
      <Types2 />
      <Frame41 />
    </div>
  );
}

function Date1() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">tue</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">4</p>
    </div>
  );
}

function Frame21() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Frame29 />
      <Date1 />
    </div>
  );
}

function Frame42() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Easy</p>
      </div>
    </div>
  );
}

function Check3() {
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

function Frame43() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame42 />
          <Check3 />
        </div>
      </div>
    </div>
  );
}

function Frame44() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Wed, Nov 5</p>
    </div>
  );
}

function Frame45() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame44 />
        </div>
      </div>
    </div>
  );
}

function Frame46() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">6 miles</p>
    </div>
  );
}

function Frame47() {
  return (
    <div className="bg-[#172859] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame46 />
        </div>
      </div>
    </div>
  );
}

function Frame48() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame43 />
      <Frame45 />
      <Frame47 />
    </div>
  );
}

function Types3() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] shrink-0 w-full" data-name="types">
      <Frame48 />
    </div>
  );
}

function Frame49() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">ITBS, Hip Flexors</p>
    </div>
  );
}

function Check4() {
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

function Frame50() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame49 />
          <Check4 />
        </div>
      </div>
    </div>
  );
}

function Frame51() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Wed, Nov 5</p>
    </div>
  );
}

function Frame52() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame51 />
        </div>
      </div>
    </div>
  );
}

function Frame53() {
  return (
    <div className="bg-green-900 content-stretch flex flex-col items-start relative rounded-[10px] shrink-0 w-full">
      <Frame50 />
      <Frame52 />
    </div>
  );
}

function Frame28() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
      <Types3 />
      <Frame53 />
    </div>
  );
}

function Date2() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">wed</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">5</p>
    </div>
  );
}

function Frame22() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Frame28 />
      <Date2 />
    </div>
  );
}

function Frame54() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Intervals</p>
      </div>
    </div>
  );
}

function Check5() {
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

function Frame55() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame54 />
          <Check5 />
        </div>
      </div>
    </div>
  );
}

function Frame56() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Thu, Nov 6</p>
    </div>
  );
}

function Frame57() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame56 />
        </div>
      </div>
    </div>
  );
}

function Frame58() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">7 miles</p>
    </div>
  );
}

function Frame59() {
  return (
    <div className="bg-[#172859] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame58 />
        </div>
      </div>
    </div>
  );
}

function Frame60() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame55 />
      <Frame57 />
      <Frame59 />
    </div>
  );
}

function Types4() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] shrink-0 w-full" data-name="types">
      <Frame60 />
    </div>
  );
}

function Frame61() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Upper body</p>
    </div>
  );
}

function Check6() {
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

function Frame62() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame61 />
          <Check6 />
        </div>
      </div>
    </div>
  );
}

function Frame63() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Thu, Nov 6</p>
    </div>
  );
}

function Frame64() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame63 />
        </div>
      </div>
    </div>
  );
}

function Frame65() {
  return (
    <div className="bg-red-900 content-stretch flex flex-col items-start relative rounded-[10px] shrink-0 w-full">
      <Frame62 />
      <Frame64 />
    </div>
  );
}

function Frame24() {
  return (
    <div className="absolute content-stretch flex flex-col gap-[20px] items-start left-[5px] top-[66px] w-[155px]">
      <Types4 />
      <Frame65 />
    </div>
  );
}

function Date3() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">thu</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">6</p>
    </div>
  );
}

function Frame23() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Frame24 />
      <Date3 />
    </div>
  );
}

function Frame66() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Easy</p>
      </div>
    </div>
  );
}

function Check7() {
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

function Frame67() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame66 />
          <Check7 />
        </div>
      </div>
    </div>
  );
}

function Frame68() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Fri, Nov 7</p>
    </div>
  );
}

function Frame69() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame68 />
        </div>
      </div>
    </div>
  );
}

function Frame70() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">4 miles</p>
    </div>
  );
}

function Frame71() {
  return (
    <div className="bg-[#172859] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame70 />
        </div>
      </div>
    </div>
  );
}

function Frame72() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame67 />
      <Frame69 />
      <Frame71 />
    </div>
  );
}

function Types5() {
  return (
    <div className="absolute bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center left-1/2 overflow-clip rounded-[10px] top-[66px] translate-x-[-50%] w-[155px]" data-name="types">
      <Frame72 />
    </div>
  );
}

function Date4() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-[4px] text-nowrap text-white top-0 w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">fri</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">7</p>
    </div>
  );
}

function Frame73() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Types5 />
      <Date4 />
    </div>
  );
}

function Frame74() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Rest</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="absolute left-[12px] size-[23.57px] top-0" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Frame">
          <path d={svgPaths.p135f5280} id="Vector" opacity="0" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
        </g>
      </svg>
    </div>
  );
}

function Frame5() {
  return (
    <div className="overflow-clip relative rounded-[6px] shrink-0 size-[36px]">
      <Frame2 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative rounded-[10px] shrink-0">
      <Frame5 />
    </div>
  );
}

function Frame75() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame74 />
          <Frame8 />
        </div>
      </div>
    </div>
  );
}

function Frame76() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Sat, Nov 8</p>
    </div>
  );
}

function Frame77() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame76 />
        </div>
      </div>
    </div>
  );
}

function Frame78() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame75 />
      <Frame77 />
    </div>
  );
}

function Types6() {
  return (
    <div className="absolute bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center left-[5px] overflow-clip rounded-[10px] top-[66px] w-[155px]" data-name="types">
      <Frame78 />
    </div>
  );
}

function Date5() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-1/2 text-nowrap text-white top-0 translate-x-[-50%] w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">sat</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">8</p>
    </div>
  );
}

function Frame25() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Types6 />
      <Date5 />
    </div>
  );
}

function Frame79() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Long</p>
      </div>
    </div>
  );
}

function Check8() {
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

function Frame80() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame79 />
          <Check8 />
        </div>
      </div>
    </div>
  );
}

function Frame81() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Fri, Nov 7</p>
    </div>
  );
}

function Frame82() {
  return (
    <div className="bg-[#1f3a8a] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame81 />
        </div>
      </div>
    </div>
  );
}

function Frame83() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">15 miles</p>
    </div>
  );
}

function Frame84() {
  return (
    <div className="bg-[#172859] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame83 />
        </div>
      </div>
    </div>
  );
}

function Frame85() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame80 />
      <Frame82 />
      <Frame84 />
    </div>
  );
}

function Types7() {
  return (
    <div className="absolute bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center left-1/2 overflow-clip rounded-[10px] top-[66px] translate-x-[-50%] w-[155px]" data-name="types">
      <Frame85 />
    </div>
  );
}

function Date6() {
  return (
    <div className="absolute content-stretch flex gap-[12px] items-center justify-center leading-[1.3] left-1/2 text-nowrap text-white top-0 translate-x-[-50%] w-[157px] whitespace-pre" data-name="date">
      <p className="font-['Geist:Regular',sans-serif] font-normal opacity-50 relative shrink-0 text-[13px] uppercase">sun</p>
      <p className="font-['Geist:Bold',sans-serif] font-bold relative shrink-0 text-[17px] text-right">9</p>
    </div>
  );
}

function Frame26() {
  return (
    <div className="bg-gray-900 h-[462px] relative shrink-0 w-[165px]">
      <Types7 />
      <Date6 />
    </div>
  );
}

function Frame27() {
  return (
    <div className="absolute content-stretch flex items-start justify-between left-[215px] top-[235px] w-[1276px]">
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame20 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame21 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame22 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame23 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame73 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame25 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
      <Frame26 />
      <div className="h-[436px] relative shrink-0 w-0" data-name="lines">
        <div className="absolute bottom-0 left-[-0.5px] right-[-0.5px] top-0">
          <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 1 436">
            <path d="M0.5 0V436" id="lines" opacity="0.1" stroke="var(--stroke-0, white)" />
          </svg>
        </div>
      </div>
    </div>
  );
}

export default function Frame86() {
  return (
    <div className="bg-gray-900 relative size-full">
      <Frame27 />
    </div>
  );
}