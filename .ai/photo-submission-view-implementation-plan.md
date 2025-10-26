# View Implementation Plan: Photo Submission

## 1. Overview

The Photo Submission view allows authorized users (with `can_add_photos = true` permission) to submit football-related photos for admin review and potential inclusion in the game. The view provides a comprehensive form with photo upload, metadata fields, and an interactive map for location selection. Submitted photos enter a moderation queue with "pending" status and can be approved or rejected by administrators.

**Key Features:**
- Photo file upload with preview (max 10MB, jpg/jpeg/png/webp)
- Interactive map for location selection
- Comprehensive metadata fields (required and optional)
- Real-time validation with inline error feedback
- Success confirmation with submission tracking

## 2. View Routing

**Primary Route:** `/submit-photo`

**Route Configuration:**
```typescript
// src/pages/submit-photo.astro
export const prerender = false; // SSR required for auth check
```

**Access Control:**
- Requires authentication (Supabase session)
- Requires `can_add_photos = true` permission
- Redirect to `/login?returnUrl=/submit-photo` if not authenticated
- Show permission error if user lacks `can_add_photos` permission

## 3. Component Structure

```
PhotoSubmissionView (Astro Page)
└── AuthGuard (server-side check)
    └── PhotoSubmissionForm (React - Interactive Form Container)
        ├── FormHeader (React)
        │   ├── Title
        │   └── Description
        ├── PhotoFileUpload (React)
        │   ├── FileDropzone (Shadcn)
        │   ├── FilePreview (React)
        │   └── ValidationError (React)
        ├── RequiredFieldsSection (React)
        │   ├── FormField (Shadcn) - Event Name
        │   │   └── Input (Shadcn)
        │   ├── FormField (Shadcn) - Year
        │   │   └── Input type="number" (Shadcn)
        │   ├── LocationPicker (React)
        │   │   ├── MapboxMap (Mapbox GL)
        │   │   ├── CoordinateInputs (React)
        │   │   │   ├── FormField - Latitude
        │   │   │   └── FormField - Longitude
        │   │   └── MapInstructions
        │   ├── FormField (Shadcn) - License
        │   │   ├── Input (Shadcn)
        │   │   └── LicenseSuggestions (React)
        │   └── FormField (Shadcn) - Credit
        │       └── Input (Shadcn)
        ├── OptionalFieldsSection (React)
        │   ├── FormField (Shadcn) - Competition
        │   ├── FormField (Shadcn) - Place
        │   ├── FormField (Shadcn) - Description (Textarea)
        │   ├── FormField (Shadcn) - Source URL
        │   ├── TagsInput (React)
        │   │   └── Badge[] (Shadcn)
        │   ├── FormField (Shadcn) - Notes (Textarea)
        │   └── FormField (Shadcn) - Email
        ├── FormActions (React)
        │   ├── ValidationSummary (React)
        │   ├── Button (Shadcn) - Cancel
        │   └── Button (Shadcn) - Submit
        └── SubmissionSuccess (React) - Conditional Overlay
            ├── SuccessIcon
            ├── Message
            └── ActionButtons
                ├── Button - Submit Another
                └── Button - View My Submissions
```

## 4. Component Details

### PhotoSubmissionView (Astro Page)
- **Description**: Server-side route handler that enforces authentication and permission checks before rendering the interactive form.
- **Main Elements**:
  - Layout wrapper with header/navigation
  - Permission check logic
  - PhotoSubmissionForm React component island
- **Handled Events**: None (server-side only)
- **Validation**:
  - Check Supabase session exists
  - Verify user has `can_add_photos = true` in profile
- **Types**: None (uses Astro types)
- **Props**: None (top-level page)

### PhotoSubmissionForm (React Component)
- **Description**: Main interactive form container managing all submission state, validation, and API communication. Acts as the orchestrator for all child components.
- **Main Elements**:
  - Form element with proper ARIA attributes
  - Sections for required vs. optional fields
  - Submit/Cancel action buttons
  - Loading overlay during submission
  - Success modal on completion
- **Handled Events**:
  - `onSubmit`: Validate all fields, convert to FormData, POST to API
  - `onChange`: Per-field updates to formData state
  - `onCancel`: Navigate back or reset form
- **Validation**:
  - All required fields present and valid before enabling submit
  - Real-time validation on blur for immediate feedback
  - Final validation on submit attempt
- **Types**:
  - `PhotoSubmissionFormData` (state)
  - `ValidationErrors` (field errors)
  - `SubmissionState` (submission status)
  - `PhotoSubmissionCommand` (API request)
  - `PhotoSubmissionResponseDTO` (API response)
- **Props**:
  ```typescript
  type PhotoSubmissionFormProps = {
    userEmail?: string; // Pre-fill submitter_email if authenticated
    onSuccess?: (submissionId: string) => void;
    onCancel?: () => void;
  };
  ```

### PhotoFileUpload (React Component)
- **Description**: Handles photo file selection via drag-and-drop or file picker, validates file, and displays preview. Core component for primary submission content.
- **Main Elements**:
  - Dropzone area with dashed border (idle state)
  - Hidden file input (type="file", accept="image/*")
  - Image preview container (after selection)
  - Remove button (X icon)
  - Error message display
  - File size/type guidance text
