# AppForge Minimalist Design System
**Version:** 2.0
**Date:** 2026-02-06

---

## 🎨 Design Philosophy

### Core Principles

**1. Clarity Over Complexity**
- Every element serves a purpose
- Remove visual noise
- Information hierarchy through typography and spacing, not color

**2. Progressive Disclosure**
- Show essential information first
- Advanced features discoverable, not hidden
- Guided paths for common tasks

**3. Intentional Interaction**
- Clear affordances
- Predictable behavior
- Immediate feedback

**4. Calm Technology**
- Interface fades into background
- Focus on content and actions
- Reduce cognitive load

---

## 🎨 Color System

### Primary Palette (Simplified)

```css
/* Core Colors - Use Sparingly */
--primary: #3B82F6      /* Blue 500 - Primary actions */
--primary-hover: #2563EB /* Blue 600 */
--accent: #8B5CF6       /* Purple 500 - Highlights */
--success: #10B981      /* Green 500 */
--warning: #F59E0B      /* Amber 500 */
--error: #EF4444        /* Red 500 */

/* Neutrals - Primary Palette */
--gray-50: #F9FAFB
--gray-100: #F3F4F6
--gray-200: #E5E7EB
--gray-300: #D1D5DB
--gray-400: #9CA3AF
--gray-500: #6B7280
--gray-600: #4B5563
--gray-700: #374151
--gray-800: #1F2937
--gray-900: #111827
--gray-950: #030712

/* Functional Colors */
--bg-primary: white (light) / gray-950 (dark)
--bg-secondary: gray-50 (light) / gray-900 (dark)
--bg-tertiary: gray-100 (light) / gray-800 (dark)
--text-primary: gray-900 (light) / gray-50 (dark)
--text-secondary: gray-600 (light) / gray-400 (dark)
--text-tertiary: gray-500 (light) / gray-500 (dark)
--border: gray-200 (light) / gray-800 (dark)
--border-hover: gray-300 (light) / gray-700 (dark)
```

### Usage Guidelines

**Primary Blue** - Reserve for:
- Primary CTA buttons
- Active states
- Important links
- Key icons

**Accent Purple** - Use for:
- AI-related features
- Premium/advanced features
- Quantum computing elements

**Neutrals** - Use for:
- 90% of interface
- Text hierarchy
- Backgrounds
- Borders

**Semantic Colors** - Use only when meaning is clear:
- Success: Completion states, positive feedback
- Warning: Cautionary actions, beta features
- Error: Validation errors, destructive actions

---

## 📐 Typography

### Font Stack

```css
/* Headings - Clean sans-serif */
--font-heading: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Body - Readable sans-serif */
--font-body: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;

/* Code - Monospace */
--font-code: 'JetBrains Mono', 'SF Mono', Monaco, 'Cascadia Code', monospace;
```

### Type Scale

```css
/* Headers */
--text-5xl: 3rem      /* 48px - Hero titles */
--text-4xl: 2.25rem   /* 36px - Page titles */
--text-3xl: 1.875rem  /* 30px - Section titles */
--text-2xl: 1.5rem    /* 24px - Card titles */
--text-xl: 1.25rem    /* 20px - Subsection titles */
--text-lg: 1.125rem   /* 18px - Emphasized text */

/* Body */
--text-base: 1rem     /* 16px - Default body */
--text-sm: 0.875rem   /* 14px - Secondary text */
--text-xs: 0.75rem    /* 12px - Captions, labels */

/* Line Heights */
--leading-tight: 1.25    /* Headings */
--leading-normal: 1.5    /* Body text */
--leading-relaxed: 1.75  /* Long-form content */

/* Font Weights */
--font-light: 300
--font-normal: 400
--font-medium: 500
--font-semibold: 600
--font-bold: 700
```

### Typography Rules

1. **Hierarchy through size and weight, not color**
2. **Maximum 3 font sizes per screen**
3. **Body text: 16px minimum for readability**
4. **Line length: 60-75 characters maximum**
5. **Line height: 1.5 for body, 1.25 for headings**

---

## 📏 Spacing System

### Scale (4px base unit)

```css
--space-1: 0.25rem   /* 4px */
--space-2: 0.5rem    /* 8px */
--space-3: 0.75rem   /* 12px */
--space-4: 1rem      /* 16px */
--space-5: 1.25rem   /* 20px */
--space-6: 1.5rem    /* 24px */
--space-8: 2rem      /* 32px */
--space-10: 2.5rem   /* 40px */
--space-12: 3rem     /* 48px */
--space-16: 4rem     /* 64px */
--space-20: 5rem     /* 80px */
--space-24: 6rem     /* 96px */
```

### Usage

- **Component padding**: 4, 6, 8
- **Element margins**: 4, 6, 8
- **Section spacing**: 12, 16, 20
- **Page margins**: 16, 20, 24

---

## 🧱 Layout System

### Grid System

```css
/* Container Widths */
--container-sm: 640px
--container-md: 768px
--container-lg: 1024px
--container-xl: 1280px
--container-2xl: 1536px

/* Max Content Width */
--content-max-width: 1280px  /* Comfortable reading width */

/* Sidebar Width */
--sidebar-width: 240px
--sidebar-collapsed-width: 64px
```

