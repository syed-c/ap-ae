# Design System Strategy: The Luminous Atelier

## 1. Overview & Creative North Star
The Creative North Star for this design system is **"The Architectural Sanctuaries."** 

We are moving away from the sterile, clinical aesthetic typical of dental directories and toward a high-end, editorial experience that feels like a luxury concierge. The system rejects the "flat" web of the last decade. Instead, it treats the screen as a physical space filled with light, frosted glass, and layered vellum. By utilizing **Plus Jakarta Sans**, we lean into an architectural, geometric precision that feels both modern and authoritative. 

The layout strategy favors **intentional asymmetry**—large display type balanced by expansive white space and overlapping glass cards—to break the "template" feel and create a signature visual rhythm.

---

## 2. Colors: Tonal Depth & Vibrancy
This system utilizes a sophisticated palette where the "off-white" primary color serves as the luminous canvas for a vibrant teal accent.

### The "No-Line" Rule
**Explicit Instruction:** Designers are prohibited from using 1px solid borders to section content. Boundaries must be defined solely through:
- **Tonal Shifts:** Placing a `surface-container-low` card against a `surface` background.
- **Luminous Transitions:** Using soft gradients to suggest where one area ends and another begins.

### Surface Hierarchy & Nesting
Treat the UI as a series of physical layers. Hierarchy is established by "stacking" the surface-container tiers to create natural depth:
- **Background (`surface`):** The base layer (#f9f6f5).
- **Secondary Depth (`surface-container-low`):** Used for large content blocks to provide subtle contrast.
- **Elevated Depth (`surface-container-lowest` / White):** Used for high-priority interactive cards to create a "lifted" effect.

### The "Glass & Gradient" Rule
To achieve the "Super Modern" feel:
- **Glassmorphism:** Use for floating elements (e.g., navigation bars, sticky filters). Apply `surface` or `surface-bright` at 70-80% opacity with a `backdrop-filter: blur(20px)`.
- **Signature Gradients:** For primary CTAs or Hero backgrounds, use a linear gradient: `primary` (#00675f) to `primary-container` (#73ebdc). This adds a "soul" to the interface that flat colors cannot replicate.

---

## 3. Typography: Architectural Precision
We use **Plus Jakarta Sans** across all levels to maintain a clean, high-end editorial feel. 

- **Display (3.5rem - 2.25rem):** Set with tight letter-spacing (-0.02em). Use for hero statements and high-impact dental practice names.
- **Headline (2rem - 1.5rem):** The "Workhorse" of the system. Provides clear structure and authoritative hierarchy.
- **Body (1rem - 0.75rem):** Generous line-height (1.6) is required to maintain the "Luminous" feel. Small text must never feel cramped.
- **Labels (0.75rem - 0.6875rem):** Always uppercase with increased letter-spacing (+0.05em) for a refined, technical look.

---

## 4. Elevation & Depth: Tonal Layering
Traditional shadows and structural lines are replaced by a philosophy of **Atmospheric Presence.**

### The Layering Principle
Depth is achieved by stacking. An inner card should use `surface-container-lowest` (pure white) when sitting on a `surface-container` (soft grey-white). This creates a "soft lift" that feels organic rather than digital.

### Ambient Shadows
When a "floating" effect is required (e.g., a modal or a floating action button):
- **Blur:** 40px to 60px.
- **Opacity:** 4% - 8%.
- **Color:** Use a tinted version of `on-surface` (#2f2f2e) rather than pure black.

### The "Ghost Border" Fallback
If accessibility requires a container edge, use a **Ghost Border**: 
- **Token:** `outline-variant` at 15% opacity. 
- **Rule:** Never use 100% opaque borders.

---

## 5. Components: Fluidity & Softness

### Buttons
- **Primary:** Linear gradient (`primary` to `primary-container`). Roundedness: `full`. No shadow, but a subtle glow on hover using the `primary-fixed` token.
- **Secondary:** `surface-container-highest` background with `on-surface` text. Minimalist and architectural.
- **Glass Variant:** Transparent background with a `backdrop-blur` and a 1px `Ghost Border`.

### Cards & Lists
- **Rule:** **Strictly forbid divider lines.** 
- Separate list items using vertical white space (use the `lg` spacing scale) or subtle shifts between `surface-container-low` and `surface-container-lowest`.
- Cards should utilize the `xl` (1.5rem) roundedness to feel soft and approachable.

### Input Fields
- **Style:** Understated. Use a `surface-container-low` fill with no border. On focus, transition the background to `surface-container-lowest` and add a soft teal glow using the `primary-fixed` token.

### Featured Dental Practice Cards (Context Specific)
- Incorporate a "Glassmorphism" overlay at the bottom of the card for the practice name, allowing the dental office photography to bleed through the background.

---

## 6. Do’s and Don’ts

### Do:
- **Do** use overlapping elements. A doctor’s profile image should slightly "break" the container of the card to create a 3D effect.
- **Do** use the `primary-container` (#73ebdc) for soft, luminous background washes behind typography.
- **Do** emphasize "Air." If you think there is enough margin, double it.

### Don’t:
- **Don’t** use pure black (#000000). Use `on-background` (#2f2f2e) for high contrast.
- **Don’t** use "Drop Shadows" that have a visible offset (X/Y). Keep shadows centered and diffused to mimic ambient light.
- **Don’t** use 90-degree corners. Everything in this system should feel human-centric and softened via the `Roundedness Scale`.