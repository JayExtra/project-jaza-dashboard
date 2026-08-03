# Pot Creation Submission — Design

## Summary

The Pot onboarding wizard (`src/pages/PotOnboarding.tsx`, see
[2026-07-28-pot-onboarding-design.md](2026-07-28-pot-onboarding-design.md)) was built
UI-only: category is a hardcoded local union, cover/feature images stay as unsent
`File` objects, and "Launch Pot" just flips a local `launched` boolean. This design
wires the wizard up to the real backend:

- Category selection is driven by a fetched category list instead of a hardcoded
  union.
- Clicking "Launch Pot" uploads any selected images, then calls `POST /pots/create`.
- On success, a non-dismissable success dialog with a confetti animation replaces
  the current in-place "Back to Overview" button swap.

Backend contracts used (confirmed by user):

```
GET  {apiBaseUrl}/pots/categories/all
  → { code: 200, data: [{ id, name, description, icon }, ...10 items], message, status }

POST {apiBaseUrl}/pots/upload-cover     (multipart, field "coverImage", single file)
  → the cover image's download URL as a string (wrapped in the standard { data } envelope)

POST {apiBaseUrl}/pots/upload-feature   (multipart, field "featuredImages", 0-3 files)
  → an array of download URL strings, same order as the files sent (wrapped in { data })

POST {apiBaseUrl}/pots/create
  body: { title, description, coverImage, featuredImages, goal, categoryId, smartGoalSetting }
  → { code: 201, data: Pot, message: "Pot created successfully", status: "CREATED" }
```

`Pot` (the `data` shape of the create response) includes: `id`, `title`, `description`,
`organiser`, `coverImage`, `featuredImages`, `goal`, `category`, `pageId`,
`smartGoalSetting`, `currency` ("KES" observed).

Assumption carried into implementation: the two upload endpoints follow the same
`{ code, data, message, status }` envelope as every other endpoint in this codebase
(categories, auth, account) — the user described the *payload* shape (a string / a
list of strings) but not the raw wire envelope. If this assumption is wrong, only the
two functions in `src/lib/potApi.ts` that parse the upload responses need to change.

## 1. Types — `src/types/pot.ts`

Remove the hardcoded `PotCategory` union and `CATEGORY_LABELS` map. Replace with:

```ts
export interface PotCategoryMeta {
  id: string;
  name: string;
  description: string;
  icon: string; // kebab-case slug, e.g. "heart-pulse" — maps to a lucide-react icon
}

export interface PotDraft {
  categoryId: string;          // '' until categories load and a default is selected
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
```

`STEP_CONTENT` is unchanged.

## 2. Categories — `src/hooks/usePotCategories.ts` (new)

A small hook, following the fetch pattern already used in `Settings.tsx`
(`authenticatedFetch` + manual `response.ok` / `result.data` handling — no new HTTP
library):

```ts
export const usePotCategories = () => {
  const [categories, setCategories] = useState<PotCategoryMeta[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authenticatedFetch(`${config.apiBaseUrl}/pots/categories/all`, { method: 'GET' });
      if (!response.ok) throw new Error('Failed to load categories');
      const result = await response.json();
      setCategories(result.data ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load categories');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  return { categories, isLoading, error, retry: fetchCategories };
};
```

`PotOnboarding.tsx` calls this once, and:
- Once `categories` loads and `draft.categoryId === ''`, defaults it to the first
  category returned (preserves the existing "step 1 always valid" behavior).
- `requiredOk[1]` becomes `draft.categoryId !== ''`.
- The `categoryLabel` value currently passed to `ReviewStep`/`PreviewStep` (previously
  a `CATEGORY_LABELS[draft.category]` lookup) is now derived as
  `categories.find((c) => c.id === draft.categoryId)?.name ?? ''`.

## 3. `CategoryStep.tsx` — icon mapping

Replace the hardcoded per-category SVGs with a slug → `lucide-react` icon lookup:

```ts
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
const DEFAULT_CATEGORY_ICON = CircleDot; // fallback for any future/unrecognized slug
```

