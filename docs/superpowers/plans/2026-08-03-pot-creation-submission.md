# Pot Creation Submission Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the existing (UI-only) Pot onboarding wizard's "Launch Pot" step to the real backend: fetch real category IDs, upload cover/feature images, call `POST /pots/create`, and show a non-dismissable success dialog with a confetti animation.

**Architecture:** A new `usePotCategories` hook fetches the category list once (replacing the wizard's hardcoded category union). A new `src/lib/potApi.ts` module holds three fetch functions (upload cover, upload feature images, create pot). `PotOnboarding.tsx`'s existing `mainAction` on the final step becomes an async `handleLaunch` that calls those three functions in sequence and, on success, renders a new `PotSuccessDialog` (confetti via `canvas-confetti`) instead of the current local "Back to Overview" button swap. Currency display switches from `$` to `KES` throughout the wizard.

**Tech Stack:** React 19 + TypeScript, existing `authenticatedFetch` interceptor (`src/lib/api.ts`) for JSON calls, plain `fetch` + manual Bearer header for the two multipart upload calls (mirrors the existing `ProfileImageUploadDialog.tsx` pattern), new dependency `canvas-confetti`.

## Global Constraints

- This repo has **no test runner** (no jest/vitest/testing-library in `package.json`); `npm run lint` and `npm run build` are the only automated checks. Every task's verification step is one or both of these, plus a manual dev-server check where noted — not automated tests.
- No inline `style=` attributes — Tailwind utility classes only (`CLAUDE.md`).
- Upload endpoints use multipart form field names `coverImage` (single file, `/pots/upload-cover`) and `featuredImages` (repeated, `/pots/upload-feature`) — confirmed by the user, not a guess.
- Assumption (flagged in the spec, carried here): the two upload endpoints return the same `{ code, data, message, status }` envelope as every other endpoint in this codebase — `data` is the URL string (cover) or array of URL strings (feature). If this is wrong, only `src/lib/potApi.ts`'s two upload functions need to change.
- Cover image becomes **required** to leave step 3 (previously always valid) — the backend needs a real cover URL.
- Category selection becomes required to leave step 1 (previously always valid, defaulted to `'medical'`) — now defaults to the first category returned by the API instead.
- Currency displays as `KES` (not `$`) in `GoalStep`, `PreviewStep`, `PotOnboarding`'s `formattedGoal`, and the new `PotSuccessDialog`.
- The success dialog is **not dismissable** via backdrop click or a close button — only its "Back to Overview" button exits, since the Pot already exists server-side by the time it's shown.
- Confetti must be skipped when `prefers-reduced-motion: reduce` is set.

Spec: `docs/superpowers/specs/2026-08-03-pot-creation-submission-design.md`

---

## Task 1: Extend Pot domain types (additive)

**Files:**
- Modify: `src/types/pot.ts` (67 lines — append to end, keep everything existing as-is for now)

**Interfaces:**
- Consumes: none
- Produces: `PotCategoryMeta`, `PotOrganiser`, `Pot` (interfaces) — used by Task 2 (`usePotCategories`), Task 3 (`potApi.ts`), Task 5 (`PotSuccessDialog`), and Task 6 (final wizard rewrite)

This task only *adds* new types; it does not touch the existing `PotCategory` union, `PotDraft`, or `CATEGORY_LABELS` yet (those are replaced together with their consumers in Task 6, since a real fetched category ID can't replace a hardcoded union without also rewriting `CategoryStep` and `PotOnboarding` in the same change). The build stays green after this task.

- [ ] **Step 1: Append the new types**

Add to the end of `src/types/pot.ts`:

```ts
export interface PotCategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: string; // kebab-case slug, e.g. "heart-pulse" — maps to a lucide-react icon name
}

export interface PotOrganiser {
  firstName: string;
  lastName: string;
  thumbnailUrl: string | null;
  id: string;
}

export interface Pot {
  id: string;
  title: string;
  description: string;
  organiser: PotOrganiser;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  category: PotCategoryMeta;
  pageId: string | null;
  smartGoalSetting: boolean;
  currency: string;
}
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/types/pot.ts`

- [ ] **Step 3: Commit**

```bash
git add src/types/pot.ts
git commit -m "feat(pot-onboarding): add PotCategoryMeta, PotOrganiser, and Pot types"
```

---

## Task 2: `usePotCategories` hook

**Files:**
- Create: `src/hooks/usePotCategories.ts`

**Interfaces:**
- Consumes: `authenticatedFetch` from `../lib/api`, `config` from `../lib/config`, `PotCategoryMeta` from `../types/pot` (Task 1)
- Produces: `usePotCategories(): { categories: PotCategoryMeta[]; isLoading: boolean; error: string | null; retry: () => void }` — used by Task 6 (`PotOnboarding`, `CategoryStep`)

`GET /pots/categories/all` returns `{ code: 200, data: PotCategoryMeta[], message, status }`. This hook fetches it once on mount using the same `authenticatedFetch` + manual `response.ok`/`result.data` pattern already used in `src/pages/Settings.tsx`.

- [ ] **Step 1: Create the hook**

```ts
// src/hooks/usePotCategories.ts
import { useCallback, useEffect, useState } from 'react';
import { authenticatedFetch } from '../lib/api';
import config from '../lib/config';
import type { PotCategoryMeta } from '../types/pot';

interface UsePotCategoriesResult {
  categories: PotCategoryMeta[];
  isLoading: boolean;
  error: string | null;
  retry: () => void;
}

export const usePotCategories = (): UsePotCategoriesResult => {
  const [categories, setCategories] = useState<PotCategoryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${config.apiBaseUrl}/pots/categories/all`, {
        method: 'GET',
      });
      if (!response.ok) {
        throw new Error('Failed to load categories');
      }
      const result = await response.json();
      setCategories(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return { categories, isLoading, error, retry: fetchCategories };
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/hooks/usePotCategories.ts`

- [ ] **Step 3: Commit**

```bash
git add src/hooks/usePotCategories.ts
git commit -m "feat(pot-onboarding): add usePotCategories hook"
```

---

## Task 3: `potApi.ts` — upload and create functions

**Files:**
- Create: `src/lib/potApi.ts`

**Interfaces:**
- Consumes: `config` from `./config`, `authenticatedFetch` from `./api`, `Pot` from `../types/pot` (Task 1)
- Produces:
  - `uploadPotCover(file: File, accessToken: string | null): Promise<string>`
  - `uploadPotFeatureImages(files: File[], accessToken: string | null): Promise<string[]>`
  - `createPot(payload: CreatePotPayload): Promise<Pot>`
  - `CreatePotPayload` (interface)

  — all used by Task 6 (`PotOnboarding`'s `handleLaunch`)

The two upload functions use plain `fetch` (not `authenticatedFetch`) because `authenticatedFetch` hardcodes `Content-Type: application/json`, which breaks a `multipart/form-data` body — this mirrors the existing manual-Bearer-header pattern in `src/components/ui/dialogs/ProfileImageUploadDialog.tsx:316-317`. `createPot` uses `authenticatedFetch` since it's a plain JSON call.

- [ ] **Step 1: Create the API module**

```ts
// src/lib/potApi.ts
import config from './config';
import { authenticatedFetch } from './api';
import type { Pot } from '../types/pot';

export interface CreatePotPayload {
  title: string;
  description: string;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  categoryId: string;
  smartGoalSetting: boolean;
}

export const uploadPotCover = async (file: File, accessToken: string | null): Promise<string> => {
  const formData = new FormData();
  formData.append('coverImage', file);

  const response = await fetch(`${config.apiBaseUrl}/pots/upload-cover`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload cover image');
  }
  const result = await response.json();
  return result.data;
};

export const uploadPotFeatureImages = async (files: File[], accessToken: string | null): Promise<string[]> => {
  if (files.length === 0) return [];

  const formData = new FormData();
  files.forEach((file) => formData.append('featuredImages', file));

  const response = await fetch(`${config.apiBaseUrl}/pots/upload-feature`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload feature images');
  }
  const result = await response.json();
  return result.data;
};

export const createPot = async (payload: CreatePotPayload): Promise<Pot> => {
  const response = await authenticatedFetch(`${config.apiBaseUrl}/pots/create`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const result = await response.json().catch(() => null);
    throw new Error(result?.message || 'Failed to create Pot');
  }
  const result = await response.json();
  return result.data;
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/lib/potApi.ts`

- [ ] **Step 3: Commit**

```bash
git add src/lib/potApi.ts
git commit -m "feat(pot-onboarding): add potApi upload and create functions"
```

---

## Task 4: Add `canvas-confetti` dependency

**Files:**
- Modify: `package.json`, `package-lock.json` (via npm)

**Interfaces:**
- Produces: `canvas-confetti` importable as `import confetti from 'canvas-confetti'` — used by Task 5 (`PotSuccessDialog`)

No existing utility in this repo produces a physically-animated confetti burst, so this clears CLAUDE.md's "check existing utilities first" bar before adding a dependency.

- [ ] **Step 1: Install the package and its types**

```bash
npm install canvas-confetti
npm install -D @types/canvas-confetti
```

- [ ] **Step 2: Verify it builds**

Run: `npm run build`
Expected: builds cleanly, `canvas-confetti` and `@types/canvas-confetti` appear in `package.json`

- [ ] **Step 3: Commit**

```bash
git add package.json package-lock.json
git commit -m "chore(pot-onboarding): add canvas-confetti dependency"
```

---

## Task 5: `PotSuccessDialog` component

**Files:**
- Create: `src/components/pot-onboarding/PotSuccessDialog.tsx`

**Interfaces:**
- Consumes: `Pot` from `../../types/pot` (Task 1), `confetti` from `canvas-confetti` (Task 4)
- Produces: `PotSuccessDialog` props: `{ pot: Pot; onDone: () => void }` — used by Task 6 (`PotOnboarding`)

Not wired into `PotOnboarding` yet in this task — it's a standalone, buildable component. Follows the existing modal shell convention (`DeleteDialog.tsx`, `ProfileImageUploadDialog.tsx`: `fixed inset-0 bg-black/30 backdrop-blur-sm z-40` backdrop + centered `bg-surface-lowest rounded-3xl shadow-lg` card), but with **no backdrop `onClick` and no close button** — the only exit is the "Back to Overview" button, since the Pot already exists server-side.

- [ ] **Step 1: Create the component**

```tsx
// src/components/pot-onboarding/PotSuccessDialog.tsx
import { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { PartyPopper } from 'lucide-react';
import type { Pot } from '../../types/pot';

interface PotSuccessDialogProps {
  pot: Pot;
  onDone: () => void;
}

export const PotSuccessDialog = ({ pot, onDone }: PotSuccessDialogProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const canvas = canvasRef.current;
    if (!canvas) return;

    const fire = confetti.create(canvas, { resize: true, useWorker: true });
    fire({ particleCount: 80, spread: 70, origin: { x: 0.2, y: 0.7 } });
    fire({ particleCount: 80, spread: 70, origin: { x: 0.8, y: 0.7 } });

    return () => fire.reset();
  }, []);

  const formattedGoal = `${pot.currency} ${pot.goal.toLocaleString('en-US')}`;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 z-[60] pointer-events-none" />
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-40" />
      <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
        <div className="bg-surface-lowest rounded-3xl shadow-lg max-w-md w-full border border-border/10 overflow-hidden text-center">
          <div className="p-8 flex flex-col items-center">
            <div className="w-14 h-14 rounded-2xl bg-primary flex items-center justify-center text-on-primary mb-5">
              <PartyPopper size={26} />
            </div>
            <h2 className="font-display text-2xl font-semibold text-foreground mb-2">
              &ldquo;{pot.title}&rdquo; is live!
            </h2>
            <p className="text-sm text-foreground/60 mb-6">
              Your Pot has been created and is ready to share with supporters. Goal: {formattedGoal}.
            </p>
            <button
              onClick={onDone}
              className="w-full bg-primary text-on-primary font-display text-sm font-semibold rounded-xl px-8 py-3.5"
            >
              Back to Overview
            </button>
          </div>
        </div>
      </div>
    </>
  );
};
```

- [ ] **Step 2: Verify it compiles**

Run: `npm run lint`
Expected: no errors related to `src/components/pot-onboarding/PotSuccessDialog.tsx`

- [ ] **Step 3: Commit**

```bash
git add src/components/pot-onboarding/PotSuccessDialog.tsx
git commit -m "feat(pot-onboarding): add PotSuccessDialog with confetti"
```

---

## Task 6: Wire categories, image upload, and pot creation into the wizard

**Files:**
- Modify: `src/types/pot.ts` (67 lines → replace category-related section)
- Modify: `src/components/pot-onboarding/CategoryStep.tsx` (99 lines → full rewrite)
- Modify: `src/components/pot-onboarding/GoalStep.tsx` (49 lines → currency only)
- Modify: `src/components/pot-onboarding/PreviewStep.tsx` (39 lines → currency only)
- Modify: `src/pages/PotOnboarding.tsx` (180 lines → full rewrite)

**Interfaces:**
- Consumes:
  - `usePotCategories` (Task 2)
  - `uploadPotCover`, `uploadPotFeatureImages`, `createPot` from `../lib/potApi` (Task 3)
  - `PotSuccessDialog` from `../components/pot-onboarding/PotSuccessDialog` (Task 5)
  - `PotCategoryMeta`, `Pot` from `../types/pot` (Task 1)
- Produces: final `PotDraft` shape (`categoryId: string` replaces `category: PotCategory`), final `CategoryStep` props `{ categories, categoryId, onSelect, isLoading, error, onRetry }`

This is a single atomic task because `types/pot.ts`, `CategoryStep.tsx`, and `PotOnboarding.tsx` all change together — none of them compiles correctly in isolation once the hardcoded `PotCategory` union is removed. This mirrors how the wizard was originally built as one state-owning orchestrator with tightly-coupled step props.

- [ ] **Step 1: Replace the category types in `src/types/pot.ts`**

Remove the `PotCategory` union, the `category` field on `PotDraft`, and `CATEGORY_LABELS` entirely. Replace the whole file with:

```ts
// src/types/pot.ts
export interface PotCategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: string; // kebab-case slug, e.g. "heart-pulse" — maps to a lucide-react icon name
}

