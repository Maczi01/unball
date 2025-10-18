# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Tech Stack

- **Astro 5** - Modern web framework with server-side rendering (SSR mode enabled)
- **React 19** - For interactive/dynamic components only
- **TypeScript 5** - Type-safe development
- **Tailwind CSS 4** - Utility-first styling via Vite plugin
- **Shadcn/ui** - Component library (React-based)
- **Node.js v22.14.0** - Runtime (see `.nvmrc`)

## Development Commands

```bash
# Development
npm run dev              # Start dev server on port 3000

# Production
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # Run ESLint
npm run lint:fix        # Fix ESLint issues automatically
npm run format          # Format code with Prettier

# Git hooks (via husky + lint-staged)
# Auto-runs on commit: ESLint fix on .ts/.tsx/.astro, Prettier on .json/.css/.md
```

## Project Structure

```
./src
├── layouts/           # Astro layouts
├── pages/             # Astro pages (file-based routing)
│   └── api/          # API endpoints (use `export const prerender = false`)
├── middleware/        # Astro middleware (index.ts)
├── components/        # UI components
│   ├── ui/           # Shadcn/ui components
│   └── hooks/        # Custom React hooks
├── lib/               # Shared utilities and services
│   └── services/     # Business logic extracted from API routes
├── db/                # Supabase clients and types
├── types.ts           # Shared types (Entities, DTOs)
├── assets/            # Internal static assets
└── env.d.ts          # TypeScript environment definitions

./public/              # Public static assets
```

**Path Alias:** Use `@/*` for imports (e.g., `import { cn } from "@/lib/utils"`)

## Architecture & Key Patterns

### Component Strategy
- **Astro components (`.astro`)**: Default for static content and layouts
- **React components (`.tsx`)**: Only when interactivity/client-side state is needed
- Never use `"use client"` or other Next.js directives (this is Astro, not Next.js)

### Rendering & Deployment
- Configured for **server-side rendering** (`output: "server"` in `astro.config.mjs`)
- Node adapter in standalone mode for deployment
- Port 3000 for local development

### API Routes (Astro Endpoints)
- Located in `src/pages/api/`
- Use uppercase HTTP method names: `GET`, `POST`, etc.
- Always set `export const prerender = false`
- Use Zod for request validation
- Extract business logic into `src/lib/services/` (keep routes thin)
- Access Supabase via `context.locals.supabase`, not direct imports

### Supabase Integration
- Database client and types live in `src/db/`
- Always use the `SupabaseClient` type from `src/db/supabase.client.ts`
- Never import directly from `@supabase/supabase-js` for typing
- Validate data with Zod schemas before database operations

### Styling with Tailwind
- Use `cn()` utility from `@/lib/utils` for conditional classes (combines `clsx` + `twMerge`)
- Leverage arbitrary values: `w-[123px]`
- Use `@layer` directive for custom utilities/components
- Dark mode via `dark:` variant
- Responsive: `sm:`, `md:`, `lg:`, etc.
- State variants: `hover:`, `focus-visible:`, `active:`

## Coding Standards

### Error Handling Pattern
```typescript
// Handle errors and edge cases at the top (guard clauses)
if (!input) {
  return { error: "Input required" };
}

if (hasError) {
  return { error: "Something went wrong" };
}

// Happy path at the end
return { success: true, data };
```

- Use early returns for error conditions
- Avoid deeply nested if/else statements
- Place happy path last for readability
- Implement proper error logging with user-friendly messages

### React Best Practices
- Functional components with hooks only (no class components)
- Extract logic into custom hooks in `src/components/hooks/`
- Use `React.memo()` for expensive components with stable props
- Use `React.lazy()` + `Suspense` for code-splitting
- Use `useCallback` for event handlers passed to children
- Use `useMemo` for expensive calculations
- Use `useId()` for accessibility IDs
- Consider `useOptimistic` for optimistic UI updates
- Use `useTransition` for non-urgent state updates

### Astro Patterns
- Leverage View Transitions API (ClientRouter) for smooth navigation
- Use content collections with type safety for structured content
- Middleware goes in `src/middleware/index.ts`
- Use `Astro.cookies` for server-side cookie management
- Environment variables via `import.meta.env`
- Image optimization with Astro Image integration
- Hybrid rendering where needed (per-page SSR control)

### Accessibility (ARIA)
- Use semantic HTML first; ARIA only when necessary
- Implement ARIA landmarks (main, navigation, search)
- Use `aria-expanded`, `aria-controls` for expandable content
- Use `aria-live` regions for dynamic updates
- Apply `aria-hidden` for decorative elements
- Use `aria-label` or `aria-labelledby` for unlabeled elements
- Use `aria-describedby` for form descriptions
- Implement `aria-current` for navigation state
- Avoid redundant ARIA on native elements

### Linting & Formatting
- ESLint runs with TypeScript, Astro, React, and accessibility plugins
- Prettier configured with Astro plugin
- Pre-commit hooks auto-fix issues via `lint-staged`
- Always address linter feedback when making changes