### Layout Patterns

**1. Dashboard Layout**
```
┌─────────────────────────────────────┐
│         Top Navigation              │
├──────┬──────────────────────────────┤
│      │                              │
│ Side │         Content              │
│ bar  │         Area                 │
│      │                              │
└──────┴──────────────────────────────┘
```

**2. Detail Layout**
```
┌─────────────────────────────────────┐
│         Breadcrumbs / Back          │
├─────────────────────────────────────┤
│                                     │
│         Hero / Title Section        │
│                                     │
├───────────────────┬─────────────────┤
│                   │                 │
│   Main Content    │   Sidebar       │
│                   │   (Optional)    │
└───────────────────┴─────────────────┘
```

**3. Studio Layout (Builders)**
```
┌──────┬─────────────────────┬────────┐
│      │                     │        │
│ List │      Canvas         │ Props  │
│ View │                     │ Panel  │
│      │                     │        │
└──────┴─────────────────────┴────────┘
```

---

## 🎭 Components

### Button

**Variants:**
- **Primary** - Blue, high emphasis
- **Secondary** - Gray outline, medium emphasis
- **Ghost** - No background, low emphasis
- **Danger** - Red, destructive actions

**Sizes:**
- **sm** - Height 32px, padding 8px 12px
- **md** - Height 40px, padding 10px 16px (default)
- **lg** - Height 48px, padding 12px 20px

**States:**
- Default
- Hover - Darker background
- Active - Even darker
- Disabled - 50% opacity, no pointer events
- Loading - Spinner, disabled state

```jsx
/* Examples */
<Button>Primary Action</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="ghost">Cancel</Button>
<Button variant="danger">Delete</Button>
```

### Card

**Base Card:**
- White background (dark: gray-900)
- 1px border gray-200 (dark: gray-800)
- Border radius: 12px
- Padding: 24px
- No shadow by default

**Interactive Card:**
- Hover: Border gray-300, subtle scale (1.02)
- Transition: 150ms ease

```jsx
<Card>
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>
    Content here
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Input

**Styling:**
- Height: 40px
- Border: 1px gray-300
- Border radius: 8px
- Padding: 10px 12px
- Focus: Blue border, no shadow

**States:**
- Default
- Focus - Primary border, outline
- Error - Red border
- Disabled - Gray background

```jsx
<Input
  placeholder="Enter text..."
  error={errors.field?.message}
/>
```

### Navigation

**Top Nav:**
- Height: 64px
- White background with subtle border
- Sticky position
- Items: Logo, Search, Theme, User menu

**Sidebar:**
- Width: 240px (collapsed: 64px)
- Gray-50 background (dark: gray-900)
- Padding: 16px
- Grouped sections with labels

**Active States:**
- Primary blue background (subtle)
- Primary blue text
- Blue left border (4px)

---

## 🎬 Motion & Animation

### Principles

1. **Purposeful** - Animations guide attention
2. **Quick** - 150-300ms for most interactions
3. **Natural** - Ease-out for entrances, ease-in for exits
4. **Subtle** - Don't distract from content

### Timing Functions

```css
--ease-out: cubic-bezier(0.16, 1, 0.3, 1)    /* Snappy entrance */
--ease-in: cubic-bezier(0.7, 0, 0.84, 0)     /* Quick exit */
--ease-in-out: cubic-bezier(0.65, 0, 0.35, 1) /* Smooth */
```

### Duration

```css
--duration-fast: 150ms      /* Hover, active states */
--duration-normal: 250ms    /* Modal, dropdown */
--duration-slow: 350ms      /* Page transitions */
```

### Common Animations

**Fade In:**
```css
opacity: 0 → 1
duration: 250ms
easing: ease-out
```

**Slide Up:**
```css
transform: translateY(10px) → translateY(0)
opacity: 0 → 1
duration: 250ms
easing: ease-out
```

**Scale:**
```css
transform: scale(1) → scale(1.02)
duration: 150ms
easing: ease-out
```

---

## 📱 Responsive Breakpoints

```css
/* Mobile First Approach */
--sm: 640px   /* Small devices (landscape phones) */
--md: 768px   /* Medium devices (tablets) */
--lg: 1024px  /* Large devices (desktops) */
--xl: 1280px  /* Extra large devices */
--2xl: 1536px /* 2X large devices */
```

### Device-Specific Guidelines

**Mobile (<640px):**
- Single column layouts
- Fullscreen modals
- Bottom sheets for actions
- Larger touch targets (min 44px)
- Hamburger menu navigation

**Tablet (640-1024px):**
- 2-column layouts
- Drawer modals
- Sidebar navigation (collapsible)
- Reduced padding

**Desktop (>1024px):**
- Multi-column layouts
- Hover states
- Sidebar always visible
- Keyboard shortcuts
- Advanced interactions

---

## ♿ Accessibility

### Focus States

```css
/* Keyboard focus */
focus-visible:ring-2
focus-visible:ring-primary
focus-visible:ring-offset-2
```

### Color Contrast

- **Text on white:** Minimum AA (4.5:1)
- **Large text:** Minimum AA (3:1)
- **UI elements:** Minimum AA (3:1)

### Interactive Elements

- **Touch targets:** Minimum 44x44px
- **Click targets:** Minimum 40x40px
- **Focus indicators:** Always visible
- **Skip links:** Included in navigation

### Screen Readers

- Semantic HTML (nav, main, aside, footer)
- ARIA labels for icon buttons
- Alt text for images
- Live regions for dynamic content

---

## 🎯 Design Patterns

### Empty States

**Structure:**
```jsx
<EmptyState>
  <Icon size={48} className="text-gray-400" />
  <EmptyStateTitle>No projects yet</EmptyStateTitle>
  <EmptyStateDescription>
    Get started by creating your first project
  </EmptyStateDescription>
  <Button>Create Project</Button>
