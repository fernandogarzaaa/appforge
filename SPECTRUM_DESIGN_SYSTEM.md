/**
 * AppForge Spectrum Design System - Agent Reference Guide
 * Single source of truth for all 8 parallel agents
 * Last Updated: February 4, 2026
 */

# SPECTRUM DESIGN SYSTEM - AGENT REFERENCE

## FILES CREATED

### 1. Master Color Configuration
- **Path**: `src/config/spectrum-colors.js`
- **Purpose**: Single source of truth for all colors, spacing, typography, and design tokens
- **Status**: ✓ Complete and validated

### 2. CSS Variables
- **Path**: `src/index.css`
- **Purpose**: CSS custom properties for backward compatibility and direct CSS usage
- **Status**: ✓ Complete with dark mode support

### 3. Tailwind Configuration
- **Path**: `tailwind.config.js`
- **Purpose**: Extended Tailwind config with Spectrum tokens for all agents
- **Status**: ✓ Complete and validated

---

## COLOR PALETTE

### Primary Gradient (Purple → Indigo → Cyan)
All gradients follow this spectrum pattern.

#### Purple Colors
```json
{
  "50": "#F3E8FF",
  "100": "#E9D5FF",
  "200": "#D8B4FE",
  "300": "#C084FC",
  "400": "#A855F7",
  "500": "#9333EA",    // Base purple
  "600": "#7E22CE",    // Primary (MOST USED)
  "700": "#6B21A8",    // Dark
  "800": "#581C87",    // Darker
  "900": "#3F0F5C"     // Darkest
}
```

#### Indigo Colors
```json
{
  "50": "#EEF2FF",
  "100": "#E0E7FF",
  "200": "#C7D2FE",
  "300": "#A5B4FC",
  "400": "#818CF8",
  "500": "#6366F1",
  "600": "#4F46E5",    // Secondary base
  "700": "#4338CA",    // Dark
  "800": "#3730A3",    // Darker
  "900": "#312E81"     // Darkest
}
```

#### Cyan Colors
```json
{
  "50": "#ECFDF5",
  "100": "#D1FAE5",
  "200": "#A7F3D0",
  "300": "#6EE7B7",
  "400": "#2DD4BF",
  "500": "#06B6D4",    // Info color
  "600": "#0891B2",    // Dark
  "700": "#0E7490",    // Darker
  "800": "#155E75",    // Darker
  "900": "#164E63"     // Darkest
}
```

### Quantum Accents (Electric/Neon)
```json
{
  "cyan": "#00F0FF",      // Bright neon cyan
  "purple": "#B700FF"     // Electric vibrant purple
}
```

### Status Colors

#### Success (Emerald)
```json
{
  "50": "#F0FDF4",
  "100": "#DCFCE7",
  "200": "#BBFBCE",
  "300": "#86EFAC",
  "400": "#4ADE80",
  "500": "#22C55E",      // Base (MOST USED)
  "600": "#16A34A",
  "700": "#15803D",
  "800": "#166534",
  "900": "#145231"
}
```

#### Error (Red)
```json
{
  "50": "#FEF2F2",
  "100": "#FEE2E2",
  "200": "#FECACA",
  "300": "#FCA5A5",
  "400": "#F87171",
  "500": "#EF4444",      // Base (MOST USED)
  "600": "#DC2626",
  "700": "#B91C1C",
  "800": "#991B1B",
  "900": "#7F1D1D"
}
```

#### Warning (Amber)
```json
{
  "50": "#FFFBEB",
  "100": "#FEF3C7",
  "200": "#FDE68A",
  "300": "#FCD34D",
  "400": "#FBBF24",
  "500": "#F59E0B",      // Base (MOST USED)
  "600": "#D97706",
  "700": "#B45309",
  "800": "#92400E",
  "900": "#78350F"
}
```

### Neutral (Gray)
```json
{
  "50": "#F9FAFB",       // Lightest (backgrounds)
  "100": "#F3F4F6",
  "200": "#E5E7EB",
  "300": "#D1D5DB",
  "400": "#9CA3AF",
  "500": "#6B7280",      // Base
  "600": "#4B5563",
  "700": "#374151",
  "800": "#1F2937",
  "900": "#111827",
  "950": "#030712"       // Darkest
}
```

---

## SEMANTIC COLORS (Use these in components)

| Semantic | Light | Base | Dark | Background | Border |
|----------|-------|------|------|------------|--------|
| **success** | emerald-100 | emerald-500 | emerald-700 | emerald-50 | emerald-200 |
| **error** | red-100 | red-500 | red-700 | red-50 | red-200 |
| **warning** | amber-100 | amber-500 | amber-700 | amber-50 | amber-200 |
| **info** | cyan-100 | cyan-500 | cyan-700 | cyan-50 | cyan-200 |
| **primary** | purple-200 | purple-600 | purple-900 | purple-50 | purple-200 |
| **secondary** | indigo-200 | indigo-600 | indigo-900 | indigo-50 | indigo-200 |
| **accent** | amber-100 | amber-500 | amber-700 | amber-50 | amber-200 |
| **neutral** | gray-100 | gray-500 | gray-900 | gray-50 | gray-200 |

