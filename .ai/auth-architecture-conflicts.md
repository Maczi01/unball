# Authentication Architecture - Conflict Resolution Report

**Date:** 2025-10-26
**Status:** Critical Conflicts Identified - Requires Updates

---

## Critical Conflicts Found

### 🔴 CONFLICT 1: Role Storage Mechanism

**Issue:** Frontend code incorrectly accesses role via `user_metadata`

**PRD Requirement:**
- User roles stored in database `users` table
- Role-based access control enforced at database level via RLS

**Current Backend Implementation (CORRECT):**
```typescript
// src/lib/services/auth.service.ts
const { data: user } = await this.supabase
  .from("users")
  .select("role")
  .eq("id", userId)
  .single();

return user?.role === "admin";
```

**Architecture Document Error (INCORRECT):**
```astro
<!-- src/layouts/Layout.astro - WRONG! -->
if (requireAdmin && user?.user_metadata?.role !== 'admin') {
  return Astro.redirect('/');
}
```

**Root Cause:**
- `user` from `Astro.locals.user` is the Supabase Auth user object
- This object does NOT contain role information
- Role is stored separately in the `users` table and must be queried

**Impact:** 🔴 BLOCKING
- Admin route protection will not work
- All admin features will be accessible to regular users
- Security vulnerability

**Fix Required:**
```astro
---
// CORRECT approach
const { user, supabase } = Astro.locals;

if (requireAdmin && user) {
  const { data: userProfile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!userProfile || userProfile.role !== 'admin') {
    return Astro.redirect('/');
  }
}
---
```

**Files Affected:**
- `src/layouts/Layout.astro` (architecture example)
- `src/components/navigation/UserMenu.tsx` (shows role incorrectly)
- All admin pages that check role client-side

---

### 🔴 CONFLICT 2: Missing Profanity Filtering

**Issue:** Profanity checking required by PRD but not implemented

**PRD Requirements:**
- **US-026:** "Optional nickname field (3-20 chars, validated for profanity/uniqueness)"
- **US-029:** "Validation: 3-20 chars, profanity check, uniqueness check"
- **US-009:** "Profanity is blocked"

**Current Implementation:**
- ❌ No profanity checking in `AuthService.updateNickname()`
- ❌ No profanity checking in signup flow
- ✅ Uniqueness checking implemented
- ✅ Length validation implemented

**Impact:** 🟡 HIGH PRIORITY
- Users can set offensive nicknames
- Public leaderboard may display inappropriate content
- Violates PRD acceptance criteria

**Fix Required:**

1. **Add profanity filter dependency:**
```bash
npm install bad-words
# or
npm install leo-profanity
```

2. **Update AuthService:**
```typescript
import Filter from 'bad-words';

export class AuthService {
  private profanityFilter = new Filter();

  async updateNickname(userId: string, nickname: string): Promise<AuthResult> {
    // Existing validations...

    // Add profanity check
    if (this.profanityFilter.isProfane(nickname)) {
      return {
        success: false,
        error: "Nickname contains inappropriate content",
      };
    }

    // Continue with uniqueness check...
  }
}
```

3. **Update frontend forms:**
```typescript
// src/components/auth/SignupForm.tsx
// src/components/profile/ProfileForm.tsx
const validateNickname = (): string | null => {
  // ... existing validations

  // Note: Client-side profanity check for UX, server-side for security
  if (containsProfanity(nickname)) {
    return 'Nickname contains inappropriate content';
  }

  return null;
};
```

**Files to Update:**
- `src/lib/services/auth.service.ts`
- `src/components/auth/SignupForm.tsx`
- `src/components/profile/ProfileForm.tsx`
- `package.json` (add dependency)

---

### 🟡 CONFLICT 3: Submission Stats Display Location

**Issue:** Inconsistent placement of photo submission statistics

**PRD Requirement (US-030):**
> "Profile page shows email, nickname, account creation date, role, and photo submission permission status. **User can see their submission stats if they have `can_add_photos` permission.**"

