# Authentication & Authorization Architecture Specification
## FootyGuess Daily - Complete Implementation Plan

**Version:** 1.1 (CORRECTED)
**Date:** 2025-10-26
**Status:** Ready for Implementation

**⚠️ IMPORTANT:** This document has been updated to fix critical conflicts identified during PRD comparison. See `.ai/auth-architecture-conflicts.md` for detailed conflict analysis.

---

## Executive Summary

This document provides a complete architecture for implementing authentication and authorization features for FootyGuess Daily, covering user stories **US-026 through US-039** from the PRD. The backend infrastructure (API routes, services, database schema, RLS policies) is **fully implemented**. This specification focuses on the **frontend UI layer** and integration patterns.

### Current Status
✅ **Backend Complete:** All API endpoints, services, middleware, and database schema implemented
❌ **Frontend Missing:** No authentication UI components or pages exist
🎯 **Goal:** Implement complete auth UI while maintaining compatibility with existing gameplay

---

## Table of Contents

1. [User Interface Architecture](#1-user-interface-architecture)
2. [Backend Logic](#2-backend-logic)
3. [Authentication System](#3-authentication-system)
4. [Integration & Data Flow](#4-integration--data-flow)
5. [Implementation Roadmap](#5-implementation-roadmap)

---

## 1. USER INTERFACE ARCHITECTURE

### 1.1 Page Structure & Navigation

#### **1.1.1 New Pages to Create**

All pages should be created in `src/pages/` following Astro's file-based routing:

| Path | File | Purpose | Auth Required |
|------|------|---------|---------------|
| `/login` | `src/pages/login.astro` | User sign-in page | ❌ No |
| `/signup` | `src/pages/signup.astro` | User registration page | ❌ No |
| `/profile` | `src/pages/profile.astro` | User profile settings | ✅ Yes |
| `/admin` | `src/pages/admin/index.astro` | Admin dashboard | ✅ Yes (Admin) |
| `/admin/submissions` | `src/pages/admin/submissions.astro` | Photo moderation queue | ✅ Yes (Admin) |
| `/admin/users` | `src/pages/admin/users.astro` | User management | ✅ Yes (Admin) |
| `/photos/submit` | `src/pages/photos/submit.astro` | Photo submission form | ✅ Yes (Permission) |
| `/photos/my-submissions` | `src/pages/photos/my-submissions.astro` | User's submission history | ✅ Yes |

#### **1.1.2 Pages to Extend**

| Existing Page | File | Changes Required |
|---------------|------|------------------|
| Home | `src/pages/index.astro` | Add auth status indicator and user menu |
| Game | `src/pages/play/[mode].astro` | Handle authenticated vs anonymous leaderboard submission |

---

### 1.2 Layout & Navigation Components

#### **1.2.1 Enhanced Main Layout**

**File:** `src/layouts/Layout.astro`

**Current State:** Basic HTML wrapper with no navigation or auth state
**Required Changes:** Add global navigation header with auth state

**New Structure:**
```astro
---
import "../styles/global.css";
import Navigation from "@/components/navigation/Navigation.astro";
import { AuthService } from "@/lib/services/auth.service";

interface Props {
  title?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePhotoPermission?: boolean;
}

const {
  title = "FootyGuess Daily - Test Your Football Knowledge",
  requireAuth = false,
  requireAdmin = false,
  requirePhotoPermission = false
} = Astro.props;

// Access auth state from middleware
const { user, supabase } = Astro.locals;

// Handle protected routes - check authentication first
if (requireAuth && !user) {
  return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}

// Check admin role (requires database query - role NOT in user object)
if (requireAdmin && user) {
  const authService = new AuthService(supabase);
  const isAdmin = await authService.isAdmin(user.id);

  if (!isAdmin) {
    return Astro.redirect('/?error=forbidden');
  }
}

// Check photo submission permission (requires database query)
if (requirePhotoPermission && user) {
  const authService = new AuthService(supabase);
  const canSubmit = await authService.canAddPhotos(user.id);

  if (!canSubmit) {
    return Astro.redirect('/?error=permission_denied');
  }
}

// Fetch full user profile for navigation (if authenticated)
let userProfile = null;
if (user) {
  const authService = new AuthService(supabase);
  userProfile = await authService.getUserProfile(user.id);
}
---

<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width" />
    <link rel="icon" type="image/png" href="/favicon.png" />
    <meta name="generator" content={Astro.generator} />
    <meta name="description" content="..." />
    <title>{title}</title>
  </head>
  <body>
    <Navigation user={user} profile={userProfile} />
    <main>
      <slot />
    </main>
  </body>
</html>
```

**Key Features:**
- Route protection via `requireAuth`, `requireAdmin`, and `requirePhotoPermission` props
- **CORRECT:** Role and permissions checked via AuthService (database query)
- **IMPORTANT:** `user` object from Supabase Auth does NOT contain role/permissions
- Automatic redirect to login with return URL
- Pass both user and full profile to Navigation component
- Maintain existing minimal layout for game pages

**⚠️ Critical Note:**
The Supabase Auth `user` object (`Astro.locals.user`) contains only auth-related data (id, email, etc.). Role and permissions are stored in the `users` table and MUST be queried separately using `AuthService`.

---

#### **1.2.2 Navigation Component**

**File:** `src/components/navigation/Navigation.astro`

**Purpose:** Global navigation bar with auth state and user menu

**Structure:**
```astro
---
import type { User } from '@supabase/supabase-js';
import type { UserProfile } from '@/lib/services/auth.service';
import UserMenu from './UserMenu';

interface Props {
  user: User | null;
  profile: UserProfile | null;
}

const { user, profile } = Astro.props;
const currentPath = Astro.url.pathname;
---

<nav class="border-b bg-background">
  <div class="container mx-auto flex items-center justify-between px-4 py-3">
    <!-- Logo & Brand -->
    <a href="/" class="text-xl font-bold hover:opacity-80">
      ⚽ FootyGuess Daily
    </a>

    <!-- Main Navigation Links -->
    <div class="flex items-center gap-6">
      <a
        href="/play/normal"
        class:list={[
          "text-sm font-medium transition-colors hover:text-primary",
          currentPath.startsWith('/play/normal') && "text-primary"
        ]}
      >
        Play Normal
      </a>
      <a
        href="/play/daily"
        class:list={[
          "text-sm font-medium transition-colors hover:text-primary",
          currentPath.startsWith('/play/daily') && "text-primary"
        ]}
      >
        Daily Challenge
      </a>
    </div>

    <!-- Auth State -->
    {profile ? (
      <UserMenu client:load profile={profile} currentPath={currentPath} />
    ) : (
      <div class="flex items-center gap-3">
        <a href="/login" class="text-sm font-medium hover:text-primary">
          Log In
        </a>
        <a
          href="/signup"
          class="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          Sign Up
        </a>
      </div>
    )}
  </div>
</nav>
```

**Responsive Behavior:**
- Desktop: Horizontal layout with full links
- Mobile (< 768px): Hamburger menu with drawer navigation

**⚠️ Important:** Navigation receives `profile` (with role/permissions), not just `user`

---

#### **1.2.3 User Menu Component**

**File:** `src/components/navigation/UserMenu.tsx`

**Type:** React component (requires client-side interactivity)

**Purpose:** Dropdown menu showing user info and actions

**Structure:**
```tsx
import React, { useState } from 'react';
import type { UserProfile } from '@/lib/services/auth.service';
import { Button } from '@/components/ui/button';

interface UserMenuProps {
  profile: UserProfile; // Full profile with role and permissions
  currentPath: string;
}

export default function UserMenu({ profile, currentPath }: UserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleSignOut = async () => {
    setIsLoggingOut(true);
    try {
      const response = await fetch('/api/auth/signout', { method: 'POST' });
      if (response.ok) {
        window.location.href = '/';
      } else {
        alert('Failed to sign out');
      }
    } catch (error) {
      alert('Network error');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="relative">
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 rounded-md border px-3 py-2 hover:bg-accent"
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        <div className="size-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
          {profile.nickname?.[0]?.toUpperCase() || profile.email?.[0]?.toUpperCase() || 'U'}
        </div>
        <svg className="size-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
            aria-hidden="true"
          />

          {/* Menu Panel */}
          <div className="absolute right-0 mt-2 w-64 rounded-md border bg-background shadow-lg z-20">
            {/* User Info Header */}
            <div className="border-b px-4 py-3">
              <p className="text-sm font-medium">{profile.nickname || profile.email}</p>
              <p className="text-xs text-muted-foreground mt-1">
                {profile.role === 'admin' ? 'Administrator' : 'Player'}
              </p>
            </div>

            {/* Menu Items */}
            <div className="py-2">
              <a
                href="/profile"
                className="block px-4 py-2 text-sm hover:bg-accent"
              >
                Profile Settings
              </a>

              {profile.canAddPhotos && (
                <>
                  <a
                    href="/photos/submit"
                    className="block px-4 py-2 text-sm hover:bg-accent"
                  >
                    Submit Photo
                  </a>
                  <a
                    href="/photos/my-submissions"
                    className="block px-4 py-2 text-sm hover:bg-accent"
                  >
                    My Submissions
                  </a>
                </>
              )}

              {profile.role === 'admin' && (
                <>
                  <div className="border-t my-2" />
                  <a
                    href="/admin"
                    className="block px-4 py-2 text-sm hover:bg-accent"
                  >
                    Admin Dashboard
                  </a>
                  <a
                    href="/admin/submissions"
                    className="block px-4 py-2 text-sm hover:bg-accent"
                  >
                    Moderate Submissions
                  </a>
                  <a
                    href="/admin/users"
                    className="block px-4 py-2 text-sm hover:bg-accent"
                  >
                    Manage Users
                  </a>
                </>
              )}
            </div>

            {/* Sign Out */}
            <div className="border-t px-4 py-3">
              <Button
                onClick={handleSignOut}
                disabled={isLoggingOut}
                variant="outline"
                className="w-full"
              >
                {isLoggingOut ? 'Signing out...' : 'Sign Out'}
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
```

**Key Features:**
- Avatar with nickname or email initial
- Conditional menu items based on role/permissions from profile
- **CORRECT:** Uses `profile.role` and `profile.canAddPhotos` (from database)
- Admin-only sections
- Loading state during sign-out
- Click-outside to close
- Accessible ARIA attributes

**⚠️ Critical:** This component receives `profile` with role and permissions, NOT raw `user` object

---

### 1.3 Authentication Forms & Pages

#### **1.3.0 Profanity Filtering Requirement**

**PRD Requirements:** US-026, US-029, US-009
**Priority:** HIGH (Required for MVP)

All nickname inputs must be validated for profanity to prevent inappropriate content on public leaderboards.

**Implementation Approach:**

1. **Add Dependency:**
```bash
npm install bad-words
```

2. **Update AuthService** (`src/lib/services/auth.service.ts`):
```typescript
import Filter from 'bad-words';

export class AuthService {
  private profanityFilter = new Filter();

  async updateNickname(userId: string, nickname: string): Promise<AuthResult> {
    // Length validation
    if (nickname.length < 3 || nickname.length > 20) {
      return {
        success: false,
        error: "Nickname must be between 3 and 20 characters",
      };
    }

    // **NEW: Profanity check**
    if (this.profanityFilter.isProfane(nickname)) {
      return {
        success: false,
        error: "Nickname contains inappropriate content",
      };
    }

    // Uniqueness check (existing code)
    // ...
  }

  // Add same profanity check to signUp method
}
```

3. **Client-Side Validation** (for immediate UX feedback):
```typescript
// src/lib/utils/profanity.ts
import Filter from 'bad-words';

const filter = new Filter();

export function containsProfanity(text: string): boolean {
  return filter.isProfane(text);
}
```

**Usage in Forms:**
- SignupForm: Check before submission
- ProfileForm: Check before submission
- Server always validates (defense in depth)

#### **1.3.1 Login Page**

**File:** `src/pages/login.astro`

**User Story:** US-027 (User sign in)

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import LoginForm from '@/components/auth/LoginForm';

// If already logged in, redirect to home
const { user } = Astro.locals;
if (user) {
  return Astro.redirect('/');
}

// Get redirect URL from query params
const redirectUrl = Astro.url.searchParams.get('redirect') || '/';
---

<Layout title="Log In - FootyGuess Daily">
  <div class="container mx-auto flex min-h-screen items-center justify-center px-4">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold">Welcome Back</h1>
        <p class="mt-2 text-muted-foreground">
          Sign in to save your scores to the leaderboard
        </p>
      </div>

      <LoginForm client:load redirectUrl={redirectUrl} />

      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Don't have an account?</span>
        <a href="/signup" class="ml-1 font-medium text-primary hover:underline">
          Sign up
        </a>
      </div>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-muted-foreground hover:text-foreground">
          Continue as guest
        </a>
      </div>
    </div>
  </div>
</Layout>
```

**Design Notes:**
- Centered card layout
- Clear call-to-action for sign-up
- Option to continue as guest
- Redirect URL preserved through login flow

---

#### **1.3.2 Login Form Component**

**File:** `src/components/auth/LoginForm.tsx`

**Type:** React component (client-side form handling)

**Structure:**
```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface LoginFormProps {
  redirectUrl?: string;
}

export default function LoginForm({ redirectUrl = '/' }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to sign in');
        return;
      }

      // Successful login - redirect
      window.location.href = redirectUrl;
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="current-password"
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Signing in...' : 'Sign In'}
      </Button>
    </form>
  );
}
```

**Validation Rules:**
- Email: Required, valid email format (HTML5 validation)
- Password: Required, minimum 8 characters

**Error Handling:**
- Display API error messages
- Network error fallback
- Clear error on new submission attempt

---

#### **1.3.3 Signup Page**

**File:** `src/pages/signup.astro`

**User Story:** US-026 (User sign up)

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import SignupForm from '@/components/auth/SignupForm';

// If already logged in, redirect to home
const { user } = Astro.locals;
if (user) {
  return Astro.redirect('/');
}
---

<Layout title="Sign Up - FootyGuess Daily">
  <div class="container mx-auto flex min-h-screen items-center justify-center px-4 py-8">
    <div class="w-full max-w-md">
      <div class="mb-8 text-center">
        <h1 class="text-3xl font-bold">Create Account</h1>
        <p class="mt-2 text-muted-foreground">
          Join the competition and save your scores to the leaderboard
        </p>
      </div>

      <SignupForm client:load />

      <div class="mt-6 text-center text-sm">
        <span class="text-muted-foreground">Already have an account?</span>
        <a href="/login" class="ml-1 font-medium text-primary hover:underline">
          Log in
        </a>
      </div>

      <div class="mt-4 text-center">
        <a href="/" class="text-sm text-muted-foreground hover:text-foreground">
          Continue as guest
        </a>
      </div>
    </div>
  </div>
</Layout>
```

---

#### **1.3.4 Signup Form Component**

**File:** `src/components/auth/SignupForm.tsx`

**Structure:**
```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationConstants } from '@/types';
import { containsProfanity } from '@/lib/utils/profanity';

export default function SignupForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(false);

  // Client-side validation
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    // Email validation (basic)
    if (!email.includes('@')) {
      errors.email = 'Invalid email address';
    }

    // Password validation
    if (password.length < 8) {
      errors.password = 'Password must be at least 8 characters';
    }

    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    // Nickname validation (optional but if provided must be valid)
    if (nickname) {
      if (nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH) {
        errors.nickname = `Nickname must be at least ${ValidationConstants.NICKNAME.MIN_LENGTH} characters`;
      }
      if (nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH) {
        errors.nickname = `Nickname must be no more than ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`;
      }
      if (!ValidationConstants.NICKNAME.REGEX.test(nickname)) {
        errors.nickname = 'Nickname can only contain letters, numbers, spaces, hyphens, and underscores';
      }
      // **NEW: Profanity check**
      if (containsProfanity(nickname)) {
        errors.nickname = 'Nickname contains inappropriate content';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          password,
          nickname: nickname || undefined // Send only if provided
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create account');
        return;
      }

      // Success - redirect to home or show success message
      window.location.href = '/';
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {/* Email Field */}
      <div className="space-y-2">
        <label htmlFor="email" className="text-sm font-medium">
          Email <span className="text-destructive">*</span>
        </label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@example.com"
          required
          autoComplete="email"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.email}
          aria-describedby={fieldErrors.email ? 'email-error' : undefined}
        />
        {fieldErrors.email && (
          <p id="email-error" className="text-sm text-destructive">
            {fieldErrors.email}
          </p>
        )}
      </div>

      {/* Nickname Field (Optional) */}
      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium">
          Nickname <span className="text-muted-foreground text-xs">(optional)</span>
        </label>
        <Input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="FootyFan123"
          maxLength={ValidationConstants.NICKNAME.MAX_LENGTH}
          disabled={isLoading}
          aria-invalid={!!fieldErrors.nickname}
          aria-describedby={fieldErrors.nickname ? 'nickname-error' : 'nickname-help'}
        />
        {fieldErrors.nickname ? (
          <p id="nickname-error" className="text-sm text-destructive">
            {fieldErrors.nickname}
          </p>
        ) : (
          <p id="nickname-help" className="text-xs text-muted-foreground">
            3-20 characters, letters, numbers, spaces, hyphens, underscores
          </p>
        )}
      </div>

      {/* Password Field */}
      <div className="space-y-2">
        <label htmlFor="password" className="text-sm font-medium">
          Password <span className="text-destructive">*</span>
        </label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.password}
          aria-describedby={fieldErrors.password ? 'password-error' : 'password-help'}
        />
        {fieldErrors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {fieldErrors.password}
          </p>
        ) : (
          <p id="password-help" className="text-xs text-muted-foreground">
            Minimum 8 characters
          </p>
        )}
      </div>

      {/* Confirm Password Field */}
      <div className="space-y-2">
        <label htmlFor="confirmPassword" className="text-sm font-medium">
          Confirm Password <span className="text-destructive">*</span>
        </label>
        <Input
          id="confirmPassword"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          required
          autoComplete="new-password"
          disabled={isLoading}
          aria-invalid={!!fieldErrors.confirmPassword}
          aria-describedby={fieldErrors.confirmPassword ? 'confirm-password-error' : undefined}
        />
        {fieldErrors.confirmPassword && (
          <p id="confirm-password-error" className="text-sm text-destructive">
            {fieldErrors.confirmPassword}
          </p>
        )}
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Creating account...' : 'Create Account'}
      </Button>

      <p className="text-xs text-muted-foreground text-center mt-4">
        By signing up, you agree to our Terms of Service and Privacy Policy
      </p>
    </form>
  );
}
```

**Validation Rules:**
- Email: Required, valid format
- Password: Required, minimum 8 characters
- Confirm Password: Must match password
- Nickname: Optional, 3-20 characters, alphanumeric/spaces/hyphens/underscores

**Key Features:**
- Real-time client-side validation
- Field-specific error messages
- Accessible ARIA attributes
- Password confirmation
- Loading state with disabled inputs

---

#### **1.3.5 Profile Page**

**File:** `src/pages/profile.astro`

**User Stories:** US-029 (Update nickname), US-030 (View profile)

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import ProfileForm from '@/components/profile/ProfileForm';
import { AuthService } from '@/lib/services/auth.service';

const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/profile');
}

// Fetch user profile
const authService = new AuthService(supabase);
const profile = await authService.getUserProfile(user.id);

if (!profile) {
  return Astro.redirect('/login');
}
---

<Layout title="Profile - FootyGuess Daily" requireAuth={true}>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-8">Profile Settings</h1>

    <div class="space-y-8">
      <!-- Account Information -->
      <section class="rounded-lg border bg-card p-6">
        <h2 class="text-xl font-semibold mb-4">Account Information</h2>

        <div class="space-y-3 text-sm">
          <div class="flex justify-between">
            <span class="text-muted-foreground">Email:</span>
            <span class="font-medium">{profile.email}</span>
          </div>

          <div class="flex justify-between">
            <span class="text-muted-foreground">Account Created:</span>
            <span class="font-medium">
              {new Date(profile.createdAt).toLocaleDateString()}
            </span>
          </div>

          <div class="flex justify-between">
            <span class="text-muted-foreground">Role:</span>
            <span class="font-medium capitalize">{profile.role}</span>
          </div>

          {profile.canAddPhotos && (
            <div class="flex justify-between">
              <span class="text-muted-foreground">Photo Submission:</span>
              <span class="font-medium text-green-600">Enabled</span>
            </div>
          )}
        </div>
      </section>

      <!-- Edit Nickname -->
      <section class="rounded-lg border bg-card p-6">
        <h2 class="text-xl font-semibold mb-4">Display Name</h2>
        <ProfileForm
          client:load
          currentNickname={profile.nickname}
          userId={profile.id}
        />
      </section>

      <!-- Photo Submission Stats (if user has permission) - PRD US-030 -->
      {profile.canAddPhotos && (
        <section class="rounded-lg border bg-card p-6">
          <h2 class="text-xl font-semibold mb-4">Photo Submission Stats</h2>
          <SubmissionStats client:load userId={profile.id} />
        </section>
      )}
    </div>
  </div>
</Layout>
```

**⚠️ PRD Compliance:** US-030 requires submission stats on profile page for users with `can_add_photos` permission

---

#### **1.3.6 Profile Form Component**

**File:** `src/components/profile/ProfileForm.tsx`

**Structure:**
```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationConstants } from '@/types';
import { containsProfanity } from '@/lib/utils/profanity';

interface ProfileFormProps {
  currentNickname: string | null;
  userId: string;
}

export default function ProfileForm({ currentNickname, userId }: ProfileFormProps) {
  const [nickname, setNickname] = useState(currentNickname || '');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const validateNickname = (): string | null => {
    if (!nickname || nickname.trim() === '') {
      return 'Nickname cannot be empty';
    }
    if (nickname.length < ValidationConstants.NICKNAME.MIN_LENGTH) {
      return `Nickname must be at least ${ValidationConstants.NICKNAME.MIN_LENGTH} characters`;
    }
    if (nickname.length > ValidationConstants.NICKNAME.MAX_LENGTH) {
      return `Nickname must be no more than ${ValidationConstants.NICKNAME.MAX_LENGTH} characters`;
    }
    if (!ValidationConstants.NICKNAME.REGEX.test(nickname)) {
      return 'Nickname can only contain letters, numbers, spaces, hyphens, and underscores';
    }
    // **NEW: Profanity check**
    if (containsProfanity(nickname)) {
      return 'Nickname contains inappropriate content';
    }
    return null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    const validationError = validateNickname();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nickname }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to update nickname');
        return;
      }

      setSuccess(true);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-sm text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {success && (
        <div
          className="rounded-md border border-green-600 bg-green-50 px-4 py-3 text-sm text-green-700"
          role="alert"
        >
          Nickname updated successfully!
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="nickname" className="text-sm font-medium">
          Nickname
        </label>
        <Input
          id="nickname"
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="FootyFan123"
          maxLength={ValidationConstants.NICKNAME.MAX_LENGTH}
          disabled={isLoading}
        />
        <p className="text-xs text-muted-foreground">
          This will be displayed on the leaderboard for future submissions
        </p>
      </div>

      <Button
        type="submit"
        disabled={isLoading || nickname === currentNickname}
      >
        {isLoading ? 'Updating...' : 'Update Nickname'}
      </Button>
    </form>
  );
}
```

**Key Features:**
- Pre-filled with current nickname
- Real-time validation
- **Profanity filtering** on nickname input
- Success feedback
- Disabled when unchanged

**⚠️ Note:** Client-side profanity check for UX; server-side validation for security

---

### 1.4 Admin & Photo Submission UI

#### **1.4.1 Admin Dashboard**

**File:** `src/pages/admin/index.astro`

**User Story:** US-035, US-038, US-039

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import { AuthService } from '@/lib/services/auth.service';

const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/admin');
}

// Check admin role
const authService = new AuthService(supabase);
const isAdmin = await authService.isAdmin(user.id);

if (!isAdmin) {
  return Astro.redirect('/');
}

// Fetch admin stats
const { data: pendingCount } = await supabase
  .from('photo_submissions')
  .select('id', { count: 'exact', head: true })
  .eq('status', 'pending');

const { data: userCount } = await supabase
  .from('users')
  .select('id', { count: 'exact', head: true });
---

<Layout title="Admin Dashboard - FootyGuess Daily" requireAdmin={true}>
  <div class="container mx-auto px-4 py-8">
    <h1 class="text-3xl font-bold mb-8">Admin Dashboard</h1>

    <div class="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-8">
      <!-- Pending Submissions Card -->
      <a
        href="/admin/submissions"
        class="rounded-lg border bg-card p-6 hover:border-primary transition-colors"
      >
        <h3 class="text-sm font-medium text-muted-foreground">Pending Submissions</h3>
        <p class="text-3xl font-bold mt-2">{pendingCount?.count || 0}</p>
        <p class="text-sm text-muted-foreground mt-2">
          Photos awaiting review
        </p>
      </a>

      <!-- Total Users Card -->
      <a
        href="/admin/users"
        class="rounded-lg border bg-card p-6 hover:border-primary transition-colors"
      >
        <h3 class="text-sm font-medium text-muted-foreground">Total Users</h3>
        <p class="text-3xl font-bold mt-2">{userCount?.count || 0}</p>
        <p class="text-sm text-muted-foreground mt-2">
          Registered players
        </p>
      </a>
    </div>

    <!-- Quick Actions -->
    <section>
      <h2 class="text-xl font-semibold mb-4">Quick Actions</h2>
      <div class="space-y-3">
        <a
          href="/admin/submissions"
          class="block rounded-md border p-4 hover:bg-accent transition-colors"
        >
          <h3 class="font-medium">Moderate Photo Submissions</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Review and approve/reject user-submitted photos
          </p>
        </a>

        <a
          href="/admin/users"
          class="block rounded-md border p-4 hover:bg-accent transition-colors"
        >
          <h3 class="font-medium">Manage User Permissions</h3>
          <p class="text-sm text-muted-foreground mt-1">
            Grant or revoke photo submission permissions
          </p>
        </a>
      </div>
    </section>
  </div>
</Layout>
```

---

#### **1.4.2 Photo Moderation Page**

**File:** `src/pages/admin/submissions.astro`

**User Stories:** US-035, US-036, US-037

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import ModerationQueue from '@/components/admin/ModerationQueue';

const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/admin/submissions');
}