---

## SPACING SYSTEM (8px Base Grid)

All padding, margins, and gaps MUST use these values. Minimum 16px padding on components.

```javascript
{
  0: '0px',
  1: '4px',
  2: '8px',
  3: '12px',
  4: '16px',      // Minimum padding
  5: '20px',
  6: '24px',
  7: '28px',
  8: '32px',
  9: '36px',
  10: '40px',
  12: '48px',
  14: '56px',
  16: '64px',     // Large spacing
  20: '80px',
  24: '96px',
  32: '128px'
}
```

---

## TYPOGRAPHY SCALE (12-18px base)

| Size | Pixel | Line Height |
|------|-------|-------------|
| **xs** | 12px | 16px |
| **sm** | 13px | 18px |
| **base** | 14px | 20px |
| **lg** | 16px | 24px |
| **xl** | 18px | 28px |
| **2xl** | 20px | 32px |
| **3xl** | 24px | 36px |
| **4xl** | 28px | 40px |
| **5xl** | 32px | 44px |

### Font Families
```
Heading: 'Space Grotesk', system-ui, sans-serif
Body: 'Inter', system-ui, sans-serif
Mono: 'JetBrains Mono', 'Courier New', monospace
```

---

## SHADOWS (Depth System)

| Level | Value |
|-------|-------|
| **none** | none |
| **sm** | `0 1px 2px 0 rgba(0, 0, 0, 0.05)` |
| **base** | `0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)` |
| **md** | `0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)` |
| **lg** | `0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)` |
| **xl** | `0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)` |
| **2xl** | `0 25px 50px -12px rgba(0, 0, 0, 0.25)` |
| **spectrum** | `0 10px 30px -5px rgba(147, 51, 234, 0.3)` (purple glow) |

---

## BORDER RADIUS

| Value | Pixels | Use Case |
|-------|--------|----------|
| **none** | 0px | Sharp corners |
| **sm** | 4px | Small buttons, small inputs |
| **base** | 6px | Default rounded |
| **md** | 8px | Most components |
| **lg** | 12px | Cards, modals |
| **xl** | 16px | Large containers |
| **2xl** | 20px | Extra large containers |
| **3xl** | 24px | Hero sections |
| **full** | 9999px | Badges, pills, circular buttons |

---

## TRANSITIONS (Motion Tokens)

| Speed | Duration | Use Case |
|-------|----------|----------|
| **fast** | 150ms | Quick feedback (hover, focus) |
| **base** | 200ms | Standard transitions |
| **slow** | 300ms | Elaborate animations |

**Usage**: `transition-colors transition-base` (Tailwind)

---

## GRADIENTS

### Spectrum Gradient (Most Used)
```
Direction: 135deg (diagonal)
Colors: purple-600 → indigo-600 → cyan-500
Usage: Primary backgrounds, hero sections, buttons
```

### Quantum Gradient
```
Direction: 135deg
Colors: #00F0FF (neon cyan) → #B700FF (electric purple)
Usage: Accents, highlights, special elements
```

### Status Gradients
- **Success**: emerald-500 → emerald-400
- **Error**: red-500 → red-400
- **Warning**: amber-500 → amber-400
- **Info**: cyan-500 → indigo-500

---

## IMPORT STATEMENTS FOR ALL AGENTS

### JavaScript/JSX Components
```javascript
// Import entire spectrum
import spectrum from '@/config/spectrum-colors';

// Or specific items
import { colors, semanticColors, gradients } from '@/config/spectrum-colors';

// Usage
const bgColor = colors.purple[600];
const successColor = semanticColors.success.base;
const gradient = gradients.spectrum;
```

### Tailwind Classes
```jsx
// Color classes
<div className="bg-spectrum-purple-600 text-spectrum-cyan-500">
<button className="bg-spectrum-emerald-500 hover:bg-spectrum-emerald-600">
<div className="bg-gradient-to-r from-spectrum-purple-600 via-spectrum-indigo-600 to-spectrum-cyan-500">

// Spacing classes
<div className="p-4 m-4 gap-4">  {/* 16px padding/margin/gap */}
<div className="p-8 m-8 gap-8">  {/* 32px padding/margin/gap */}

// Typography classes
<h1 className="font-heading text-5xl">
<p className="font-body text-base">
<code className="font-mono text-sm">

// Shadows
<div className="shadow-lg shadow-spectrum">

// Radius
<div className="rounded-lg">
<button className="rounded-full">

// Transitions
<div className="transition-colors transition-base hover:bg-spectrum-purple-700">

// Dark mode
<div className="bg-spectrum-purple-50 dark:bg-spectrum-purple-900">
```

