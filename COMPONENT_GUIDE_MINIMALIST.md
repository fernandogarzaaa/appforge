# Minimalist Component Guide

**Version:** 2.0
**Date:** 2026-02-06
**Status:** ✅ Complete

---

## Overview

This guide provides usage patterns for all UI components following the minimalist design system. The existing components are well-structured using shadcn/ui patterns - this guide shows how to use them correctly.

---

## 🎨 Color System Update

### CSS Variables

Replace `src/globals.css` with `src/globals-minimalist.css` to update color system:

```bash
# Backup old file
mv src/globals.css src/globals-old.css

# Use new minimalist colors
mv src/globals-minimalist.css src/globals.css
```

**New Colors:**
- Primary: Blue 500 (#3B82F6) - `bg-primary`, `text-primary`
- Accent: Purple 500 (#8B5CF6) - `bg-accent`, `text-accent`
- Destructive: Red 500 (#EF4444) - `bg-destructive`, `text-destructive`
- Border: Gray 200 - `border-border`
- Muted: Gray 200 - `bg-muted`

---

## 🔘 Button Component

**File:** `src/components/ui/button.jsx`

### Variants

#### Primary (Default)
```jsx
<Button>Primary Action</Button>
<Button variant="default">Primary Action</Button>
```
**Use for:** Main CTAs, primary actions

#### Secondary (Outline)
```jsx
<Button variant="outline">Secondary Action</Button>
```
**Use for:** Secondary actions, cancel buttons

#### Ghost
```jsx
<Button variant="ghost">Tertiary Action</Button>
```
**Use for:** Low-priority actions, nav items

#### Destructive
```jsx
<Button variant="destructive">Delete</Button>
```
**Use for:** Destructive actions only (delete, remove)

#### Link
```jsx
<Button variant="link">Learn More</Button>
```
**Use for:** Text links that need button semantics

### Sizes

```jsx
<Button size="sm">Small</Button>
<Button size="default">Default</Button>
<Button size="lg">Large</Button>
<Button size="icon"><Icon /></Button>
```

### With Icons

```jsx
import { Plus, ArrowRight, Sparkles } from 'lucide-react';

<Button>
  <Plus className="w-4 h-4 mr-2" />
  New Item
</Button>

<Button>
  Continue
  <ArrowRight className="w-4 h-4 ml-2" />
</Button>

// Icon-only
<Button size="icon">
  <Plus className="w-4 h-4" />
</Button>
```

### States

```jsx
// Loading
<Button disabled>
  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
  Loading...
</Button>

// Disabled
<Button disabled>Disabled</Button>
```

### Do's & Don'ts

✅ **Do:**
- Use primary buttons sparingly (1 per section)
- Pair icons with text for clarity
- Use destructive variant for delete actions
- Provide loading states for async actions

❌ **Don't:**
- Use multiple primary buttons in close proximity
- Add gradients or heavy shadows
- Use colors for decoration
- Create custom button variants without reason

---

## 🎴 Card Component

**File:** `src/components/ui/card.jsx`

### Basic Usage

```jsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';

<Card>
  <CardHeader>
    <CardTitle>Card Title</CardTitle>
    <CardDescription>Optional description</CardDescription>
  </CardHeader>
  <CardContent>
    <p>Card content goes here</p>
  </CardContent>
  <CardFooter>
    <Button>Action</Button>
  </CardFooter>
</Card>
```

### Interactive Card

```jsx
<Card className="hover:shadow-md hover:border-blue-300 transition-all cursor-pointer">
  <CardContent className="p-6">
    {/* Content */}
  </CardContent>
</Card>
```

### Minimal Card (No Header)

```jsx
<Card className="border border-gray-200">
  <CardContent className="p-6">
    {/* Simple content */}
  </CardContent>
</Card>
```

### Empty State Card

```jsx
<Card className="border-2 border-dashed border-gray-300 shadow-none">
  <CardContent className="p-12 text-center">
    <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center mx-auto mb-4">
      <Icon className="w-8 h-8 text-gray-400" />
    </div>
    <h3 className="text-lg font-semibold text-gray-900 mb-2">Empty State</h3>
    <p className="text-gray-600 mb-6">Description text</p>
    <Button>Action</Button>
  </CardContent>
</Card>
```

### Do's & Don'ts

✅ **Do:**
- Use consistent padding (p-6 for standard, p-4 for compact)
- Add hover effects for interactive cards
- Keep border colors minimal (gray-200)
- Use dashed borders for empty states

❌ **Don't:**
- Add colored backgrounds (unless for specific purpose)
- Use heavy shadows by default
- Stack multiple cards without spacing
- Add gradients or decorative elements

---

## 📝 Input Component

**File:** `src/components/ui/input.jsx`

### Basic Input

```jsx
<Input
  placeholder="Enter text..."
  className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
/>
```

### With Label

```jsx
<div className="space-y-2">
  <Label htmlFor="email" className="text-sm font-medium text-gray-900">
    Email Address
  </Label>
  <Input
    id="email"
    type="email"
    placeholder="you@example.com"
    className="border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  />
</div>
```

### With Icon

```jsx
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
  <Input
    placeholder="Search..."
    className="pl-10 border-gray-300"
  />
</div>
```

### Error State

```jsx
<div className="space-y-2">
  <Label htmlFor="email">Email</Label>
  <Input
    id="email"
    type="email"
    className="border-red-300 focus:border-red-500 focus:ring-red-100"
  />
  <p className="text-sm text-red-600">Please enter a valid email</p>
</div>
```

### Disabled State

```jsx
<Input
  disabled
  placeholder="Disabled input"
  className="bg-gray-100 cursor-not-allowed"
/>
```

### Do's & Don'ts

✅ **Do:**
- Use consistent border colors (gray-300)
- Provide clear focus states (blue ring)
- Show error messages below input
- Use appropriate input types

❌ **Don't:**
- Use decorative icons unnecessarily
- Skip focus states
- Hide labels (use placeholder as fallback only)
- Use small input sizes (min height 40px)

---

## 📄 Textarea Component

**File:** `src/components/ui/textarea.jsx`

### Basic Textarea

```jsx
<Textarea
  placeholder="Enter description..."
  className="min-h-[100px] resize-none border-gray-300 focus:border-blue-500 focus:ring-2 focus:ring-blue-100"
  rows={4}
/>
```

### With Label

```jsx
<div className="space-y-2">
  <Label htmlFor="description">Description</Label>
  <Textarea
    id="description"
    placeholder="Describe your project..."
    className="min-h-[120px] resize-none border-gray-300"
    rows={5}
  />
  <p className="text-sm text-gray-500">
    Provide a brief description of your project
  </p>
</div>
```

---

## 🗨️ Dialog (Modal) Component

**File:** `src/components/ui/dialog.jsx`

### Basic Dialog

```jsx
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';

<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="sm:max-w-md">
    <DialogTitle className="text-xl font-semibold text-gray-900">
      Dialog Title
    </DialogTitle>
    <DialogDescription className="text-gray-600">
      Optional description text
    </DialogDescription>

    {/* Content */}
    <div className="space-y-4 mt-4">
      {/* Form fields, etc. */}
    </div>

    {/* Actions */}
    <div className="flex gap-3 mt-6 pt-6 border-t border-gray-200">
      <Button variant="outline" onClick={() => setIsOpen(false)} className="flex-1">
        Cancel
      </Button>
      <Button onClick={handleSave} className="flex-1">
        Save
      </Button>
    </div>
  </DialogContent>
</Dialog>
```

### Dialog Sizes

```jsx
// Small
<DialogContent className="sm:max-w-sm">

// Medium (default)
<DialogContent className="sm:max-w-md">

// Large
<DialogContent className="sm:max-w-lg">

// Extra Large
<DialogContent className="sm:max-w-2xl">
```

### Dialog with Close Button

```jsx
<DialogContent className="sm:max-w-md">
  <div className="flex items-center justify-between mb-6">
    <DialogTitle>Title</DialogTitle>
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setIsOpen(false)}
      className="h-8 w-8 p-0"
    >
      <X className="w-4 h-4" />
    </Button>
  </div>
  {/* Content */}
</DialogContent>
```

---

## 🎯 Select Component

**File:** `src/components/ui/select.jsx`

### Basic Select

```jsx
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

<Select value={value} onValueChange={setValue}>
  <SelectTrigger className="w-full border-gray-300">
    <SelectValue placeholder="Select option" />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="option1">Option 1</SelectItem>
    <SelectItem value="option2">Option 2</SelectItem>
    <SelectItem value="option3">Option 3</SelectItem>
  </SelectContent>
</Select>
```

### With Label

```jsx
<div className="space-y-2">
  <Label htmlFor="status">Status</Label>
  <Select value={status} onValueChange={setStatus}>
    <SelectTrigger className="w-full border-gray-300">
      <SelectValue placeholder="Select status" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem value="draft">Draft</SelectItem>
      <SelectItem value="published">Published</SelectItem>
      <SelectItem value="archived">Archived</SelectItem>
    </SelectContent>
  </Select>
</div>
```

### With Icon

```jsx
<Select value={filter} onValueChange={setFilter}>
  <SelectTrigger className="w-40 border-gray-300">
    <Filter className="w-4 h-4 mr-2 text-gray-400" />
    <SelectValue placeholder="Filter" />
  </SelectTrigger>
  <SelectContent>
    {/* Items */}
  </SelectContent>
</Select>
```

---

## 🍞 Toast (Notification) Component

**File:** `src/components/ui/toast.jsx`, `src/components/ui/use-toast.js`

### Basic Usage

```jsx
import { useToast } from '@/components/ui/use-toast';

const { toast } = useToast();

// Success
toast({
  title: "Success",
  description: "Your changes have been saved.",
});

// Error
toast({
  title: "Error",
  description: "Something went wrong. Please try again.",
  variant: "destructive"
});

// With action
toast({
  title: "Scheduled: Catch up",
  description: "Friday, February 10, 2023 at 5:57 PM",
  action: (
    <Button variant="outline" size="sm">
      Undo
    </Button>
  ),
});
```

### Toast Variants

```jsx
// Default (info/success)
toast({
  title: "Info",
  description: "This is an informational message.",
});

// Destructive (error/warning)
toast({
  title: "Error",
  description: "Action failed",
  variant: "destructive"
});
```

---

## 🏷️ Badge Component

**File:** `src/components/ui/badge.jsx`

### Basic Badge

```jsx
import { Badge } from '@/components/ui/badge';

<Badge>Default</Badge>
<Badge variant="secondary">Secondary</Badge>
<Badge variant="destructive">Error</Badge>
<Badge variant="outline">Outline</Badge>
```

### Status Badges

```jsx
// Active/Success
<Badge className="bg-green-100 text-green-700 border-0">Active</Badge>

// Warning
<Badge className="bg-amber-100 text-amber-700 border-0">Warning</Badge>

// Info
<Badge className="bg-blue-100 text-blue-700 border-0">Info</Badge>

// Error
<Badge variant="destructive">Error</Badge>
```

---

## 📊 Component Patterns

### Form Layout

```jsx
<div className="space-y-6">
  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
    <div className="space-y-2">
      <Label htmlFor="firstName">First Name</Label>
      <Input id="firstName" placeholder="John" />
    </div>
    <div className="space-y-2">
      <Label htmlFor="lastName">Last Name</Label>
      <Input id="lastName" placeholder="Doe" />
    </div>
  </div>

  <div className="space-y-2">
    <Label htmlFor="email">Email</Label>
    <Input id="email" type="email" placeholder="john@example.com" />
  </div>

  <div className="flex gap-3">
    <Button variant="outline" className="flex-1">Cancel</Button>
    <Button className="flex-1">Submit</Button>
  </div>
</div>
```

### Grid Layout

```jsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
  {items.map(item => (
    <Card key={item.id}>
      {/* Card content */}
    </Card>
  ))}
</div>
```

### List with Actions

```jsx
<div className="space-y-3">
  {items.map(item => (
    <Card key={item.id} className="border border-gray-200">
      <CardContent className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-gray-400" />
          <div>
            <p className="font-medium text-gray-900">{item.name}</p>
            <p className="text-sm text-gray-500">{item.description}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm">Edit</Button>
          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
            Delete
          </Button>
        </div>
      </CardContent>
    </Card>
  ))}
</div>
```

---

## ✅ Component Checklist

For each component usage:

- [ ] Uses design system colors (blue primary, gray neutrals)
- [ ] Has clear focus states
- [ ] Provides loading states (if applicable)
- [ ] Shows error states (if applicable)
- [ ] Includes proper labels and descriptions
- [ ] Is keyboard accessible
- [ ] Has appropriate hover effects
- [ ] Uses consistent spacing
- [ ] Avoids gradients and heavy shadows
- [ ] Is mobile-responsive

---

## 🎨 Quick Reference

### Colors
- **Primary:** `bg-blue-500`, `text-blue-600`, `border-blue-300`
- **Accent:** `bg-purple-500`, `text-purple-600`, `border-purple-300`
- **Error:** `bg-red-500`, `text-red-600`, `border-red-300`
- **Neutral:** `bg-gray-50/100/200`, `text-gray-600/900`, `border-gray-200/300`

### Spacing
- **Cards:** `p-6` (24px)
- **Sections:** `space-y-6/8/12` (24px/32px/48px)
- **Forms:** `space-y-4` (16px)
- **Grid gaps:** `gap-6` (24px)

### Typography
- **Headings:** `text-3xl/2xl/xl` + `font-bold/semibold`
- **Body:** `text-base` (16px)
- **Secondary:** `text-sm` (14px), `text-gray-600`
- **Labels:** `text-sm` + `font-medium`

### Borders
- **Default:** `border border-gray-200`
- **Hover:** `hover:border-gray-300` or `hover:border-blue-300`
- **Focus:** `focus:border-blue-500 focus:ring-2 focus:ring-blue-100`

### Shadows
- **Default:** `shadow-sm` (minimal)
- **Hover:** `hover:shadow-md`
- **Avoid:** `shadow-lg`, `shadow-xl`, colored shadows

---

**Last Updated:** 2026-02-06
**Version:** 2.0
**Status:** ✅ Ready for use