export interface PotDraft {
  categoryId: string;
  title: string;
  story: string;
  goalAmount: number | '';
  smartGoal: boolean;
  coverImage: File | null;
  featureImages: [File | null, File | null, File | null];
}

export interface PotOrganiser {
  firstName: string;
  lastName: string;
  thumbnailUrl: string | null;
  id: string;
}

export interface Pot {
  id: string;
  title: string;
  description: string;
  organiser: PotOrganiser;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  category: PotCategoryMeta;
  pageId: string | null;
  smartGoalSetting: boolean;
  currency: string;
}

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

- [ ] **Step 2: Rewrite `CategoryStep.tsx` to consume fetched categories**

```tsx
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
```

- [ ] **Step 3: Update `GoalStep.tsx` currency prefix**

In `src/components/pot-onboarding/GoalStep.tsx`, replace the `$` prefix span and widen the input's left padding to fit it:

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
        <span className="absolute left-4 top-1/2 -translate-y-1/2 font-display text-lg font-semibold text-foreground">KES</span>
        <input
          value={goalAmount}
          onChange={(e) => onGoalChange(e.target.value === '' ? '' : Number(e.target.value))}
          type="number"
          min={0}
          step={100}
          className="w-full font-display text-lg font-semibold text-foreground bg-surface-low border-0 border-l-2 border-primary rounded-lg pl-16 pr-4 py-3.5 outline-none"
        />
      </div>

      <div className="flex items-center justify-between bg-surface-low rounded-xl px-5 py-4">
        <div className="pr-5">
          <div className="text-sm font-bold text-foreground mb-1">Smart goal setting</div>
          <div className="text-[13px] leading-relaxed text-foreground/60">
            Automatically fine-tune your goal over time based on how your Pot's story and category typically perform.
          </div>
        </div>
        <button
          type="button"
          onClick={onToggleSmartGoal}
          role="switch"
          aria-checked={smartGoal}
          className={`flex-shrink-0 w-[46px] h-[26px] rounded-full p-[3px] cursor-pointer transition-colors ${
            smartGoal ? 'bg-primary' : 'bg-foreground/15'
          }`}
        >
          <div
            className={`w-5 h-5 rounded-full bg-surface-lowest shadow-md transition-transform ${
              smartGoal ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    </div>
  );
};
```

- [ ] **Step 4: Update `PreviewStep.tsx` currency label**

In `src/components/pot-onboarding/PreviewStep.tsx`, change the hardcoded `$0 raised` to `KES 0 raised` (only that one string changes; everything else in the file is unchanged):

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
      <div className="p-[18px]">
        <span className="inline-block text-[10px] font-bold tracking-wide text-primary bg-primary/10 px-2.5 py-1 rounded-full mb-2.5">
          {categoryLabel}
        </span>
        <div className="font-display text-base font-semibold text-foreground mb-1.5">{title}</div>
        <div className="text-[13px] leading-relaxed text-foreground/60 mb-4">{storyExcerpt}</div>
        <div className="w-full h-1.5 bg-foreground/10 rounded overflow-hidden mb-2.5">
          <div className="h-full w-[6%] bg-gradient-to-br from-secondary to-primary rounded" />
        </div>
        <div className="flex justify-between text-[13px]">
          <span className="font-bold text-foreground">KES 0 raised</span>
          <span className="text-foreground/60">of {formattedGoal} goal</span>
        </div>
      </div>
    </div>
  );
};
```

- [ ] **Step 5: Rewrite `PotOnboarding.tsx` to wire categories, submit flow, and the success dialog**

```tsx
// src/pages/PotOnboarding.tsx
import { useEffect, useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { usePotCategories } from '../hooks/usePotCategories';
import { StepSidebar } from '../components/pot-onboarding/StepSidebar';
import { CategoryStep } from '../components/pot-onboarding/CategoryStep';
import { DetailsStep } from '../components/pot-onboarding/DetailsStep';
import { PhotosStep } from '../components/pot-onboarding/PhotosStep';
import { GoalStep } from '../components/pot-onboarding/GoalStep';
import { ReviewStep } from '../components/pot-onboarding/ReviewStep';
import { PreviewStep } from '../components/pot-onboarding/PreviewStep';
import { PotSuccessDialog } from '../components/pot-onboarding/PotSuccessDialog';
import { uploadPotCover, uploadPotFeatureImages, createPot } from '../lib/potApi';
import type { PotDraft, Pot } from '../types/pot';
import { STEP_CONTENT } from '../types/pot';

const TOTAL_STEPS = 6;

export const PotOnboarding = () => {
  const navigate = useNavigate();
  const { isAuthenticated, isLoading, accessToken } = useAuth();
  const { categories, isLoading: categoriesLoading, error: categoriesError, retry: retryCategories } = usePotCategories();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [createdPot, setCreatedPot] = useState<Pot | null>(null);
  const [draft, setDraft] = useState<PotDraft>({
    categoryId: '',
    title: '',
    story: '',
    goalAmount: '',
    smartGoal: true,
    coverImage: null,
    featureImages: [null, null, null],
  });

  useEffect(() => {
    if (draft.categoryId === '' && categories.length > 0) {
      setDraft((d) => ({ ...d, categoryId: categories[0].id }));
    }
  }, [categories, draft.categoryId]);

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

  const categoryLabel = categories.find((c) => c.id === draft.categoryId)?.name ?? '';
  const goalNum = Number(draft.goalAmount) || 0;
  const formattedGoal = `KES ${goalNum.toLocaleString('en-US')}`;
  const storyExcerpt = draft.story.length > 140 ? `${draft.story.slice(0, 140).trim()}…` : draft.story;
  const photoSummary = draft.coverImage
    ? `Cover + ${draft.featureImages.filter(Boolean).length} feature image(s)`
    : 'No photos added yet';

  const requiredOk: Record<number, boolean> = {
    1: draft.categoryId !== '',
    2: draft.title.trim().length > 0 && draft.story.trim().length > 0,
    3: draft.coverImage !== null,
    4: draft.goalAmount !== '' && Number(draft.goalAmount) > 0,
    5: true,
    6: true,
  };
  const canContinue = requiredOk[step];

  const goBack = () => setStep((s) => Math.max(1, s - 1));
  const goHome = () => navigate('/');
  const goNext = () => setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  const jumpTo = (n: number) => setStep(n);

  const handleLaunch = async () => {
    if (!draft.coverImage) return;
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      const coverUrl = await uploadPotCover(draft.coverImage, accessToken);
      const featureFiles = draft.featureImages.filter((f): f is File => f !== null);
      const featureUrls = await uploadPotFeatureImages(featureFiles, accessToken);
      const pot = await createPot({
        title: draft.title,
        description: draft.story,
        coverImage: coverUrl,
        featuredImages: featureUrls,
        goal: Number(draft.goalAmount),
        categoryId: draft.categoryId,
        smartGoalSetting: draft.smartGoal,
      });
      setCreatedPot(pot);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const mainAction = () => {
    if (step === TOTAL_STEPS) {
      handleLaunch();
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
    <>
      <div className="flex min-h-screen w-full bg-background">
        <StepSidebar step={step} content={STEP_CONTENT[step]} />

        <div className="flex-1 bg-surface-lowest rounded-tl-[40px] flex flex-col relative min-w-0">
          <div className="flex-1 overflow-y-auto flex px-16">
            <div key={step} className="pot-step-in w-full max-w-[560px] mx-auto my-auto">
              {step === 1 && (
                <CategoryStep
                  categories={categories}
                  categoryId={draft.categoryId}
                  onSelect={(categoryId) => setDraft((d) => ({ ...d, categoryId }))}
                  isLoading={categoriesLoading}
                  error={categoriesError}
                  onRetry={retryCategories}
                />
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
                  photoSummary={photoSummary}
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

          <div className="px-16 pb-10">
            {submitError && (
              <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-sm text-red-500">
                {submitError}
              </div>
            )}
            <div className="flex justify-between items-center">
              <button
                onClick={() => {
                  if (step === 1) {
                    goHome();
                  } else {
                    goBack();
                  }
                }}
                disabled={isSubmitting}
                className="bg-transparent text-foreground font-display text-sm font-semibold ring-1 ring-inset ring-foreground/15 rounded-xl px-7 py-3.5 disabled:opacity-50"
              >
                Back
              </button>

              <button
                onClick={mainAction}
                disabled={!canContinue || isSubmitting}
                className={`font-display text-sm font-semibold rounded-xl px-8 py-3.5 ${
                  canContinue && !isSubmitting
                    ? 'bg-primary text-on-primary cursor-pointer'
                    : 'bg-foreground/20 text-foreground/50 cursor-not-allowed'
                }`}
              >
                {step === TOTAL_STEPS ? (isSubmitting ? 'Launching…' : 'Launch Pot') : 'Continue'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {createdPot && <PotSuccessDialog pot={createdPot} onDone={() => navigate('/')} />}
    </>
  );
};
```

- [ ] **Step 6: Verify it builds**

Run: `npm run build`
Expected: builds cleanly — no TypeScript errors (this is the point where the removed `PotCategory`/`CATEGORY_LABELS` and the changed `CategoryStep` props must line up across all five files touched in this task)

- [ ] **Step 7: Manual check — categories load and cover image gating**

Run: `npm run dev`, sign in, navigate to `/pot/new`.
Expected:
- Step 1 shows a real fetched category grid (or a 10-tile pulsing skeleton briefly, then the real grid) with icons matching each category's `icon` slug; the first category is pre-selected.
- Step 3: Continue stays disabled until a cover image is selected.
- Step 4 and step 6 show "KES" instead of "$".

- [ ] **Step 8: Commit**

```bash
git add src/types/pot.ts src/components/pot-onboarding/CategoryStep.tsx src/components/pot-onboarding/GoalStep.tsx src/components/pot-onboarding/PreviewStep.tsx src/pages/PotOnboarding.tsx
git commit -m "feat(pot-onboarding): wire categories, image upload, and pot creation into the wizard"
```

---

## Task 7: End-to-end verification

**Files:** none (verification only)

- [ ] **Step 1: Full checks**

Run: `npm run lint && npm run build`
Expected: both clean, zero errors/warnings introduced by this feature

- [ ] **Step 2: Manual click-through against the real backend**

Run: `npm run dev`. In the browser, signed in, at `/pot/new`:

1. Step 1: confirm the category grid loads from the real API (open devtools Network tab, confirm a `GET /pots/categories/all` call); confirm icons render correctly for all 10 categories; select a non-default category.
2. Step 2: fill title + story.
3. Step 3: select a cover image and 1-2 feature images; confirm Continue is disabled with no cover image and enables once one is set.
4. Step 4: enter a goal amount; confirm the `KES` prefix displays correctly; toggle smart goal setting.
5. Step 5: confirm the review summary shows the correct category name, title/story excerpt, photo summary, and `KES`-formatted goal; use each "Edit" link to confirm it jumps to the right step.
6. Step 6: confirm the preview card renders correctly with `KES` formatting.
7. Click "Launch Pot": confirm the button shows "Launching…" and disables; confirm in the Network tab the calls fire in order — `POST /pots/upload-cover` (field `coverImage`) → `POST /pots/upload-feature` (field `featuredImages`, only if feature images were selected) → `POST /pots/create` with the correct JSON body (`categoryId` is a real UUID, `goal` is a number, `featuredImages` is an array of URLs).
8. Confirm the success dialog appears with confetti, the correct Pot title, and the correct `KES`-formatted goal.
9. Confirm the success dialog cannot be dismissed by clicking the backdrop; only "Back to Overview" works, navigating to `/`.
10. Launch a second Pot with **no** feature images selected — confirm `POST /pots/upload-feature` is not called at all, and `/pots/create` is sent with `featuredImages: []`.
11. Simulate a failure (e.g. temporarily disconnect network, or use browser devtools to block the `/pots/create` request) mid-launch — confirm an inline red error banner appears above the Launch button, the button re-enables and reads "Launch Pot" again, and the draft (including selected images) is untouched; retry successfully.
12. Enable OS-level "reduce motion" and relaunch a Pot — confirm no confetti animation fires but the success dialog still appears correctly.
13. Toggle dark mode — confirm the category skeleton, error/retry state, and success dialog all render correctly.

- [ ] **Step 3: Final commit (if any fixes were needed)**

```bash
git add -A
git commit -m "fix(pot-onboarding): address issues found in end-to-end verification"
```

(Skip this commit if step 2 found no issues.)
