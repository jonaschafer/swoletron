import svgPaths from "./svg-hrt1ddwggo";

function Frame2() {
  return (
    <div className="bg-[#1139b0] box-border content-stretch flex flex-col gap-[10px] h-[36px] items-start justify-center overflow-clip p-[10px] relative rounded-[6px] shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">9 miles</p>
    </div>
  );
}

function Frame() {
  return (
    <div className="absolute left-1/2 size-[24px] top-1/2 translate-x-[-50%] translate-y-[-50%]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="Frame">
          <path d={svgPaths.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Frame3() {
  return (
    <div className="overflow-clip relative rounded-[6px] shrink-0 size-[36px]">
      <Frame />
    </div>
  );
}

function Frame5() {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center right-[20px] top-[20px]">
      <Frame2 />
      <Frame3 />
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-blue-600 h-[76px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full">
      <Frame5 />
      <div className="absolute flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] left-[20px] text-[21px] text-white top-[38.5px] translate-y-[-50%] w-[178px]">
        <p className="leading-[1.3]">Hills</p>
      </div>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 size-[16px]" data-name="Frame">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 16">
        <g id="Frame">
          <path d={svgPaths.p1acf0f00} id="Vector" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
          <path d={svgPaths.p3ab77480} id="Vector_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
          <path d="M4.66602 1.33301V3.99967" id="Vector_3" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
          <path d={svgPaths.p1df74fc0} id="Vector_4" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeOpacity="0.5" />
        </g>
      </svg>
    </div>
  );
}

function Frame11() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Frame1 />
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Tue, Nov 4</p>
    </div>
  );
}

function Frame9() {
  return (
    <div className="bg-gray-800 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-700 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center pl-[20px] pr-0 py-[24px] relative w-full">
          <Frame11 />
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame8 />
      <Frame9 />
    </div>
  );
}

function Notes() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] leading-[1.3] min-w-full opacity-50 relative shrink-0 text-[13px] text-white w-[min-content]">Description</p>
      <div className="flex flex-col font-['Geist:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#f8fafd] text-[18px] w-[388px]">
        <p className="leading-[1.5]">{`Group run with the fellas at TTT. This week see about doing hill repeats on Stairway and Hell, with stairs. Go for 3 repeats. `}</p>
      </div>
    </div>
  );
}

function Container() {
  return (
    <div className="relative rounded-[6px] shrink-0 w-[388px]" data-name="container">
      <div className="box-border content-stretch flex gap-[10px] items-start overflow-clip pb-[118px] pl-[16px] pr-[20px] pt-[22px] relative rounded-[inherit] w-[388px]">
        <div className="basis-0 flex flex-col font-['Geist:Regular',sans-serif] font-normal grow justify-center leading-[0] min-h-px min-w-px relative shrink-0 text-[18px] text-white">
          <p className="leading-[20px]">{`Dude! What a run. I crushed all of my enemies in battle. `}</p>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px]" />
    </div>
  );
}

function Notes1() {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0 w-full" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] min-w-full opacity-50 relative shrink-0 text-[13px] text-white w-[min-content]">Notes</p>
      <Container />
    </div>
  );
}

function Frame6() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[50px] items-start pb-[70px] pt-[16px] px-[20px] relative shrink-0">
      <Notes />
      <Notes1 />
    </div>
  );
}

function Frame4() {
  return (
    <div className="bg-blue-600 box-border content-stretch flex gap-[10px] h-[50px] items-center justify-center overflow-clip px-[27px] py-[14px] relative rounded-[10px] shrink-0 w-[388px]">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[16px] text-center text-nowrap text-white whitespace-pre">Complete</p>
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-gray-800 box-border content-stretch flex flex-col gap-[10px] items-start pb-[20px] pt-0 px-[20px] relative shrink-0">
      <Frame4 />
    </div>
  );
}

export default function Types() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] size-full" data-name="types">
      <Frame10 />
      <Frame6 />
      <Frame7 />
    </div>
  );
}