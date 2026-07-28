# Pot Onboarding Flow — Design

## Summary

Add a "create a fundraiser" entry point to the dashboard Home page, and a full-page,
6-step onboarding wizard ("Pot" is this product's term for a fundraiser) that walks
the user through creating one. Ports the visual design from the imported Claude
Design project `Pot fundraiser onboarding flow` (`Pot Onboarding.dc.html`) onto this
repo's existing Tailwind design tokens. UI-only for this iteration — no backend
persistence; "Launch Pot" ends in a local confirmation state.

## 1. Home.tsx — entry point

Replace the current placeholder content in `src/pages/Home.tsx` (the empty
`bg-surface-lowest` panel with "Welcome to your dashboard.") with a centered
empty-state prompt:

- Icon/visual accent using existing tokens (`text-secondary` / `bg-primary`)
- Headline (Space Grotesk / `font-display`): "Create your first Pot"
- One line of supporting copy
- Primary button, "Start a Pot", `onClick` → `navigate('/pot/new')`

No new dependencies. Builds entirely from tokens already in `tailwind.config.js`
(`primary`, `secondary`, `surface-lowest`, `shadow-ambient`).

## 2. Routing

`/pot/new` is added to `src/App.tsx` as a **standalone top-level route**, a sibling
of `/signin` / `/signup` / `/forgot-password` — **not** nested under the
`DashboardLayout` route. This is required so the wizard renders full-viewport with
no Sidebar/Topbar chrome (`DashboardLayout` always renders `Sidebar` + `Topbar`
around its `Outlet`, so anything nested inside it inherits that chrome).

```tsx
<Route path="/signin" element={<SignIn />} />
...
<Route path="/pot/new" element={<PotOnboarding />} />
<Route path="/" element={<DashboardLayout />}>
  ...existing nested routes unchanged...
</Route>
```

Because `PotOnboarding` sits outside `DashboardLayout`, it does not get that
component's auth guard for free. `PotOnboarding` performs the same guard inline,
reusing the existing `useAuth` hook:

```tsx
const { isAuthenticated, isLoading } = useAuth();
if (isLoading) return <...loading spinner, same markup as DashboardLayout...>;
if (!isAuthenticated) return <Navigate to="/signin" replace />;
```

This duplicates ~10 lines already present in `DashboardLayout.tsx` rather than
extracting a shared guard — `DashboardLayout.tsx` has unrelated uncommitted changes
in this working tree, and a single small page doesn't justify restructuring the
shared layout/auth wiring.

## 3. File layout

```
src/pages/PotOnboarding.tsx          # orchestrates state, current step, layout shell
src/components/pot-onboarding/
  StepSidebar.tsx                    # left rail: step counter, step title, description
  CategoryStep.tsx                   # step 1 — category chip grid (10 categories)
  DetailsStep.tsx                    # step 2 — title + story
  PhotosStep.tsx                     # step 3 — cover + 3 feature images
  GoalStep.tsx                       # step 4 — amount + smart-goal toggle
  ReviewStep.tsx                     # step 5 — summary with "Edit" jump-links
  PreviewStep.tsx                    # step 6 — Pot card preview + Launch
  ImageUploadSlot.tsx                # click/drag image upload + local preview
src/types/pot.ts                     # PotCategory union, PotDraft type
```

`PotOnboarding.tsx` owns all wizard state via `useState` and passes values/handlers
down as props to the active step component. This mirrors the imported design's
single-component state machine, split into focused files per this repo's
conventions (`CLAUDE.md`: "Keep components focused and single-purpose").

## 4. Step content (ported from the design)

| Step | Title | Content |
|---|---|---|
| 1 | What's this Pot for? | Grid of 10 category chips: Medical, Education, Community, Emergency, Business, Charity, Environment, Sports, Technology, In Memory. Selecting sets `category`. |
| 2 | Give your Pot a name and a story | `title` text input, `story` textarea. |
| 3 | Add photos | Required cover image slot + 3 optional feature image slots. |
| 4 | Set your goal | `goalAmount` currency input + "Smart goal setting" toggle (`smartGoal`). |
| 5 | Confirm your details | Read-only summary of category/title+story/photos/goal, each with a "Edit" link that jumps back to the relevant step (`jumpTo(n)`). |
| 6 | Preview your Pot | Rendered Pot card (cover image, category badge, title, story excerpt, $0/goal progress bar) + "Launch Pot" button. |

Left rail (`StepSidebar`) shows "`{step}` of 6", the step's title, and its
description — content driven by the same per-step copy table as the design's
`stepContent` map. The design's Lottie step illustration is dropped (it's gated
behind a `showIllustrations` prop defaulting to `false` in the source design, i.e.
already optional/off).

