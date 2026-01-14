# Application Shell Components

The shell provides persistent navigation and layout that wraps all sections of Monopoluri.

## Components

### AppShell.tsx
Main layout component with:
- Fixed sidebar navigation (256px wide on desktop)
- Logo/app name at top
- Main navigation in middle
- User menu at bottom
- Responsive hamburger menu on mobile

**Props:**
- `children`: React.ReactNode — Main content area

### MainNav.tsx
Navigation menu with links to all sections:
- Transactions
- Goals
- Analytics
- AI Insights

Highlights the active section and uses appropriate icons.

**Props:**
- `activeSection`: string — Current active section ID

### UserMenu.tsx
User profile menu displaying:
- Active user name (Eden or Sivan)
- Profile color indicator
- Profile switcher
- Optional logout button

**Props:**
- `activeUser`: { name: string, color: 'blue' | 'amber' }
- `onSwitchProfile`: () => void
- `onLogout`?: () => void

## Usage

```tsx
import { AppShell, MainNav, UserMenu } from './shell/components';

function App() {
  return (
    <AppShell>
      <MainNav activeSection="transactions" />
      <main>{/* Your section content */}</main>
      <UserMenu 
        activeUser={{ name: 'Eden', color: 'blue' }}
        onSwitchProfile={handleSwitch}
      />
    </AppShell>
  );
}
```

## Responsive Behavior

- **Desktop (≥1024px):** Fixed sidebar always visible
- **Tablet (768px-1023px):** Sidebar visible but slightly narrower  
- **Mobile (<768px):** Sidebar collapses to hamburger menu with overlay

## Dynamic User Theming

The shell applies the active user's color throughout:
- Eden → Blue accents
- Sivan → Amber accents

Implement this using CSS custom properties or Tailwind's dynamic classes.
