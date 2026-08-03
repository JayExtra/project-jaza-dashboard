// src/components/pot-onboarding/CategoryStep.tsx
import {
  Briefcase,
  HandHeart,
  Users,
  AlertTriangle,
  GraduationCap,
  HeartPulse,
  Leaf,
  Trophy,
  Cpu,
  Flower2,
  CircleDot,
  type LucideIcon,
} from 'lucide-react';
import type { PotCategoryMeta } from '../../types/pot';

interface CategoryStepProps {
  categories: PotCategoryMeta[];
  categoryId: string;
  onSelect: (categoryId: string) => void;
  isLoading: boolean;
  error: string | null;
  onRetry: () => void;
}

const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  briefcase: Briefcase,
  'hand-heart': HandHeart,
  users: Users,
  'alert-triangle': AlertTriangle,
  'graduation-cap': GraduationCap,
  'heart-pulse': HeartPulse,
  leaf: Leaf,
  trophy: Trophy,
  cpu: Cpu,
  'flower-2': Flower2,
};

export const CategoryStep = ({ categories, categoryId, onSelect, isLoading, error, onRetry }: CategoryStepProps) => {
  if (error) {
    return (
      <div className="text-center py-10">
        <p className="text-sm text-foreground/60 mb-4">{error}</p>
        <button
          type="button"
          onClick={onRetry}
          className="bg-primary text-on-primary font-display text-sm font-semibold rounded-xl px-6 py-3"
        >
          Retry
        </button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-3 gap-2.5">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-[84px] rounded-xl bg-surface-low animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 gap-2.5">
      {categories.map((cat) => {
        const active = cat.id === categoryId;
        const Icon = CATEGORY_ICON_MAP[cat.icon] ?? CircleDot;
        return (
          <button
            key={cat.id}
            type="button"
            onClick={() => onSelect(cat.id)}
            aria-pressed={active}
            className={`w-full flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-xl cursor-pointer transition-colors ${
              active ? 'bg-primary text-on-primary' : 'bg-surface-low text-foreground ring-1 ring-inset ring-foreground/10'
            }`}
          >
            <Icon size={20} />
            <span className="text-[13px] font-semibold">{cat.name}</span>
          </button>
        );
      })}
    </div>
  );
};
