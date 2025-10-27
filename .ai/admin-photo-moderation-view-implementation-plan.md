# View Implementation Plan: Admin Photo Moderation

## 1. Overview

This view provides admin users with the ability to review, approve, or reject user-submitted photos. Admins can view a list of pending photo submissions, examine detailed information about each submission (similar to the submit-photo view), and take moderation actions. The view supports filtering by submission status and displays key metadata for each submission. Approved photos are automatically added to the photos pool with `is_daily_eligible = true`.

**Purpose:** Enable admin moderation workflow for community-submitted photos to maintain content quality and expand the game's photo library.

## 2. View Routing

**Primary Route:** `/admin/photo-moderation`

**Access Control:**
- Requires authentication via Supabase Auth
- Requires `role = admin` in users table
- Redirect to `/login?redirect=/admin/photo-moderation` if not authenticated
- Redirect to `/` with error message if authenticated but not admin

**SSR Configuration:**
```typescript
export const prerender = false;
```

## 3. Component Structure

```
AdminPhotoModerationPage (Astro)
├── Layout (Astro)
└── PhotoModerationDashboard (React, client:load)
    ├── ModerationHeader (React)
    │   ├── StatusFilter (React)
    │   └── StatusCounts (React)
    ├── SubmissionsList (React)
    │   ├── SubmissionCard (React) [multiple]
    │   │   ├── PhotoThumbnail (React)
    │   │   ├── SubmissionMetadata (React)
    │   │   └── QuickActions (React)
    │   └── Pagination (React)
    └── SubmissionDetailModal (React)
        ├── PhotoPreview (React)
        ├── MetadataDisplay (React)
        ├── MapPreview (React)
        └── ModerationActions (React)
```

## 4. Component Details

### AdminPhotoModerationPage (Astro)
- **Description:** Server-side page component that handles authentication, authorization, and initial data loading
- **Main elements:**
  - Layout wrapper
  - PhotoModerationDashboard client component with hydration directive
- **Handled interactions:** None (server-side only)
- **Handled validation:**
  - User authentication check
  - Admin role verification
- **Types:**
  - `User` (from Supabase Auth)
  - `DbTable<"users">` for role check
- **Props:** None (page component)

### PhotoModerationDashboard (React)
- **Description:** Main container component managing moderation state and orchestrating child components
- **Main elements:**
  - `<div>` with grid layout for header and content area
  - ModerationHeader for filters and stats
  - SubmissionsList for displaying submissions
  - SubmissionDetailModal for detailed review
- **Handled interactions:**
  - Status filter changes
  - Pagination navigation
  - Opening detail modal
  - Closing detail modal
  - Refresh after moderation actions
- **Handled validation:** None (delegates to children)
- **Types:**
  - `PhotoSubmissionListViewModel`
  - `SubmissionStatus`
  - `PaginationState`
- **Props:**
```typescript
interface PhotoModerationDashboardProps {
  initialData?: AdminPhotoSubmissionsResponseDTO;
  adminEmail: string;
}
```

### ModerationHeader (React)
- **Description:** Header section displaying status filter and submission counts
- **Main elements:**
  - `<header>` with flex layout
  - Title heading
  - StatusFilter dropdown
  - StatusCounts badges
- **Handled interactions:**
  - Filter selection change
- **Handled validation:** None
- **Types:**
  - `SubmissionStatus`
  - `StatusCountsDTO`
- **Props:**
```typescript
interface ModerationHeaderProps {
  currentStatus: SubmissionStatus | "all";
  statusCounts: StatusCountsDTO;
  onStatusChange: (status: SubmissionStatus | "all") => void;
}
```

### StatusFilter (React)
- **Description:** Dropdown/select component for filtering submissions by status
- **Main elements:**
  - Shadcn Select component
  - SelectTrigger
  - SelectContent with SelectItem for each status
- **Handled interactions:**
  - Status selection
- **Handled validation:** None
- **Types:**
  - `SubmissionStatus`
- **Props:**
```typescript
interface StatusFilterProps {
  value: SubmissionStatus | "all";
  onChange: (value: SubmissionStatus | "all") => void;
}
```

### StatusCounts (React)
- **Description:** Display component showing counts for each submission status
- **Main elements:**
  - `<div>` with flex layout
  - Badge components for each status (pending, approved, rejected)
- **Handled interactions:** None (display only)
- **Handled validation:** None
- **Types:**
  - `StatusCountsDTO`
- **Props:**
```typescript
interface StatusCountsProps {
  counts: StatusCountsDTO;
}
```

### SubmissionsList (React)
- **Description:** List container displaying submission cards with pagination
- **Main elements:**
  - `<div>` or `<section>` container
  - Loading skeleton when fetching
  - Empty state when no submissions
  - Grid of SubmissionCard components
  - Pagination component at bottom
- **Handled interactions:**
  - Card click to open detail modal
  - Pagination navigation
- **Handled validation:** None
- **Types:**
  - `AdminPhotoSubmissionListItemDTO[]`
  - `PaginationDTO`
- **Props:**
```typescript
interface SubmissionsListProps {
  submissions: AdminPhotoSubmissionListItemDTO[];
  pagination: PaginationDTO;
  isLoading: boolean;
  onSubmissionClick: (id: string) => void;
  onPageChange: (page: number) => void;
}
```

### SubmissionCard (React)
- **Description:** Compact card showing submission preview and key metadata
- **Main elements:**
  - `<article>` or Card component wrapper
  - PhotoThumbnail component
  - SubmissionMetadata component
  - QuickActions component
  - Status badge
- **Handled interactions:**
  - Card click to view details
  - Quick action button clicks