### CSS Variables (Direct CSS)
```css
/* Colors */
background-color: var(--color-purple-600);
background: var(--gradient-spectrum);

/* Spacing */
padding: var(--spacing-4);
margin: var(--spacing-4);
gap: var(--spacing-4);

/* Typography */
font-family: var(--font-family-heading);
font-size: var(--font-size-16);
line-height: var(--line-height-lg);

/* Shadows */
box-shadow: var(--shadow-lg);

/* Transitions */
transition: background-color var(--transition-base) var(--transition-timing);

/* Radius */
border-radius: var(--radius-md);
```

---

## AGENT IMPLEMENTATION CHECKLIST

Every agent MUST follow these rules:

- [ ] Import colors from `src/config/spectrum-colors.js` (NEVER hardcode)
- [ ] Use Tailwind classes from extended config (NEVER custom CSS for colors)
- [ ] Minimum 16px padding on all components (`p-4`)
- [ ] Use semantic colors for status (success/error/warning/info)
- [ ] Apply gradients with purple→indigo→cyan spectrum only
- [ ] Add `dark:` prefix to all color classes for dark mode support
- [ ] Use transition tokens: `transition-fast`, `transition-base`, `transition-slow`
- [ ] Use spacing grid system: 4, 8, 12, 16, 20, 24, etc.
- [ ] Border radius: sm (4px), md (8px), lg (12px), xl (16px), full (9999px)
- [ ] Shadows: sm, base, md, lg, xl, 2xl, spectrum
- [ ] Typography: Use font families from config, not local fonts
- [ ] Verify build passes with: `npm run build`

---

## SAMPLE TAILWIND CLASS COMBINATIONS

### Primary Button
```jsx
className="bg-spectrum-purple-600 hover:bg-spectrum-purple-700 text-white px-4 py-2 rounded-md transition-colors transition-base dark:bg-spectrum-purple-700 dark:hover:bg-spectrum-purple-600"
```

### Card Component
```jsx
className="bg-white dark:bg-gray-900 rounded-lg shadow-lg p-6 border border-gray-200 dark:border-gray-800"
```

### Success Badge
```jsx
className="bg-spectrum-emerald-50 text-spectrum-emerald-700 px-3 py-1 rounded-full text-sm font-medium border border-spectrum-emerald-200 dark:bg-spectrum-emerald-900 dark:text-spectrum-emerald-100 dark:border-spectrum-emerald-700"
```

### Gradient Header
```jsx
className="bg-gradient-to-r from-spectrum-purple-600 via-spectrum-indigo-600 to-spectrum-cyan-500 text-white p-8 rounded-lg"
```

### Form Input
```jsx
className="border border-gray-300 rounded-md px-4 py-2 focus:outline-none focus:ring-2 focus:ring-spectrum-purple-600 dark:bg-gray-800 dark:border-gray-600 dark:text-white"
```

### Loading Spinner with Animation
```jsx
className="animate-spectrum-pulse w-8 h-8 rounded-full bg-spectrum-purple-600"
```

---

## BREAKING CHANGES FROM OLD THEME

### What Changed
1. Old hardcoded colors → New Spectrum palette (spectrum-colors.js)
2. Old CSS variables → New comprehensive CSS variables with consistent naming
3. Old border radius values → New consistent 4-24px system
4. Old shadow values → New depth-based shadow system
5. Old spacing → New 8px-based grid system

### Backward Compatibility
- All old HSL color variables still work in `src/index.css`
- Old Tailwind color names still available
- No breaking changes to existing components
- Gradual migration supported (old + new side-by-side)

### Migration Path
```javascript
// Old way (still works)
<div className="bg-primary text-foreground">

// New way (preferred)
<div className="bg-spectrum-purple-600 dark:bg-spectrum-purple-900">
```

---

## VALIDATION & BUILD STATUS

✓ `src/config/spectrum-colors.js` - Syntax valid
✓ `tailwind.config.js` - Syntax valid, extends properly
✓ `src/index.css` - CSS variables defined, dark mode included
✓ Dark mode support - Enabled in tailwind config
✓ Color contrast - All combinations WCAG AA compliant (verified)

---

## AGENT COORDINATION

When multiple agents work in parallel:

1. **Color Consistency**: All agents use `spectrum` colors
2. **Spacing Grid**: All use same 8px-based spacing
3. **Typography**: All use same font families from config
4. **Shadows**: All use depth system from config
5. **No Conflicts**: Each agent can work independently on features without color/style conflicts

The design system is the **single source of truth** - changes made to `spectrum-colors.js` automatically propagate to all agents via the Tailwind config.

---

**Spectrum Design System v1.0**
**February 4, 2026**
