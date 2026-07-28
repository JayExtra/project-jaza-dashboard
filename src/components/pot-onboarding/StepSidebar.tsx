import { Link } from 'react-router-dom';
import type { StepContent } from '../../types/pot';

interface StepSidebarProps {
  step: number;
  content: StepContent;
}

export const StepSidebar = ({ step, content }: StepSidebarProps) => {
  return (
    <div className="flex-none w-80 bg-surface-low px-11 py-12 flex flex-col">
       <div className="flex items-center ">
                    <Link 
                        to="/"
                        aria-label="Go to home"
                        className="hover:opacity-80 transition-opacity"
                    >
                       <img 
                    src="/logo.png" 
                    alt="Jaza" 
                    className="h-16 w-auto object-contain"
                     /> 
                    </Link>
            </div>

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