- **Handled validation:** None
- **Types:**
  - `AdminPhotoSubmissionListItemDTO`
- **Props:**
```typescript
interface SubmissionCardProps {
  submission: AdminPhotoSubmissionListItemDTO;
  onClick: (id: string) => void;
  onQuickApprove?: (id: string) => void;
  onQuickReject?: (id: string) => void;
}
```

### PhotoThumbnail (React)
- **Description:** Displays submission photo thumbnail with loading state
- **Main elements:**
  - `<img>` with object-fit cover
  - Loading skeleton placeholder
  - Error fallback icon
- **Handled interactions:** None
- **Handled validation:** None
- **Types:** None (primitive props)
- **Props:**
```typescript
interface PhotoThumbnailProps {
  thumbnailUrl: string | null;
  alt: string;
  className?: string;
}
```

### SubmissionMetadata (React)
- **Description:** Displays key submission metadata in compact format
- **Main elements:**
  - `<div>` with vertical stack
  - Event name heading
  - Year, location text
  - Submitter email
  - Submission date
- **Handled interactions:** None
- **Handled validation:** None
- **Types:**
  - `AdminPhotoSubmissionListItemDTO` (partial)
- **Props:**
```typescript
interface SubmissionMetadataProps {
  eventName: string;
  yearUtc: number;
  submitterEmail: string | null;
  createdAt: string;
}
```

### QuickActions (React)
- **Description:** Quick action buttons for approve/reject without opening detail view
- **Main elements:**
  - `<div>` with button group
  - Approve button (green)
  - Reject button (red)
  - Loading spinners when actions pending
- **Handled interactions:**
  - Approve button click
  - Reject button click
- **Handled validation:**
  - Reject requires confirmation dialog
- **Types:** None (primitive props)
- **Props:**
```typescript
interface QuickActionsProps {
  submissionId: string;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  isLoading?: boolean;
}
```

### Pagination (React)
- **Description:** Pagination controls for navigating submission pages
- **Main elements:**
  - Shadcn Pagination component
  - PaginationContent
  - PaginationItem for each page
  - PaginationPrevious and PaginationNext buttons
- **Handled interactions:**
  - Page number click
  - Previous/Next button click
- **Handled validation:**
  - Disable previous on first page
  - Disable next on last page
- **Types:**
  - `PaginationDTO`
- **Props:**
```typescript
interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}
```

### SubmissionDetailModal (React)
- **Description:** Modal displaying full submission details for review
- **Main elements:**
  - Shadcn Dialog component
  - DialogContent with scrollable area
  - PhotoPreview component
  - MetadataDisplay component
  - MapPreview component (optional, if coordinates provided)
  - ModerationActions component
  - Close button
- **Handled interactions:**
  - Modal open/close
  - Moderation action submission
- **Handled validation:**
  - Approval confirmation
  - Rejection requires reason (1-500 chars)
- **Types:**
  - `AdminPhotoSubmissionDetailDTO`
  - `ModerationActionState`
- **Props:**
```typescript
interface SubmissionDetailModalProps {
  submissionId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onActionComplete: () => void;
}
```

### PhotoPreview (React)
- **Description:** Full-size photo preview with zoom capability
- **Main elements:**
  - `<img>` or `<figure>` with full photo URL
  - Zoom controls (optional)
  - Download link
- **Handled interactions:**
  - Image click to zoom
  - Download click
- **Handled validation:** None
- **Types:** None (primitive props)
- **Props:**
```typescript
interface PhotoPreviewProps {
  photoUrl: string;
  alt: string;
}
```

### MetadataDisplay (React)
- **Description:** Comprehensive display of all submission metadata fields
- **Main elements:**
  - `<dl>` definition list or grid layout
  - Labels and values for all metadata fields:
    - Event name
    - Competition
    - Year (validated: 1880-2025)
    - Place (city/region/country)
    - Coordinates (lat/lon, validated ranges)
    - Description
    - Source URL
    - License
    - Credit
    - Tags
    - Notes
    - Submitter email
    - Submission timestamp
- **Handled interactions:** None (display only)
- **Handled validation:** None (display validated data)
- **Types:**
  - `AdminPhotoSubmissionDetailDTO`
- **Props:**
```typescript
interface MetadataDisplayProps {
  submission: AdminPhotoSubmissionDetailDTO;
}
```

### MapPreview (React)
- **Description:** Small map showing submission location pin (similar to submit form)
- **Main elements:**
  - Mapbox GL JS map container
  - Single marker at submitted coordinates
  - Zoom controls
- **Handled interactions:**
  - Map pan/zoom for verification
- **Handled validation:** None
- **Types:** None (primitive props)
- **Props:**
```typescript
interface MapPreviewProps {
  lat: number;
  lon: number;
}
```

### ModerationActions (React)
- **Description:** Action buttons and forms for approving or rejecting submissions
- **Main elements:**
  - Approve section:
    - Approval confirmation button
    - Optional review notes textarea
    - is_daily_eligible checkbox (default true)
    - Metadata override section (optional, expandable)
  - Reject section:
    - Rejection reason textarea (required, 1-500 chars)
    - Reject button
  - Loading state with spinner
  - Error display
- **Handled interactions:**
  - Approve button click
  - Reject button click
  - Textarea input
  - Checkbox toggle
- **Handled validation:**
  - Approval: optional review notes (max 500 chars)
  - Rejection: required reason (1-500 chars)
  - Submission must be in "pending" status
- **Types:**
  - `ApproveSubmissionCommand`
  - `RejectSubmissionCommand`
  - `ModerationActionState`