// Check admin role
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (userProfile?.role !== 'admin') {
  return Astro.redirect('/');
}

// Fetch pending submissions with user info
const { data: submissions, error } = await supabase
  .from('photo_submissions')
  .select(`
    *,
    users!photo_submissions_user_id_fkey (
      email,
      nickname
    )
  `)
  .eq('status', 'pending')
  .order('created_at', { ascending: false });
---

<Layout title="Moderate Submissions - FootyGuess Daily" requireAdmin={true}>
  <div class="container mx-auto px-4 py-8 max-w-6xl">
    <div class="mb-8">
      <h1 class="text-3xl font-bold">Photo Moderation</h1>
      <p class="text-muted-foreground mt-2">
        Review and approve/reject user-submitted photos
      </p>
    </div>

    {error ? (
      <div class="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-destructive">
        Failed to load submissions: {error.message}
      </div>
    ) : submissions && submissions.length > 0 ? (
      <ModerationQueue client:load submissions={submissions} />
    ) : (
      <div class="text-center py-12 text-muted-foreground">
        No pending submissions to review
      </div>
    )}
  </div>
</Layout>
```

---

#### **1.4.3 Moderation Queue Component**

**File:** `src/components/admin/ModerationQueue.tsx`

**Structure:**
```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

interface Submission {
  id: string;
  event_name: string;
  photo_url: string;
  year_utc: number;
  place: string | null;
  lat: number;
  lon: number;
  competition: string | null;
  license: string;
  credit: string;
  created_at: string;
  users: {
    email: string;
    nickname: string | null;
  };
}

