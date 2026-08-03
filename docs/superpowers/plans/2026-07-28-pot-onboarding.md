















# Pot Onboarding Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "create a Pot (fundraiser)" prompt to the dashboard Home page and a full-page, animated, 6-step onboarding wizard at `/pot/new` that ports the imported Claude Design project `Pot Onboarding.dc.html` onto this repo's existing Tailwind tokens.

**Architecture:** `PotOnboarding.tsx` is a standalone top-level route (outside `DashboardLayout`, so no Sidebar/Topbar render) that owns all wizard state via `useState` and renders one of six focused step components based on the current step number, passing state/handlers down as props. A `StepSidebar` shows step progress on the left. All inline styles from the source design are translated to Tailwind utility classes using tokens already defined in `tailwind.config.js`.

**Tech Stack:** React 19 + TypeScript, react-router-dom v7, Tailwind CSS, lucide-react icons. No new dependencies.

## Global Constraints

- No inline `style=` attributes — Tailwind utility classes only (`CLAUDE.md`).
- No new npm dependencies — everything maps onto existing tokens/libraries already in `package.json`.
- This repo has **no test runner** (no jest/vitest/testing-library in `package.json`; `npm run lint` and `npm run build` are the only checks). Every task's verification step is `npm run lint` (and `npm run build` for the tasks that wire routing/pages together) plus, where noted, a manual dev-server check — not automated tests.
- Colors/fonts map exactly: `#00342b`→`primary`, `#ac3509`→`secondary`, `#fbf9f5`→`background`, `#f2efe8`→`surface-low`, `#fffdfa`→`surface-lowest`, Space Grotesk→`font-display`, Manrope→`font-sans` (all already defined in `tailwind.config.js` / `src/index.css`).
- `/pot/new` must render with **no Sidebar/Topbar** — it is added as a top-level route sibling to `/signin`, not nested inside the `DashboardLayout` route.
- Step transitions animate on every step change (forward and backward) via a CSS `@keyframes` rule applied to a `key`-ed wrapper — no animation library.
- UI-only scope: no API calls. "Launch Pot" ends in a local confirmation state.

Spec: `docs/superpowers/specs/2026-07-28-pot-onboarding-design.md`

---

## Task 1: Pot domain types

**Files:**
- Create: `src/types/pot.ts`

**Interfaces:**
- Produces: `PotCategory` (union type), `PotDraft` (interface), `CATEGORY_LABELS: Record<PotCategory, string>`, `StepContent` (interface with `title: string; desc: string`), `STEP_CONTENT: Record<number, StepContent>`

- [ ] **Step 1: Create the types file**

```ts
// src/types/pot.ts
export type PotCategory =
  | 'medical'
  | 'education'
  | 'community'
  | 'emergency'
  | 'business'
  | 'charity'
  | 'environment'
  | 'sports'
  | 'technology'
  | 'memory';

export interface PotDraft {
  category: PotCategory;
  title: string;
  story: string;
  goalAmount: number | '';
  smartGoal: boolean;
  coverImage: File | null;
  featureImages: [File | null, File | null, File | null];
}

export const CATEGORY_LABELS: Record<PotCategory, string> = {
  medical: 'Medical',
  education: 'Education',
  community: 'Community',
  emergency: 'Emergency',
  business: 'Business',
  charity: 'Charity',
  environment: 'Environment',
  sports: 'Sports',
  technology: 'Technology',
  memory: 'In Memory',
};

export interface StepContent {
  title: string;
  desc: string;
}

export const STEP_CONTENT: Record<number, StepContent> = {
  1: {
    title: "What's this Pot for?",
    desc: 'Choose the category that best describes your fundraiser. This helps us tailor tips and reach the right supporters.',
  },
  2: {
    title: 'Give your Pot a name and a story',
    desc: 'A clear title and honest story are the biggest drivers of support. Take your time here.',
  },
  3: {
    title: 'Add photos',
    desc: "A strong cover image is required — it's the first thing people see. Feature images are optional extras that add depth to your story.",
  },
  4: {
    title: 'Set your goal',
    desc: 'How much do you need to raise? You can adjust this later as your Pot grows.',
  },
  5: {
    title: 'Confirm your details',
    desc: 'Take one last look before you preview your Pot.',
  },
  6: {
    title: 'Preview your Pot',
    desc: 'This is roughly how supporters will see your Pot. Ready to share it with the world?',
  },
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/types/pot.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/pot.ts
git commit -m "feat(pot-onboarding): add Pot domain types"
```

