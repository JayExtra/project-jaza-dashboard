import type { ReactElement } from 'react';
import type { PotCategory } from '../../types/pot';
import { CATEGORY_LABELS } from '../../types/pot';

interface CategoryStepProps {
  category: PotCategory;
  onSelect: (category: PotCategory) => void;
}

const CATEGORY_ICONS: Record<PotCategory, ReactElement> = {
  medical: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M12 5v14M5 12h14" />
    </svg>
  ),
  education: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 5h8v14H4z" />
      <path d="M12 5h8v14h-8z" />
    </svg>
  ),
  community: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="6" r="2.4" />
      <circle cx="6" cy="17" r="2.4" />
      <circle cx="18" cy="17" r="2.4" />
      <path d="M12 8.5v3M8.2 15l1.8-2M15.8 15l-1.8-2" />
    </svg>
  ),
  emergency: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 4l9 16H3z" />
      <path d="M12 11v3" />
      <circle cx="12" cy="17" r="0.6" fill="currentColor" stroke="none" />
    </svg>
  ),
  business: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="8" width="16" height="11" rx="1.2" />
      <path d="M9 8V6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
      <path d="M4 13h16" />
    </svg>
  ),
  charity: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 19s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 9c0 5.5-7 10-7 10z" />
    </svg>
  ),
  environment: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 18C6 10 12 4 20 4c0 8-6 14-14 14z" />
      <path d="M6 18c3-3 6-6 10-10" />
    </svg>
  ),
  sports: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="12" cy="12" r="8" />
      <path d="M4 12h16" />
      <path d="M12 4c3 3 3 13 0 16M12 4c-3 3-3 13 0 16" />
    </svg>
  ),
  technology: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="7" y="7" width="10" height="10" rx="1" />
      <path d="M9 7V4M12 7V4M15 7V4M9 20v-3M12 20v-3M15 20v-3M7 9H4M7 12H4M7 15H4M20 9h-3M20 12h-3M20 15h-3" />
    </svg>
  ),
  memory: (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3c2.2 3 4 5.2 4 8.2a4 4 0 0 1-8 0C8 8.2 9.8 6 12 3z" />
    </svg>
  ),
};

const CATEGORIES = Object.keys(CATEGORY_LABELS) as PotCategory[];

export const CategoryStep = ({ category, onSelect }: CategoryStepProps) => {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {CATEGORIES.map((cat) => {
        const active = cat === category;
        return (
          <button
            key={cat}
            type="button"
            onClick={() => onSelect(cat)}
            aria-pressed={active}
            className={`w-full flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-xl cursor-pointer transition-colors ${
              active ? 'bg-primary text-on-primary' : 'bg-surface-low text-foreground ring-1 ring-inset ring-foreground/10'
            }`}
          >
            {CATEGORY_ICONS[cat]}
            <span className="text-[13px] font-semibold">{CATEGORY_LABELS[cat]}</span>
          </button>
        );
      })}
    </div>
  );
};