</EmptyState>
```

### Loading States

**Skeleton Loaders:**
- Use for predictable layouts
- Match final content size/shape
- Pulse animation (2s duration)
- Gray-200 base, gray-300 shine

**Spinners:**
- Use for unpredictable content
- Center on screen or in container
- Primary color
- 40px default size

### Error States

**Structure:**
```jsx
<ErrorState>
  <Icon name="alert-circle" className="text-error" />
  <ErrorStateTitle>Something went wrong</ErrorStateTitle>
  <ErrorStateMessage>{error.message}</ErrorStateMessage>
  <Button onClick={retry}>Try Again</Button>
</ErrorState>
```

### Search & Filters

**Search:**
- Prominent placement (top of page/section)
- Icon prefix (magnifying glass)
- Clear button when text present
- Debounced (300ms)

**Filters:**
- Horizontal pill buttons
- Show active count
- Clear all option
- Drawer for advanced filters (mobile)

---

## 📊 Data Visualization

### Charts

**Colors:**
- Use primary and accent
- Add neutrals for multi-series
- Ensure sufficient contrast
- Avoid red/green for critical info

**Style:**
- Clean axes
- Subtle gridlines (gray-200)
- Clear labels
- Tooltips on hover

### Tables

**Style:**
- Borders only between rows
- Zebra striping optional
- Sticky header
- Row hover state

**Features:**
- Sortable columns
- Resizable columns
- Pagination
- Row selection

---

## 🎨 Illustrations & Icons

### Icons

**Library:** Lucide React
**Default Size:** 20px
**Usage:**
- Use sparingly
- Pair with text for clarity
- Consistent style
- Color: gray-600 (light), gray-400 (dark)

### Illustrations

**Style:**
- Minimal line art
- Single accent color
- No gradients
- Friendly, approachable

**Usage:**
- Empty states
- Error states
- Onboarding
- Marketing pages

---

## ✅ Component Checklist

For each component, ensure:

- [ ] All variants documented
- [ ] Responsive behavior defined
- [ ] Accessibility requirements met
- [ ] Dark mode support
- [ ] Loading and error states
- [ ] Keyboard navigation
- [ ] Touch-friendly (mobile)
- [ ] Animation timing defined
- [ ] Focus states visible
- [ ] High contrast mode support

---

## 📐 Grid Examples

### Dashboard Grid

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  <StatCard />
  <StatCard />
  <StatCard />
</div>
```

### Project Grid

```jsx
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
  <ProjectCard />
  {/* ... */}
</div>
```

### Form Layout

```jsx
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <Input label="First Name" />
    <Input label="Last Name" />
  </div>
  <Input label="Email" fullWidth />
</div>
```

---

## 🎨 Theme Implementation

### CSS Variables

```css
:root {
  /* Colors */
  --color-primary: 59 130 246;
  --color-accent: 139 92 246;
  /* ... */
}

.dark {
  --color-bg-primary: 3 7 18;
  /* ... */
}
```

### Tailwind Config

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'rgb(var(--color-primary) / <alpha-value>)',
        accent: 'rgb(var(--color-accent) / <alpha-value>)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      borderRadius: {
        'lg': '12px',
        'xl': '16px',
      },
    },
  },
};
```

---

## 🚀 Implementation Guidelines

### Do's

✅ Use spacing scale consistently
✅ Limit color usage (90% neutrals)
✅ Start with mobile layout
✅ Test with keyboard only
✅ Provide clear feedback
✅ Use semantic HTML
✅ Follow naming conventions
✅ Document component usage

### Don'ts

❌ Use colors for decoration
❌ Create one-off spacing values
❌ Hide critical actions
❌ Use animations without purpose
❌ Ignore loading/error states
❌ Forget dark mode
❌ Skip accessibility testing
❌ Create overly complex components

---

## 📚 Resources

- **Figma Design File:** [Link to designs]
- **Component Library:** Radix UI + Custom
- **Icons:** Lucide React
- **Fonts:** Google Fonts (Inter)
- **Animations:** Framer Motion
- **Utilities:** Tailwind CSS + shadcn/ui

---

**Last Updated:** 2026-02-06
**Version:** 2.0
**Maintainer:** AppForge Design Team