---

## Task 2: `useObjectUrl` hook + `ImageUploadSlot` component

**Files:**
- Create: `src/hooks/useObjectUrl.ts`
- Create: `src/components/pot-onboarding/ImageUploadSlot.tsx`

**Interfaces:**
- Consumes: none (leaf files)
- Produces: `useObjectUrl(file: File | null): string | null` — used by Task 9 (`PreviewStep`) and this task's `ImageUploadSlot`. `ImageUploadSlot` props: `{ label: string; file: File | null; onChange: (file: File | null) => void; className?: string }` — used by Task 6 (`PhotosStep`).

- [ ] **Step 1: Create the object-URL hook**

```ts
// src/hooks/useObjectUrl.ts
import { useEffect, useState } from 'react';

export const useObjectUrl = (file: File | null): string | null => {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const objectUrl = URL.createObjectURL(file);
    setUrl(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);

  return url;
};
```

- [ ] **Step 2: Create the image upload slot component**

```tsx
// src/components/pot-onboarding/ImageUploadSlot.tsx
import { useRef, useState } from 'react';
import { ImagePlus } from 'lucide-react';
import { useObjectUrl } from '../../hooks/useObjectUrl';

interface ImageUploadSlotProps {
  label: string;
  file: File | null;
  onChange: (file: File | null) => void;
  className?: string;
}

export const ImageUploadSlot = ({ label, file, onChange, className = '' }: ImageUploadSlotProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const previewUrl = useObjectUrl(file);

  const handleFiles = (files: FileList | null) => {
    const picked = files?.[0];
    if (picked && picked.type.startsWith('image/')) {
      onChange(picked);
    }
  };

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => {
        e.preventDefault();
        setIsDragging(true);
      }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => {
        e.preventDefault();
        setIsDragging(false);
        handleFiles(e.dataTransfer.files);
      }}
      className={`relative flex flex-col items-center justify-center gap-2 rounded-2xl cursor-pointer overflow-hidden transition-colors ${
        isDragging ? 'bg-primary/10 ring-2 ring-primary' : 'bg-surface-low hover:bg-surface-low/70'
      } ${className}`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {previewUrl ? (
        <img src={previewUrl} alt={label} className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <>
          <ImagePlus size={20} className="text-foreground/40" />
          <span className="text-xs font-semibold text-foreground/50 text-center px-2">{label}</span>
        </>
      )}
    </div>
  );
};
```

