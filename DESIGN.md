---
name: Lumina AI
colors:
  surface: '#f8f9ff'
  surface-dim: '#cbdbf5'
  surface-bright: '#f8f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4ff'
  surface-container: '#e5eeff'
  surface-container-high: '#dce9ff'
  surface-container-highest: '#d3e4fe'
  on-surface: '#0b1c30'
  on-surface-variant: '#434656'
  inverse-surface: '#213145'
  inverse-on-surface: '#eaf1ff'
  outline: '#737688'
  outline-variant: '#c3c5d9'
  surface-tint: '#004ced'
  primary: '#003ec7'
  on-primary: '#ffffff'
  primary-container: '#0052ff'
  on-primary-container: '#dfe3ff'
  inverse-primary: '#b7c4ff'
  secondary: '#855300'
  on-secondary: '#ffffff'
  secondary-container: '#fea619'
  on-secondary-container: '#684000'
  tertiary: '#464e64'
  on-tertiary: '#ffffff'
  tertiary-container: '#5e667d'
  on-tertiary-container: '#dde4ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dde1ff'
  primary-fixed-dim: '#b7c4ff'
  on-primary-fixed: '#001452'
  on-primary-fixed-variant: '#0038b6'
  secondary-fixed: '#ffddb8'
  secondary-fixed-dim: '#ffb95f'
  on-secondary-fixed: '#2a1700'
  on-secondary-fixed-variant: '#653e00'
  tertiary-fixed: '#dae2fd'
  tertiary-fixed-dim: '#bec6e0'
  on-tertiary-fixed: '#131b2e'
  on-tertiary-fixed-variant: '#3f465c'
  background: '#f8f9ff'
  on-background: '#0b1c30'
  surface-variant: '#d3e4fe'
typography:
  headline-xl:
    fontFamily: Manrope
    fontSize: 48px
    fontWeight: '800'
    lineHeight: 56px
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Manrope
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.01em
  headline-md:
    fontFamily: Manrope
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
  body-lg:
    fontFamily: Manrope
    fontSize: 18px
    fontWeight: '400'
    lineHeight: 28px
  body-md:
    fontFamily: Manrope
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  label-md:
    fontFamily: Manrope
    fontSize: 14px
    fontWeight: '600'
    lineHeight: 20px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Manrope
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  xs: 4px
  sm: 12px
  md: 24px
  lg: 48px
  xl: 80px
  gutter: 24px
  margin: 32px
---

## Brand & Style

The design system is engineered to bridge the gap between technical electrical engineering and creative architectural lighting. The brand personality is **precise, luminous, and authoritative**, evoking a sense of confidence in AI-driven calculations while remaining accessible to designers.

The visual style follows a **Modern Minimalist** approach with subtle **Glassmorphism** accents. This aesthetic mirrors the behavior of light itself—clarity, transparency, and soft diffusion. By prioritizing high-contrast boundaries and expansive whitespace, the UI remains uncluttered even when displaying complex visualization data. The user should feel they are working within a high-end studio environment where the tool fades into the background, allowing the light simulations to take center stage.

## Colors

The palette is anchored by **Deep Slate (#0F172A)**, providing a professional, "industrial-tech" foundation. The primary **Electric Blue (#0052FF)** signifies the AI's "intelligence" and active energy, while the secondary **Warm Amber (#F59E0B)** is used exclusively for light-related interactions, representing the warmth of a glow.

The background is a **Pure White (#FFFFFF)** to ensure maximum legibility and a clinical, high-tech feel. Functional neutrals are pulled from the slate spectrum to maintain a cohesive cool-toned environment. Feedback colors (Success, Warning, Error) should be used sparingly, ensuring they do not compete with the secondary Amber light accents.

## Typography

This design system utilizes **Manrope** for its technical yet modern character. The typeface strikes a balance between the geometric structure required for a professional tool and the humanist warmth needed for a user-friendly app. 

Headlines use a tighter letter-spacing and heavier weights to command attention, while body text maintains a generous line height to enhance readability during long planning sessions. Label styles, particularly for technical specifications or electrical data, are occasionally set in uppercase with slight tracking to distinguish data-heavy information from standard UI prose.

## Layout & Spacing

This design system employs a **12-column fluid grid** for desktop environments, transitioning to a flexible 4-column grid for mobile. A strict **8px spacing rhythm** ensures mathematical harmony across all components.

The layout philosophy emphasizes **"The Breathable Canvas."** Major functional blocks are separated by `xl` (80px) spacing to prevent cognitive overload. Sidebars and tool panels use `md` (24px) padding to maintain internal density without feeling cramped. Use `lg` (48px) margins on the outer container to frame the visualization area, giving it a gallery-like importance.

## Elevation & Depth

Hierarchy is established through **Ambient Shadows** and **Tonal Layers**. Instead of traditional high-contrast shadows, this design system uses soft, diffused shadows with a slight Deep Slate tint (`rgba(15, 23, 42, 0.08)`).

1.  **Base Layer:** Pure white background.
2.  **Surface Layer:** Cards and containers use a subtle 1px border (`#E2E8F0`) with no shadow.
3.  **Raised Layer:** Interactive elements and active cards use a medium-diffusion shadow to "float" above the workspace.
4.  **Overlay Layer:** Modals and dropdowns use a high-blur shadow and a background blur (12px) to simulate light passing through glass, reinforcing the lighting visualization theme.

## Shapes

The shape language is **Rounded**, using a standard 0.5rem (8px) corner radius for most components. This softens the technical nature of the app, making it feel approachable and modern. Larger containers like visualization viewports use `rounded-xl` (1.5rem) to create a distinct frame, while smaller utility elements like tags or badges use a pill-shape to differentiate them from actionable buttons.

## Components

-   **Buttons:** Primary buttons use the Electric Blue background with white text. Secondary buttons (for light manipulation) use a Ghost style with a Warm Amber border and text. All buttons feature a 200ms transition on hover, subtly increasing shadow depth.
-   **Input Fields:** Use a light slate background (`#F8FAFC`) with a 1px border. On focus, the border transitions to Electric Blue with a soft outer glow.
-   **Chips/Tags:** Used for light types (LED, Halogen, Smart). These are pill-shaped with a low-opacity Electric Blue background to keep them subtle.
-   **Cards:** Visualization cards should have a "Header-Image-Data" structure. Images should use the full width of the card with `rounded-t` corners.
-   **Checkboxes & Radios:** Custom-styled to match the primary Blue. When "Checked," they utilize a small glow effect to mimic a light turning on.
-   **Specialty Component (Light Slider):** A custom range slider for adjusting "Lumens." The track should be a gradient from Deep Slate to Warm Amber, visually representing the intensity of light.