- **Handled Events**:
  - `onDrop`: Handle dropped file
  - `onChange`: Handle file picker selection
  - `onRemove`: Clear selected file and preview
  - `onDragOver/onDragLeave`: Visual feedback during drag
- **Validation**:
  - File size ≤ 10MB (10 * 1024 * 1024 bytes)
  - File type in ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
  - File must be selected (required)
- **Types**:
  - `File | null` (selected file)
  - `FileValidationResult` (validation state)
  - `string | null` (preview URL)
- **Props**:
  ```typescript
  type PhotoFileUploadProps = {
    value: File | null;
    onChange: (file: File | null) => void;
    error?: string;
    disabled?: boolean;
  };
  ```

### LocationPicker (React Component)
- **Description**: Interactive map component for visual location selection with coordinate inputs. Allows users to click map or enter coordinates manually. Synchronizes map pin with coordinate inputs bidirectionally.
- **Main Elements**:
  - Mapbox GL map container (600px height recommended)
  - Single draggable pin marker
  - Coordinate input fields (lat/lon) below map
  - Map controls (zoom, pan)
  - Instructions text ("Click on the map to select location")
- **Handled Events**:
  - `onMapClick`: Place or move pin, update coordinates
  - `onPinDrag`: Update coordinates while dragging pin
  - `onCoordinateChange`: Update map pin when coordinates typed manually
- **Validation**:
  - Latitude range: -90 ≤ lat ≤ 90
  - Longitude range: -180 ≤ lon ≤ 180
  - Both coordinates required
  - Validate on coordinate input change (debounced)
- **Types**:
  - `PinLocation` ({ lat: number, lon: number })
  - `MapBounds` (map viewport)
- **Props**:
  ```typescript
  type LocationPickerProps = {
    lat: number | null;
    lon: number | null;
    onChange: (location: { lat: number; lon: number }) => void;
    error?: string;
    disabled?: boolean;
  };
  ```

### TagsInput (React Component)
- **Description**: Custom input component for adding/removing tags. Displays tags as badges and allows adding via Enter key or comma separation.
- **Main Elements**:
  - Text input for new tag entry
  - Badge components displaying current tags with remove buttons
  - Suggested tags (optional, clickable)
  - Tag count indicator
- **Handled Events**:
  - `onKeyDown`: Add tag on Enter, handle Backspace to remove last tag
  - `onChange`: Update input value
  - `onAddTag`: Add tag to array
  - `onRemoveTag`: Remove tag from array by index
  - `onSuggestionClick`: Add suggested tag
- **Validation**:
  - Tag not empty after trim
  - Tag not duplicate (case-insensitive)
  - Optional: max tag length (e.g., 50 chars)
- **Types**:
  - `string[]` (tags array)
- **Props**:
  ```typescript
  type TagsInputProps = {
    value: string[];
    onChange: (tags: string[]) => void;
    placeholder?: string;
    suggestions?: string[]; // e.g., ["world-cup", "champions-league", "final"]
    maxTags?: number;
    disabled?: boolean;
  };
  ```

### FormField (Shadcn UI Component - Reused)
- **Description**: Standard form field wrapper from Shadcn UI providing label, input, error message, and description structure. Used for all text/number inputs.
- **Main Elements**:
  - Label element
  - Input or Textarea element
  - Error message (conditional)
  - Helper text (optional)
- **Handled Events**: Delegates to child Input component
- **Validation**: Displays validation errors passed via props
- **Types**: Standard Shadcn FormField types
- **Props**: Standard Shadcn FormField props

### SubmissionSuccess (React Component)
- **Description**: Modal/overlay displayed after successful submission, showing confirmation and next action options.
- **Main Elements**:
  - Success icon (checkmark)
  - Confirmation message with submission_id
  - Status badge ("Pending Review")
  - Action buttons (Submit Another, View Submissions)
  - Optional: Estimated review time message
- **Handled Events**:
  - `onSubmitAnother`: Reset form and close modal
  - `onViewSubmissions`: Navigate to submission history page
  - `onClose`: Close modal (optional)
- **Validation**: None
- **Types**:
  - `PhotoSubmissionResponseDTO` (submission details)
- **Props**:
  ```typescript
  type SubmissionSuccessProps = {
    submission: PhotoSubmissionResponseDTO;
    onSubmitAnother: () => void;
    onViewSubmissions: () => void;
  };
  ```

## 5. Types

### API Request Type (Existing/Modified)
```typescript
/**
 * Command to submit a photo for review
 * Used to construct FormData for multipart/form-data request
 */
export type PhotoSubmissionCommand = {
  photo_file: File; // Required
  event_name: string; // Required, max 255 chars
  competition?: string; // Optional, max 255 chars
  year_utc: number; // Required, range [1880, 2025]
  place?: string; // Optional, max 255 chars
  lat: number; // Required, range [-90, 90]
  lon: number; // Required, range [-180, 180]
  description?: string; // Optional
  source_url?: string; // Optional, valid URL
  license: string; // Required, max 100 chars
  credit: string; // Required, max 255 chars
  tags?: string[]; // Optional array
  notes?: string; // Optional
  submitter_email?: string; // Optional, valid email format
};
```