- [ ] **Step 3: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/hooks/useObjectUrl.ts` or `src/components/pot-onboarding/ImageUploadSlot.tsx`

- [ ] **Step 4: Commit**

```bash
git add src/hooks/useObjectUrl.ts src/components/pot-onboarding/ImageUploadSlot.tsx
git commit -m "feat(pot-onboarding): add useObjectUrl hook and ImageUploadSlot component"
```

---

## Task 3: `StepSidebar` component

**Files:**
- Create: `src/components/pot-onboarding/StepSidebar.tsx`

**Interfaces:**
- Consumes: `StepContent` type from `src/types/pot.ts` (Task 1)
- Produces: `StepSidebar` props: `{ step: number; content: StepContent }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/StepSidebar.tsx
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
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/StepSidebar.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/StepSidebar.tsx
git commit -m "feat(pot-onboarding): add StepSidebar component"
```

---

## Task 4: `CategoryStep` component

**Files:**
- Create: `src/components/pot-onboarding/CategoryStep.tsx`

**Interfaces:**
- Consumes: `PotCategory`, `CATEGORY_LABELS` from `src/types/pot.ts` (Task 1)
- Produces: `CategoryStep` props: `{ category: PotCategory; onSelect: (category: PotCategory) => void }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/CategoryStep.tsx
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
          <div
            key={cat}
            onClick={() => onSelect(cat)}
            className={`flex flex-col items-center justify-center gap-2.5 py-4 px-2 rounded-xl cursor-pointer transition-colors ${
              active ? 'bg-primary text-on-primary' : 'bg-surface-low text-foreground ring-1 ring-inset ring-foreground/10'
            }`}
          >
            {CATEGORY_ICONS[cat]}
            <span className="text-[13px] font-semibold">{CATEGORY_LABELS[cat]}</span>
          </div>
        );
      })}
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/CategoryStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/CategoryStep.tsx
git commit -m "feat(pot-onboarding): add CategoryStep component"
```

---

## Task 5: `DetailsStep` component

**Files:**
- Create: `src/components/pot-onboarding/DetailsStep.tsx`

**Interfaces:**
- Consumes: none beyond primitives
- Produces: `DetailsStep` props: `{ title: string; story: string; onTitleChange: (value: string) => void; onStoryChange: (value: string) => void }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/DetailsStep.tsx
interface DetailsStepProps {
  title: string;
  story: string;
  onTitleChange: (value: string) => void;
  onStoryChange: (value: string) => void;
}

