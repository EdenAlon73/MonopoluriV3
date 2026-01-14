# Design System

Monopoluri uses a clean, modern design system built on Tailwind CSS.

## Color Palette

**Primary:** `slate` — Main brand color for primary actions and accents  
**Secondary:** `red` — Secondary accent color for alerts and highlights  
**Neutral:** `stone` — Grays for backgrounds, borders, and text

### Tailwind Color Usage

```css
/* Primary (slate) */
slate-50, slate-100, slate-200, ..., slate-900, slate-950

/* Secondary (red) */
red-50, red-100, red-200, ..., red-900, red-950

/* Neutral (stone) */
stone-50, stone-100, stone-200, ..., stone-900, stone-950
```

### User-Specific Colors

**Eden:** Blue accents (`blue-500`, `blue-600`, `slate-600`)  
**Sivan:** Amber accents (`amber-500`, `amber-600`)

Apply the active user's color dynamically throughout the session.

## Typography

All fonts are loaded from Google Fonts:

**Heading Font:** `Manrope` — Clean, modern sans-serif  
**Body Font:** `Manrope` — Same as heading for consistency  
**Monospace Font:** `IBM Plex Mono` — For code, data, and numbers

### Font Weights

- Regular: 400
- Medium: 500
- Semibold: 600
- Bold: 700
- Extrabold: 800 (for headings only)

### Google Fonts Setup

Add to your HTML `<head>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet">
```

### Tailwind Configuration

Configure Tailwind to use these fonts:

```css
@import "tailwindcss";

@theme {
  --font-sans: Manrope, ui-sans-serif, system-ui, sans-serif;
  --font-mono: "IBM Plex Mono", ui-monospace, monospace;
}
```

Or in older Tailwind config format:

```js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Manrope', 'sans-serif'],
        mono: ['IBM Plex Mono', 'monospace'],
      },
    },
  },
}
```

## CSS Custom Properties

For dynamic user color theming:

```css
:root {
  --user-color-primary: 59 130 246; /* blue-500 for Eden */
  --user-color-secondary: 37 99 235; /* blue-600 */
}

[data-user="sivan"] {
  --user-color-primary: 245 158 11; /* amber-500 for Sivan */
  --user-color-secondary: 217 119 6; /* amber-600 */
}

/* Use in Tailwind */
.bg-user-primary {
  background-color: rgb(var(--user-color-primary));
}
```

## Dark Mode

Enable dark mode in Tailwind:

```js
module.exports = {
  darkMode: 'class', // or 'media'
  // ...
}
```

All components use `dark:` variants for dark mode support.

## Component Patterns

### Cards
- Border: `border border-stone-200 dark:border-stone-700`
- Shadow: `shadow-sm`
- Padding: `p-4` or `p-6`
- Radius: `rounded-lg`

### Buttons
- Primary: `bg-slate-600 hover:bg-slate-700 text-white`
- Secondary: `bg-stone-200 hover:bg-stone-300 text-stone-900 dark:bg-stone-700 dark:hover:bg-stone-600 dark:text-stone-100`
- Radius: `rounded-md`
- Padding: `px-4 py-2`

### Inputs
- Border: `border border-stone-300 dark:border-stone-600`
- Background: `bg-white dark:bg-stone-800`
- Focus: `focus:border-slate-500 focus:ring-slate-500`
- Radius: `rounded-md`
- Padding: `px-3 py-2`

### Text
- Headings: `text-stone-900 dark:text-stone-100`
- Body: `text-stone-700 dark:text-stone-300`
- Muted: `text-stone-500 dark:text-stone-400`
