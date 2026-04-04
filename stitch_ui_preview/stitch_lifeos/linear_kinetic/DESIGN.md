# Design System Specification: The Obsidian Life Protocol

## 1. Overview & Creative North Star
**Creative North Star: The Digital Architect**
This design system moves away from the "standard dashboard" aesthetic into a realm of high-end editorial precision. We are not just building an app; we are building a sophisticated tool for life-curation. The goal is to create a "Linear-style" experience that feels like a premium physical object—think matte black titanium and frosted glass. 

We achieve this through **Intentional Asymmetry** and **Tonal Depth**. By breaking the rigid 12-column grid in favor of varied content widths and overlapping elements, we create a layout that feels bespoke and fluid rather than templated.

---

## 2. Color & Atmospheric Theory
The palette is rooted in deep obsidian tones, utilizing the Indigo accent (`#6366f1`) to guide the eye through a dark, atmospheric space.

### The "No-Line" Rule
Standard 1px borders are strictly prohibited for sectioning. Structural definition must be achieved through:
1.  **Background Shifts:** Using `surface_container_low` against `surface`.
2.  **Tonal Transitions:** Defining an area by its slightly lighter or darker background value.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Use the following tiers to define importance:
-   **Base Layer (`surface` / `#131315`):** The foundation.
-   **Section Layer (`surface_container_low` / `#1c1b1d`):** Large structural blocks.
-   **Content Layer (`surface_container` / `#201f22`):** Standard cards and modules.
-   **Interactive Layer (`surface_container_high` / `#2a2a2c`):** Hover states and active modals.

### The "Glass & Gradient" Rule
To escape the "flat" look, use **Backdrop Blurs** (20px-40px) on floating elements using semi-transparent versions of `surface_variant`. 
-   **Signature CTA Gradient:** Use a subtle linear gradient from `primary` (`#c0c1ff`) to `primary_container` (`#8083ff`) at a 135° angle to give action points a luminous, "lit-from-within" soul.

---

## 3. Typography: Editorial Authority
The type system pairs the geometric strength of **Plus Jakarta Sans** with the utilitarian clarity of **Inter**.

-   **Display & Headlines (Plus Jakarta Sans, 800 Weight):** Use `display-lg` and `headline-lg` for high-contrast impact. Tighten letter-spacing by -0.02em to create an authoritative, "locked-in" editorial feel.
-   **Body & Labels (Inter, 400-500 Weight):** Use `body-md` for standard reading. The 1.5x line height ensures breathability against the high-contrast headlines.
-   **The Brand Signature:** Headings should often be paired with a much smaller `label-md` in uppercase with +0.1em tracking to create a sophisticated, "spec-sheet" hierarchy.

---

## 4. Elevation & Depth: Tonal Layering
In this system, light is the architect of space. We do not use "shadows" in the traditional sense; we use ambient occlusion.

-   **The Layering Principle:** Place a `surface_container_lowest` card on top of a `surface_container_low` background. This "negative lift" creates a sophisticated, recessed feel.
-   **Ambient Shadows:** For floating elements, use a diffused 32px blur with 6% opacity. The shadow color should be a tinted deep Indigo (`#0d0096`) rather than black, mimicking the way light reacts with a dark surface.
-   **Ghost Borders:** If a boundary is required for accessibility, use `outline_variant` at **15% opacity**. This creates a "suggestion" of a line that only appears under certain lighting/focus, maintaining the minimalist aesthetic.

---

## 5. Component Logic

### Cards & Containers
-   **Card Radius:** Always `xl` (1.5rem/24px) for outer containers, nesting `lg` (1rem/16px) inside. 
-   **Spacing:** Never use dividers. Separate list items with `spacing-4` (1rem) of vertical whitespace.

### Buttons & Inputs
-   **Primary Button:** Gradient fill (`primary` to `primary_container`) with `on_primary` text. Border radius: `md` (0.75rem/12px).
-   **The Ghost Input:** Input fields should have no fill and a 10% opacity `outline_variant`. On focus, the border transitions to a 40% opacity `primary` glow.

### Category Color Chips
Category colors (Fitness, Work, etc.) must be used as **Accents Only**.
-   **The 10/90 Rule:** Use the category color for a small 4px vertical indicator or a subtle 10% opacity background tint. Never use high-saturation blocks of color that break the obsidian atmosphere.

### New Component: The Activity Pulse
A bespoke component for 'LifeApp'. A slim, horizontal bar using `surface_container_highest` with a glowing 2px "needle" in the category color to indicate progress or time elapsed, replacing standard thick progress bars.

---

## 6. Do's and Don'ts

### Do:
-   **DO** use whitespace as a functional tool. If a screen feels cluttered, increase the padding between sections using `spacing-12` or `spacing-16`.
-   **DO** use "Primary Fixed" tokens for elements that must remain legible and vibrant regardless of the specific surface they sit on.
-   **DO** embrace the "Obsidian" feel—ensure the background remains the dominant visual force.

### Don't:
-   **DON'T** use 100% white (#FFFFFF) for text. Use `on_surface` or `on_surface_variant` to prevent eye strain and maintain the "Premium Dark" atmosphere.
-   **DON'T** use standard Material ripples. Use a subtle "Scale-Down" (98%) transform on press to simulate physical tactility.
-   **DON'T** use 1px solid dividers to separate content. If vertical separation is needed, use a tonal shift in the background.