interface ModerationQueueProps {
  submissions: Submission[];
}

export default function ModerationQueue({ submissions: initialSubmissions }: ModerationQueueProps) {
  const [submissions, setSubmissions] = useState(initialSubmissions);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    if (!confirm('Are you sure you want to approve this submission?')) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${id}/approve`, {
        method: 'POST',
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to approve submission');
        return;
      }

      // Remove from list
      setSubmissions(prev => prev.filter(s => s.id !== id));
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) {
      setError('Please provide a rejection reason');
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      const response = await fetch(`/api/admin/submissions/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || 'Failed to reject submission');
        return;
      }

      // Remove from list and reset form
      setSubmissions(prev => prev.filter(s => s.id !== id));
      setSelectedId(null);
      setRejectReason('');
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-destructive"
          role="alert"
        >
          {error}
        </div>
      )}

      {submissions.map((submission) => (
        <div key={submission.id} className="rounded-lg border bg-card overflow-hidden">
          <div className="grid md:grid-cols-[300px_1fr] gap-6 p-6">
            {/* Photo Preview */}
            <div>
              <img
                src={submission.photo_url}
                alt={submission.event_name}
                className="w-full h-48 object-cover rounded-md"
              />
            </div>

            {/* Submission Details */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold">{submission.event_name}</h3>
                <p className="text-sm text-muted-foreground">
                  Submitted by: {submission.users.nickname || submission.users.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {new Date(submission.created_at).toLocaleString()}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Year:</span>
                  <span className="ml-2 font-medium">{submission.year_utc}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Place:</span>
                  <span className="ml-2 font-medium">{submission.place || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Competition:</span>
                  <span className="ml-2 font-medium">{submission.competition || 'N/A'}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Coordinates:</span>
                  <span className="ml-2 font-medium">
                    {submission.lat.toFixed(4)}, {submission.lon.toFixed(4)}
                  </span>
                </div>
              </div>

              <div className="text-sm">
                <p><span className="text-muted-foreground">License:</span> {submission.license}</p>
                <p><span className="text-muted-foreground">Credit:</span> {submission.credit}</p>
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <Button
                  onClick={() => handleApprove(submission.id)}
                  disabled={isProcessing}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Approve
                </Button>

                <Button
                  onClick={() => setSelectedId(selectedId === submission.id ? null : submission.id)}
                  variant="destructive"
                  disabled={isProcessing}
                >
                  {selectedId === submission.id ? 'Cancel' : 'Reject'}
                </Button>
              </div>

              {/* Reject Reason Input */}
              {selectedId === submission.id && (
                <div className="space-y-2 pt-4 border-t">
                  <label htmlFor={`reason-${submission.id}`} className="text-sm font-medium">
                    Rejection Reason
                  </label>
                  <textarea
                    id={`reason-${submission.id}`}
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    className="w-full rounded-md border p-2 text-sm"
                    rows={3}
                    placeholder="Explain why this submission is being rejected..."
                    disabled={isProcessing}
                  />
                  <Button
                    onClick={() => handleReject(submission.id)}
                    variant="destructive"
                    disabled={isProcessing || !rejectReason.trim()}
                  >
                    {isProcessing ? 'Rejecting...' : 'Confirm Rejection'}
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
```

**Key Features:**
- Photo preview
- Submission metadata display
- One-click approve
- Two-step reject with reason
- Real-time UI updates
- Optimistic removal from list

---

#### **1.4.4 Photo Submission Page**

**File:** `src/pages/photos/submit.astro`

**User Story:** US-033 (Submit photo)

**Structure:**
```astro
---
import Layout from '@/layouts/Layout.astro';
import PhotoSubmitForm from '@/components/photos/PhotoSubmitForm';
import { AuthService } from '@/lib/services/auth.service';

const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/photos/submit');
}

// Check permission
const authService = new AuthService(supabase);
const canSubmit = await authService.canAddPhotos(user.id);

if (!canSubmit) {
  return Astro.redirect('/');
}
---

<Layout title="Submit Photo - FootyGuess Daily" requireAuth={true}>
  <div class="container mx-auto px-4 py-8 max-w-2xl">
    <h1 class="text-3xl font-bold mb-2">Submit a Photo</h1>
    <p class="text-muted-foreground mb-8">
      Contribute to the game by submitting football photos with location and year metadata
    </p>

    <PhotoSubmitForm client:load />
  </div>
</Layout>
```

---

#### **1.4.5 Photo Submit Form Component**

**File:** `src/components/photos/PhotoSubmitForm.tsx`

**Structure:**
```tsx
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ValidationConstants } from '@/types';

export default function PhotoSubmitForm() {
  const [formData, setFormData] = useState({
    event_name: '',
    photo_url: '',
    year_utc: '',
    lat: '',
    lon: '',
    place: '',
    competition: '',
    license: '',
    credit: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    // Basic validation
    const year = parseInt(formData.year_utc);
    const lat = parseFloat(formData.lat);
    const lon = parseFloat(formData.lon);

    if (year < ValidationConstants.YEAR.MIN || year > ValidationConstants.YEAR.MAX) {
      setError(`Year must be between ${ValidationConstants.YEAR.MIN} and ${ValidationConstants.YEAR.MAX}`);
      return;
    }

    if (lat < -90 || lat > 90) {
      setError('Latitude must be between -90 and 90');
      return;
    }

    if (lon < -180 || lon > 180) {
      setError('Longitude must be between -180 and 180');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/photos/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          year_utc: year,
          lat,
          lon,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to submit photo');
        return;
      }

      setSuccess(true);
      // Reset form
      setFormData({
        event_name: '',
        photo_url: '',
        year_utc: '',
        lat: '',
        lon: '',
        place: '',
        competition: '',
        license: '',
        credit: '',
      });

      // Auto-redirect to submissions after 2 seconds
      setTimeout(() => {
        window.location.href = '/photos/my-submissions';
      }, 2000);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="rounded-md border border-destructive bg-destructive/10 px-4 py-3 text-destructive">
          {error}
        </div>
      )}

      {success && (
        <div className="rounded-md border border-green-600 bg-green-50 px-4 py-3 text-green-700">
          Photo submitted successfully! Redirecting to your submissions...
        </div>
      )}

      <div className="space-y-2">
        <label htmlFor="event_name" className="text-sm font-medium">
          Event Name <span className="text-destructive">*</span>
        </label>
        <Input
          id="event_name"
          name="event_name"
          value={formData.event_name}
          onChange={handleChange}
          placeholder="2014 FIFA World Cup Final"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="photo_url" className="text-sm font-medium">
          Photo URL <span className="text-destructive">*</span>
        </label>
        <Input
          id="photo_url"
          name="photo_url"
          type="url"
          value={formData.photo_url}
          onChange={handleChange}
          placeholder="https://example.com/photo.jpg"
          required
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="year_utc" className="text-sm font-medium">
            Year <span className="text-destructive">*</span>
          </label>
          <Input
            id="year_utc"
            name="year_utc"
            type="number"
            min={ValidationConstants.YEAR.MIN}
            max={ValidationConstants.YEAR.MAX}
            value={formData.year_utc}
            onChange={handleChange}
            placeholder="2014"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="place" className="text-sm font-medium">
            Place
          </label>
          <Input
            id="place"
            name="place"
            value={formData.place}
            onChange={handleChange}
            placeholder="Rio de Janeiro, Brazil"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <label htmlFor="lat" className="text-sm font-medium">
            Latitude <span className="text-destructive">*</span>
          </label>
          <Input
            id="lat"
            name="lat"
            type="number"
            step="any"
            value={formData.lat}
            onChange={handleChange}
            placeholder="-22.9068"
            required
            disabled={isLoading}
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="lon" className="text-sm font-medium">
            Longitude <span className="text-destructive">*</span>
          </label>
          <Input
            id="lon"
            name="lon"
            type="number"
            step="any"
            value={formData.lon}
            onChange={handleChange}
            placeholder="-43.1729"
            required
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label htmlFor="competition" className="text-sm font-medium">
          Competition
        </label>
        <Input
          id="competition"
          name="competition"
          value={formData.competition}
          onChange={handleChange}
          placeholder="FIFA World Cup"
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="license" className="text-sm font-medium">
          License <span className="text-destructive">*</span>
        </label>
        <Input
          id="license"
          name="license"
          value={formData.license}
          onChange={handleChange}
          placeholder="CC BY-SA 4.0"
          required
          disabled={isLoading}
        />
      </div>

      <div className="space-y-2">
        <label htmlFor="credit" className="text-sm font-medium">
          Credit/Attribution <span className="text-destructive">*</span>
        </label>
        <Input
          id="credit"
          name="credit"
          value={formData.credit}
          onChange={handleChange}
          placeholder="Photo by John Doe"
          required
          disabled={isLoading}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading}
      >
        {isLoading ? 'Submitting...' : 'Submit Photo'}
      </Button>
    </form>
  );
}
```

---

### 1.5 Game Integration - Authenticated vs Anonymous

#### **1.5.1 Enhanced Daily Game Page**

**File:** `src/pages/play/[mode].astro`

**User Story:** US-031 (Anonymous rank display), US-032 (Authenticated submission)

**Changes Required:**
```astro
---
// ... existing imports
import PotentialRankNotice from '@/components/game/PotentialRankNotice';

const { user } = Astro.locals;
const mode = Astro.params.mode as 'normal' | 'daily';

// Pass auth state to game
const isAuthenticated = !!user;
---

<Layout title={`${mode === 'daily' ? 'Daily' : 'Normal'} Mode - FootyGuess Daily`}>
  <GameView
    client:only="react"
    mode={mode}
    isAuthenticated={isAuthenticated}
  />

  {mode === 'daily' && !isAuthenticated && (
    <PotentialRankNotice client:load />
  )}
</Layout>
```

---

#### **1.5.2 Potential Rank Notice**

**File:** `src/components/game/PotentialRankNotice.tsx`

**Purpose:** Encourage anonymous users to sign up

**Structure:**
```tsx
import React from 'react';
import { Button } from '@/components/ui/button';

interface PotentialRankNoticeProps {
  rank?: number;
  showAfterCompletion?: boolean;
}

export default function PotentialRankNotice({ rank, showAfterCompletion }: PotentialRankNoticeProps) {
  if (showAfterCompletion && !rank) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 max-w-sm rounded-lg border bg-card p-4 shadow-lg">
      <h3 className="font-semibold mb-2">
        {rank ? `You would be #${rank}!` : 'Save Your Score'}
      </h3>
      <p className="text-sm text-muted-foreground mb-4">
        {rank
          ? `Create an account to save your score to the leaderboard.`
          : `Create an account to automatically save your Daily challenge scores.`
        }
      </p>
      <div className="flex gap-2">
        <Button asChild size="sm">
          <a href="/signup">Sign Up</a>
        </Button>
        <Button asChild variant="outline" size="sm">
          <a href="/login">Log In</a>
        </Button>
      </div>
    </div>
  );
}
```

---

### 1.6 Validation & Error Handling Summary

#### **Client-Side Validation**

All forms implement real-time validation:

| Field | Rules | Error Message |
|-------|-------|---------------|
| Email | Valid format, required | "Invalid email address" |
| Password | Min 8 chars, required | "Password must be at least 8 characters" |
| Confirm Password | Must match password | "Passwords do not match" |
| Nickname | 3-20 chars, alphanumeric/spaces/hyphens/underscores, unique | "Nickname must be 3-20 characters" / "Nickname already taken" |
| Year | 1880-2025 | "Year must be between 1880 and 2025" |
| Latitude | -90 to 90 | "Latitude must be between -90 and 90" |
| Longitude | -180 to 180 | "Longitude must be between -180 and 180" |

#### **Error Display Patterns**

1. **Field-level errors:** Red border + error text below field
2. **Form-level errors:** Alert banner at top of form
3. **Success messages:** Green alert banner with auto-dismiss
4. **Loading states:** Disabled inputs + button text change

#### **Accessibility**

- All error messages have `role="alert"`
- Fields with errors have `aria-invalid="true"`
- Error messages linked via `aria-describedby`
- Focus management on validation failure

---

## 2. BACKEND LOGIC

### 2.1 API Endpoints Overview

**Status:** ✅ All endpoints fully implemented

The backend API is complete and production-ready. All endpoints follow consistent patterns:

- Input validation with Zod schemas
- Authentication via middleware (`context.locals.user`)
- Business logic in service layer (`src/lib/services/`)
- Proper HTTP status codes
- Error handling with standardized responses

#### **2.1.1 Authentication Endpoints**

| Endpoint | Method | Auth | Purpose | Implementation |
|----------|--------|------|---------|----------------|
| `/api/auth/signup` | POST | ❌ | Create new user account | `src/pages/api/auth/signup.ts` |
| `/api/auth/signin` | POST | ❌ | Authenticate user | `src/pages/api/auth/signin.ts` |
| `/api/auth/signout` | POST | ✅ | End session | `src/pages/api/auth/signout.ts` |
| `/api/auth/me` | GET | ✅ | Get current user profile | `src/pages/api/auth/me.ts` |
| `/api/auth/me` | PATCH | ✅ | Update user nickname | `src/pages/api/auth/me.ts` |

**Request/Response Examples:**

**POST /api/auth/signup**
```typescript
// Request
{
  "email": "user@example.com",
  "password": "securepass123",
  "nickname": "FootyFan"  // optional
}

// Response (201 Created)
{
  "success": true,
  "userId": "uuid-here"
}

// Error Response (400 Bad Request)
{
  "success": false,
  "error": "Email already registered"
}
```

**POST /api/auth/signin**
```typescript
// Request
{
  "email": "user@example.com",
  "password": "securepass123"
}

// Response (200 OK)
{
  "success": true,
  "userId": "uuid-here"
}
```

**GET /api/auth/me**
```typescript
// Response (200 OK)
{
  "id": "uuid",
  "email": "user@example.com",
  "nickname": "FootyFan",
  "role": "user",
  "canAddPhotos": false,
  "createdAt": "2025-01-15T12:00:00Z"
}
```

**PATCH /api/auth/me**
```typescript
// Request
{
  "nickname": "NewNickname"
}

// Response (200 OK)
{
  "success": true
}
```

---

#### **2.1.2 Photo Submission Endpoints**

| Endpoint | Method | Auth | Permission | Purpose |
|----------|--------|------|------------|---------|
| `/api/photos/submit` | POST | ✅ | `can_add_photos` | Submit photo for moderation |
| `/api/photos/submissions/my` | GET | ✅ | None | Get user's submissions & stats |

**Implementation:** `src/pages/api/photos/`

---

#### **2.1.3 Admin Endpoints**

| Endpoint | Method | Auth | Role | Purpose |
|----------|--------|------|------|---------|
| `/api/admin/submissions/pending` | GET | ✅ | Admin | Get all pending submissions |
| `/api/admin/submissions/[id]/approve` | POST | ✅ | Admin | Approve photo submission |
| `/api/admin/submissions/[id]/reject` | POST | ✅ | Admin | Reject photo with reason |
| `/api/admin/users` | GET | ✅ | Admin | List all users |
| `/api/admin/users/[id]/permissions` | PATCH | ✅ | Admin | Update user permissions |

**Implementation:** `src/pages/api/admin/`

**Example - Approve Submission:**
```typescript
// POST /api/admin/submissions/[id]/approve
// No request body required

// Response (200 OK)
{
  "success": true,
  "photoId": "uuid-of-approved-photo"
}
```

**Example - Reject Submission:**
```typescript
// POST /api/admin/submissions/[id]/reject
// Request
{
  "reason": "Image quality too low"
}

// Response (200 OK)
{
  "success": true
}
```

---

### 2.2 Service Layer Architecture

**Location:** `src/lib/services/`

All business logic is abstracted into service classes:

#### **2.2.1 AuthService**

**File:** `src/lib/services/auth.service.ts`
**Status:** ✅ Complete

**Methods:**
- `signUp(data: SignUpData): Promise<AuthResult>`
- `signIn(data: SignInData): Promise<AuthResult>`
- `signOut(): Promise<AuthResult>`
- `getUserProfile(userId: string): Promise<UserProfile | null>`
- `updateNickname(userId: string, nickname: string): Promise<AuthResult>`
- `canAddPhotos(userId: string): Promise<boolean>`
- `isAdmin(userId: string): Promise<boolean>`

**Key Features:**
- Password validation (min 8 characters)
- Nickname uniqueness checking
- Permission and role verification

---

#### **2.2.2 PhotoSubmissionsService**

**File:** `src/lib/services/photo-submissions.service.ts`
**Status:** ✅ Complete

**Methods:**
- `submitPhoto(userId: string, data: PhotoSubmissionData): Promise<PhotoSubmissionResult>`
- `getPendingSubmissions(): Promise<PhotoSubmission[]>`
- `getUserSubmissions(userId: string): Promise<PhotoSubmission[]>`
- `approveSubmission(submissionId: string, adminId: string): Promise<ModerationResult>`
- `rejectSubmission(submissionId: string, adminId: string, reason: string): Promise<ModerationResult>`
- `getUserStats(userId: string): Promise<SubmissionStats>`

**Validation:**
- Checks `can_add_photos` permission
- Validates year range (1880-2025)
- Validates coordinates (lat: -90 to 90, lon: -180 to 180)

---

### 2.3 Middleware & Session Management

**File:** `src/middleware/index.ts`
**Status:** ✅ Complete

**Functionality:**
```typescript
export const onRequest = defineMiddleware(async (context, next) => {
  // 1. Create server-side Supabase client with cookie support
  const supabase = createSupabaseServerClient(context.cookies);

  // 2. Retrieve session from cookies (if exists)
  const { data: { session } } = await supabase.auth.getSession();

  // 3. Attach to context for use in pages/API routes
  context.locals.supabase = supabase;
  context.locals.session = session;
  context.locals.user = session?.user ?? null;

  return next();
});
```

**Key Features:**
- Runs on every request (global middleware)
- Automatically extracts session from HTTP-only cookies
- Provides `supabase`, `session`, and `user` to all routes via `Astro.locals`
- No manual session handling required in routes

---

### 2.4 Server-Side Rendering (SSR) Configuration

**File:** `astro.config.mjs`
**Status:** ✅ Complete

```javascript
export default defineConfig({
  output: "server",           // Enable SSR for all pages
  adapter: node({
    mode: "standalone",       // Self-contained deployment
  }),
  integrations: [react(), sitemap()],
  server: { port: 3000 },
  vite: {
    plugins: [tailwindcss()],
  },
});
```

**Implications:**
- All pages render server-side by default
- Session available in `Astro.locals` on every page load
- Protected routes can redirect on server before rendering
- No hydration mismatch for auth state

**Per-Page SSR Control:**
- API routes: `export const prerender = false` (required)
- Static pages: Can use `export const prerender = true` for static generation

---

### 2.5 Database Schema & RLS Policies

**Status:** ✅ Complete

#### **2.5.1 Users Table**

**Schema:**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  nickname TEXT UNIQUE,
  role TEXT CHECK (role IN ('user', 'admin')) DEFAULT 'user',
  can_add_photos BOOLEAN DEFAULT false,
  consent_given_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
1. **Users can view their own profile**
   ```sql
   CREATE POLICY "Users can view own profile"
   ON users FOR SELECT
   USING (auth.uid() = id);
   ```

2. **Users can update their own nickname**
   ```sql
   CREATE POLICY "Users can update own nickname"
   ON users FOR UPDATE
   USING (auth.uid() = id);
   ```

3. **Admins can view all users**
   ```sql
   CREATE POLICY "Admins can view all users"
   ON users FOR SELECT
   USING (
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     )
   );
   ```

4. **Admins can update user permissions**
   ```sql
   CREATE POLICY "Admins can update permissions"
   ON users FOR UPDATE
   USING (
     EXISTS (
       SELECT 1 FROM users
       WHERE id = auth.uid() AND role = 'admin'
     )
   );
   ```

---

#### **2.5.2 Photo Submissions Table**

**Schema:**
```sql
CREATE TABLE photo_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  competition TEXT,
  year_utc INTEGER NOT NULL CHECK (year_utc >= 1880 AND year_utc <= 2025),
  place TEXT,
  lat DECIMAL(9, 6) NOT NULL CHECK (lat >= -90 AND lat <= 90),
  lon DECIMAL(9, 6) NOT NULL CHECK (lon >= -180 AND lon <= 180),
  photo_url TEXT NOT NULL,
  license TEXT NOT NULL,
  credit TEXT NOT NULL,
  status TEXT CHECK (status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  reviewed_by UUID REFERENCES users(id),
  reviewed_at TIMESTAMPTZ,
  rejection_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**RLS Policies:**
1. **Users can view their own submissions**
2. **Users with permission can insert submissions**
3. **Admins can view all submissions**
4. **Admins can approve/reject submissions**

---

#### **2.5.3 Daily Submissions Table**

**Schema:**
```sql
CREATE TABLE daily_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  anon_device_token TEXT,
  date_utc DATE NOT NULL,
  daily_set_id UUID NOT NULL REFERENCES daily_sets(id),
  nickname TEXT NOT NULL,
  total_score INTEGER NOT NULL,
  total_time_ms INTEGER NOT NULL,
  submission_timestamp TIMESTAMPTZ DEFAULT now(),

  -- Ensure one submission per user per day
  CONSTRAINT unique_user_daily UNIQUE (user_id, date_utc),
  CONSTRAINT unique_device_daily UNIQUE (anon_device_token, date_utc)
);
```

**RLS Policies:**
1. **Anyone can view leaderboard** (public SELECT)
2. **Only authenticated users can submit**

---

#### **2.5.4 Trigger Functions**

**Auto-create user profile on signup:**
```sql
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, role, can_add_photos)
  VALUES (
    NEW.id,
    NEW.email,
    'user',
    false
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

**Auto-update timestamps:**
```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

## 3. AUTHENTICATION SYSTEM

### 3.1 Supabase Auth Integration

**Provider:** Supabase Auth (email + password)
**Implementation:** `src/db/supabase.client.ts`

#### **3.1.1 Client Types**

**Browser Client (Anonymous):**
```typescript
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

export const supabaseClient = createClient<Database>(
  import.meta.env.SUPABASE_URL,
  import.meta.env.SUPABASE_KEY
);
```

**Server Client (SSR with cookies):**
```typescript
import { createServerClient } from '@supabase/ssr';
import type { AstroCookies } from 'astro';

export function createSupabaseServerClient(cookies: AstroCookies) {
  return createServerClient<Database>(
    import.meta.env.SUPABASE_URL,
    import.meta.env.SUPABASE_KEY,
    {
      cookies: {
        get(key: string) {
          return cookies.get(key)?.value;
        },
        set(key: string, value: string, options) {
          cookies.set(key, value, options);
        },
        remove(key: string, options) {
          cookies.delete(key, options);
        },
      },
    }
  );
}
```

**Type-safe Client Export:**
```typescript
import type { SupabaseClient as BaseSupabaseClient } from '@supabase/supabase-js';

export type SupabaseClient = BaseSupabaseClient<Database>;
```

---

#### **3.1.2 Session Management**

**Cookie Configuration:**
- HTTP-only cookies (not accessible via JavaScript)
- Secure flag in production
- SameSite: Lax (CSRF protection)
- Automatic expiration handling

**Session Flow:**
1. User signs in via `/api/auth/signin`
2. Supabase Auth creates session and sets cookies
3. Middleware extracts session from cookies on every request
4. Session available in `Astro.locals.session`
5. User signs out via `/api/auth/signout` → cookies cleared

---

### 3.2 Role-Based Access Control (RBAC)

#### **3.2.1 Role Hierarchy**

| Role | Permissions | Pages Accessible |
|------|-------------|------------------|
| **Anonymous** | Play games (results not saved in Daily) | `/`, `/play/*`, `/login`, `/signup` |
| **User** | Save Daily scores, view profile | + `/profile` |
| **User (can_add_photos)** | Submit photos | + `/photos/submit`, `/photos/my-submissions` |
| **Admin** | All user permissions + moderation | + `/admin/*` |

---

#### **3.2.2 Permission Checking**

**Server-Side (Astro pages):**
```astro
---
const { user, supabase } = Astro.locals;

// Check authentication
if (!user) {
  return Astro.redirect('/login');
}

// Check admin role
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (userProfile?.role !== 'admin') {
  return Astro.redirect('/');
}
---
```

**Server-Side (API routes):**
```typescript
export const POST: APIRoute = async ({ locals }) => {
  if (!locals.user) {
    return new Response(
      JSON.stringify({ error: 'Unauthorized' }),
      { status: 401 }
    );
  }

  // Check permission
  const authService = new AuthService(locals.supabase);
  const canSubmit = await authService.canAddPhotos(locals.user.id);

  if (!canSubmit) {
    return new Response(
      JSON.stringify({ error: 'Forbidden' }),
      { status: 403 }
    );
  }

  // Proceed with logic...
};
```

**Database-Level (RLS):**
- RLS policies enforce permissions at database level
- Even if client bypasses UI checks, database rejects unauthorized queries
- Defense in depth strategy

---

#### **3.2.3 Route Protection Patterns**

**Pattern 1: Enhanced Layout (Recommended)**
```astro
---
// src/layouts/Layout.astro
const { requireAuth = false, requireAdmin = false } = Astro.props;
const { user } = Astro.locals;

if (requireAuth && !user) {
  return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}

if (requireAdmin) {
  const { data: userProfile } = await Astro.locals.supabase
    .from('users')
    .select('role')
    .eq('id', user!.id)
    .single();

  if (userProfile?.role !== 'admin') {
    return Astro.redirect('/');
  }
}
---
```

**Usage:**
```astro
<Layout requireAuth={true}>
  <!-- Page content -->
</Layout>

<Layout requireAdmin={true}>
  <!-- Admin-only content -->
</Layout>
```

**Pattern 2: Per-Page Check (Alternative)**
```astro
---
// src/pages/profile.astro
if (!Astro.locals.user) {
  return Astro.redirect('/login?redirect=/profile');
}
---
```

---

### 3.3 Security Considerations

#### **3.3.1 Implemented Security Measures**

✅ **Password Security**
- Minimum 8 characters enforced
- Hashed by Supabase Auth (bcrypt)
- No plaintext storage

✅ **Session Security**
- HTTP-only cookies (XSS protection)
- Secure flag in production (HTTPS only)
- SameSite: Lax (CSRF protection)
- Automatic expiration

✅ **Database Security**
- Row-Level Security (RLS) enabled on all tables
- Policies enforce authorization at data layer
- Foreign key constraints

✅ **Input Validation**
- Client-side validation (UX)
- Server-side validation (security)
- Zod schemas for API requests
- SQL injection prevention (parameterized queries)

✅ **Role-Based Access Control**
- Checked server-side before rendering
- Enforced in API routes
- Backed by RLS policies

---

#### **3.3.2 Outstanding Security Tasks**

⚠️ **Email Verification** (Future Enhancement)
- Currently not implemented
- Users can sign up without verifying email
- **Recommendation:** Enable Supabase email confirmation

⚠️ **Rate Limiting** (Planned)
- No rate limiting on auth endpoints
- Vulnerable to brute force attacks
- **Recommendation:** Implement rate limiting middleware

⚠️ **Password Reset** (Future Enhancement)
- No "forgot password" flow
- **Recommendation:** Implement via Supabase Auth recovery emails

⚠️ **Two-Factor Authentication** (Future Enhancement)
- Not implemented
- **Recommendation:** Add 2FA for admin accounts

---

### 3.4 User Metadata & Profile Sync

**Supabase Auth User Metadata:**
```typescript
// Stored in auth.users table (managed by Supabase)
{
  id: "uuid",
  email: "user@example.com",
  user_metadata: {
    // Can store additional data here
  }
}
```

**Custom User Profile:**
```typescript
// Stored in public.users table (managed by us)
{
  id: "uuid",  // Same as auth.users.id
  email: "user@example.com",
  nickname: "FootyFan",
  role: "user",
  can_add_photos: false,
  created_at: "2025-01-15T12:00:00Z"
}
```

**Synchronization:**
- Trigger function `handle_new_user()` auto-creates profile on signup
- Profile `id` references `auth.users(id)` via foreign key
- Deleting auth user cascades to profile (ON DELETE CASCADE)

---

## 4. INTEGRATION & DATA FLOW

### 4.1 Authentication Flow Diagrams

#### **4.1.1 Sign Up Flow**

```
┌─────────┐         ┌─────────────┐         ┌─────────────┐         ┌──────────┐
│ Browser │         │ SignupForm  │         │ API Route   │         │ Supabase │
└────┬────┘         └──────┬──────┘         └──────┬──────┘         └────┬─────┘
     │                     │                       │                     │
     │ 1. User fills form  │                       │                     │
     ├────────────────────>│                       │                     │
     │                     │                       │                     │
     │                     │ 2. POST /api/auth/signup                    │
     │                     │      { email, password, nickname }          │
     │                     ├──────────────────────>│                     │
     │                     │                       │                     │
     │                     │                       │ 3. Validate input   │
     │                     │                       │    (Zod schema)     │
     │                     │                       │                     │
     │                     │                       │ 4. signUp()         │
     │                     │                       ├────────────────────>│
     │                     │                       │                     │
     │                     │                       │ 5. Create auth user │
     │                     │                       │    + trigger        │
     │                     │                       │    creates profile  │
     │                     │                       │                     │
     │                     │                       │ 6. Update nickname  │
     │                     │                       │    (if provided)    │
     │                     │                       │                     │
     │                     │                       │<────────────────────│
     │                     │                       │ 7. Return success   │
     │                     │<──────────────────────│                     │
     │                     │                       │                     │
     │ 8. Redirect to home │                       │                     │
     │<────────────────────│                       │                     │
     │                     │                       │                     │
```

---

#### **4.1.2 Sign In Flow**

```
┌─────────┐         ┌─────────────┐         ┌─────────────┐         ┌──────────┐
│ Browser │         │ LoginForm   │         │ API Route   │         │ Supabase │
└────┬────┘         └──────┬──────┘         └──────┬──────┘         └────┬─────┘
     │                     │                       │                     │
     │ 1. User enters      │                       │                     │
     │    email/password   │                       │                     │
     ├────────────────────>│                       │                     │
     │                     │                       │                     │
     │                     │ 2. POST /api/auth/signin                    │
     │                     │      { email, password }                    │
     │                     ├──────────────────────>│                     │
     │                     │                       │                     │
     │                     │                       │ 3. signInWithPassword()
     │                     │                       ├────────────────────>│
     │                     │                       │                     │
     │                     │                       │ 4. Verify password  │
     │                     │                       │    Set session      │
     │                     │                       │    Return cookies   │
     │                     │                       │<────────────────────│
     │                     │                       │                     │
     │                     │ 5. Success response   │                     │
     │                     │    (cookies set)      │                     │
     │                     │<──────────────────────│                     │
     │                     │                       │                     │
     │ 6. Redirect to      │                       │                     │
     │    redirect URL     │                       │                     │
     │<────────────────────│                       │                     │
     │                     │                       │                     │
```

---

#### **4.1.3 Protected Page Request Flow**

```
┌─────────┐    ┌────────────┐    ┌─────────┐    ┌──────────┐
│ Browser │    │ Middleware │    │ Page    │    │ Supabase │
└────┬────┘    └─────┬──────┘    └────┬────┘    └────┬─────┘
     │               │                │              │
     │ 1. GET /profile                │              │
     ├──────────────>│                │              │
     │               │                │              │
     │               │ 2. Extract session from cookies
     │               ├───────────────────────────────>│
     │               │                │              │
     │               │ 3. Return session (if valid)  │
     │               │<───────────────────────────────│
     │               │                │              │
     │               │ 4. Set Astro.locals.user      │
     │               │                │              │
     │               │ 5. Continue to page           │
     │               ├───────────────>│              │
     │               │                │              │
     │               │                │ 6. Check if  │
     │               │                │    user exists
     │               │                │              │
     │               │                │ 7a. If NO:   │
     │               │                │     Redirect │
     │               │                │     to /login│
     │               │                │              │
     │               │                │ 7b. If YES:  │
     │               │                │     Render   │
     │               │                │     page     │
     │               │                │              │
     │ 8. Return HTML or 302 redirect                │
     │<──────────────┴────────────────┘              │
     │                                                │
```

---

### 4.2 Daily Challenge: Authenticated vs Anonymous

**Scenario:** User completes Daily challenge

```
┌─────────────────────┐
│ Is user logged in?  │
└──────────┬──────────┘
           │
     ┌─────┴─────┐
     │           │
    YES         NO (Anonymous)
     │           │
     ▼           ▼
┌──────────┐   ┌────────────────────┐
│ Submit   │   │ Calculate rank     │
│ score to │   │ WITHOUT saving     │
│ database │   │                    │
└────┬─────┘   └────────┬───────────┘
     │                  │
     ▼                  ▼
┌─────────────┐   ┌──────────────────────┐
│ Show rank   │   │ Show "potential rank"│
│ on leaderbd │   │ + sign-up CTA        │
└─────────────┘   └──────────────────────┘
```

**Implementation:**

**Frontend (GameView component):**
```typescript
const submitDailyChallenge = async () => {
  const response = await fetch('/api/daily/submissions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      daily_set_id: dailySetId,
      date_utc: dateUtc,
      guesses: guesses,
      total_time_ms: totalTime,
    }),
  });

  const data = await response.json();

  if (data.is_saved) {
    // Authenticated user - show saved rank
    showLeaderboardRank(data.leaderboard_rank);
  } else {
    // Anonymous user - show potential rank + sign-up CTA
    showPotentialRank(data.potential_rank);
  }
};
```

**Backend (Daily submission API):**
```typescript
export const POST: APIRoute = async ({ request, locals }) => {
  const { user } = locals;
  const body = await request.json();

  // Calculate scores (same for both)
  const scores = calculateScores(body.guesses);

  if (user) {
    // AUTHENTICATED: Save to database
    const { data: submission } = await locals.supabase
      .from('daily_submissions')
      .insert({
        user_id: user.id,
        date_utc: body.date_utc,
        total_score: scores.total,
        total_time_ms: body.total_time_ms,
        // ... other fields
      })
      .select()
      .single();

    const rank = await calculateRank(submission.id);

    return new Response(JSON.stringify({
      is_saved: true,
      leaderboard_rank: rank,
      potential_rank: null,
      // ... scores
    }));
  } else {
    // ANONYMOUS: Calculate rank WITHOUT saving
    const potentialRank = await calculatePotentialRank(scores.total, body.total_time_ms);

    return new Response(JSON.stringify({
      is_saved: false,
      leaderboard_rank: null,
      potential_rank: potentialRank,
      // ... scores
    }));
  }
};
```

---

### 4.3 Admin Moderation Workflow

```
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ User submits │          │ Photo stored │          │ Admin reviews│
│ photo        │─────────>│ as "pending" │─────────>│ in queue     │
└──────────────┘          └──────────────┘          └──────┬───────┘
                                                            │
                                                  ┌─────────┴─────────┐
                                                  │                   │
                                              APPROVE              REJECT
                                                  │                   │
                                                  ▼                   ▼
                                          ┌──────────────┐    ┌──────────────┐
                                          │ Move to      │    │ Mark as      │
                                          │ photos table │    │ rejected     │
                                          │ Set status   │    │ Store reason │
                                          │ = approved   │    │              │
                                          └──────┬───────┘    └──────┬───────┘
                                                  │                   │
                                                  ▼                   ▼
                                          ┌──────────────┐    ┌──────────────┐
                                          │ Photo        │    │ User sees    │
                                          │ available    │    │ rejection    │
                                          │ for Daily    │    │ in their     │
                                          │ sets         │    │ submissions  │
                                          └──────────────┘    └──────────────┘
```

**Database Trigger for Approval:**
```sql
CREATE OR REPLACE FUNCTION approve_photo_submission()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status = 'pending' THEN
    -- Copy to photos table
    INSERT INTO photos (
      event_name, competition, year_utc, place, lat, lon,
      photo_url, license, credit, is_daily_eligible
    )
    VALUES (
      NEW.event_name, NEW.competition, NEW.year_utc, NEW.place,
      NEW.lat, NEW.lon, NEW.photo_url, NEW.license, NEW.credit, true
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

---

## 5. IMPLEMENTATION ROADMAP

### Phase 1: Core Authentication UI (Week 1)

**Priority:** HIGH
**Estimated Effort:** 3-4 days

**Tasks:**
1. ✅ Install missing dependency: `npm install zod`
2. Create navigation components:
   - [ ] `src/components/navigation/Navigation.astro`
   - [ ] `src/components/navigation/UserMenu.tsx`
3. Enhance main layout:
   - [ ] Update `src/layouts/Layout.astro` with navigation and route protection
4. Create auth pages:
   - [ ] `src/pages/login.astro`
   - [ ] `src/pages/signup.astro`
5. Create auth form components:
   - [ ] `src/components/auth/LoginForm.tsx`
   - [ ] `src/components/auth/SignupForm.tsx`
6. Create profile page:
   - [ ] `src/pages/profile.astro`
   - [ ] `src/components/profile/ProfileForm.tsx`
7. Testing:
   - [ ] Test sign-up flow
   - [ ] Test sign-in flow
   - [ ] Test profile update
   - [ ] Test protected route redirects

**Acceptance Criteria:**
- Users can sign up with email/password
- Users can log in and see their profile
- Navigation shows auth state correctly
- Protected routes redirect to login

---

### Phase 2: Game Integration (Week 2)

**Priority:** HIGH
**Estimated Effort:** 2-3 days

**Tasks:**
1. Update game pages:
   - [ ] Modify `src/pages/play/[mode].astro` to pass auth state
   - [ ] Update `GameView` component to handle authenticated submissions
2. Create auth-aware components:
   - [ ] `src/components/game/PotentialRankNotice.tsx`
   - [ ] Update `RoundSummary.tsx` to show sign-up CTA for anonymous users
3. API integration:
   - [ ] Update daily submission endpoint to handle anonymous rank calculation
4. Testing:
   - [ ] Test anonymous Daily play (show potential rank)
   - [ ] Test authenticated Daily play (save score)
   - [ ] Test multiple plays (only first counts)
   - [ ] Test leaderboard display

**Acceptance Criteria:**
- Anonymous users see potential rank
- Authenticated users' scores are saved
- Leaderboard shows only authenticated submissions
- Clear differentiation between saved and unsaved scores

---

### Phase 3: Admin Dashboard & Moderation (Week 3)

**Priority:** MEDIUM
**Estimated Effort:** 4-5 days

**Tasks:**
1. Create admin pages:
   - [ ] `src/pages/admin/index.astro` (dashboard)
   - [ ] `src/pages/admin/submissions.astro` (moderation queue)
   - [ ] `src/pages/admin/users.astro` (user management)
2. Create admin components:
   - [ ] `src/components/admin/ModerationQueue.tsx`
   - [ ] `src/components/admin/UserList.tsx`
   - [ ] `src/components/admin/PermissionToggle.tsx`
3. Create user management API:
   - [ ] `src/pages/api/admin/users/index.ts` (GET list)
   - [ ] `src/pages/api/admin/users/[id]/permissions.ts` (PATCH)
4. Testing:
   - [ ] Test admin-only access
   - [ ] Test photo approval/rejection
   - [ ] Test permission management
   - [ ] Test non-admin access denial

**Acceptance Criteria:**
- Admins can view pending submissions
- Admins can approve/reject photos with reasons
- Admins can grant/revoke `can_add_photos` permission
- Non-admins cannot access admin pages

---

### Phase 4: Photo Submission UI (Week 3)

**Priority:** MEDIUM
**Estimated Effort:** 2-3 days

**Tasks:**
1. Create photo submission pages:
   - [ ] `src/pages/photos/submit.astro`
   - [ ] `src/pages/photos/my-submissions.astro`
2. Create photo components:
   - [ ] `src/components/photos/PhotoSubmitForm.tsx`
   - [ ] `src/components/photos/SubmissionList.tsx`
   - [ ] `src/components/photos/SubmissionStats.tsx`
3. Testing:
   - [ ] Test photo submission flow
   - [ ] Test permission checking
   - [ ] Test submission history display
   - [ ] Test rejection reason visibility

**Acceptance Criteria:**
- Users with permission can submit photos
- Users can view their submission history
- Rejection reasons are displayed
- Form validates coordinates and year range

---

### Phase 5: Polish & Enhancements (Week 4)

**Priority:** LOW
**Estimated Effort:** 3-4 days

**Tasks:**
1. Responsive design:
   - [ ] Mobile navigation (hamburger menu)
   - [ ] Responsive admin dashboard
   - [ ] Mobile-friendly forms
2. Accessibility audit:
   - [ ] Keyboard navigation testing
   - [ ] Screen reader testing
   - [ ] ARIA attribute review
3. Error handling improvements:
   - [ ] Better error messages
   - [ ] Network error retry logic
   - [ ] Loading skeleton states
4. Performance optimization:
   - [ ] Code splitting for admin pages
   - [ ] Lazy loading for heavy components
   - [ ] Image optimization
5. Documentation:
   - [ ] User guide for photo submission
   - [ ] Admin guide for moderation

**Acceptance Criteria:**
- All pages responsive on mobile
- WCAG AA compliance
- Graceful error handling
- Fast page load times

---

### Optional Future Enhancements

**NOT in MVP scope:**

1. **Email Verification**
   - Supabase email confirmation
   - Email verification flow UI
   - Resend verification email

2. **Password Reset**
   - Forgot password page
   - Password reset email
   - Reset password form

3. **Two-Factor Authentication**
   - 2FA setup page
   - TOTP support
   - Backup codes

4. **Social Login**
   - Google OAuth
   - GitHub OAuth
   - Social account linking

5. **User Analytics**
   - User activity tracking
   - Submission success rates
   - Moderation metrics dashboard

---

## Appendix A: File Checklist

### New Files to Create

#### Pages
- [ ] `src/pages/login.astro`
- [ ] `src/pages/signup.astro`
- [ ] `src/pages/profile.astro`
- [ ] `src/pages/admin/index.astro`
- [ ] `src/pages/admin/submissions.astro`
- [ ] `src/pages/admin/users.astro`
- [ ] `src/pages/photos/submit.astro`
- [ ] `src/pages/photos/my-submissions.astro`

#### Navigation Components
- [ ] `src/components/navigation/Navigation.astro`
- [ ] `src/components/navigation/UserMenu.tsx`

#### Auth Components
- [ ] `src/components/auth/LoginForm.tsx`
- [ ] `src/components/auth/SignupForm.tsx`

#### Profile Components
- [ ] `src/components/profile/ProfileForm.tsx`

#### Admin Components
- [ ] `src/components/admin/ModerationQueue.tsx`
- [ ] `src/components/admin/UserList.tsx`
- [ ] `src/components/admin/PermissionToggle.tsx`

#### Photo Components
- [ ] `src/components/photos/PhotoSubmitForm.tsx`
- [ ] `src/components/photos/SubmissionList.tsx`
- [ ] `src/components/photos/SubmissionStats.tsx`

#### Game Integration
- [ ] `src/components/game/PotentialRankNotice.tsx`

#### API Routes (New)
- [ ] `src/pages/api/admin/users/index.ts`
- [ ] `src/pages/api/admin/users/[id]/permissions.ts`

### Files to Modify

- [ ] `src/layouts/Layout.astro` (add navigation and route protection)
- [ ] `src/pages/index.astro` (add auth state indicator)
- [ ] `src/pages/play/[mode].astro` (pass auth state to GameView)
- [ ] `src/components/game/GameView.tsx` (handle authenticated submissions)
- [ ] `src/components/game/RoundSummary.tsx` (show sign-up CTA)

---

## Appendix B: Testing Scenarios

### Authentication Testing

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **Sign Up Success** | 1. Navigate to /signup<br>2. Enter email, password<br>3. Submit | User created, redirected to home, navigation shows user menu |
| **Sign Up - Duplicate Email** | 1. Sign up with existing email | Error: "Email already registered" |
| **Sign Up - Weak Password** | 1. Enter password < 8 chars | Error: "Password must be at least 8 characters" |
| **Sign In Success** | 1. Navigate to /login<br>2. Enter valid credentials | Logged in, redirected to home |
| **Sign In - Invalid Password** | 1. Enter wrong password | Error: "Invalid credentials" |
| **Protected Route (Logged Out)** | 1. Navigate to /profile while logged out | Redirected to /login?redirect=/profile |
| **Protected Route (Logged In)** | 1. Log in<br>2. Navigate to /profile | Profile page displayed |
| **Sign Out** | 1. Click "Sign Out" in user menu | Logged out, redirected to home |
| **Update Nickname** | 1. Navigate to /profile<br>2. Change nickname<br>3. Submit | Nickname updated, success message shown |
| **Nickname Uniqueness** | 1. Try to update to existing nickname | Error: "Nickname already taken" |

---

### Game Integration Testing

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **Anonymous Daily Play** | 1. Complete Daily challenge without login | Potential rank shown, sign-up CTA displayed, score NOT saved |
| **Authenticated Daily Play** | 1. Log in<br>2. Complete Daily challenge | Score saved, leaderboard rank shown |
| **Multiple Daily Plays (Authenticated)** | 1. Complete Daily<br>2. Play again on same day | Second play shows "already submitted" notice, score not updated |
| **Normal Mode (Any User)** | 1. Play Normal mode | Scores shown, NOT saved (works same for auth/anon) |
| **Leaderboard Display** | 1. View leaderboard | Shows only authenticated submissions with nicknames |

---

### Admin Testing

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **Admin Access (Admin User)** | 1. Log in as admin<br>2. Navigate to /admin | Admin dashboard displayed |
| **Admin Access (Regular User)** | 1. Log in as regular user<br>2. Navigate to /admin | Redirected to home |
| **Approve Photo** | 1. Log in as admin<br>2. Go to /admin/submissions<br>3. Approve photo | Photo moved to photos table, removed from pending |
| **Reject Photo** | 1. Reject photo with reason | Photo marked rejected, reason stored, visible to submitter |
| **Grant Permission** | 1. Go to /admin/users<br>2. Toggle can_add_photos for user | Permission updated, user can now submit photos |
| **Revoke Permission** | 1. Disable can_add_photos | User can no longer access /photos/submit |

---

### Photo Submission Testing

| Test Case | Steps | Expected Result |
|-----------|-------|-----------------|
| **Submit Photo (With Permission)** | 1. User with permission submits photo | Photo created with "pending" status |
| **Submit Photo (Without Permission)** | 1. Navigate to /photos/submit without permission | Redirected to home |
| **View Submission History** | 1. Navigate to /photos/my-submissions | User sees their submissions with statuses |
| **View Rejection Reason** | 1. Check rejected submission | Rejection reason displayed |
| **Invalid Coordinates** | 1. Submit with lat > 90 | Error: "Latitude must be between -90 and 90" |
| **Invalid Year** | 1. Submit with year < 1880 | Error: "Year must be between 1880 and 2025" |

---

## Appendix C: Environment Variables

Required environment variables (already configured):

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-anon-key

# AI (for future features)
OPENROUTER_API_KEY=your-openrouter-key
```

**Security Note:** Never commit `.env` to git. Use `.env.example` for documentation.

---

## Appendix D: Dependencies

### Already Installed
```json
{
  "@supabase/supabase-js": "^2.75.1",
  "@supabase/ssr": "^0.7.0",
  "astro": "^5.13.7",
  "react": "^19.1.1",
  "tailwindcss": "^4.1.13",
  "class-variance-authority": "^0.7.1",
  "clsx": "^2.1.1"
}
```

### Missing (Required)
```bash
npm install zod bad-words
```

**Recommended Versions:**
- `zod@^3.22.4` - Input validation
- `bad-words@^4.0.0` - Profanity filtering (required by PRD US-026, US-029)

---

## Conclusion

This architecture provides a complete, production-ready authentication and authorization system for FootyGuess Daily. The backend infrastructure is fully implemented; this specification focuses on the frontend UI layer needed to expose these capabilities to users.

**Key Design Principles:**
1. **Security First:** Server-side validation, RLS policies, HTTP-only cookies
2. **Separation of Concerns:** Service layer abstracts business logic from API routes
3. **Type Safety:** End-to-end TypeScript with generated database types
4. **Accessibility:** WCAG AA compliance, ARIA attributes, keyboard navigation
5. **User Experience:** Clear error messages, loading states, success feedback

**Next Steps:**
1. Review this specification
2. Prioritize implementation phases
3. Begin Phase 1 (Core Authentication UI)
4. Test thoroughly at each phase
5. Deploy incrementally

---

**Document Version:** 1.0
**Last Updated:** 2025-10-26
**Status:** Ready for Implementation