**Architecture Document:**
- Profile page shows permission status: ✅ Correct
- Profile page shows submission stats: ❌ NOT included in design
- Stats shown on `/photos/my-submissions` page instead

**Impact:** 🟡 MEDIUM PRIORITY
- UX inconsistency with PRD
- Users must navigate to separate page to see stats
- Extra database query on submissions page

**Recommended Fix:**

**Option 1 (Align with PRD):** Add stats to profile page
```astro
<!-- src/pages/profile.astro -->
{profile.canAddPhotos && (
  <section class="rounded-lg border bg-card p-6">
    <h2 class="text-xl font-semibold mb-4">Photo Submission Stats</h2>
    <SubmissionStats client:load userId={profile.id} />
  </section>
)}
```

**Option 2 (Update PRD):** Keep stats on dedicated page, show link on profile
```astro
<!-- src/pages/profile.astro -->
{profile.canAddPhotos && (
  <div class="flex justify-between items-center">
    <span class="text-muted-foreground">Photo Submission:</span>
    <a href="/photos/my-submissions" class="font-medium text-primary hover:underline">
      View Submissions
    </a>
  </div>
)}
```

**Recommendation:** Option 1 (align with PRD) for better UX

**Files to Update:**
- `src/pages/profile.astro`
- Create `src/components/profile/SubmissionStats.tsx` (or reuse from submissions page)

---

### 🟡 CONFLICT 4: Consent Handling for Authenticated Users

**Issue:** Consent flow incomplete for authenticated users

**PRD Requirement (US-025):**
> "Before first leaderboard submission, a brief notice explains public display. User must confirm once; preference is stored with `anon_device_token`."

**Current Architecture:**
- ✅ Consent handling for anonymous users (via device token)
- ❌ No consent flow for authenticated users
- ❌ Database schema has `consent_given_at` in `users` table but not used

**Gap Analysis:**

Anonymous users:
1. Consent stored in `device_nicknames.consent_given_at` ✅
2. Checked before leaderboard submission ✅

Authenticated users:
1. `users.consent_given_at` column exists ✅
2. No UI to collect consent ❌
3. No check before first leaderboard submission ❌
4. No API to update consent ❌

**Impact:** 🟡 MEDIUM PRIORITY
- Privacy compliance gap
- Inconsistent consent handling
- Database field unused

**Fix Required:**

1. **Add consent to first Daily submission:**
```typescript
// src/pages/api/daily/submissions.ts
export const POST: APIRoute = async ({ request, locals }) => {
  const { user, supabase } = locals;

  if (user) {
    // Check if user has given consent
    const { data: userProfile } = await supabase
      .from('users')
      .select('consent_given_at')
      .eq('id', user.id)
      .single();

    if (!userProfile?.consent_given_at) {
      return new Response(
        JSON.stringify({
          error: 'Consent required',
          consentRequired: true
        }),
        { status: 400 }
      );
    }

    // Continue with submission...
  }
};
```

2. **Add consent modal/checkbox to game UI:**
```tsx
// src/components/game/ConsentModal.tsx
export default function ConsentModal({ onConsent, onDecline }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
      <div className="bg-card p-6 rounded-lg max-w-md">
        <h2 className="text-xl font-bold mb-4">Public Leaderboard Notice</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Your nickname will be publicly displayed on the leaderboard if you
          rank in the top 10. Do you consent to this public display?
        </p>
        <div className="flex gap-3">
          <Button onClick={onConsent}>I Consent</Button>
          <Button variant="outline" onClick={onDecline}>Decline</Button>
        </div>
      </div>
    </div>
  );
}
```

3. **Add consent API endpoint:**
```typescript
// src/pages/api/auth/consent.ts
export const POST: APIRoute = async ({ locals }) => {
  const { user, supabase } = locals;

  if (!user) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });
  }

  const { error } = await supabase
    .from('users')
    .update({ consent_given_at: new Date().toISOString() })
    .eq('id', user.id);

  if (error) {
    return new Response(JSON.stringify({ error: error.message }), { status: 500 });
  }

  return new Response(JSON.stringify({ success: true }), { status: 200 });
};
```

