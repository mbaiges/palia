---
name: Nocturnal Clarity
colors:
  surface: '#131313'
  surface-dim: '#131313'
  surface-bright: '#393939'
  surface-container-lowest: '#0e0e0e'
  surface-container-low: '#1c1b1b'
  surface-container: '#201f1f'
  surface-container-high: '#2a2a2a'
  surface-container-highest: '#353534'
  on-surface: '#e5e2e1'
  on-surface-variant: '#bbc9cd'
  inverse-surface: '#e5e2e1'
  inverse-on-surface: '#313030'
  outline: '#859397'
  outline-variant: '#3c494c'
  surface-tint: '#2fd9f4'
  primary: '#8aebff'
  on-primary: '#00363e'
  primary-container: '#22d3ee'
  on-primary-container: '#005763'
  inverse-primary: '#006877'
  secondary: '#bec6e0'
  on-secondary: '#283044'
  secondary-container: '#3f465c'
  on-secondary-container: '#adb4ce'
  tertiary: '#d2ddf5'
  on-tertiary: '#263143'
  tertiary-container: '#b6c1d9'
  on-tertiary-container: '#444f63'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#a2eeff'
  primary-fixed-dim: '#2fd9f4'
  on-primary-fixed: '#001f25'
  on-primary-fixed-variant: '#004e5a'
  secondary-fixed: '#dae2fd'
  secondary-fixed-dim: '#bec6e0'
  on-secondary-fixed: '#131b2e'
  on-secondary-fixed-variant: '#3f465c'
  tertiary-fixed: '#d8e3fb'
  tertiary-fixed-dim: '#bcc7de'
  on-tertiary-fixed: '#111c2d'
  on-tertiary-fixed-variant: '#3c475a'
  background: '#131313'
  on-background: '#e5e2e1'
  surface-variant: '#353534'
typography:
  display-lg:
    fontFamily: manrope
    fontSize: 48px
    fontWeight: '700'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: manrope
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 40px
  headline-lg-mobile:
    fontFamily: manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-md:
    fontFamily: inter
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-sm:
    fontFamily: inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: jetbrainsMono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.05em
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 4px
  xs: 0.5rem
  sm: 1rem
  md: 1.5rem
  lg: 2rem
  xl: 3rem
  container-max: 1280px
  gutter: 24px
---

## Brand & Style

The design system is a high-fidelity, professional framework built for deep focus and visual comfort. It targets a sophisticated audience that values precision and a calm digital environment. The aesthetic merges **Modern Minimalism** with subtle **Glassmorphism** to create a sense of layered depth without visual clutter.

The emotional response is one of quiet confidence and technical mastery. By utilizing a dark-first approach, the UI recedes into the background, allowing content and primary actions to take center stage. The style is characterized by generous negative space, crisp typography, and intentional use of vibrant accents to guide the user's eye through complex workflows.

## Colors

The color palette is anchored by a deep charcoal base (`#131313`) to minimize eye strain and provide a premium, high-fidelity foundation. Surface layers use dark navy tones to differentiate between layout containers and interactive regions.

- **Primary**: A vibrant cyan (`#22d3ee`) used exclusively for call-to-actions, active states, and critical highlights.
- **Surface Tiers**: Base background is `#131313`. Secondary surfaces (cards, sidebars) use `#0f172a`. Tertiary elements (inputs, hover states) use `#1e293b`.
- **Typography**: Text is never pure white; primary content uses an off-white (`#f8fafc`) for readability, while secondary metadata uses a muted light gray (`#94a3b8`).
- **Semantics**: Success states utilize a bright sage green, while errors use a soft coral red, both calibrated with high saturation to remain legible against dark backgrounds.

## Typography

This design system employs a tiered typographic scale to ensure information hierarchy is immediate and clear. 

- **Headlines**: Use **Manrope** for its modern, balanced proportions. Large display styles use tighter letter spacing to maintain a cohesive "block" feel.
- **Body**: Use **Inter** for its systematic and utilitarian nature, ensuring high legibility in dense data environments.
- **Labels/Technical**: Use **JetBrains Mono** for small labels, tags, and data points to reinforce the professional, high-fidelity personality of the system.

All text should be rendered with `antialiased` smoothing to ensure crispness on dark backgrounds.

## Layout & Spacing

The layout philosophy follows a **Fluid Grid** model with a 12-column structure for desktop. The system relies on an 8px spatial rhythm for all padding and margins to maintain mathematical harmony.

- **Desktop**: 12 columns, 24px gutters, and 48px side margins.
- **Tablet**: 8 columns, 16px gutters, and 24px side margins.
- **Mobile**: 4 columns, 16px gutters, and 16px side margins.

Content is grouped into logical modules with generous `xl` (48px) vertical spacing between major sections to prevent visual fatigue.

## Elevation & Depth

In this dark-mode environment, depth is communicated through **Tonal Layers** and **Glassmorphism** rather than traditional heavy shadows.

- **Layering**: Elements closer to the user are rendered in lighter navy shades (e.g., a card is lighter than the background).
- **Glassmorphism**: Overlays like modals or dropdown menus use a backdrop-blur (20px) with a semi-transparent fill of the surface color (80% opacity) and a subtle 1px inner border (`#ffffff10`) to define edges.
- **Shadows**: Use "Ambient Shadows"—extremely soft, low-opacity (#000000 40%) glows that provide a lift effect without creating muddy dark spots on the charcoal background.

## Shapes

The shape language is **Rounded**, reflecting a calm and professional tone. This softness balances the technical nature of the dark color palette and monospaced accents.

- Standard components (buttons, inputs) use a 0.5rem (8px) radius.
- Large containers (cards, modals) use a 1rem (16px) radius.
- System-wide icons should use a 2px stroke width with slightly rounded joins to match the component language.

## Components

### Buttons
- **Primary**: Solid Cyan (`#22d3ee`) with dark charcoal text. No shadow; high-contrast focus.
- **Secondary**: Transparent with a 1px border of `#1e293b`. Text in off-white.
- **Ghost**: No border or background. Cyan text.

### Input Fields
- **Default**: Dark navy background (`#0f172a`) with a subtle 1px border (`#1e293b`).
- **Focus**: Border changes to Primary Cyan with a subtle 2px outer glow.

### Cards & Surfaces
- Use a "Stroke-Only" definition for cards on top of the base background, or a solid `#0f172a` fill when grouped.
- **Success/Error States**: Use a subtle 2px left-accent border in the respective semantic color to indicate status without overwhelming the UI.

### Chips & Tags
- Small, pill-shaped elements with a secondary background fill (`#1e293b`) and `label-caps` typography.

### Progress & Loading
- Use a continuous linear gradient for progress bars, transitioning from Primary Cyan to a slightly darker teal to simulate depth.