### API Response Type (New)
```typescript
/**
 * Response after successful photo submission
 * Confirms submission entered pending review status
 */
export type PhotoSubmissionResponseDTO = {
  submission_id: string; // UUID
  status: "pending"; // Always "pending" for new submissions
  message: string; // Success message
  created_at: string; // ISO 8601 timestamp
};
```

### Client-Side Form State Type (New)
```typescript
/**
 * Form state for controlled inputs
 * All fields as strings initially to handle empty states
 * Converted to proper types on submission
 */
export type PhotoSubmissionFormData = {
  photo_file: File | null;
  event_name: string;
  competition: string;
  year_utc: string; // String in input, converts to number for API
  place: string;
  lat: string; // String in input, converts to number for API
  lon: string; // String in input, converts to number for API
  description: string;
  source_url: string;
  license: string;
  credit: string;
  tags: string[];
  notes: string;
  submitter_email: string;
};
```

### Validation Types (New)
```typescript
/**
 * Per-field validation errors
 * Key matches PhotoSubmissionFormData keys
 */
export type ValidationErrors = {
  [K in keyof PhotoSubmissionFormData]?: string;
};

/**
 * File validation result with preview
 */
export type FileValidationResult = {
  isValid: boolean;
  error?: string;
  preview?: string; // base64 or object URL for preview
};
```

### Submission State Type (New)
```typescript
/**
 * Overall form submission state
 * Tracks submission lifecycle from idle to success/error
 */
export type SubmissionState = {
  status: "idle" | "validating" | "submitting" | "success" | "error";
  error?: string; // General error message
  result?: PhotoSubmissionResponseDTO; // Success result
};
```

### Location Type (Reuse from existing types)
```typescript
// From types.ts
export type PinLocation = {
  lat: number; // -90 to 90
  lon: number; // -180 to 180
};
```

## 6. State Management

State management is centralized in the `PhotoSubmissionForm` component using a custom hook for cleaner separation of concerns.

### Custom Hook: `usePhotoSubmission()`

**Purpose**: Encapsulates all form state, validation logic, and API submission handling.

**Location**: `src/components/hooks/usePhotoSubmission.ts`

**State Variables**:
```typescript
const [formData, setFormData] = useState<PhotoSubmissionFormData>(initialFormData);
const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
const [submissionState, setSubmissionState] = useState<SubmissionState>({ status: "idle" });
const [photoPreview, setPhotoPreview] = useState<string | null>(null);
```

**Hook Interface**:
```typescript
type UsePhotoSubmissionReturn = {
  // State
  formData: PhotoSubmissionFormData;
  validationErrors: ValidationErrors;
  submissionState: SubmissionState;
  photoPreview: string | null;
  isFormValid: boolean; // Computed: all required fields valid

  // Actions
  updateField: <K extends keyof PhotoSubmissionFormData>(
    field: K,
    value: PhotoSubmissionFormData[K]
  ) => void;
  updatePhoto: (file: File | null) => void;
  validateField: (field: keyof PhotoSubmissionFormData) => boolean;
  validateAllFields: () => boolean;
  submitPhoto: () => Promise<void>;
  resetForm: () => void;
};
```

**Hook Logic Flow**:

1. **Field Updates** (`updateField`):
   - Update formData state
   - Optionally validate on change for critical fields (year, lat, lon)
   - Clear error for that field on valid change

2. **Photo Updates** (`updatePhoto`):
   - Validate file size and type
   - Generate preview URL using `URL.createObjectURL()`
   - Clean up previous preview URL
   - Update formData.photo_file and photoPreview state

3. **Field Validation** (`validateField`):
   - Run field-specific validation rules (see section 9)
   - Update validationErrors state
   - Return boolean validity

4. **Form Submission** (`submitPhoto`):
   ```typescript
   async function submitPhoto() {
     // 1. Validate all fields
     setSubmissionState({ status: "validating" });
     if (!validateAllFields()) {
       setSubmissionState({ status: "idle" });
       return;
     }

     // 2. Prepare FormData
     const apiFormData = new FormData();
     apiFormData.append("photo_file", formData.photo_file!);
     apiFormData.append("event_name", formData.event_name);
     apiFormData.append("year_utc", formData.year_utc);
     apiFormData.append("lat", formData.lat);
     apiFormData.append("lon", formData.lon);
     apiFormData.append("license", formData.license);
     apiFormData.append("credit", formData.credit);

     // Append optional fields if present
     if (formData.competition) apiFormData.append("competition", formData.competition);
     if (formData.place) apiFormData.append("place", formData.place);
     if (formData.description) apiFormData.append("description", formData.description);
     if (formData.source_url) apiFormData.append("source_url", formData.source_url);
     if (formData.notes) apiFormData.append("notes", formData.notes);
     if (formData.submitter_email) apiFormData.append("submitter_email", formData.submitter_email);
     if (formData.tags.length > 0) apiFormData.append("tags", JSON.stringify(formData.tags));

     // 3. Submit to API
     setSubmissionState({ status: "submitting" });
     try {
       const response = await fetch("/api/photo-submissions", {
         method: "POST",
         body: apiFormData,
         // No Content-Type header - browser sets it with boundary for multipart
       });

       if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.error || "Submission failed");
       }

       const result: PhotoSubmissionResponseDTO = await response.json();
       setSubmissionState({ status: "success", result });
     } catch (error) {
       setSubmissionState({
         status: "error",
         error: error.message || "Failed to submit photo"
       });
     }
   }
   ```