Props change to `{ categories: PotCategoryMeta[]; categoryId: string; onSelect: (id: string) => void; isLoading: boolean }`.
Grid layout, active-state styling, and column count (3) are unchanged. While
`isLoading`, render 10 pulsing skeleton tiles in the same grid. If `usePotCategories`
returns an `error` (passed down from `PotOnboarding`), `CategoryStep` renders an error
message with a "Retry" button instead of the grid.

## 4. Upload + create — `src/lib/potApi.ts` (new)

A thin API layer, separate from the generic `authenticatedFetch` in `src/lib/api.ts`
because the upload calls need `multipart/form-data` (no `Content-Type: application/json`
default) and manual bearer-token attachment — mirroring the existing
`ProfileImageUploadDialog.tsx` upload pattern, but as plain `fetch` (no XHR/progress —
not required by this task, keeps this file simple):

```ts
async function uploadPotCover(file: File, accessToken: string | null): Promise<string> {
  const formData = new FormData();
  formData.append('coverImage', file);
  const response = await fetch(`${config.apiBaseUrl}/pots/upload-cover`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload cover image');
  const result = await response.json();
  return result.data;
}

async function uploadPotFeatureImages(files: File[], accessToken: string | null): Promise<string[]> {
  if (files.length === 0) return [];
  const formData = new FormData();
  files.forEach((file) => formData.append('featuredImages', file));
  const response = await fetch(`${config.apiBaseUrl}/pots/upload-feature`, {
    method: 'POST',
    headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
    credentials: 'include',
    body: formData,
  });
  if (!response.ok) throw new Error('Failed to upload feature images');
  const result = await response.json();
  return result.data;
}

interface CreatePotPayload {
  title: string;
  description: string;
  coverImage: string;
  featuredImages: string[];
  goal: number;
  categoryId: string;
  smartGoalSetting: boolean;
}

async function createPot(payload: CreatePotPayload): Promise<Pot> {
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
}

export const potApi = { uploadPotCover, uploadPotFeatureImages, createPot };
```

## 5. Submit flow — `PotOnboarding.tsx`

New state: `isSubmitting: boolean`, `submitError: string | null`, `createdPot: Pot | null`.

`mainAction`'s step-6 branch becomes an async `handleLaunch`:

```ts
const handleLaunch = async () => {
  setIsSubmitting(true);
  setSubmitError(null);
  try {
    const coverUrl = await potApi.uploadPotCover(draft.coverImage!, accessToken);
    const featureFiles = draft.featureImages.filter((f): f is File => f !== null);
    const featureUrls = await potApi.uploadPotFeatureImages(featureFiles, accessToken);
    const pot = await potApi.createPot({
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
```

- `draft.coverImage!` is safe because step 3 now requires it (see below).
- The `launched` boolean and its "Back to Overview" button-swap are removed entirely
  — replaced by rendering `<PotSuccessDialog pot={createdPot} onDone={() => navigate('/')} />`
  when `createdPot` is non-null.
- Launch button: `disabled={!canContinue || isSubmitting}`, label becomes "Launching…"
  while `isSubmitting`.