**Files to Update:**
- `src/pages/api/daily/submissions.ts` (add consent check)
- `src/pages/api/auth/consent.ts` (new endpoint)
- `src/components/game/ConsentModal.tsx` (new component)
- `src/components/game/GameView.tsx` (integrate consent modal)

---

### ⚠️ CONFLICT 5: Admin Filter Capabilities

**Issue:** PRD requires status filtering, architecture doesn't specify

**PRD Requirement (US-035):**
> "Admin panel lists all pending submissions... Admin can filter by status."

**Architecture Document:**
- Shows only pending submissions by default ✅
- No filter UI specified ❌
- API returns all pending, no status parameter ❌

**Impact:** 🟢 LOW PRIORITY
- Nice-to-have feature
- Can be added later
- Workaround: Create separate pages for pending/approved/rejected

**Recommended Fix:**

Add filter dropdown to moderation page:
```tsx
// src/components/admin/ModerationQueue.tsx
const [statusFilter, setStatusFilter] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');

// Filter submissions client-side or via API parameter
```

**Files to Update:**
- `src/pages/admin/submissions.astro` (fetch with status param)
- `src/components/admin/ModerationQueue.tsx` (add filter UI)
- `src/pages/api/admin/submissions/pending.ts` (rename to /submissions, add status param)

---

## Summary Table

| Conflict | Priority | Impact | Status | Effort |
|----------|----------|--------|--------|--------|
| 1. Role Storage | 🔴 CRITICAL | Security vulnerability | Must fix before implementation | 2 hours |
| 2. Profanity Filter | 🟡 HIGH | Content moderation failure | Fix in Phase 1 | 4 hours |
| 3. Stats Display | 🟡 MEDIUM | UX inconsistency | Fix in Phase 1 | 1 hour |
| 4. Consent Flow | 🟡 MEDIUM | Privacy compliance | Fix in Phase 2 | 3 hours |
| 5. Admin Filters | 🟢 LOW | Feature gap | Fix in Phase 3 | 2 hours |

**Total Estimated Effort:** 12 hours of additional development

---

## Action Items

### Before Starting Implementation:

1. ✅ **Fix Role Checking Pattern** (CRITICAL)
   - Update all examples in architecture document
   - Create helper function for role checking
   - Document correct pattern

2. ✅ **Add Profanity Filter Specification** (HIGH)
   - Choose profanity filter library
   - Update service layer specification
   - Update frontend validation specification

3. ✅ **Clarify Stats Display** (MEDIUM)
   - Decide on placement (profile vs dedicated page)
   - Update PRD or architecture to match

4. ⚠️ **Design Consent Flow** (MEDIUM)
   - Add consent modal specification
   - Update API endpoint specification
   - Update game integration flow

5. ⏸️ **Admin Filters** (LOW)
   - Can be deferred to Phase 3
   - Not blocking for MVP

---

## Corrected Architecture Patterns

### Pattern 1: Checking User Role (CORRECT)

```astro
---
// src/pages/admin/index.astro
const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/admin');
}

// Query database for role
const { data: userProfile } = await supabase
  .from('users')
  .select('role')
  .eq('id', user.id)
  .single();

if (!userProfile || userProfile.role !== 'admin') {
  return Astro.redirect('/');
}
---
```

### Pattern 2: Checking Permission (CORRECT)

```astro
---
// src/pages/photos/submit.astro
const { user, supabase } = Astro.locals;

if (!user) {
  return Astro.redirect('/login?redirect=/photos/submit');
}

// Query database for permission
const { data: userProfile } = await supabase
  .from('users')
  .select('can_add_photos')
  .eq('id', user.id)
  .single();

if (!userProfile?.can_add_photos) {
  return Astro.redirect('/?error=permission_denied');
}
---
```

### Pattern 3: Enhanced Layout with Helper (RECOMMENDED)

