---
name: Academic Distraction-Free Workspace
colors:
  surface: '#f8f9fa'
  surface-dim: '#d9dadb'
  surface-bright: '#f8f9fa'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f3f4f5'
  surface-container: '#edeeef'
  surface-container-high: '#e7e8e9'
  surface-container-highest: '#e1e3e4'
  on-surface: '#191c1d'
  on-surface-variant: '#434655'
  inverse-surface: '#2e3132'
  inverse-on-surface: '#f0f1f2'
  outline: '#737686'
  outline-variant: '#c3c6d7'
  surface-tint: '#0053db'
  primary: '#004ac6'
  on-primary: '#ffffff'
  primary-container: '#2563eb'
  on-primary-container: '#eeefff'
  inverse-primary: '#b4c5ff'
  secondary: '#545f73'
  on-secondary: '#ffffff'
  secondary-container: '#d5e0f8'
  on-secondary-container: '#586377'
  tertiary: '#4c5664'
  on-tertiary: '#ffffff'
  tertiary-container: '#646e7d'
  on-tertiary-container: '#e9f1ff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#dbe1ff'
  primary-fixed-dim: '#b4c5ff'
  on-primary-fixed: '#00174b'
  on-primary-fixed-variant: '#003ea8'
  secondary-fixed: '#d8e3fb'
  secondary-fixed-dim: '#bcc7de'
  on-secondary-fixed: '#111c2d'
  on-secondary-fixed-variant: '#3c475a'
  tertiary-fixed: '#d9e3f4'
  tertiary-fixed-dim: '#bdc7d8'
  on-tertiary-fixed: '#121c28'
  on-tertiary-fixed-variant: '#3e4755'
  background: '#f8f9fa'
  on-background: '#191c1d'
  surface-variant: '#e1e3e4'
  status-ready-bg: '#ecfdf5'
  status-ready-text: '#059669'
  status-ready-border: '#a7f3d0'
  status-pending-bg: '#eff6ff'
  status-pending-text: '#2563eb'
  status-pending-border: '#bfdbfe'
  status-failed-bg: '#fef2f2'
  status-failed-text: '#dc2626'
  status-failed-border: '#fecaca'
  border-subtle: '#e5e7eb'
  border-strong: '#d1d5db'
  surface-card: '#ffffff'
  text-primary: '#111827'
  text-muted: '#9ca3af'
typography:
  headline-lg:
    fontFamily: Inter
    fontSize: 28px
    fontWeight: '700'
    lineHeight: 36px
    letterSpacing: -0.02em
  headline-lg-mobile:
    fontFamily: Inter
    fontSize: 24px
    fontWeight: '700'
    lineHeight: 32px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Inter
    fontSize: 20px
    fontWeight: '600'
    lineHeight: 28px
    letterSpacing: -0.015em
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 24px
    letterSpacing: -0.01em
  title-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '500'
    lineHeight: 22px
    letterSpacing: -0.005em
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: Inter
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 22px
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  label-md:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
    letterSpacing: 0.01em
  label-sm:
    fontFamily: Inter
    fontSize: 11px
    fontWeight: '600'
    lineHeight: 14px
    letterSpacing: 0.04em
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  gutter: 1rem
  gutter-lg: 1.5rem
  margin: 1rem
  margin-md: 1.5rem
  margin-lg: 2rem
  space-xs: 0.25rem
  space-sm: 0.5rem
  space-md: 0.75rem
  space-lg: 1rem
  space-xl: 1.5rem
  space-2xl: 2rem
---

## Brand & Style

The design system establishes a focused, high-precision academic workspace tailored for researchers, scientists, and analysts. Inspired by the quiet utilitarian clarity of Linear and Notion, the visual environment prioritizes editorial focus over decoration. Content—such as mathematical notation, synthesis reports, citation graphs, and vector-grounded arguments—remains central.

The interface employs a minimal, highly structured aesthetic built on crisp neutral surfaces, structured 1px structural dividers, and deliberate information density. Interactive emphasis is restrained: actionable royal blue guides the eye to primary paths, while deep slate anchors the structural frame. The emotional tone is rigorous, reliable, and intellectually serene.

## Colors

The system relies on a light foundation optimized for reading density and sustained focus. The background canvas utilizes a soft off-white (`#f9fafb`) to eliminate screen glare while maintaining crisp contrast against pure white (`#ffffff`) card planes and panels.

Primary interactivity is concentrated in vivid royal blue (`#2563eb`), reserved strictly for focused links, key operations, and positive pipeline progress indicators. Secondary structural tone is anchored in deep slate (`#1e293b`), serving as the strong visual backbone for primary headers, navigation frames, and high-emphasis elements. 

Paper extraction states rely on three purpose-specific trios:
- **Ready / Grounded**: Mint green tint background (`#ecfdf5`) with clean green ink (`#059669`) and delicate emerald perimeter line (`#a7f3d0`).
- **Extracting / Queued**: Soft blue wash (`#eff6ff`) with royal blue ink (`#2563eb`) and border (`#bfdbfe`).
- **Failed**: Subtle coral-red wash (`#fef2f2`) with clear error ink (`#dc2626`) and boundary line (`#fecaca`).