- `submitError`, if set, renders as an inline red banner (same visual pattern as
  `DeleteDialog`'s error banner) directly above the Back/Launch button row, and the
  Launch button remains clickable again for retry — no draft state is cleared on
  failure.

**Validation change:** `requiredOk[3]` changes from `true` to `draft.coverImage !== null`
— cover image becomes actually required to leave step 3, matching its existing
"REQUIRED" label. `requiredOk[1]` changes from `true` to `draft.categoryId !== ''`
(see §2).

## 6. Success dialog — `src/components/pot-onboarding/PotSuccessDialog.tsx` (new)

Follows the existing modal shell convention (`DeleteDialog.tsx`,
`ProfileImageUploadDialog.tsx`): `fixed inset-0 bg-black/30 backdrop-blur-sm z-40`
backdrop + centered `bg-surface-lowest rounded-3xl shadow-lg` card. Unlike those
dialogs, **it is not dismissable** — no backdrop `onClick`, no close `X` — because the
Pot already exists server-side and there's nothing left to edit; the only exit is a
single "Back to Overview" button (`onDone`).

Content: a success icon badge (`PartyPopper` from `lucide-react`, matching the
existing colored-icon-badge pattern), heading (`"{pot.title}" is live!`), one line of
supporting copy, and the goal formatted as KES (§7).

Props: `{ pot: Pot; onDone: () => void }`.

## 7. Confetti

New dependency: `canvas-confetti` (+ `@types/canvas-confetti` dev dependency) — no
existing utility in this repo covers a physically-animated confetti burst, so this
clears CLAUDE.md's "check existing utilities first" bar.

Inside `PotSuccessDialog`, a `<canvas>` is rendered `fixed inset-0 z-[60] pointer-events-none`
(above the dialog's own `z-50`/`z-40` layers). On mount:

```ts
useEffect(() => {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const myConfetti = confetti.create(canvasRef.current!, { resize: true, useWorker: true });
  myConfetti({ particleCount: 80, spread: 70, origin: { x: 0.2, y: 0.7 } });
  myConfetti({ particleCount: 80, spread: 70, origin: { x: 0.8, y: 0.7 } });
  return () => myConfetti.reset();
}, []);
```

Two bursts fired once, from the bottom-left and bottom-right toward center — no
continuous loop, no user interaction required. Skipped entirely under
`prefers-reduced-motion`.

## 8. Currency — KES instead of `$`

- `PotOnboarding.tsx`: `formattedGoal` becomes `` `KES ${goalNum.toLocaleString('en-US')}` ``.
- `GoalStep.tsx`: the absolute-positioned `$` prefix span becomes `KES` (input left
  padding adjusted from `pl-8` to fit the wider label, e.g. `pl-14`).
- `PreviewStep.tsx`: `$0 raised` becomes `KES 0 raised`.
- `PotSuccessDialog.tsx` formats `pot.goal` the same way.

## 9. Error handling summary

| Failure point | Behavior |
|---|---|
| Categories fetch fails | Step 1 shows inline error + Retry instead of the category grid; wizard can't proceed past step 1 |
| Cover upload / feature upload / create-pot fails | Inline red banner above the action row on step 6; Launch button re-enabled for retry; all draft state (including selected files) preserved |

## 10. Out of scope

- Upload progress bars (the existing `ProfileImageUploadDialog` XHR+progress pattern
  is not reused — plain `fetch` is sufficient here; no requirement was stated for
  progress UI on pot image uploads).
- Editing or viewing the created Pot from the success dialog beyond "Back to Overview"
  (no Pot detail/list page exists yet in this codebase).
- Retrying individual failed steps (e.g. re-using an already-uploaded cover URL if
  only feature upload fails) — a full retry re-runs cover → feature → create from
  scratch. Simpler, and re-uploading images on the rare retry path is an acceptable
  cost.

## 11. Verification plan

This repo has no test runner — `npm run lint` and `npm run build` (`tsc -b`) are the
only automated checks.

1. `npm run lint` and `npm run build` clean.
2. `npm run dev`, click through the full wizard with a real backend:
   - Step 1 shows real fetched categories with correct icons; loading skeleton and
     error+retry states verified (e.g. by briefly blocking the network request).
   - Step 3 blocks Continue until a cover image is selected.
   - Step 4 shows "KES" instead of "$"; Preview step and Review step show KES too.
   - Launch Pot with cover + 2 feature images → network tab shows
     upload-cover → upload-feature → create in sequence with correct field names
     (`coverImage`, `featuredImages`) → success dialog appears with confetti,
     correct title/goal.
   - Launch Pot with cover only, no feature images → feature upload call is skipped
     entirely, `featuredImages: []` sent to `/pots/create`.
   - Simulate a create-pot failure (e.g. temporarily point at a bad URL) → inline
     error banner shown, Launch re-enabled, draft state intact, retry succeeds.
   - Success dialog cannot be dismissed via backdrop click; only "Back to Overview"
     navigates to `/`.
   - Confetti does not fire when OS-level "reduce motion" is enabled.
3. Dark mode spot-check on the new dialog and skeleton states.