5. **Form Reset** (`resetForm`):
   - Reset formData to initial empty state
   - Clear all validation errors
   - Clear photo preview and clean up URL
   - Reset submission state to idle

### Additional Hooks

**`useFileUpload()`** - Extracted file-specific logic:
- File validation (size, type)
- Preview generation
- URL cleanup on unmount

**`useLocationPicker()`** - Map-specific logic:
- Mapbox initialization
- Pin placement/dragging
- Coordinate synchronization

These smaller hooks can be used within `usePhotoSubmission` or independently for better reusability.

## 7. API Integration

### Endpoint Details

**Endpoint**: `POST /api/photo-submissions`

**Request Format**: `multipart/form-data`

**Headers**:
- `Authorization: Bearer {token}` (automatic from Supabase client)
- `Content-Type`: Not set manually (browser adds with boundary)

**Request Body** (FormData):
All fields from `PhotoSubmissionCommand` type, with file as binary and others as strings.

**Response Type**: `PhotoSubmissionResponseDTO`

**Success Response** (201 Created):
```json
{
  "submission_id": "550e8400-e29b-41d4-a716-446655440000",
  "status": "pending",
  "message": "Photo submitted successfully and is pending admin review",
  "created_at": "2025-10-26T14:30:00Z"
}
```

**Error Responses**:

1. **400 Bad Request** - Validation errors:
```json
{
  "error": "Validation failed",
  "details": [
    "year_utc must be between 1880 and 2025",
    "lat must be between -90 and 90"
  ],
  "timestamp": "2025-10-26T14:30:00Z"
}
```

2. **413 Payload Too Large** - File size exceeded:
```json
{
  "error": "Photo file exceeds 10MB limit",
  "timestamp": "2025-10-26T14:30:00Z"
}
```

3. **429 Too Many Requests** - Rate limit:
```json
{
  "error": "Submission rate limit exceeded",
  "retry_after": 3600,
  "timestamp": "2025-10-26T14:30:00Z"
}
```

### Integration Steps

1. **Prepare FormData**:
   - Create new FormData instance
   - Append file directly as binary
   - Convert all numbers to strings before appending
   - Stringify arrays (tags) as JSON
   - Only append optional fields if present

2. **Make Request**:
   - Use `fetch()` API (or Axios if preferred)
   - Let browser set Content-Type with boundary
   - Include Supabase session token automatically via client

3. **Handle Response**:
   - Parse JSON response
   - On 2xx: Update state to success, show SubmissionSuccess modal
   - On 4xx: Parse error.details, map to field errors if possible
   - On 429: Show retry message with countdown
   - On 5xx: Show generic error message

4. **Error Mapping**:
   ```typescript
   function mapApiErrorsToFields(details: string[]): ValidationErrors {
     const errors: ValidationErrors = {};
     details.forEach(detail => {
       // Parse details like "year_utc must be between 1880 and 2025"
       // Map to field name and set error message
       if (detail.includes("year_utc")) errors.year_utc = detail;
       if (detail.includes("lat")) errors.lat = detail;
       // ... etc
     });
     return errors;
   }
   ```

## 8. User Interactions

### 1. Page Load
**User Action**: Navigate to `/submit-photo`

**System Response**:
- Check authentication status
- If not authenticated: Redirect to `/login?returnUrl=/submit-photo`
- If authenticated but no permission: Show permission error page
- If authorized: Render PhotoSubmissionForm with empty fields

**UI State**: Form in idle state, all fields empty, submit button disabled

### 2. Photo Selection
**User Action**: Click "Choose Photo" or drag-and-drop file onto dropzone

**System Response**:
- Validate file size (≤10MB) and type (jpg/jpeg/png/webp)
- If valid: Generate preview, update formData.photo_file, clear any previous error
- If invalid: Show error message below dropzone, don't update state

**UI State**: Preview displayed with remove button, error cleared (if previously shown)

### 3. Photo Removal
**User Action**: Click X button on photo preview

**System Response**:
- Clear formData.photo_file
- Clean up preview URL to prevent memory leak
- Clear any photo-related validation errors

**UI State**: Return to dropzone idle state

### 4. Fill Event Name
**User Action**: Type in event name field, then blur (tab away)

**System Response**:
- Update formData.event_name on change
- On blur: Validate field (required, ≤255 chars)
- If invalid: Show error message below field, red border
- If valid: Clear any previous error

**UI State**: Field shows error state if invalid, normal state if valid

### 5. Select Year
**User Action**: Type or use spinner in year number input

**System Response**:
- Update formData.year_utc on change
- Validate in real-time (range 1880-2025)
- Show error immediately if out of range
- Clear error when valid value entered

**UI State**: Error shown/cleared as user types

### 6. Select Location on Map
**User Action**: Click on map to place pin

**System Response**:
- Convert click coordinates to lat/lon
- Update map pin position
- Update formData.lat and formData.lon
- Update coordinate input fields
- Validate coordinates (should always be valid from map)