## Typography

Typography centers exclusively on Inter across headlines, body copy, and interface labels to maintain a unified, systematic typographic texture. 

For dense prose and synthesized academic literature, `body-md` (14px/22px) serves as the primary reading standard, providing an optical balance between information economy and sustained legibility. Headings utilize tight negative letter spacing (`-0.01em` to `-0.02em`) to produce authoritative, disciplined headers without feeling overly decorative. Status badges, table tags, and metadata utilize `label-md` and `label-sm` with slight positive tracking to ensure high optical clarity at reduced scale.

## Layout & Spacing

The layout model combines an app-shell architecture with flexible content split panes. The default workspace presents a persistent, compact 240px navigation rail on the left, an expandable secondary panel for contextual research drawers (e.g. citations or extraction graphs), and a flexible primary stage.

- **Breakpoints**: 
  - Mobile (`< 768px`): Rail collapses into an overlay drawer. Workspace transitions to a unified single-column flow with `margin: 1rem` and `gutter: 1rem`. Citations slide up in a bottom sheet.
  - Tablet (`768px - 1024px`): Collapsed icon-rail (64px width), 2-column grid reflow, dynamic content padding of `1.5rem`.
  - Desktop (`> 1024px`): Fixed 240px rail, fluid multi-column work areas with 12-column subgrids, 24px default gutters, and persistent split-panel citation views.

A strict 4px base rhythm governs internal padding and item spacing, avoiding arbitrary heights and maintaining vertical metric alignment across papers, synthesis runs, and metadata tables.

## Elevation & Depth

Visual separation relies primarily on planar surface shifts and quiet, low-contrast 1px outlines (`#e5e7eb`) rather than elevated drop shadows.

- **Canvas & Surfaces**: The application backdrop sits at base level `#f9fafb`. Cards, toolbars, and active documents rest upon flat white surfaces (`#ffffff`) bounded by razor-thin hairline borders.
- **Micro-Shadows**: Floating context menus, popovers, and elevated modal panels utilize soft, low-opacity ambient diffusion (`0 1px 2px 0 rgba(0, 0, 0, 0.05)` or `0 4px 6px -1px rgba(0, 0, 0, 0.07)`).
- **Dividers & Grid Borders**: In tabular paper views and split-screen RAG conversation feeds, panels are bounded by continuous single-pixel borders with zero outer shadow, yielding a technical, notebook-like surface organization.

## Shapes

The design system adopts a soft, disciplined corner profile (`roundedness: 1`), standardizing on compact 4px (`0.25rem`) to 6px radii for components. 

Inputs, status pills, table action chips, and nested cards maintain subtle corner smoothing that preserves strict structural geometry. This controlled radius reinforces a utilitarian, scientific software aesthetic, preventing conversational or playful over-rounding and maximizing available screen space for dense data tables and literature extracts.

## Components

### Buttons
- **Primary**: Solid royal blue (`#2563eb`) with white text, 4px corner radius, `space-sm` vertical and `space-md` horizontal padding. Transitions cleanly to `#1d4ed8` on hover.
- **Secondary / Ghost**: White or transparent surface with a subtle 1px border (`#e5e7eb`), deep slate text (`#1e293b`), and a light `#f3f4f6` hover fill.
- **Action / Destructive**: Red hairline border or subdued red fill (`#fef2f2`) with `#dc2626` text for deleting runs or clearing indexes.

### Status Badges (Extraction Pipeline)
- Badges use `label-md` uppercase or capitalized text with 4px border radius and 1px dedicated border.
- **READY**: `#ecfdf5` background, `#059669` text, `#a7f3d0` border, accompanied by a small green dot.
- **EXTRACTING / QUEUED**: `#eff6ff` background, `#2563eb` text, `#bfdbfe` border, accompanied by a 12px rotating spinner.
- **FAILED**: `#fef2f2` background, `#dc2626` text, `#fecaca` border, with an inline retry trigger.

### Input Fields & Controls
- **Inputs & Dropdowns**: 1px crisp border (`#d1d5db`), `#ffffff` background, `body-md` typography. On active focus, applies a 1px border shift to `#2563eb` with an immediate 2px semi-transparent ring (`rgba(37, 99, 235, 0.15)`).
- **Checkboxes & Radios**: 16px square or round indicators with a 1px `#d1d5db` outline, snapping to `#2563eb` with a sharp white checkmark when selected.

### Cards & Paper Library Rows
- **Paper Cards / Rows**: Pure white background with hairline `#e5e7eb` boundary. Displays paper title in `title-md` (`#111827`), author metadata in `body-sm` (`#4b5563`), right-aligned pipeline status badge, and quiet 1-click icon actions.
- **Hover State**: Shifts row background to `#f9fafb` with instantaneous transition.

### Citation & Grounding Panel
- **Drawer Panels**: Anchored right panel with `#ffffff` surface and 1px left border (`#e5e7eb`). Contains structured citation chunks with confidence percentage meters and verified paper anchor tags.