- **Props:**
```typescript
interface ModerationActionsProps {
  submissionId: string;
  currentStatus: SubmissionStatus;
  onApprove: (command: ApproveSubmissionCommand) => Promise<void>;
  onReject: (command: RejectSubmissionCommand) => Promise<void>;
}
```

## 5. Types

### New DTO Types (add to src/types.ts)

```typescript
/**
 * Summary item in admin photo submissions list
 * Response item type for GET /api/admin/photo-submissions
 */
export type AdminPhotoSubmissionListItemDTO = {
  id: string;
  event_name: string;
  year_utc: number;
  status: Database["public"]["Enums"]["submission_status"];
  submitter_email: string | null;
  thumbnail_url: string | null;
  created_at: string;
};

/**
 * Complete photo submission details for admin review
 * Response type for GET /api/admin/photo-submissions/{id}
 */
export type AdminPhotoSubmissionDetailDTO = DbTable<"photo_submissions">;

/**
 * Response for GET /api/admin/photo-submissions list endpoint
 */
export type AdminPhotoSubmissionsResponseDTO = {
  submissions: AdminPhotoSubmissionListItemDTO[];
  pagination: PaginationDTO;
  status_counts: StatusCountsDTO;
};

/**
 * Counts of submissions by status
 */
export type StatusCountsDTO = {
  pending: number;
  approved: number;
  rejected: number;
};

/**
 * Command to approve a photo submission
 * Request body for POST /api/admin/photo-submissions/{id}/approve
 */
export type ApproveSubmissionCommand = {
  review_notes?: string; // Optional, max 500 chars
  is_daily_eligible?: boolean; // Default true
  metadata_overrides?: Partial<{
    event_name: string;
    competition: string;
    year_utc: number;
    place: string;
    description: string;
    tags: string[];
  }>;
};

/**
 * Response for POST /api/admin/photo-submissions/{id}/approve
 */
export type ApproveSubmissionResponseDTO = {
  submission_id: string;
  photo_id: string;
  status: "approved";
  photo_url: string;
  reviewed_at: string;
  reviewed_by: string;
};

/**
 * Command to reject a photo submission
 * Request body for POST /api/admin/photo-submissions/{id}/reject
 */
export type RejectSubmissionCommand = {
  review_notes: string; // Required, 1-500 chars
  delete_file?: boolean; // Default true
};

/**
 * Response for POST /api/admin/photo-submissions/{id}/reject
 */
export type RejectSubmissionResponseDTO = {
  submission_id: string;
  status: "rejected";
  reviewed_at: string;
  reviewed_by: string;
};
```

### ViewModel Types (add to src/types.ts)

```typescript
/**
 * Submission status type (union of enum values)
 */
export type SubmissionStatus = Database["public"]["Enums"]["submission_status"];

/**
 * Filter state for submissions list
 */
export type SubmissionFilterState = {
  status: SubmissionStatus | "all";
  page: number;
};

/**
 * Pagination state for list navigation
 */
export type PaginationState = {
  currentPage: number;
  totalPages: number;
  totalItems: number;
};

/**
 * State for moderation actions (approve/reject)
 */
export type ModerationActionState = {
  status: "idle" | "submitting" | "success" | "error";
  error?: string;
};

/**
 * Complete view model for photo moderation dashboard
 */
export type PhotoSubmissionListViewModel = {
  submissions: AdminPhotoSubmissionListItemDTO[];
  filters: SubmissionFilterState;
  pagination: PaginationState;
  statusCounts: StatusCountsDTO;
  isLoading: boolean;
  error: string | null;
};

/**
 * View model for detail modal
 */
export type SubmissionDetailViewModel = {
  submission: AdminPhotoSubmissionDetailDTO | null;
  isLoading: boolean;
  error: string | null;
  moderationAction: ModerationActionState;
};
```

## 6. State Management

### Custom Hook: `usePhotoModeration`

**Location:** `src/components/hooks/usePhotoModeration.ts`

**Purpose:** Manages photo moderation state, fetching submissions, filtering, pagination, and moderation actions.

**State Structure:**
```typescript
interface PhotoModerationState {
  // List state
  submissions: AdminPhotoSubmissionListItemDTO[];
  statusCounts: StatusCountsDTO;
  isLoading: boolean;
  error: string | null;

  // Filter state
  currentStatus: SubmissionStatus | "all";
  currentPage: number;
  pagination: PaginationDTO | null;

  // Detail modal state
  selectedSubmissionId: string | null;
  submissionDetail: AdminPhotoSubmissionDetailDTO | null;
  isDetailLoading: boolean;
  detailError: string | null;

  // Action state
  moderationAction: ModerationActionState;
}
```

**Exported Functions:**
```typescript
interface UsePhotoModerationReturn {
  // State
  state: PhotoModerationState;

  // Actions
  setStatusFilter: (status: SubmissionStatus | "all") => void;
  setPage: (page: number) => void;
  openDetailModal: (id: string) => void;
  closeDetailModal: () => void;
  approveSubmission: (id: string, command: ApproveSubmissionCommand) => Promise<void>;
  rejectSubmission: (id: string, command: RejectSubmissionCommand) => Promise<void>;
  refreshList: () => Promise<void>;
}
```

**Implementation Details:**
- Uses `useState` for all state management
- Uses `useEffect` to fetch submissions when filters/page change
- Uses `useCallback` for action functions to prevent unnecessary re-renders
- Implements optimistic updates where appropriate
- Handles loading states and errors for all async operations

### Local Component State

**QuickActions Component:**
- `isApproving: boolean` - tracks approval action loading
- `isRejecting: boolean` - tracks rejection action loading
- `showRejectDialog: boolean` - controls rejection confirmation dialog

