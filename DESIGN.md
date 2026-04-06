# Design System Document: High-End Editorial Fintech

## 1. Overview & Creative North Star: "The Architectural Ledger"
This design system moves away from the cluttered, "dashboard-heavy" nature of traditional fintech. Our Creative North Star is **The Architectural Ledger**. It treats digital wealth management like a high-end physical space—think of a minimalist gallery where the "art" is the user’s financial growth.

We achieve a premium feel through **intentional asymmetry**, **exaggerated white space**, and **tonal layering**. We reject the "standard UI" of boxed-in grids. Instead, we use geometric metaphors—rising diagonals and staggered layouts—to represent dynamic growth. The interface should feel curated, not populated.

---

## 2. Color & Surface Philosophy
The palette is rooted in a sophisticated contrast between heritage depth (`primary`) and modern vitality (`secondary`).

### The Palette
- **Primary (`#00342b`)**: Use for high-authority moments and deep-background sections.
- **Secondary/Coral (`#ac3509`)**: Reserved for "Growth Actions" and key conversion points.
- **Tertiary/Light Blue (`#003142`)**: Used for data visualization and secondary accents.
- **Background (`#fbf9f5`)**: An off-white "bone" finish that feels more editorial than pure white.

### The "No-Line" Rule
**Explicit Instruction:** You are prohibited from using 1px solid borders to section off content. Sectioning must be achieved through:
1.  **Background Shifts:** Transitioning from `surface` to `surface-container-low`.
2.  **Negative Space:** Using the Spacing Scale to create clear, unlined boundaries.

### Surface Hierarchy & Nesting
Treat the UI as physical layers of fine paper. 
- Place a `surface-container-lowest` card on a `surface-container-low` section to create a soft, natural lift. 
- **The Glass Rule:** For floating navigation or modal overlays, use `surface` with 80% opacity and a `24px` backdrop-blur. This "frosted glass" effect ensures the UI feels integrated into the environment rather than a sticker placed on top.

---

## 3. Typography: Geometric Authority
We pair the technical precision of **Space Grotesk** with the humanistic clarity of **Manrope**.

*   **Display & Headlines (Space Grotesk):** These are our "anchors." Use `display-lg` (3.5rem) with tight letter-spacing (-0.02em) to create an editorial, high-fashion impact. 
*   **Body & Titles (Manrope):** Chosen for its immense readability in dense financial data. 
*   **The Hierarchy Goal:** Use extreme scale contrast. A massive `display-md` headline next to a tiny, wide-tracked `label-md` creates an "Architectural" feel that looks custom-designed rather than templated.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are too "software-like." This system uses **Tonal Layering**.

*   **The Layering Principle:** Depth is achieved by stacking `surface-container` tiers. 
    *   Base: `surface`
    *   Secondary Content: `surface-container-low`
    *   Active Cards: `surface-container-lowest`
*   **Ambient Shadows:** If a floating element (like a FAB or Popover) requires a shadow, use a `32px` blur with 4% opacity. The shadow color must be a tinted version of `on-surface` (`#1b1c1a`), never pure black.
*   **The Ghost Border:** If a boundary is mission-critical for accessibility, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.

---

## 5. Components & Primitive Styling

### Buttons
- **Primary:** High-contrast `primary` background with `on-primary` text. Use `xl` (0.75rem) roundedness. 
- **Signature Growth CTA:** Use a subtle linear gradient from `primary` to `primary-container` at a 135-degree angle to provide "soul."
- **Secondary:** Transparent background with a `Ghost Border`.

### Cards & Lists
- **Prohibited:** Horizontal divider lines.
- **Layout:** Separate transactions or list items using `12px` of vertical white space or a slight hover state shift to `surface-container-high`.
- **Growth Metaphor:** Use the `secondary` (Coral) color for upward-trending data visualizations, creating a sharp "pop" against the Dark Teal.

### Input Fields
- Use `surface-container-highest` for the input background. 
- On focus, do not use a heavy border; instead, shift the background to `surface-container-lowest` and provide a `2px` left-side accent bar in `primary`.

### Data Visualization (Fintech Context)
- **The Geometric Growth Path:** Charts should use thick, `4px` strokes. 
- Areas under line charts should use a "fading glass" gradient—from `secondary` at 20% opacity to `background` at 0%.

---

## 6. Do’s and Don’ts

### Do:
*   **Do** use asymmetrical margins (e.g., a wider left margin for headlines than for body text) to create a premium, editorial feel.
*   **Do** allow elements to overlap slightly (e.g., a card overlapping a background color transition) to create depth.
*   **Do** use `display-lg` typography for balance totals; the numbers are the hero.

### Don't:
*   **Don't** use 100% opaque borders for any reason.
*   **Don't** use generic system icons. Use custom, geometric, thin-stroke (1.5pt) icons that match the `Space Grotesk` aesthetic.
*   **Don't** cram information. If a screen feels full, increase the container size and add a scroll—premium design requires "breathing room."
*   **Don't** use "Alert Red" for everything. Use the `error` (`#ba1a1a`) token sparingly, ensuring it sits on an `error_container` for a softer, integrated look.