## 5. Validation / navigation

Continue is disabled per-step exactly as in the source design's `requiredOk` logic:

- Step 1: always valid (a category is always selected, default `medical`)
- Step 2: `title.trim()` and `story.trim()` both non-empty
- Step 3: always valid (cover image is visually marked required but not gated —
  matches the design)
- Step 4: `goalAmount !== '' && Number(goalAmount) > 0`
- Step 5, 6: always valid

Back/Continue buttons sit at the bottom of the content panel. On step 6, the
primary button reads "Launch Pot"; clicking it sets a local `launched` flag and
swaps the button for a confirmation state with a "Back to Overview" action
(`navigate('/')`). No API call — matches the UI-only scope for this iteration.

## 6. Images

The source design's `<image-slot>` is a design-tool-only web component and isn't
usable outside that environment. `ImageUploadSlot` replaces it: click-to-browse
(hidden `<input type="file" accept="image/*">`) plus drag-and-drop, previewed via
`URL.createObjectURL`. State holds `File | null` per slot (cover + 3 feature
slots); nothing is uploaded anywhere in this iteration.

## 7. Styling

All of the source design's inline hex/px styles map directly onto tokens already
defined in `tailwind.config.js` / `index.css` — no new colors, fonts, or Tailwind
plugins needed:

| Design value | Token |
|---|---|
| `#00342b` | `primary` |
| `#ac3509` | `secondary` |
| `#fbf9f5` | `background` |
| `#f2efe8` | `surface-low` |
| `#fffdfa` | `surface-lowest` |
| Space Grotesk | `font-display` |
| Manrope | `font-sans` |

No inline `style=` attributes — Tailwind utility classes throughout, per
`CLAUDE.md` conventions.

## 8. Step transition animation

No animation library is installed (`framer-motion`, `tailwindcss-animate`, etc. are
all absent from `package.json`), and none is needed. A single `@keyframes` rule is
added to `index.css`:

```css
@keyframes pot-step-in {
  from { opacity: 0; transform: translateY(8px); }
  to   { opacity: 1; transform: translateY(0); }
}
```

The step-content wrapper inside `PotOnboarding.tsx` is `key={step}`-ed by the
current step number, so React remounts it on every step change (forward or back).
The keyframe is applied as a plain CSS `animation` on that wrapper, which replays
automatically on each remount — no JS-driven animation state required. The left
rail's step counter/title/description animate the same way, keyed together.

## 9. Verification

This repo has no test runner (`npm run lint` and `tsc -b` via `npm run build` are
the only checks). Verification plan:

1. `npm run lint` and `npm run build` clean
2. `npm run dev`, click through: Home → "Start a Pot" → all 6 steps forward and
   back → category selection → title/story validation gating → image upload
   (drag and click-to-browse) → goal validation gating → smart-goal toggle →
   review "Edit" jump-links → preview card renders correct data → Launch → "Back
   to Overview" returns to `/`
3. Confirm no Sidebar/Topbar visible on `/pot/new`
4. Confirm step transition animation plays on both forward and backward navigation
5. Spot-check dark mode (tokens are dark-mode aware already; wizard should inherit
   correctly without extra work)