**ModerationActions Component:**
- `reviewNotes: string` - approval/rejection notes input
- `isDailyEligible: boolean` - checkbox state (default true)
- `showMetadataOverrides: boolean` - toggle for metadata override section
- `metadataOverrides: Partial<{...}>` - override field values
- `validationErrors: Record<string, string>` - field-level validation errors

**SubmissionDetailModal Component:**
- Uses `usePhotoModeration` hook for data and actions
- No additional local state required

## 7. API Integration

### Endpoint 1: List Photo Submissions

**Method:** GET
**Path:** `/api/admin/photo-submissions`

**Query Parameters:**
```typescript
{
  page?: number;        // Default: 1
  limit?: number;       // Default: 50, max: 100
  status?: SubmissionStatus; // Filter by status
  from_date?: string;   // YYYY-MM-DD
  to_date?: string;     // YYYY-MM-DD
}
```

**Request Headers:**
```typescript
{
  Authorization: `Bearer ${accessToken}` // From Supabase Auth
}
```

**Response Type:** `AdminPhotoSubmissionsResponseDTO`

**Implementation:**
```typescript
// src/pages/api/admin/photo-submissions.ts
import type { APIRoute } from "astro";
import { z } from "zod";

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: z.enum(["pending", "approved", "rejected"]).optional(),
  from_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  to_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export const GET: APIRoute = async (context) => {
  // Auth check
  // Role check
  // Parse and validate query params
  // Fetch from database with filters
  // Return AdminPhotoSubmissionsResponseDTO
};
```

### Endpoint 2: Get Submission Detail

**Method:** GET
**Path:** `/api/admin/photo-submissions/{id}`

**URL Parameters:**
```typescript
{
  id: string; // UUID
}
```

**Request Headers:**
```typescript
{
  Authorization: `Bearer ${accessToken}`
}
```

**Response Type:** `AdminPhotoSubmissionDetailDTO`

**Error Responses:**
- 404 if submission not found
- 401 if not authenticated
- 403 if not admin

### Endpoint 3: Approve Submission

**Method:** POST
**Path:** `/api/admin/photo-submissions/{id}/approve`

**URL Parameters:**
```typescript
{
  id: string; // UUID
}
```

**Request Headers:**
```typescript
{
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json"
}
```

**Request Body Type:** `ApproveSubmissionCommand`

**Response Type:** `ApproveSubmissionResponseDTO`

**Validation Rules:**
- review_notes: optional, max 500 characters
- is_daily_eligible: boolean, defaults to true
- metadata_overrides: optional, follows photo metadata validation rules
- Submission must be in "pending" status

**Error Responses:**
- 400 if submission already reviewed
- 404 if submission not found
- 422 if validation fails

**Implementation:**
```typescript
// src/pages/api/admin/photo-submissions/[id]/approve.ts
import type { APIRoute } from "astro";
import { z } from "zod";

const approveSchema = z.object({
  review_notes: z.string().max(500).optional(),
  is_daily_eligible: z.boolean().default(true),
  metadata_overrides: z.object({
    event_name: z.string().max(255).optional(),
    tags: z.array(z.string()).optional(),
    // ... other overridable fields
  }).optional(),
});

export const POST: APIRoute = async (context) => {
  // Auth check
  // Role check
  // Parse and validate body
  // Call approve_photo_submission database function
  // Return ApproveSubmissionResponseDTO
};
```

### Endpoint 4: Reject Submission

**Method:** POST
**Path:** `/api/admin/photo-submissions/{id}/reject`

**URL Parameters:**
```typescript
{
  id: string; // UUID
}
```

**Request Headers:**
```typescript
{
  Authorization: `Bearer ${accessToken}`,
  "Content-Type": "application/json"
}
```

**Request Body Type:** `RejectSubmissionCommand`

**Response Type:** `RejectSubmissionResponseDTO`

**Validation Rules:**
- review_notes: required, 1-500 characters
- delete_file: boolean, defaults to true
- Submission must be in "pending" status

**Error Responses:**
- 400 if submission already reviewed or missing required fields
- 404 if submission not found

**Implementation:**
```typescript
// src/pages/api/admin/photo-submissions/[id]/reject.ts
import type { APIRoute } from "astro";
import { z } from "zod";

const rejectSchema = z.object({
  review_notes: z.string().min(1).max(500),
  delete_file: z.boolean().default(true),
});

export const POST: APIRoute = async (context) => {
  // Auth check
  // Role check
  // Parse and validate body
  // Call reject_photo_submission database function
  // Return RejectSubmissionResponseDTO
};
```

### Client-Side Integration

