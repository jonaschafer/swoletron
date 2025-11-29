import svgPaths from "./svg-sh7hrytu9k";

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

function Frame2() {
  return (
    <div className="overflow-clip relative rounded-[6px] shrink-0 size-[36px]">
      <Frame />
    </div>
  );
}

function Frame4() {
  return (
    <div className="absolute content-stretch flex gap-[6px] items-center right-[20px] top-[20px]">
      <Frame2 />
    </div>
  );
}

function Frame7() {
  return (
    <div className="bg-green-900 h-[76px] relative rounded-tl-[10px] rounded-tr-[10px] shrink-0 w-full">
      <Frame4 />
      <div className="absolute flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] left-[20px] text-[21px] text-white top-[38.5px] translate-y-[-50%] w-[178px]">
        <p className="leading-[1.3]">Ankle, core</p>
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

function Frame9() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <Frame1 />
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Tue, Nov 4</p>
    </div>
  );
}

function Frame8() {
  return (
    <div className="bg-gray-800 relative shrink-0 w-full">
      <div aria-hidden="true" className="absolute border-[0px_0px_1px] border-gray-700 border-solid bottom-[-0.5px] left-0 pointer-events-none right-0 top-0" />
      <div className="flex flex-row items-center size-full">
        <div className="box-border content-stretch flex gap-[20px] items-center pl-[20px] pr-0 py-[24px] relative w-full">
          <Frame9 />
        </div>
      </div>
    </div>
  );
}

function Frame10() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame7 />
      <Frame8 />
    </div>
  );
}

function Set() {
  return (
    <div className="box-border content-stretch flex items-center justify-center px-[14px] py-0 relative rounded-[8px] shrink-0 size-[36px]" data-name="set">
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">1</p>
      </div>
    </div>
  );
}

function Rep() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex h-[36px] items-center justify-center overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 w-[96px]" data-name="rep">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">16</p>
      </div>
    </div>
  );
}

function X() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="x">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="x">
          <path d={svgPaths.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Weight() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex font-['Geist:Regular',sans-serif] font-normal h-[36px] items-center justify-between leading-[0] overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 text-[14px] text-nowrap text-white w-[96px]" data-name="weight">
      <div className="flex flex-col justify-center relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">195</p>
      </div>
      <div className="flex flex-col justify-center opacity-50 relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">lbs</p>
      </div>
    </div>
  );
}

function RepWeight() {
  return (
    <div className="content-stretch flex gap-[30px] items-center relative shrink-0" data-name="rep weight">
      <Rep />
      <X />
      <Weight />
    </div>
  );
}

function Check() {
  return (
    <div className="absolute left-[calc(50%+0.5px)] size-[15px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check" opacity="0.2">
            <path d={svgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Set1() {
  return (
    <div className="box-border content-stretch flex items-center justify-center px-[14px] py-0 relative rounded-[8px] shrink-0 size-[36px]" data-name="set">
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">2</p>
      </div>
    </div>
  );
}

function Rep1() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex h-[36px] items-center justify-center overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 w-[96px]" data-name="rep">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">16</p>
      </div>
    </div>
  );
}

function X1() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="x">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="x">
          <path d={svgPaths.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Weight1() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex font-['Geist:Regular',sans-serif] font-normal h-[36px] items-center justify-between leading-[0] overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 text-[14px] text-nowrap text-white w-[96px]" data-name="weight">
      <div className="flex flex-col justify-center relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">195</p>
      </div>
      <div className="flex flex-col justify-center opacity-50 relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">lbs</p>
      </div>
    </div>
  );
}

function RepWeight1() {
  return (
    <div className="content-stretch flex gap-[30px] items-center relative shrink-0" data-name="rep weight">
      <Rep1 />
      <X1 />
      <Weight1 />
    </div>
  );
}

function Check1() {
  return (
    <div className="absolute left-[calc(50%+0.5px)] size-[15px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check" opacity="0.2">
            <path d={svgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Component() {
  return (
    <div className="bg-gray-700 overflow-clip relative rounded-[9999px] shrink-0 size-[36px]" data-name="Component 2">
      <Check1 />
    </div>
  );
}

function Row() {
  return (
    <div className="box-border content-stretch flex gap-[20px] items-center px-0 py-[9px] relative rounded-[8px] shrink-0" data-name="row">
      <Set1 />
      <RepWeight1 />
      <Component />
    </div>
  );
}

function Set2() {
  return (
    <div className="box-border content-stretch flex items-center justify-center px-[14px] py-0 relative rounded-[8px] shrink-0 size-[36px]" data-name="set">
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[8.5px]" />
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">3</p>
      </div>
    </div>
  );
}

function Rep2() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex h-[36px] items-center justify-center overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 w-[96px]" data-name="rep">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[14px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">16</p>
      </div>
    </div>
  );
}

function X2() {
  return (
    <div className="relative shrink-0 size-[24px]" data-name="x">
      <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 24 24">
        <g id="x">
          <path d={svgPaths.p2efb2b00} id="Vector" opacity="0.5" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        </g>
      </svg>
    </div>
  );
}

function Weight2() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex font-['Geist:Regular',sans-serif] font-normal h-[36px] items-center justify-between leading-[0] overflow-clip px-[14px] py-[10px] relative rounded-[8px] shrink-0 text-[14px] text-nowrap text-white w-[96px]" data-name="weight">
      <div className="flex flex-col justify-center relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">195</p>
      </div>
      <div className="flex flex-col justify-center opacity-50 relative shrink-0">
        <p className="leading-[1.3] text-nowrap whitespace-pre">lbs</p>
      </div>
    </div>
  );
}