**UI State**: Pin appears on map, coordinate inputs update

### 7. Enter Coordinates Manually
**User Action**: Type lat or lon value in coordinate inputs

**System Response**:
- Update formData.lat or formData.lon on change
- Validate range on blur
- If valid: Update map pin position
- If invalid: Show error, don't move pin

**UI State**: Inputs sync with map when valid

### 8. Fill License Field
**User Action**: Type in license field or click suggested license

**System Response**:
- Update formData.license on change
- Show suggestions dropdown (e.g., "CC-BY-SA 4.0", "CC-BY 4.0", "Public Domain")
- On suggestion click: Populate field with full license text
- Validate on blur (required, ≤100 chars)

**UI State**: Suggestions shown while typing, error shown if invalid on blur

### 9. Fill Credit Field
**User Action**: Type in credit field (photographer/source name)

**System Response**:
- Update formData.credit on change
- Validate on blur (required, ≤255 chars)
- Show error if empty or too long

**UI State**: Error shown on blur if invalid

### 10. Add Tags
**User Action**: Type tag name and press Enter (or type comma)

**System Response**:
- Validate tag not empty and not duplicate
- If valid: Add to formData.tags array, clear input
- If invalid: Show brief error message
- Display tag as Badge with remove button

**UI State**: New badge appears, input clears

### 11. Remove Tag
**User Action**: Click X on tag badge

**System Response**:
- Remove tag from formData.tags array at that index

**UI State**: Badge disappears

### 12. Fill Optional Fields
**User Action**: Type in competition, place, description, source_url, notes, or email fields

**System Response**:
- Update formData on change
- Validate email format if email field filled (on blur)
- No validation for other optional fields (accept any input)

**UI State**: Errors only shown for email if format invalid

### 13. Attempt Submit with Errors
**User Action**: Click "Submit Photo" button with invalid/missing required fields

**System Response**:
- Run full validation on all fields
- Highlight all invalid fields with errors
- Disable submit button (should already be disabled)
- Scroll to first error
- Show summary: "Please fix X errors before submitting"

**UI State**: All errors visible, form not submitted

### 14. Successful Submit
**User Action**: Click "Submit Photo" with all fields valid

**System Response**:
- Change submit button to loading state ("Submitting...")
- Disable all form inputs
- Send POST request to API
- On success (201): Show SubmissionSuccess modal overlay

**UI State**: Loading state, then success modal over form

### 15. Submit Another Photo
**User Action**: Click "Submit Another Photo" in success modal

**System Response**:
- Close modal
- Reset form to initial empty state
- Clear all errors and preview
- Focus on photo upload field

**UI State**: Clean form ready for new submission

### 16. View Submissions
**User Action**: Click "View My Submissions" in success modal

**System Response**:
- Navigate to `/my-submissions` page (future implementation)

**UI State**: Navigate away from form

### 17. Handle Submission Error
**User Action**: Submit triggers API error (network, validation, rate limit)