export const DetailsStep = ({ title, story, onTitleChange, onStoryChange }: DetailsStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">POT TITLE</label>
      <input
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        placeholder="e.g. Help Maria Beat Cancer"
        className="w-full font-display text-base font-semibold text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg px-4 py-3.5 mb-6 outline-none placeholder:text-foreground/40"
      />

      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">THE STORY</label>
      <textarea
        value={story}
        onChange={(e) => onStoryChange(e.target.value)}
        placeholder="Tell people what happened, why it matters, and how their gift helps."
        rows={6}
        className="w-full text-sm leading-relaxed text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg px-4 py-3.5 outline-none resize-y placeholder:text-foreground/40"
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/DetailsStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/DetailsStep.tsx
git commit -m "feat(pot-onboarding): add DetailsStep component"
```

---

## Task 6: `PhotosStep` component

**Files:**
- Create: `src/components/pot-onboarding/PhotosStep.tsx`

**Interfaces:**
- Consumes: `ImageUploadSlot` from `src/components/pot-onboarding/ImageUploadSlot.tsx` (Task 2), props `{ label, file, onChange, className }`
- Produces: `PhotosStep` props: `{ coverImage: File | null; featureImages: [File | null, File | null, File | null]; onCoverChange: (file: File | null) => void; onFeatureChange: (index: 0 | 1 | 2, file: File | null) => void }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/PhotosStep.tsx
import { ImageUploadSlot } from './ImageUploadSlot';

interface PhotosStepProps {
  coverImage: File | null;
  featureImages: [File | null, File | null, File | null];
  onCoverChange: (file: File | null) => void;
  onFeatureChange: (index: 0 | 1 | 2, file: File | null) => void;
}

export const PhotosStep = ({ coverImage, featureImages, onCoverChange, onFeatureChange }: PhotosStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">COVER IMAGE — REQUIRED</label>
      <ImageUploadSlot label="Drop your cover image" file={coverImage} onChange={onCoverChange} className="w-full h-[220px] mb-6" />

      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">FEATURE IMAGES — OPTIONAL</label>
      <div className="grid grid-cols-3 gap-3">
        <ImageUploadSlot label="Feature 1" file={featureImages[0]} onChange={(f) => onFeatureChange(0, f)} className="w-full h-[100px]" />
        <ImageUploadSlot label="Feature 2" file={featureImages[1]} onChange={(f) => onFeatureChange(1, f)} className="w-full h-[100px]" />
        <ImageUploadSlot label="Feature 3" file={featureImages[2]} onChange={(f) => onFeatureChange(2, f)} className="w-full h-[100px]" />
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/PhotosStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/PhotosStep.tsx
git commit -m "feat(pot-onboarding): add PhotosStep component"
```

---

## Task 7: `GoalStep` component

**Files:**
- Create: `src/components/pot-onboarding/GoalStep.tsx`

**Interfaces:**
- Consumes: none beyond primitives
- Produces: `GoalStep` props: `{ goalAmount: number | ''; smartGoal: boolean; onGoalChange: (value: number | '') => void; onToggleSmartGoal: () => void }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/GoalStep.tsx
interface GoalStepProps {
  goalAmount: number | '';
  smartGoal: boolean;
  onGoalChange: (value: number | '') => void;
  onToggleSmartGoal: () => void;
}

export const GoalStep = ({ goalAmount, smartGoal, onGoalChange, onToggleSmartGoal }: GoalStepProps) => {
  return (
    <div>
      <label className="block text-xs font-semibold tracking-wide text-foreground/60 mb-2">FUNDRAISING GOAL</label>
      <div className="relative mb-6">
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-semibold text-foreground">$</span>
        <input
          value={goalAmount}
          onChange={(e) => onGoalChange(e.target.value === '' ? '' : Number(e.target.value))}
          type="number"
          min={0}
          step={100}
          className="w-full font-display text-lg font-semibold text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg pl-8 pr-4 py-3.5 outline-none"
        />
      </div>

      <div className="flex items-center justify-between bg-surface-low rounded-xl px-5 py-4">
        <div className="pr-5">
          <div className="text-sm font-bold text-foreground mb-1">Smart goal setting</div>
          <div className="text-[13px] leading-relaxed text-foreground/60">
            Automatically fine-tune your goal over time based on how your Pot's story and category typically perform.
          </div>
        </div>
        <div
          onClick={onToggleSmartGoal}
          className={`flex-shrink-0 w-[46px] h-[26px] rounded-full p-[3px] cursor-pointer transition-colors ${
            smartGoal ? 'bg-primary' : 'bg-foreground/15'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-surface-lowest shadow-md transition-transform ${
              smartGoal ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/GoalStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/GoalStep.tsx
git commit -m "feat(pot-onboarding): add GoalStep component"
```

---

## Task 8: `ReviewStep` component

**Files:**
- Create: `src/components/pot-onboarding/ReviewStep.tsx`

**Interfaces:**
- Consumes: none beyond primitives
- Produces: `ReviewStep` props: `{ categoryLabel: string; title: string; storyExcerpt: string; formattedGoal: string; smartGoal: boolean; onJumpTo: (step: number) => void }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/ReviewStep.tsx
interface ReviewStepProps {
  categoryLabel: string;
  title: string;
  storyExcerpt: string;
  formattedGoal: string;
  smartGoal: boolean;
  onJumpTo: (step: number) => void;
}

interface ReviewRowProps {
  label: string;
  primary: string;
  secondary?: string;
  onEdit: () => void;
}

const ReviewRow = ({ label, primary, secondary, onEdit }: ReviewRowProps) => (
  <div className="flex justify-between items-start py-4">
    <div className="max-w-[400px]">
      <div className="text-[11px] font-bold tracking-wide text-foreground/40 mb-1.5">{label}</div>
      <div className="text-[15px] font-semibold text-foreground mb-1">{primary}</div>
      {secondary && <div className="text-[13px] leading-relaxed text-foreground/60">{secondary}</div>}
    </div>
    <a onClick={onEdit} className="text-sm font-bold text-secondary cursor-pointer">
      Edit
    </a>
  </div>
);

export const ReviewStep = ({ categoryLabel, title, storyExcerpt, formattedGoal, smartGoal, onJumpTo }: ReviewStepProps) => {
  return (
    <div className="flex flex-col">
      <ReviewRow label="CATEGORY" primary={categoryLabel} onEdit={() => onJumpTo(1)} />
      <ReviewRow label="TITLE & STORY" primary={title} secondary={storyExcerpt} onEdit={() => onJumpTo(2)} />
      <ReviewRow label="PHOTOS" primary="Cover + feature images" onEdit={() => onJumpTo(3)} />
      <ReviewRow
        label="GOAL"
        primary={formattedGoal}
        secondary={`Smart goal setting: ${smartGoal ? 'On' : 'Off'}`}
        onEdit={() => onJumpTo(4)}
      />
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/ReviewStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/ReviewStep.tsx
git commit -m "feat(pot-onboarding): add ReviewStep component"
```

---

## Task 9: `PreviewStep` component

**Files:**
- Create: `src/components/pot-onboarding/PreviewStep.tsx`

**Interfaces:**
- Consumes: `useObjectUrl` from `src/hooks/useObjectUrl.ts` (Task 2)
- Produces: `PreviewStep` props: `{ coverImage: File | null; categoryLabel: string; title: string; storyExcerpt: string; formattedGoal: string }` — used by Task 11 (`PotOnboarding`)

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/PreviewStep.tsx
import { useObjectUrl } from '../../hooks/useObjectUrl';

interface PreviewStepProps {
  coverImage: File | null;
  categoryLabel: string;
  title: string;
  storyExcerpt: string;
  formattedGoal: string;
}

export const PreviewStep = ({ coverImage, categoryLabel, title, storyExcerpt, formattedGoal }: PreviewStepProps) => {
  const coverUrl = useObjectUrl(coverImage);

  return (
    <div className="bg-surface-low rounded-2xl overflow-hidden max-w-[360px] mx-auto shadow-ambient">
      <div className="w-full h-[160px] bg-surface-highest flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={title} className="w-full h-full object-cover" />
        ) : (
          <span className="text-xs font-semibold text-foreground/40">Drop your cover image</span>
        )}
      </div>
      <div className="p-4.5">
        <span className="inline-block text-[10px] font-bold tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2.5">
          {categoryLabel}
        </span>
        <div className="font-display text-base font-semibold text-foreground mb-1.5">{title}</div>
        <div className="text-[13px] leading-relaxed text-foreground/60 mb-4">{storyExcerpt}</div>
        <div className="w-full h-1.5 bg-foreground/10 rounded overflow-hidden mb-2.5">
          <div className="h-full w-[6%] bg-gradient-to-br from-secondary to-primary rounded" />
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="font-bold text-foreground">$0 raised</span>
          <span className="text-foreground/60">of {formattedGoal} goal</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/PreviewStep.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/PreviewStep.tsx
git commit -m "feat(pot-onboarding): add PreviewStep component"
```

---

## Task 10: Step transition animation CSS

**Files:**
- Modify: `src/index.css`

**Interfaces:**
- Produces: CSS class `.pot-step-in` — used by Task 11 (`PotOnboarding`) and Task 3 (`StepSidebar`, already references it)

- [ ] **Step 1: Append the keyframe and class**

Add to the end of `src/index.css` (after the existing `@layer base { ... }` block, at file scope, not inside the layer):

```css

@keyframes pot-step-in {
  from {
    opacity: 0;
    transform: translateY(8px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.pot-step-in {
  animation: pot-step-in 300ms ease-out;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors (CSS is not linted by ESLint, but this confirms nothing else broke)

- [ ] **Step 3: Commit**

```bash
git add src/index.css
git commit -m "feat(pot-onboarding): add step transition animation"
```

---

## Task 11: `PotOnboarding` page (orchestrator)

**Files:**
- Create: `src/pages/PotOnboarding.tsx`

**Interfaces:**
- Consumes:
  - `useAuth` from `../hooks/useAuth` → `{ isAuthenticated: boolean; isLoading: boolean }`
  - `PotCategory`, `PotDraft`, `CATEGORY_LABELS`, `STEP_CONTENT` from `../types/pot` (Task 1)
  - `StepSidebar` from `../components/pot-onboarding/StepSidebar` (Task 3), props `{ step, content }`
  - `CategoryStep` (Task 4), props `{ category, onSelect }`
  - `DetailsStep` (Task 5), props `{ title, story, onTitleChange, onStoryChange }`
  - `PhotosStep` (Task 6), props `{ coverImage, featureImages, onCoverChange, onFeatureChange }`
  - `GoalStep` (Task 7), props `{ goalAmount, smartGoal, onGoalChange, onToggleSmartGoal }`
  - `ReviewStep` (Task 8), props `{ categoryLabel, title, storyExcerpt, formattedGoal, smartGoal, onJumpTo }`
  - `PreviewStep` (Task 9), props `{ coverImage, categoryLabel, title, storyExcerpt, formattedGoal }`
  - `.pot-step-in` CSS class (Task 10)
- Produces: `PotOnboarding` component (default export target for the `/pot/new` route) — used by Task 12 (`App.tsx`)

- [ ] **Step 1: Create the page**

```tsx
// src/pages/PotOnboarding.tsx
import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { StepSidebar } from '../components/pot-onboarding/StepSidebar';
import { CategoryStep } from '../components/pot-onboarding/CategoryStep';
import { DetailsStep } from '../components/pot-onboarding/DetailsStep';
import { PhotosStep } from '../components/pot-onboarding/PhotosStep';
import { GoalStep } from '../components/pot-onboarding/GoalStep';
import { ReviewStep } from '../components/pot-onboarding/ReviewStep';
import { PreviewStep } from '../components/pot-onboarding/PreviewStep';
import type { PotDraft } from '../types/pot';
import { CATEGORY_LABELS, STEP_CONTENT } from '../types/pot';

const TOTAL_STEPS = 6;

export const PotOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading } = useAuth();

  const [step, setStep] = useState(1);
  const [launched, setLaunched] = useState(false);
  const [draft, setDraft] = useState<PotDraft>({
    category: 'medical',
    title: '',
    story: '',
    goalAmount: '',
    smartGoal: true,
    coverImage: null,
    featureImages: [null, null, null],
  });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-foreground/60">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  const categoryLabel = CATEGORY_LABELS[draft.category];
  const goalNum = Number(draft.goalAmount) || 0;
  const formattedGoal = `$${goalNum.toLocaleString('en-US')}`;
  const storyExcerpt = draft.story.length > 140 ? `${draft.story.slice(0, 140).trim()}…` : draft.story;

  const requiredOk: Record<number, boolean> = {
    1: true,
    2: draft.title.trim().length > 0 && draft.story.trim().length > 0,
    3: true,
    4: draft.goalAmount !== '' && Number(draft.goalAmount) > 0,
    5: true,
    6: true,
  };
  const canContinue = requiredOk[step];

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const jumpTo = (n: number) => setStep(n);

  const mainAction = () => {
    if (step === TOTAL_STEPS) {
      setLaunched(true);
    } else {
      goNext();
    }
  };

  const updateFeatureImage = (index: 0 | 1 | 2, file: File | null) => {
    setDraft((d) => {
      const next = [...d.featureImages] as PotDraft['featureImages'];
      next[index] = file;
      return { ...d, featureImages: next };
    });
  };

  return (
    <div className="flex min-h-screen w-full bg-background">
      <StepSidebar step={step} content={STEP_CONTENT[step]} />

      <div className="flex-1 bg-surface-lowest rounded-tl-[40px] flex flex-col relative min-w-0">
        <div className="flex-1 overflow-y-auto flex items-center px-16">
          <div key={step} className="pot-step-in w-full max-w-[560px] mx-auto">
            {step === 1 && (
              <CategoryStep category={draft.category} onSelect={(category) => setDraft((d) => ({ ...d, category }))} />
            )}
            {step === 2 && (
              <DetailsStep
                title={draft.title}
                story={draft.story}
                onTitleChange={(title) => setDraft((d) => ({ ...d, title }))}
                onStoryChange={(story) => setDraft((d) => ({ ...d, story }))}
              />
            )}
            {step === 3 && (
              <PhotosStep
                coverImage={draft.coverImage}
                featureImages={draft.featureImages}
                onCoverChange={(coverImage) => setDraft((d) => ({ ...d, coverImage }))}
                onFeatureChange={updateFeatureImage}
              />
            )}
            {step === 4 && (
              <GoalStep
                goalAmount={draft.goalAmount}
                smartGoal={draft.smartGoal}
                onGoalChange={(goalAmount) => setDraft((d) => ({ ...d, goalAmount }))}
                onToggleSmartGoal={() => setDraft((d) => ({ ...d, smartGoal: !d.smartGoal }))}
              />
            )}
            {step === 5 && (
              <ReviewStep
                categoryLabel={categoryLabel}
                title={draft.title}
                storyExcerpt={storyExcerpt}
                formattedGoal={formattedGoal}
                smartGoal={draft.smartGoal}
                onJumpTo={jumpTo}
              />
            )}
            {step === 6 && (
              <PreviewStep
                coverImage={draft.coverImage}
                categoryLabel={categoryLabel}
                title={draft.title}
                storyExcerpt={storyExcerpt}
                formattedGoal={formattedGoal}
              />
            )}
          </div>
        </div>

        <div className="flex justify-between items-center px-16 pb-10">
          <button
            onClick={goBack}
            className={`${step === 1 ? 'invisible' : 'visible'} bg-transparent text-foreground font-display text-sm font-semibold ring-1 ring-inset ring-foreground/15 rounded-xl px-7 py-3.5`}
          >
            Back
          </button>

          {launched && step === TOTAL_STEPS ? (
            <button
              onClick={() => navigate('/')}
              className="bg-primary text-on-primary font-display text-sm font-semibold rounded-xl px-8 py-3.5"
            >
              Back to Overview
            </button>
          ) : (
            <button
              onClick={mainAction}
              disabled={!canContinue}
              className={`font-display text-sm font-semibold rounded-xl px-8 py-3.5 ${
                canContinue ? 'bg-primary text-on-primary cursor-pointer' : 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
              }`}
            >
              {step === TOTAL_STEPS ? 'Launch Pot' : 'Continue'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/pages/PotOnboarding.tsx` (import errors are expected to be none since all consumed components/types exist from Tasks 1–10)

- [ ] **Step 3: Commit**

```bash
git add src/pages/PotOnboarding.tsx
git commit -m "feat(pot-onboarding): add PotOnboarding orchestrator page"
```

---

## Task 12: Wire the `/pot/new` route

**Files:**
- Modify: `src/App.tsx:1-25` (imports), `src/App.tsx:39-68` (route tree)

**Interfaces:**
- Consumes: `PotOnboarding` from `./pages/PotOnboarding` (Task 11)

- [ ] **Step 1: Import `PotOnboarding`**

In `src/App.tsx`, add near the other page imports (after the `Home` import on line 9):

```tsx
import { PotOnboarding } from './pages/PotOnboarding';
```

- [ ] **Step 2: Add the standalone route**

In `src/App.tsx`, inside `<Routes>`, add the route as a sibling of the auth pages and the `DashboardLayout` route — **not** nested inside `<Route path="/" element={<DashboardLayout />}>`:

```tsx
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/pot/new" element={<PotOnboarding />} />
        {/* Protected layout routes */}
        <Route path="/" element={<DashboardLayout />}>
```

(This replaces the existing `<Route path="/forgot-password" ... />` line and the `{/* Protected layout routes */}` comment/line that follow it — insert the new route between them.)

- [ ] **Step 3: Verify it builds**

Run: `npm run build`
Expected: builds cleanly with no TypeScript or bundling errors

- [ ] **Step 4: Manual check — full-page, no chrome**

Run: `npm run dev`, sign in, navigate to `http://localhost:5173/pot/new` (or the port Vite prints).
Expected: the wizard renders full-viewport with **no Sidebar and no Topbar** visible; Step 1's category grid is shown.

- [ ] **Step 5: Commit**

```bash
git add src/App.tsx
git commit -m "feat(pot-onboarding): wire /pot/new as a standalone route"
```

---

## Task 13: Home.tsx entry-point prompt

**Files:**
- Modify: `src/pages/Home.tsx` (entire file — currently 17 lines)

**Interfaces:**
- Consumes: `PotOnboarding` route at `/pot/new` (Task 12, via `navigate`)

- [ ] **Step 1: Replace the placeholder content**

```tsx
// src/pages/Home.tsx
import { useNavigate } from 'react-router-dom';
import { PiggyBank } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="w-full h-full flex flex-col p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <p className="text-secondary font-bold text-xs tracking-[0.1em] uppercase mb-1">WORKSPACE</p>
          <h1 className="text-5xl font-display font-semibold text-primary">Home</h1>
        </div>
      </div>
      <div className="flex-1 flex flex-col items-center justify-center gap-5 bg-surface-lowest rounded-[2rem] shadow-ambient text-center px-8">
        <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary">
          <PiggyBank size={26} />
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold text-foreground mb-2">Create your first Pot</h2>
          <p className="text-sm text-foreground/60 max-w-sm mx-auto">
            A Pot is your fundraiser — give it a story, a goal, and start collecting support in minutes.
          </p>
        </div>
        <button
          onClick={() => navigate('/pot/new')}
          className="bg-secondary hover:bg-secondary/90 text-white font-display text-sm font-semibold rounded-xl px-6 py-3 transition-colors"
        >
          Start a Pot
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: builds cleanly

- [ ] **Step 3: Manual check**

Run: `npm run dev`, sign in, land on `/` (Home).
Expected: the "Create your first Pot" card is centered on the page with the Sidebar/Topbar still visible (Home is still nested under `DashboardLayout`); clicking "Start a Pot" navigates to `/pot/new`.

- [ ] **Step 4: Commit**

```bash
git add src/pages/Home.tsx
git commit -m "feat(pot-onboarding): add Create a Pot prompt to Home"
```

---

## Task 14: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full checks**

Run: `npm run lint && npm run build`
Expected: both clean, zero errors/warnings introduced by this feature

- [ ] **Step 2: Manual click-through**

Run: `npm run dev`. In the browser:
1. Sign in, land on Home — confirm the "Create your first Pot" card renders, Sidebar/Topbar visible.
2. Click "Start a Pot" — confirm navigation to `/pot/new` with **no Sidebar/Topbar**, full viewport.
3. Step 1: click each of the 10 category chips, confirm the active chip highlights (`bg-primary`) and Continue is always enabled.
4. Step 2: leave title/story empty — confirm Continue is disabled; fill both — confirm it enables.
5. Step 3: click a slot to browse, and drag-and-drop an image onto a slot — confirm the preview image renders in both cases; confirm Continue is enabled either way.
6. Step 4: leave goal empty or `0` — confirm Continue is disabled; enter a positive number — confirm it enables; toggle "Smart goal setting" — confirm the switch animates.
7. Step 5: confirm the summary shows the category/title/story excerpt/goal entered; click each "Edit" link — confirm it jumps back to the correct step.
8. Step 6: confirm the preview card shows the cover image, category badge, title, story excerpt, and formatted goal; click "Launch Pot" — confirm it swaps to "Back to Overview"; click it — confirm navigation back to `/`.
9. Click Back at each step — confirm it decrements the step and the content updates.
10. Confirm the step-content area visibly animates (fade/slide) on every forward and backward step change.
11. Toggle OS/browser dark mode (or the app's dark mode if exposed) — confirm the wizard's colors adapt via the existing CSS variables with no hardcoded-light artifacts.

- [ ] **Step 3: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(pot-onboarding): address issues found in end-to-end verification"
```

(Skip this commit if step 2 found no issues.)