```astro
---
// src/layouts/Layout.astro
import { AuthService } from '@/lib/services/auth.service';

interface Props {
  title?: string;
  requireAuth?: boolean;
  requireAdmin?: boolean;
  requirePhotoPermission?: boolean;
}

const {
  title = "FootyGuess Daily",
  requireAuth = false,
  requireAdmin = false,
  requirePhotoPermission = false
} = Astro.props;

const { user, supabase } = Astro.locals;

// Check authentication
if (requireAuth && !user) {
  return Astro.redirect('/login?redirect=' + encodeURIComponent(Astro.url.pathname));
}

// Check admin role if required
if (requireAdmin && user) {
  const authService = new AuthService(supabase);
  const isAdmin = await authService.isAdmin(user.id);

  if (!isAdmin) {
    return Astro.redirect('/?error=forbidden');
  }
}

// Check photo permission if required
if (requirePhotoPermission && user) {
  const authService = new AuthService(supabase);
  const canSubmit = await authService.canAddPhotos(user.id);

  if (!canSubmit) {
    return Astro.redirect('/?error=permission_denied');
  }
}

// Fetch full user profile if authenticated (for navigation)
let userProfile = null;
if (user) {
  const authService = new AuthService(supabase);
  userProfile = await authService.getUserProfile(user.id);
}
---

<!doctype html>
<html lang="en">
  <head>
    <!-- ... -->
  </head>
  <body>
    <Navigation user={user} profile={userProfile} />
    <main>
      <slot />
    </main>
  </body>
</html>
```

### Pattern 4: UserMenu with Correct Role Access

```tsx
// src/components/navigation/UserMenu.tsx
import type { UserProfile } from '@/lib/services/auth.service';

interface UserMenuProps {
  profile: UserProfile; // Full profile with role/permissions
}

export default function UserMenu({ profile }: UserMenuProps) {
  return (
    <div>
      <p className="text-xs text-muted-foreground mt-1">
        {profile.role === 'admin' ? 'Administrator' : 'Player'}
      </p>

      {/* Menu items */}
      {profile.canAddPhotos && (
        <a href="/photos/submit">Submit Photo</a>
      )}

      {profile.role === 'admin' && (
        <a href="/admin">Admin Dashboard</a>
      )}
    </div>
  );
}
```

---

## Updated Implementation Checklist

### Phase 1: Core Authentication UI (Week 1)

- [ ] **CRITICAL:** Fix role checking in all page examples
- [ ] **HIGH:** Add profanity filter dependency (`npm install bad-words`)
- [ ] **HIGH:** Implement profanity checking in AuthService
- [ ] **HIGH:** Add profanity validation to frontend forms
- [ ] **MEDIUM:** Add submission stats to profile page (or link to submissions)
- [ ] Create navigation components
- [ ] Create auth pages (login, signup, profile)
- [ ] Create auth form components
- [ ] Test auth flows

### Phase 2: Game Integration (Week 2)

- [ ] **MEDIUM:** Implement consent modal for authenticated users
- [ ] **MEDIUM:** Add consent API endpoint
- [ ] **MEDIUM:** Check consent before first Daily submission
- [ ] Update game pages for auth state
- [ ] Create potential rank notice
- [ ] Test authenticated vs anonymous flows

### Phase 3: Admin Dashboard (Week 3)

- [ ] Create admin pages with CORRECT role checking
- [ ] Create moderation queue
- [ ] **LOW:** Add status filter to admin submissions
- [ ] Test admin-only access

### Phase 4: Photo Submission (Week 3)

- [ ] Create photo submission pages
- [ ] Create submission forms
- [ ] Test permission checking

---

## Conclusion

The architecture document provides a solid foundation but requires **critical updates** before implementation begins:

1. **Role/permission checking pattern must be corrected** - this is a security issue
2. **Profanity filtering must be added** - required by PRD
3. **Submission stats placement must be clarified** - UX consistency
4. **Consent flow for authenticated users must be designed** - compliance

Once these issues are addressed, the implementation can proceed safely.

**Next Step:** Update the main architecture document with these corrections.