**System Response**:
- Parse error response
- If 400 with field details: Map to field errors, show inline
- If 429: Show "Too many submissions. Try again in X minutes."
- If 5xx: Show "Server error. Please try again later."
- Keep form populated (don't clear data)
- Re-enable submit button

**UI State**: Error messages shown, form editable, can retry

### 18. Cancel Submission
**User Action**: Click "Cancel" button or browser back

**System Response**:
- Show confirmation dialog if form has data: "Discard changes?"
- If confirmed: Navigate back or to home page
- If cancelled: Stay on form

**UI State**: Confirmation dialog or navigate away

## 9. Conditions and Validation

### Required Field Validations

#### 1. Photo File (`photo_file`)
**Components**: PhotoFileUpload

**Conditions**:
- File must be selected
- File size ≤ 10MB (10,485,760 bytes)
- File type in ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

**Validation Logic**:
```typescript
function validatePhotoFile(file: File | null): string | null {
  if (!file) return "Photo is required";
  if (file.size > 10 * 1024 * 1024) return "Photo must be under 10MB";
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) return "Photo must be JPG, PNG, or WebP";
  return null; // Valid
}
```

**UI Impact**:
- Error shown below dropzone
- Submit button disabled if invalid
- Preview not generated if invalid

#### 2. Event Name (`event_name`)
**Components**: FormField + Input

**Conditions**:
- Must not be empty after trim
- Maximum length: 255 characters

**Validation Logic**:
```typescript
function validateEventName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Event name is required";
  if (trimmed.length > 255) return "Event name must be 255 characters or less";
  return null;
}
```

**When Validated**: On blur, on submit

**UI Impact**:
- Red border on input if invalid
- Error message below field
- Submit disabled if invalid

#### 3. Year (`year_utc`)
**Components**: FormField + Input type="number"

**Conditions**:
- Must be a valid integer
- Range: 1880 ≤ year ≤ 2025

**Validation Logic**:
```typescript
function validateYear(value: string): string | null {
  const year = parseInt(value, 10);
  if (isNaN(year)) return "Year must be a number";
  if (!Number.isInteger(year)) return "Year must be a whole number";
  if (year < 1880) return "Year must be 1880 or later";
  if (year > 2025) return "Year must be 2025 or earlier";
  return null;
}
```

**When Validated**: On change (real-time), on submit

**UI Impact**:
- Error shown immediately if out of range
- HTML5 min/max attributes prevent invalid entry
- Submit disabled if invalid

#### 4. Latitude (`lat`)
**Components**: LocationPicker coordinate input

**Conditions**:
- Must be a valid number
- Range: -90 ≤ lat ≤ 90
- Precision: up to 6 decimal places

**Validation Logic**:
```typescript
function validateLatitude(value: string): string | null {
  const lat = parseFloat(value);
  if (isNaN(lat)) return "Latitude must be a number";
  if (lat < -90) return "Latitude must be -90 or greater";
  if (lat > 90) return "Latitude must be 90 or less";
  return null;
}
```

**When Validated**: On blur, when syncing from map

**UI Impact**:
- Error shown below input
- Map pin doesn't move if invalid manual entry
- Submit disabled if invalid

#### 5. Longitude (`lon`)
**Components**: LocationPicker coordinate input

**Conditions**:
- Must be a valid number
- Range: -180 ≤ lon ≤ 180
- Precision: up to 6 decimal places

**Validation Logic**:
```typescript
function validateLongitude(value: string): string | null {
  const lon = parseFloat(value);
  if (isNaN(lon)) return "Longitude must be a number";
  if (lon < -180) return "Longitude must be -180 or greater";
  if (lon > 180) return "Longitude must be 180 or less";
  return null;
}
```

**When Validated**: On blur, when syncing from map

**UI Impact**: Same as latitude

#### 6. License (`license`)
**Components**: FormField + Input with suggestions

**Conditions**:
- Must not be empty after trim
- Maximum length: 100 characters

**Validation Logic**:
```typescript
function validateLicense(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "License is required";
  if (trimmed.length > 100) return "License must be 100 characters or less";
  return null;
}
```

**When Validated**: On blur, on submit

**UI Impact**:
- Error message below field
- Suggestions dropdown for common licenses
- Submit disabled if invalid

#### 7. Credit (`credit`)
**Components**: FormField + Input

**Conditions**:
- Must not be empty after trim
- Maximum length: 255 characters

**Validation Logic**:
```typescript
function validateCredit(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Credit/photographer is required";
  if (trimmed.length > 255) return "Credit must be 255 characters or less";
  return null;
}
```

**When Validated**: On blur, on submit

**UI Impact**: Same as event name

### Optional Field Validations

#### 8. Competition (`competition`)
**Conditions**: Optional, max 255 characters

**Validation Logic**:
```typescript
function validateCompetition(value: string): string | null {
  if (value.length === 0) return null; // Optional
  if (value.length > 255) return "Competition must be 255 characters or less";
  return null;
}
```

#### 9. Place (`place`)
**Conditions**: Optional, max 255 characters

**Validation Logic**: Same as competition

#### 10. Email (`submitter_email`)
**Conditions**: Optional, but if provided must be valid email format

**Validation Logic**:
```typescript
function validateEmail(value: string): string | null {
  if (value.length === 0) return null; // Optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  return null;
}
```

**When Validated**: On blur

**UI Impact**: Error shown if format invalid

#### 11. Source URL (`source_url`)
**Conditions**: Optional, should be valid URL if provided

**Validation Logic**:
```typescript
function validateSourceUrl(value: string): string | null {
  if (value.length === 0) return null; // Optional
  try {
    new URL(value);
    return null;
  } catch {
    return "Please enter a valid URL";
  }
}
```

### Overall Form Validation

**Form Valid Condition**:
```typescript
const isFormValid =
  formData.photo_file !== null &&
  validatePhotoFile(formData.photo_file) === null &&
  validateEventName(formData.event_name) === null &&
  validateYear(formData.year_utc) === null &&
  validateLatitude(formData.lat) === null &&
  validateLongitude(formData.lon) === null &&
  validateLicense(formData.license) === null &&
  validateCredit(formData.credit) === null &&
  // Optional fields only if they have values
  (formData.competition === '' || validateCompetition(formData.competition) === null) &&
  (formData.place === '' || validatePlace(formData.place) === null) &&
  (formData.submitter_email === '' || validateEmail(formData.submitter_email) === null) &&
  (formData.source_url === '' || validateSourceUrl(formData.source_url) === null);
```

**Submit Button State**:
- Disabled when: `!isFormValid || submissionState.status === 'submitting'`
- Enabled when: `isFormValid && submissionState.status !== 'submitting'`

## 10. Error Handling

### Client-Side Validation Errors

**Trigger**: User input fails validation

**Handling**:
- Display inline error message below relevant field
- Apply error styling (red border, red text)
- Keep error until user corrects and field validates successfully
- On submit attempt, highlight all invalid fields and scroll to first error

**User Recovery**: Fix the invalid field value

### Authentication Errors

**Trigger**: User not logged in or session expired

**Handling**:
- Detect missing Supabase session in Astro middleware
- Redirect to `/login?returnUrl=/submit-photo`
- Show message: "Please log in to submit photos"

**User Recovery**: Log in and get redirected back to form

### Permission Errors

**Trigger**: User logged in but `can_add_photos = false`

**Handling**:
- Show dedicated permission error page (instead of form)
- Message: "You don't have permission to submit photos. Please contact an administrator to request access."
- Provide link to home page or user profile

**User Recovery**: Contact admin to grant permission

### File Size Error (413)

**Trigger**: Photo file exceeds 10MB

**Handling**:
- Validate on client before submission (prevent API call)
- Show error: "Photo must be under 10MB. Please choose a smaller file or compress the image."
- Provide link to image compression tools (optional)

**User Recovery**: Compress image and re-upload

### File Type Error (400)

**Trigger**: Photo file not jpg/jpeg/png/webp

**Handling**:
- Validate on client before submission
- Show error: "Please choose a JPG, PNG, or WebP image file."

**User Recovery**: Convert image format and re-upload

### API Validation Error (400)

**Trigger**: Server-side validation fails (e.g., coordinate out of range)

**Handling**:
- Parse `response.details` array from error response
- Map error messages to corresponding fields
- Display errors inline on affected fields
- Show general error banner: "Please fix validation errors below"

**Example Error Response**:
```json
{
  "error": "Validation failed",
  "details": [
    "year_utc must be between 1880 and 2025",
    "license is required"
  ]
}
```

**Mapping Logic**:
```typescript
function handleValidationErrors(details: string[]) {
  const fieldErrors: ValidationErrors = {};
  details.forEach(detail => {
    const lower = detail.toLowerCase();
    if (lower.includes('year')) fieldErrors.year_utc = detail;
    if (lower.includes('lat')) fieldErrors.lat = detail;
    if (lower.includes('lon')) fieldErrors.lon = detail;
    if (lower.includes('license')) fieldErrors.license = detail;
    if (lower.includes('credit')) fieldErrors.credit = detail;
    if (lower.includes('event_name')) fieldErrors.event_name = detail;
    // Add more mappings as needed
  });
  setValidationErrors(fieldErrors);
}
```

**User Recovery**: Correct the highlighted fields and resubmit

### Rate Limit Error (429)

**Trigger**: Too many submissions in short time

**Handling**:
- Parse `retry_after` from response (seconds)
- Show error banner: "Too many submissions. Please try again in {X} minutes."
- Disable submit button for countdown duration
- Optional: Show countdown timer

**User Recovery**: Wait for rate limit to expire

### Network Error

**Trigger**: fetch() throws (no internet, server unreachable)

**Handling**:
- Catch network errors in try/catch
- Show error banner: "Network error. Please check your connection and try again."
- Keep form data intact
- Enable retry button

**User Recovery**: Check connection and click retry

### Server Error (500)

**Trigger**: Unexpected server error

**Handling**:
- Show generic error message: "Server error. Please try again later."
- Log error details to console for debugging
- Keep form data intact
- Enable retry button

**User Recovery**: Wait and retry later

### Map Load Failure

**Trigger**: Mapbox fails to initialize or load

**Handling**:
- Show error message in map container: "Map failed to load"
- Provide fallback: Manual coordinate entry fields always visible
- Show instructions: "Please enter coordinates manually"
- Map functionality gracefully degrades

**User Recovery**: Enter lat/lon manually

### Image Preview Failure

**Trigger**: Cannot generate preview from selected file

**Handling**:
- Log error to console
- Show placeholder or no preview
- Allow submission to continue (preview is UX enhancement, not required)

**User Recovery**: None needed, can still submit

### Form Abandonment Protection

**Trigger**: User tries to navigate away with unsaved changes

**Handling**:
- Detect if formData has been modified from initial state
- Show browser confirmation dialog: "You have unsaved changes. Are you sure you want to leave?"
- Implemented via `beforeunload` event

**User Recovery**: Cancel navigation or confirm to discard

## 11. Implementation Steps

### Step 1: Create Type Definitions
1. Add new types to `src/types.ts`:
   - `PhotoSubmissionCommand`
   - `PhotoSubmissionResponseDTO`
   - `PhotoSubmissionFormData`
   - `ValidationErrors`
   - `FileValidationResult`
   - `SubmissionState`
2. Add validation constants to `ValidationConstants` object
3. Export all new types for use in components

### Step 2: Create Astro Page with Auth Guard
1. Create `src/pages/submit-photo.astro`
2. Set `export const prerender = false` for SSR
3. Check Supabase session via `context.locals.supabase.auth.getSession()`
4. If no session: Redirect to `/login?returnUrl=/submit-photo`
5. Query user profile to check `can_add_photos` permission
6. If no permission: Render permission error component
7. If authorized: Render layout with PhotoSubmissionForm React island

### Step 3: Create usePhotoSubmission Hook
1. Create `src/components/hooks/usePhotoSubmission.ts`
2. Define state variables (formData, validationErrors, submissionState, photoPreview)
3. Implement `updateField` function with field updates
4. Implement field validation functions (validatePhotoFile, validateEventName, etc.)
5. Implement `validateField` and `validateAllFields` functions
6. Implement `updatePhoto` with file validation and preview generation
7. Implement `submitPhoto` function:
   - Validate all fields
   - Create FormData object
   - POST to `/api/photo-submissions`
   - Handle response/errors
8. Implement `resetForm` function
9. Return hook interface

### Step 4: Create PhotoFileUpload Component
1. Create `src/components/PhotoFileUpload.tsx`
2. Implement dropzone UI with drag-and-drop handlers
3. Add hidden file input with accept="image/*"
4. Implement file validation (size, type)
5. Generate preview using `URL.createObjectURL()`
6. Clean up preview URL on unmount with `useEffect`
7. Implement remove file functionality
8. Display validation errors
9. Style with Tailwind (dashed border, hover state, preview container)

### Step 5: Create LocationPicker Component (or Reuse)
1. Check if LocationPicker exists from game implementation
2. If yes: Extract and adapt for form use
3. If no: Create `src/components/LocationPicker.tsx`
   - Initialize Mapbox GL map
   - Implement single pin placement on click
   - Add coordinate input fields (lat/lon)
   - Bidirectional sync: map click updates inputs, input change updates pin
   - Validate coordinate ranges
   - Style with Tailwind

### Step 6: Create TagsInput Component
1. Create `src/components/TagsInput.tsx`
2. Implement text input for new tags
3. Handle Enter key and comma separation to add tags
4. Display tags as Shadcn Badge components with remove buttons
5. Implement removeTag by index
6. Prevent duplicate tags (case-insensitive)
7. Optional: Add suggested tags as clickable buttons
8. Style with Tailwind

### Step 7: Create SubmissionSuccess Component
1. Create `src/components/SubmissionSuccess.tsx`
2. Design modal/overlay with success icon (Shadcn Dialog or custom)
3. Display submission_id and "Pending Review" badge
4. Add action buttons:
   - "Submit Another Photo" (calls resetForm)
   - "View My Submissions" (navigate to /my-submissions)
5. Style with Tailwind

### Step 8: Build PhotoSubmissionForm Component
1. Create `src/components/PhotoSubmissionForm.tsx`
2. Use `usePhotoSubmission()` hook
3. Render form element with sections:
   - Header with title and description
   - PhotoFileUpload component
   - Required fields section (event_name, year, location, license, credit)
   - Optional fields section (collapsible or always visible)
4. For each field:
   - Use Shadcn FormField wrapper
   - Pass value from formData
   - Pass error from validationErrors
   - Pass onChange handler
5. Add LocationPicker component
6. Add TagsInput component
7. Implement form action buttons:
   - Cancel button (navigate back)
   - Submit button (disabled when !isFormValid or submitting)
8. Show loading state during submission
9. Conditionally render SubmissionSuccess on success
10. Add keyboard navigation and ARIA attributes

### Step 9: Style the Form
1. Use Tailwind utility classes for layout
2. Implement responsive design (mobile-first)
3. Use Shadcn UI components for consistent styling
4. Add visual hierarchy (sections, spacing, borders)
5. Style validation states (red borders, error text color)
6. Style loading state (spinner, disabled fields)
7. Test accessibility (color contrast, focus states)

### Step 10: Create API Endpoint (Backend)
1. Create `src/pages/api/photo-submissions.ts`
2. Set `export const prerender = false`
3. Implement `POST` handler:
   - Parse multipart/form-data (use library like `formidable` or Astro's request.formData())
   - Validate all fields server-side
   - Check user authentication and permission
   - Upload photo_file to Supabase Storage
   - Insert record into `photo_submissions` table
   - Return PhotoSubmissionResponseDTO
4. Implement error handling:
   - 400 for validation errors
   - 401 for auth errors
   - 403 for permission errors
   - 413 for file too large
   - 429 for rate limit
   - 500 for server errors
5. Add rate limiting middleware

### Step 11: Integration Testing
1. Test full flow from page load to submission
2. Test all validation scenarios (required fields, ranges, formats)
3. Test file upload (valid and invalid files)
4. Test map interaction (click and manual entry)
5. Test error handling (network errors, API errors)
6. Test success flow (submit another, view submissions)
7. Test responsive design on mobile
8. Test keyboard navigation
9. Test with screen reader (basic ARIA)
10. Test form abandonment warning

### Step 12: Edge Case Testing
1. Test with very large image files (>10MB)
2. Test with unusual file types (SVG, GIF, TIFF)
3. Test with missing required fields
4. Test with out-of-range values
5. Test with expired session (refresh token flow)
6. Test with user without permission
7. Test with slow network (loading states)
8. Test concurrent submissions (rate limiting)
9. Test browser back button (state preservation)
10. Test autofill behavior

### Step 13: Performance Optimization
1. Lazy load Mapbox only when LocationPicker is rendered
2. Debounce validation on text inputs
3. Optimize image preview generation
4. Add loading skeletons during initial render
5. Minimize bundle size (check for unused Shadcn components)
6. Test performance with Lighthouse

### Step 14: Documentation
1. Document component APIs (props, events)
2. Document custom hooks
3. Document validation rules
4. Add JSDoc comments to functions
5. Update CLAUDE.md if needed

### Step 15: Final Review and Deployment
1. Code review (check against CLAUDE.md standards)
2. Run linter and fix issues (`npm run lint:fix`)
3. Run formatter (`npm run format`)
4. Test pre-commit hooks
5. Create pull request
6. Deploy to staging environment
7. UAT (User Acceptance Testing)
8. Deploy to production
