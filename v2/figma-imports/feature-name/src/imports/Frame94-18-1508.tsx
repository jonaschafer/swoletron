import svgPaths from "./svg-1wxibdchlr";

function Frame4() {
  return (
    <div className="content-stretch flex gap-[8px] items-center relative shrink-0">
      <p className="font-['Geist:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[17px] text-white w-[88px]">Lower body</p>
    </div>
  );
}

function Check() {
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

function Frame() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="size-full">
        <div className="box-border content-stretch flex items-start justify-between px-[14px] py-[16px] relative w-full">
          <Frame4 />
          <Check />
        </div>
      </div>
    </div>
  );
}

function Frame3() {
  return (
    <div className="content-stretch flex gap-[6px] items-center relative shrink-0">
      <p className="font-['Geist_Mono:Regular',sans-serif] font-normal leading-[1.3] relative shrink-0 text-[13px] text-nowrap text-white whitespace-pre">Tue, Nov 4</p>
    </div>
  );
}

function Frame1() {
  return (
    <div className="relative shrink-0 w-full">
      <div className="flex flex-col justify-center size-full">
        <div className="box-border content-stretch flex flex-col gap-[16px] items-start justify-center px-[14px] py-[16px] relative w-full">
          <Frame3 />
        </div>
      </div>
    </div>
  );
}

export default function Frame2() {
  return (
    <div className="bg-red-900 content-stretch flex flex-col items-start relative rounded-[10px] size-full">
      <Frame />
      <Frame1 />
    </div>
  );
}