function RepWeight2() {
  return (
    <div className="content-stretch flex gap-[30px] items-center relative shrink-0" data-name="rep weight">
      <Rep2 />
      <X2 />
      <Weight2 />
    </div>
  );
}

function Check2() {
  return (
    <div className="absolute left-[calc(50%+0.5px)] size-[15px] top-[calc(50%-0.5px)] translate-x-[-50%] translate-y-[-50%]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check" opacity="0.2">
            <path d={svgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Component1() {
  return (
    <div className="bg-gray-700 overflow-clip relative rounded-[9999px] shrink-0 size-[36px]" data-name="Component 2">
      <Check2 />
    </div>
  );
}

function Row1() {
  return (
    <div className="box-border content-stretch flex gap-[20px] items-center px-0 py-[9px] relative rounded-[8px] shrink-0" data-name="row">
      <Set2 />
      <RepWeight2 />
      <Component1 />
    </div>
  );
}

function Rows() {
  return (
    <div className="content-stretch flex flex-col gap-px items-start relative shrink-0" data-name="rows">
      <div className="box-border content-stretch flex gap-[20px] items-center px-0 py-[9px] relative rounded-[8px] shrink-0" data-name="row">
        <Set />
        <RepWeight />
        <div className="bg-gray-700 overflow-clip relative rounded-[9999px] shrink-0 size-[36px]" data-name="Component 2">
          <Check />
        </div>
      </div>
      <Row />
      <Row1 />
    </div>
  );
}

function Container() {
  return (
    <div className="content-stretch flex flex-col gap-[12px] items-start relative shrink-0 w-full" data-name="Container">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[18px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Plank with shoulder taps</p>
      </div>
      <Rows />
      <div className="h-[8px] shrink-0 w-full" data-name="Rectangle" />
    </div>
  );
}

function Notes() {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Exercises</p>
      <Container />
    </div>
  );
}

function Notes1() {
  return (
    <div className="content-stretch flex flex-col font-normal gap-[15px] items-start justify-center relative shrink-0 w-[388px]" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] leading-[1.3] min-w-full opacity-50 relative shrink-0 text-[13px] text-white w-[min-content]">Description</p>
      <div className="flex flex-col font-['Geist:Regular',sans-serif] justify-center leading-[0] relative shrink-0 text-[#f8fafd] text-[18px] w-[388px]">
        <p className="leading-[1.5]">{`Group run with the fellas at TTT. This week see about doing hill repeats on Stairway and Hell, with stairs. Go for 3 repeats. `}</p>
      </div>
    </div>
  );
}

function Container1() {
  return (
    <div className="relative rounded-[6px] shrink-0 w-full" data-name="container">
      <div className="overflow-clip rounded-[inherit] size-full">
        <div className="box-border content-stretch flex gap-[10px] items-start pb-[118px] pl-[16px] pr-[20px] pt-[22px] relative w-full">
          <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] opacity-50 relative shrink-0 text-[18px] text-nowrap text-white">
            <p className="leading-[20px] whitespace-pre">Start typing...</p>
          </div>
        </div>
      </div>
      <div aria-hidden="true" className="absolute border border-gray-600 border-solid inset-[-0.5px] pointer-events-none rounded-[6.5px]" />
    </div>
  );
}

function Notes2() {
  return (
    <div className="content-stretch flex flex-col gap-[15px] items-start justify-center relative shrink-0 w-[388px]" data-name="notes">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] opacity-50 relative shrink-0 text-[13px] text-white w-full">Notes</p>
      <Container1 />
    </div>
  );
}

function Frame5() {
  return (
    <div className="box-border content-stretch flex flex-col gap-[50px] items-start pb-[70px] pt-[16px] px-[20px] relative shrink-0">
      <Notes />
      <Notes1 />
      <Notes2 />
    </div>
  );
}

function Frame3() {
  return (
    <div className="bg-gray-700 box-border content-stretch flex gap-[10px] h-[50px] items-center justify-center overflow-clip px-[27px] py-[14px] relative rounded-[10px] shrink-0 w-[388px]">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[16px] text-center text-nowrap text-white whitespace-pre">Mark complete</p>
    </div>
  );
}

function Frame6() {
  return (
    <div className="bg-gray-800 box-border content-stretch flex flex-col gap-[10px] items-start pb-[20px] pt-0 px-[20px] relative shrink-0">
      <Frame3 />
    </div>
  );
}

export default function Types() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] size-full" data-name="types">
      <Frame10 />
      <Frame5 />
      <Frame6 />
    </div>
  );
}