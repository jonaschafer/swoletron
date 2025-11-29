import svgPaths from "./svg-mshe8mxtvh";

function Frame6() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <div className="flex flex-col font-['Geist:Regular',sans-serif] font-normal justify-center leading-[0] relative shrink-0 text-[17px] text-nowrap text-white">
        <p className="leading-[1.3] whitespace-pre">Easy</p>
      </div>
    </div>
  );
}

function Check() {
  return (
    <div className="absolute left-[126px] size-[15px] top-[16px]" data-name="check">
      <div className="absolute bottom-0 left-[-1.81%] right-0 top-0">
        <svg className="block size-full" fill="none" preserveAspectRatio="none" viewBox="0 0 16 15">
          <g id="check">
            <path d={svgPaths.pe1d9c80} id="check_2" stroke="var(--stroke-0, white)" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.47312" />
          </g>
        </svg>
      </div>
    </div>
  );
}

function Frame() {
  return (
    <div className="bg-blue-600 relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame6 />
          <Check />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Wed, Nov 5</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="bg-blue-600 relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

function Frame4() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">6 miles</p>
    </div>
  );
}

function Frame2() {
  return (
    <div className="bg-[#1139b0] relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame4 />
        </div>
      </div>
    </div>
  );
}

function Frame5() {
  return (
    <div className="content-stretch flex flex-col items-start relative shrink-0 w-full">
      <Frame />
      <Frame1 />
      <Frame2 />
    </div>
  );
}

export default function Types() {
  return (
    <div className="bg-gray-800 content-stretch flex flex-col gap-[20px] items-center justify-center overflow-clip relative rounded-[10px] size-full" data-name="types">
      <Frame5 />
    </div>
  );
}