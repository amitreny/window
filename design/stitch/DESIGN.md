---
name: Window
colors:
  surface: '#fcf9f8'
  surface-dim: '#dcd9d9'
  surface-bright: '#fcf9f8'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f6f3f2'
  surface-container: '#f0eded'
  surface-container-high: '#eae7e7'
  surface-container-highest: '#e5e2e1'
  on-surface: '#1c1b1b'
  on-surface-variant: '#3e4947'
  inverse-surface: '#313030'
  inverse-on-surface: '#f3f0ef'
  outline: '#6e7977'
  outline-variant: '#bdc9c6'
  surface-tint: '#006a63'
  primary: '#005c55'
  on-primary: '#ffffff'
  primary-container: '#0f766e'
  on-primary-container: '#a3faef'
  inverse-primary: '#80d5cb'
  secondary: '#904d00'
  on-secondary: '#ffffff'
  secondary-container: '#fe932c'
  on-secondary-container: '#663500'
  tertiary: '#9a2700'
  on-tertiary: '#ffffff'
  tertiary-container: '#be3c14'
  on-tertiary-container: '#ffe5de'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#9cf2e8'
  primary-fixed-dim: '#80d5cb'
  on-primary-fixed: '#00201d'
  on-primary-fixed-variant: '#00504a'
  secondary-fixed: '#ffdcc3'
  secondary-fixed-dim: '#ffb77d'
  on-secondary-fixed: '#2f1500'
  on-secondary-fixed-variant: '#6e3900'
  tertiary-fixed: '#ffdbd1'
  tertiary-fixed-dim: '#ffb5a0'
  on-tertiary-fixed: '#3b0900'
  on-tertiary-fixed-variant: '#872100'
  background: '#fcf9f8'
  on-background: '#1c1b1b'
  surface-variant: '#e5e2e1'
typography:
  display-hero:
    fontFamily: Manrope
    fontSize: 5rem
    fontWeight: '800'
    lineHeight: '0.95'
    letterSpacing: -0.04em
  display-hero-mobile:
    fontFamily: Manrope
    fontSize: 3.5rem
    fontWeight: '800'
    lineHeight: '0.95'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Manrope
    fontSize: 2.25rem
    fontWeight: '700'
    lineHeight: '1.15'
    letterSpacing: -0.03em
  headline-lg-mobile:
    fontFamily: Manrope
    fontSize: 1.75rem
    fontWeight: '700'
    lineHeight: '1.2'
    letterSpacing: -0.025em
  headline-md:
    fontFamily: Manrope
    fontSize: 1.5rem
    fontWeight: '600'
    lineHeight: '1.25'
    letterSpacing: -0.02em
  headline-sm:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '600'
    lineHeight: '1.3'
    letterSpacing: -0.01em
  body-lg:
    fontFamily: Manrope
    fontSize: 1.125rem
    fontWeight: '400'
    lineHeight: '1.6'
    letterSpacing: -0.005em
  body-md:
    fontFamily: Manrope
    fontSize: 0.9375rem
    fontWeight: '400'
    lineHeight: '1.5'
    letterSpacing: 0em
  body-sm:
    fontFamily: Manrope
    fontSize: 0.8125rem
    fontWeight: '400'
    lineHeight: '1.45'
    letterSpacing: 0em
  label-lg:
    fontFamily: Manrope
    fontSize: 0.875rem
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.02em
  label-md:
    fontFamily: Manrope
    fontSize: 0.75rem
    fontWeight: '600'
    lineHeight: '1'
    letterSpacing: 0.04em
  numeral-score:
    fontFamily: Manrope
    fontSize: 3.25rem
    fontWeight: '800'
    lineHeight: '0.9'
    letterSpacing: -0.05em
  numeral-score-mobile:
    fontFamily: Manrope
    fontSize: 2.5rem
    fontWeight: '800'
    lineHeight: '0.9'
    letterSpacing: -0.045em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  gutter: 1.25rem
  gutter-desktop: 2rem
  margin: 1.25rem
  margin-tablet: 2rem
  margin-desktop: 3.5rem
  space-xs: 0.375rem
  space-sm: 0.75rem
  space-md: 1.25rem
  space-lg: 2rem
  space-xl: 3rem
---

## Brand & Style
The design system embodies a calm, confident, editorial perspective on outdoor activity scoring. Built for thoughtful outdoor enthusiasts, athletes, and observers, it treats atmospheric conditions and activity opportunities not as frantic metrics, but as clear, beautifully framed apertures of time—the optimal "windows" to step outside.

The design movement combines **Minimalism** with an **Editorial Tactility**. Interfaces favor generous whitespace, deliberate typographical scale shifts, and quiet composure. Content surfaces avoid synthetic visual tricks, loud fills, and decorative gradients, anchoring instead to crisp ink typography, structured white cards, and nature-derived semantic score accents. The emotional resonance is patient, precise, and grounding.

