import type { StepContent } from '../../types/pot';

interface StepSidebarProps {
  step: number;
  content: StepContent;
}

export const StepSidebar = ({ step, content }: StepSidebarProps) => {
  return (
    <div className="flex-none w-80 bg-surface-low px-11 py-12 flex flex-col">
      <svg width="32" height="24" viewBox="0 0 32 24" fill="none" className="text-foreground">
        <path d="M4 22a12 12 0 0 1 24 0" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <div className="flex-1 min-h-8" />

      <div key={step} className="pot-step-in">
        <div className="text-[13px] font-semibold tracking-wide text-foreground/60 mb-3.5">{step} of 6</div>
        <h1 className="font-display text-[2rem] font-semibold tracking-tight text-foreground mb-3.5 leading-tight">
          {content.title}
        </h1>
        <p className="text-sm leading-relaxed text-foreground/60 max-w-[280px]">{content.desc}</p>
      </div>

      <div className="flex-[2]" />
    </div>
  );
};