**Fetching List:**
```typescript
const fetchSubmissions = async (
  status: SubmissionStatus | "all",
  page: number
): Promise<AdminPhotoSubmissionsResponseDTO> => {
  const params = new URLSearchParams({
    page: page.toString(),
    limit: "50",
  });

  if (status !== "all") {
    params.append("status", status);
  }

  const response = await fetch(`/api/admin/photo-submissions?${params}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch submissions");
  }

  return response.json();
};
```

**Fetching Detail:**
```typescript
const fetchSubmissionDetail = async (
  id: string
): Promise<AdminPhotoSubmissionDetailDTO> => {
  const response = await fetch(`/api/admin/photo-submissions/${id}`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch submission detail");
  }

  return response.json();
};
```

**Approving:**
```typescript
const approveSubmission = async (
  id: string,
  command: ApproveSubmissionCommand
): Promise<ApproveSubmissionResponseDTO> => {
  const response = await fetch(`/api/admin/photo-submissions/${id}/approve`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to approve submission");
  }

  return response.json();
};
```

**Rejecting:**
```typescript
const rejectSubmission = async (
  id: string,
  command: RejectSubmissionCommand
): Promise<RejectSubmissionResponseDTO> => {
  const response = await fetch(`/api/admin/photo-submissions/${id}/reject`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || "Failed to reject submission");
  }

  return response.json();
};
```

## 8. User Interactions

### 1. Status Filter Selection
**Trigger:** User clicks status filter dropdown
**Action:**
- Display dropdown with options: All, Pending, Approved, Rejected
- User selects a status
- Update `currentStatus` state
- Reset `currentPage` to 1
- Fetch submissions with new filter
- Update list display

### 2. Pagination Navigation
**Trigger:** User clicks page number or previous/next button
**Action:**
- Update `currentPage` state
- Fetch submissions for new page
- Scroll to top of list
- Update pagination controls (disable prev/next as appropriate)

### 3. Submission Card Click
**Trigger:** User clicks anywhere on submission card
**Action:**
- Set `selectedSubmissionId` to clicked submission ID
- Open detail modal
- Fetch full submission details
- Display loading state in modal while fetching
- Render full details when loaded

### 4. Quick Approve (from Card)
**Trigger:** User clicks approve button on submission card
**Action:**
- Show confirmation dialog: "Approve this submission?"
- If confirmed:
  - Set card loading state
  - Call approve API with default settings (is_daily_eligible: true)
  - On success: show success toast, refresh list
  - On error: show error toast, reset loading state

### 5. Quick Reject (from Card)
**Trigger:** User clicks reject button on submission card
**Action:**
- Open reject dialog with textarea for reason
- Validate reason is 1-500 characters
- If submitted:
  - Set card loading state
  - Call reject API with provided reason
  - On success: show success toast, refresh list
  - On error: show error toast, reset loading state

### 6. Open Detail Modal
**Trigger:** User clicks "View Details" or submission card
**Action:**
- Set `selectedSubmissionId`
- Open modal with loading state
- Fetch submission details
- Render full photo preview
- Display all metadata fields
- Show map preview with location pin
- Display moderation action buttons

### 7. Close Detail Modal
**Trigger:** User clicks close button, escape key, or outside modal
**Action:**
- Clear `selectedSubmissionId`
- Clear `submissionDetail`
- Reset `moderationAction` state
- Close modal

### 8. Approve with Options (from Modal)
**Trigger:** User clicks approve button in detail modal
**Action:**
- Display approval form with:
  - Optional review notes textarea (max 500 chars)
  - is_daily_eligible checkbox (checked by default)
  - Optional metadata overrides section (collapsed by default)
- User fills form
- Validate inputs
- On submit:
  - Set loading state
  - Call approve API with command object
  - On success: show success toast, close modal, refresh list
  - On error: display error message in modal

### 9. Reject with Reason (from Modal)
**Trigger:** User clicks reject button in detail modal
**Action:**
- Display rejection form with:
  - Required review notes textarea (1-500 chars)
  - delete_file checkbox (checked by default)
- User fills reason
- Validate reason length (1-500 chars)
- Show error if validation fails
- On submit:
  - Set loading state
  - Call reject API with command object
  - On success: show success toast, close modal, refresh list
  - On error: display error message in modal

### 10. Photo Preview Interaction
**Trigger:** User clicks photo in detail modal
**Action:**
- Open full-size photo preview (optional zoom)
- Allow pan/zoom for detailed inspection
- Provide download link for admin review

### 11. Map Verification
**Trigger:** Detail modal opens with coordinates
**Action:**
- Render Mapbox map with marker at submission coordinates
- Allow admin to pan/zoom for location verification
- Display coordinates as text for reference

### 12. Refresh List
**Trigger:** After successful moderation action
**Action:**
- Re-fetch submissions with current filters and page
- Update status counts
- Maintain scroll position if possible

## 9. Conditions and Validation

### 1. Admin Access Control
**Condition:** User must be authenticated and have `role = admin`
**Affected Components:** All (entire view)
**Interface State:**
- If not authenticated: redirect to `/login?redirect=/admin/photo-moderation`
- If authenticated but not admin: redirect to `/` with error toast
- If authorized: render view

### 2. Empty State Display
**Condition:** No submissions match current filter
**Affected Components:** SubmissionsList
**Interface State:**
- Hide submission grid
- Show centered empty state message: "No {status} submissions found"
- Display illustration or icon
- Provide button to clear filters

### 3. Loading State
**Condition:** Data is being fetched from API
**Affected Components:** SubmissionsList, SubmissionDetailModal
**Interface State:**
- Show loading skeletons for submission cards
- Show spinner in detail modal
- Disable filter controls and pagination during loading

### 4. Pagination Control State
**Condition:** Based on current page and total pages
**Affected Components:** Pagination
**Interface State:**
- Disable "Previous" button when `currentPage === 1`
- Disable "Next" button when `currentPage === totalPages`
- Highlight current page number
- Hide pagination if only 1 page

### 5. Quick Action Availability
**Condition:** Submission status must be "pending"
**Affected Components:** QuickActions
**Interface State:**
- Show approve/reject buttons only for pending submissions
- Hide buttons for approved/rejected submissions
- Show status badge instead for non-pending

### 6. Moderation Action State
**Condition:** Submission must be "pending" to moderate
**Affected Components:** ModerationActions
**Interface State:**
- Show action buttons only if status === "pending"
- If status === "approved": show approval details (reviewed_by, reviewed_at, review_notes)
- If status === "rejected": show rejection details (reviewed_by, reviewed_at, rejection_reason)
- Disable form during submission

### 7. Review Notes Validation (Approve)
**Condition:** Review notes are optional but limited to 500 chars
**Affected Components:** ModerationActions
**Interface State:**
- Show character count: "{count}/500"
- Display error if > 500 characters
- Allow submission with empty notes

### 8. Rejection Reason Validation
**Condition:** Rejection reason is required, 1-500 chars
**Affected Components:** ModerationActions, QuickActions reject dialog
**Interface State:**
- Show character count: "{count}/500"
- Display error if empty or > 500 characters
- Disable reject button until valid
- Show error message: "Rejection reason is required (1-500 characters)"

### 9. Metadata Override Validation
**Condition:** If admin provides overrides, they must match photo validation rules
**Affected Components:** ModerationActions metadata override section
**Interface State:**
- Validate year_utc: 1880-2025
- Validate coordinates if provided: lat [-90, 90], lon [-180, 180]
- Show inline validation errors for each field
- Disable submit until all overrides are valid

### 10. Photo Thumbnail Fallback
**Condition:** Thumbnail URL is null or fails to load
**Affected Components:** PhotoThumbnail
**Interface State:**
- Show placeholder icon (image icon or photo symbol)
- Display "No preview available" text

### 11. Map Rendering Condition
**Condition:** Submission has valid lat/lon coordinates
**Affected Components:** MapPreview
**Interface State:**
- If coordinates valid: render map with marker
- If coordinates invalid or missing: show error message "Invalid coordinates"

### 12. Error Display
**Condition:** API request fails
**Affected Components:** All components making API calls
**Interface State:**
- Show error toast for transient errors
- Display error message inline for form validation errors
- Provide retry button for failed fetches
- Log errors to console for debugging

### 13. Status Filter Badge Counts
**Condition:** Based on status_counts from API
**Affected Components:** StatusCounts
**Interface State:**
- Display count badge for each status
- If count is 0, show grayed out badge
- Update counts after moderation actions

### 14. Concurrent Moderation Protection
**Condition:** Another admin may have already moderated submission
**Affected Components:** ModerationActions
**Interface State:**
- On 400 "already reviewed" error: show error message
- Refresh detail view to show updated status
- Disable action buttons

## 10. Error Handling

### API Error Handling

**1. Authentication Errors (401)**
- **Cause:** Invalid or expired auth token
- **Handling:**
  - Display error toast: "Session expired. Please log in again."
  - Redirect to `/login?redirect=/admin/photo-moderation`

**2. Authorization Errors (403)**
- **Cause:** User is not admin
- **Handling:**
  - Display error toast: "You do not have permission to access this page."
  - Redirect to `/`

**3. Not Found Errors (404)**
- **Cause:** Submission doesn't exist
- **Handling:**
  - In list: show empty state
  - In detail modal: display error message "Submission not found", close modal after 2s
  - Log error to console

**4. Already Reviewed Errors (400)**
- **Cause:** Submission status is not "pending"
- **Handling:**
  - Display error message: "This submission has already been reviewed."
  - Refresh submission detail to show current status
  - Disable action buttons

**5. Validation Errors (400, 422)**
- **Cause:** Invalid request data
- **Handling:**
  - Parse error response for field-level errors
  - Display inline validation errors next to relevant fields
  - Highlight invalid fields in red
  - Show general error toast if no specific field errors

**6. Network Errors**
- **Cause:** Network connection issues, timeout
- **Handling:**
  - Display error toast: "Network error. Please check your connection."
  - Provide retry button
  - Disable form submission until error cleared

**7. Server Errors (500, 503)**
- **Cause:** Backend service issues
- **Handling:**
  - Display error toast: "Server error. Please try again later."
  - Log full error details to console
  - Provide retry button
  - Suggest contacting support if persistent

### Component Error Boundaries

**React Error Boundary**
- Wrap `PhotoModerationDashboard` in error boundary
- On error:
  - Log error to console
  - Display fallback UI: "Something went wrong. Please refresh the page."
  - Provide refresh button
  - Report error to monitoring service (if configured)

### Validation Error Handling

**Client-Side Validation**
- **Review Notes (Approve):**
  - Validate max 500 characters
  - Show error: "Review notes must be 500 characters or less"

- **Rejection Reason:**
  - Validate 1-500 characters required
  - Show error: "Rejection reason is required (1-500 characters)"

- **Metadata Overrides:**
  - Validate year: 1880-2025
  - Validate lat: -90 to 90
  - Validate lon: -180 to 180
  - Show field-specific error messages

**Server-Side Validation**
- Trust server validation as authoritative
- Parse and display server validation errors
- Map server error messages to user-friendly text

### Edge Cases

**1. Empty Submissions List**
- Display empty state with helpful message
- Suggest trying different filter or checking back later

**2. Large Pagination**
- Limit page numbers displayed (e.g., show 1 ... 5 6 7 ... 20)
- Provide direct page input for large lists

**3. Image Load Failures**
- Show placeholder with retry option
- Log failed URL to console
- Display "Image failed to load" message

**4. Map Load Failures**
- Display error message: "Map failed to load"
- Show coordinates as text fallback
- Provide coordinates in copyable format

**5. Slow API Responses**
- Show loading state immediately
- Display "Taking longer than expected..." after 5 seconds
- Provide cancel option for long requests

**6. Concurrent Submissions**
- If submission list changes during moderation, refresh list automatically
- Show toast: "New submissions available" with refresh button

**7. Session Timeout During Action**
- Detect 401 error during moderation action
- Save form state to localStorage
- Redirect to login with return URL
- Restore form state after re-authentication

## 11. Implementation Steps

### Step 1: Setup Types and API Endpoints
1.1. Add new DTO types to `src/types.ts`:
   - `AdminPhotoSubmissionListItemDTO`
   - `AdminPhotoSubmissionDetailDTO`
   - `AdminPhotoSubmissionsResponseDTO`
   - `StatusCountsDTO`
   - `ApproveSubmissionCommand`
   - `ApproveSubmissionResponseDTO`
   - `RejectSubmissionCommand`
   - `RejectSubmissionResponseDTO`

1.2. Add ViewModel types to `src/types.ts`:
   - `SubmissionStatus`
   - `SubmissionFilterState`
   - `PaginationState`
   - `ModerationActionState`
   - `PhotoSubmissionListViewModel`
   - `SubmissionDetailViewModel`

1.3. Create API endpoint: `src/pages/api/admin/photo-submissions.ts` (GET)
   - Implement auth and role checks
   - Implement query parameter parsing and validation
   - Implement database query with filters and pagination
   - Implement status counts aggregation
   - Return `AdminPhotoSubmissionsResponseDTO`

1.4. Create API endpoint: `src/pages/api/admin/photo-submissions/[id].ts` (GET)
   - Implement auth and role checks
   - Fetch submission by ID
   - Return `AdminPhotoSubmissionDetailDTO`
   - Handle 404 errors

1.5. Create API endpoint: `src/pages/api/admin/photo-submissions/[id]/approve.ts` (POST)
   - Implement auth and role checks
   - Validate request body with Zod
   - Call `approve_photo_submission` database function
   - Return `ApproveSubmissionResponseDTO`
   - Handle validation and business logic errors

1.6. Create API endpoint: `src/pages/api/admin/photo-submissions/[id]/reject.ts` (POST)
   - Implement auth and role checks
   - Validate request body with Zod
   - Call `reject_photo_submission` database function
   - Return `RejectSubmissionResponseDTO`
   - Handle validation errors

### Step 2: Create Custom Hook
2.1. Create `src/components/hooks/usePhotoModeration.ts`

2.2. Implement state management:
   - Define state interface
   - Initialize state with useState
   - Implement filter and pagination state

2.3. Implement data fetching:
   - Create `fetchSubmissions` function
   - Create `fetchSubmissionDetail` function
   - Use useEffect to trigger fetches on filter/page changes
   - Handle loading and error states

2.4. Implement moderation actions:
   - Create `approveSubmission` function
   - Create `rejectSubmission` function
   - Implement optimistic updates
   - Handle success and error cases

2.5. Implement modal controls:
   - Create `openDetailModal` function
   - Create `closeDetailModal` function
   - Trigger detail fetch on modal open

2.6. Export hook interface with all state and functions

### Step 3: Build Base Layout Components
3.1. Create `src/pages/admin/photo-moderation.astro`
   - Import Layout
   - Implement SSR flag: `export const prerender = false`
   - Implement auth check (redirect to login if not authenticated)
   - Implement admin role check (redirect to home if not admin)
   - Fetch initial data server-side (optional, for SSR)
   - Pass props to PhotoModerationDashboard

3.2. Create `src/components/PhotoModerationDashboard.tsx`
   - Import and use `usePhotoModeration` hook
   - Implement layout structure (header + content grid)
   - Render ModerationHeader with filters and counts
   - Render SubmissionsList with cards and pagination
   - Render SubmissionDetailModal conditionally based on state

### Step 4: Build Header Components
4.1. Create `src/components/ModerationHeader.tsx`
   - Accept props: currentStatus, statusCounts, onStatusChange
   - Render header with title "Photo Submissions"
   - Render StatusFilter component
   - Render StatusCounts component
   - Style with Tailwind (flexbox, responsive)

4.2. Create `src/components/StatusFilter.tsx`
   - Use Shadcn Select component
   - Implement options: All, Pending, Approved, Rejected
   - Handle selection change event
   - Style with Tailwind

4.3. Create `src/components/StatusCounts.tsx`
   - Accept statusCounts prop
   - Render badges for each status with counts
   - Style badges with color coding (pending: yellow, approved: green, rejected: red)
   - Use Shadcn Badge component

### Step 5: Build List Components
5.1. Create `src/components/SubmissionsList.tsx`
   - Accept props: submissions, pagination, isLoading, onSubmissionClick, onPageChange
   - Implement loading state with skeleton cards
   - Implement empty state message
   - Render grid of SubmissionCard components
   - Render Pagination component at bottom
   - Style with Tailwind (grid, responsive)

5.2. Create `src/components/SubmissionCard.tsx`
   - Accept submission prop and click handlers
   - Render Card component (Shadcn)
   - Render PhotoThumbnail component
   - Render SubmissionMetadata component
   - Render QuickActions component (if status is pending)
   - Render status badge
   - Implement click handler for card
   - Style with Tailwind (hover effects, transitions)

5.3. Create `src/components/PhotoThumbnail.tsx`
   - Accept thumbnailUrl and alt props
   - Render img element with object-fit cover
   - Implement loading skeleton
   - Implement error fallback (placeholder icon)
   - Style with Tailwind

5.4. Create `src/components/SubmissionMetadata.tsx`
   - Accept metadata props (eventName, yearUtc, submitterEmail, createdAt)
   - Render vertical stack of metadata fields
   - Format date with date-fns or Intl.DateTimeFormat
   - Style with Tailwind (text sizes, colors)

5.5. Create `src/components/QuickActions.tsx`
   - Accept submissionId and action handlers
   - Render approve button (green) and reject button (red)
   - Implement loading spinners during actions
   - Implement confirmation dialog for reject (with reason textarea)
   - Handle approve and reject clicks
   - Style with Tailwind (button variants)

5.6. Create `src/components/Pagination.tsx`
   - Accept currentPage, totalPages, onPageChange props
   - Use Shadcn Pagination component
   - Render page numbers (with ellipsis for large ranges)
   - Render Previous and Next buttons
   - Disable buttons based on current page
   - Handle page change events
   - Style with Tailwind

### Step 6: Build Detail Modal Components
6.1. Create `src/components/SubmissionDetailModal.tsx`
   - Accept isOpen, onClose, submissionId, onActionComplete props
   - Use Shadcn Dialog component
   - Fetch submission detail on open (via usePhotoModeration hook)
   - Implement loading state in modal
   - Render PhotoPreview component
   - Render MetadataDisplay component
   - Render MapPreview component (if coordinates available)
   - Render ModerationActions component
   - Handle close events (button, escape, outside click)

6.2. Create `src/components/PhotoPreview.tsx`
   - Accept photoUrl and alt props
   - Render full-size image
   - Implement optional zoom functionality (click to enlarge)
   - Provide download link
   - Style with Tailwind (max dimensions, rounded corners)

6.3. Create `src/components/MetadataDisplay.tsx`
   - Accept submission prop (AdminPhotoSubmissionDetailDTO)
   - Render definition list (dl/dt/dd) or grid layout
   - Display all metadata fields with labels
   - Format coordinates, dates, and arrays nicely
   - Highlight required fields
   - Style with Tailwind (grid, spacing, typography)

6.4. Create `src/components/MapPreview.tsx`
   - Accept lat and lon props
   - Initialize Mapbox GL JS map
   - Add marker at submission coordinates
   - Implement zoom controls
   - Handle map load errors gracefully
   - Style map container with Tailwind (fixed height, rounded corners)

6.5. Create `src/components/ModerationActions.tsx`
   - Accept submissionId, currentStatus, onApprove, onReject props
   - Implement conditional rendering based on status:
     - If "pending": show action forms
     - If "approved": show approval details (read-only)
     - If "rejected": show rejection details (read-only)
   - Implement approval form:
     - Review notes textarea (optional, max 500)
     - is_daily_eligible checkbox (default checked)
     - Metadata overrides section (collapsible)
     - Approve button
   - Implement rejection form:
     - Review notes textarea (required, 1-500)
     - delete_file checkbox (default checked)
     - Reject button
   - Implement form validation (client-side)
   - Handle approve and reject submissions
   - Display loading state during submission
   - Display error messages
   - Style with Tailwind (form layout, button variants)

### Step 7: Implement Validation and Error Handling
7.1. Add client-side validation to ModerationActions:
   - Validate review notes length
   - Validate rejection reason (required, 1-500)
   - Validate metadata overrides (year, coordinates)
   - Display inline error messages

7.2. Implement error handling in usePhotoModeration hook:
   - Parse API error responses
   - Set error state for display
   - Implement retry logic for transient errors

7.3. Add error boundaries:
   - Wrap PhotoModerationDashboard in React Error Boundary
   - Implement fallback UI for component errors

7.4. Implement toast notifications:
   - Success toasts for approve/reject actions
   - Error toasts for API failures
   - Use Shadcn Toast component or similar

### Step 8: Styling and Responsive Design
8.1. Apply Tailwind utility classes throughout:
   - Use responsive breakpoints (sm:, md:, lg:)
   - Implement dark mode support (dark: variant)
   - Use consistent spacing and typography

8.2. Implement loading states:
   - Skeleton loaders for submission cards
   - Spinners for form submissions
   - Disabled states for buttons during actions

8.3. Add transitions and animations:
   - Hover effects on cards and buttons
   - Smooth modal open/close transitions
   - Loading spinner animations

8.4. Ensure accessibility:
   - Proper ARIA labels for buttons and controls
   - Keyboard navigation support
   - Focus management in modals
   - Sufficient color contrast

### Step 9: Testing and Refinement
9.1. Test authentication and authorization flows:
   - Verify redirect to login when not authenticated
   - Verify redirect to home when not admin
   - Test with valid admin user

9.2. Test filtering and pagination:
   - Verify status filter updates list correctly
   - Test pagination navigation
   - Verify page resets on filter change

9.3. Test moderation actions:
   - Test approve with various options
   - Test reject with reason
   - Test quick actions from card
   - Verify list refresh after actions

9.4. Test error scenarios:
   - Test with invalid submission ID
   - Test with already-reviewed submission
   - Test network error handling
   - Test validation error display

9.5. Test edge cases:
   - Empty submissions list
   - Missing thumbnail URLs
   - Invalid coordinates
   - Large pagination
   - Concurrent moderation attempts

9.6. Refine UI/UX based on testing:
   - Adjust spacing and layout
   - Improve error messages
   - Optimize loading states
   - Enhance accessibility

### Step 10: Documentation and Deployment
10.1. Document component props and usage:
   - Add JSDoc comments to component interfaces
   - Document custom hook usage

10.2. Update API documentation:
   - Ensure endpoint documentation matches implementation
   - Document error responses

10.3. Perform final code review:
   - Check for TypeScript errors
   - Run ESLint and fix issues
   - Format code with Prettier

10.4. Deploy to staging:
   - Build and test production bundle
   - Verify SSR functionality
   - Test on staging environment

10.5. Monitor and iterate:
   - Monitor error logs
   - Gather admin feedback
   - Make refinements as needed