## Colors
The palette evokes tactile editorial print on premium paper:
- **Base Canvas (`#FAF7F2`)**: Warm, unbleached off-white linen tone that removes the sterile harshness of true white while reducing eye strain under bright outdoor sun.
- **Ink Primary (`#1A1A1A`)**: Deep soot-black used for all definitive typographic hierarchy, borders, and sharp structural framing.
- **Deep Teal (`#0F766E`)**: Primary brand identity and indicator of optimal conditions ("Great"). Calm, collected, and authoritative.
- **Warm Sand / Amber (`#D97706` / `#E5C494`)**: Secondary indicator for moderate conditions ("Okay"). Used sparingly for alerts or transitioning score tiers.
- **Coral (`#E4572E`)**: Tertiary accent denoting degraded conditions, warnings, or sub-optimal timing ("Poor"). Urgent without leaning into neon panic.
- **Surface Elevation**: Cards sit on pure white (`#FFFFFF`) to layer gently against the warm off-white canvas.

No gradients or multi-stop blends are permitted. Color is applied flat, intentional, and strictly semantic.

## Typography
Manrope serves as the foundational typeface across all roles, establishing a geometric yet warm modern atmosphere. 

Numbers are treated as architectural hero elements. Scores, probabilities, durations, and 24-hour timestamps employ `numeral-score` and `display-hero` tokens with aggressive negative tracking (`-0.04em` to `-0.05em`) and tight line clamping (`0.9` to `0.95`). Tabular figures (`tnum`) should be enabled for timestamp grids and score tickers to maintain visual alignment across updating intervals. Body text retains generous leading to preserve an unhurried, editorial reading cadence.

## Layout & Spacing
The layout follows a responsive fixed-max fluid grid. The content container caps at `1120px` to maintain focused, editorial column ratios without horizontal drift on ultrawide viewports.

- **Breakpoints**: Mobile (`< 640px`, 4 columns), Tablet (`640px – 1024px`, 8 columns), Desktop (`> 1024px`, 12 columns).
- **Margins & Gutters**: Outer canvas margin scales from `1.25rem` on mobile to `3.5rem` on desktop, generating a generous matting border around the application interface.
- **Rhythm**: Internal spacing relies strictly on `space-md` (`1.25rem`) and `space-lg` (`2rem`) for breathing room between sections, preventing the dense dashboard aesthetic common in tracking tools.

## Elevation & Depth
Depth is achieved through **ambient diffuse layering** over tonal variation rather than heavy drop shadows:
- **Canvas Base**: `#FAF7F2`
- **Surface Layer (Cards & Panels)**: Flat `#FFFFFF` floating over the base with a hairline translucent border (`rgba(26, 26, 26, 0.05)`).
- **Soft Ambient Shadow**: `0 6px 24px -4px rgba(26, 26, 26, 0.04), 0 2px 6px -1px rgba(26, 26, 26, 0.02)`.
- **Interactive Hover/Active State**: Translates upward `1px` with a subtle increase to `0 12px 32px -4px rgba(26, 26, 26, 0.06)`.

No heavy drop shadows, harsh directional lighting, or blurs exist within the system. The illusion is that of matte, heavy-stock paper panels organized across a desk.

## Shapes
Primary structural units (cards, modal panels, score sheets) specify an explicit corner radius of `20px` (`rounded-2xl` / `1.25rem`), providing a tactile, organic contour.

- **Cards & Primary Modules**: Fixed `20px` corner radius.
- **Buttons & Filters**: Pill-formed (`rounded-full`) or medium soft (`8px` / `0.5rem`) depending on role hierarchy.
- **Badges & Inline Indicators**: Full pill (`rounded-full`) to contrast against the broad, rounded card forms.

## Components

### Cards & Score Modules
Cards sit on `#FFFFFF` with `20px` border-radii, `space-md` or `space-lg` internal padding, and thin `rgba(26, 26, 26, 0.06)` outline definition. A score module highlights the daily or hourly window using a massive tight numeral badge positioned in the top-right corner, paired with a small uppercase label in the top-left (e.g., `"SURF WINDOW / 06:30 - 09:00"`).

### Buttons
- **Primary**: Deep Teal background (`#0F766E`), white text, `rounded-full` or `rounded-xl`, high horizontal padding (`1.5rem`), Manrope `label-lg`.
- **Secondary / Ghost**: Transparent fill, 1px solid `#1A1A1A` or soft ink border (`rgba(26, 26, 26, 0.2)`), dark text.
- **Semantic Action**: Tinted score variations (e.g., `#FAF7F2` background with `#0F766E` text for low-priority teal actions).

### Chips & Score Pills
Compact indicators display condition ratings. Great (`#0F766E` text on `#0F766E15` background), Okay (`#D97706` text on `#D9770615` background), and Poor (`#E4572E` text on `#E4572E15` background). Typeface is `label-md` uppercase with `0.04em` tracking.

### Inputs & Selectors
Text inputs utilize an understated underline or bordered box with `#FFFFFF` background, a 1px border of `rgba(26, 26, 26, 0.15)`, and `12px` border radius. Focus states shift border directly to Deep Teal (`#0F766E`) without glowing rings.

### Checkboxes & Segmented Controls
Segmented controls use a soft `#FAF7F2` tray with white sliding capsules (`rounded-lg` or `rounded-full`) to switch between activity presets (e.g., "Trail Run", "Cycling", "Climbing").

### Iconography
All icons adhere strictly to a minimal 1.5px mono-stroke, rounded-cap philosophy. Never fill icons with solid colors unless serving as active state indicators.