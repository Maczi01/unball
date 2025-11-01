import { useState, useCallback } from "react";
import type { PhotoSubmissionFormData, ValidationErrors, SubmissionState, PhotoSubmissionResponseDTO } from "@/types";
import { ValidationConstants } from "@/types";

// Initial form data with empty values
const initialFormData: PhotoSubmissionFormData = {
  photo_file: null,
  event_name: "",
  competition: "",
  year_utc: "",
  place: "",
  lat: "",
  lon: "",
  description: "",
  source_url: "",
  license: "",
  credit: "",
  tags: [],
  notes: "",
  submitter_email: "",
};

/**
 * Hook interface defining all state and actions
 */
export interface UsePhotoSubmissionReturn {
  // State
  formData: PhotoSubmissionFormData;
  validationErrors: ValidationErrors;
  submissionState: SubmissionState;
  photoPreview: string | null;
  isFormValid: boolean; // Computed: all required fields valid

  // Actions
  updateField: <K extends keyof PhotoSubmissionFormData>(field: K, value: PhotoSubmissionFormData[K]) => void;
  updatePhoto: (file: File | null) => void;
  validateField: (field: keyof PhotoSubmissionFormData) => boolean;
  validateAllFields: () => boolean;
  submitPhoto: () => Promise<void>;
  resetForm: () => void;
}

/**
 * Validation functions for each field
 */

function validatePhotoFile(file: File | null): string | null {
  if (!file) return "Photo is required";
  if (file.size > ValidationConstants.FILE_UPLOAD.MAX_SIZE_MB * 1024 * 1024) {
    return `Photo must be under ${ValidationConstants.FILE_UPLOAD.MAX_SIZE_MB}MB`;
  }
  const validTypes = ValidationConstants.FILE_UPLOAD.ALLOWED_FORMATS.map(
    (fmt) => `image/${fmt === "jpg" ? "jpeg" : fmt}`
  );
  if (!validTypes.includes(file.type) && !file.type.includes("image/jpg")) {
    return "Photo must be JPG, PNG, or WebP";
  }
  return null;
}

function validateEventName(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Event name is required";
  if (trimmed.length > 255) return "Event name must be 255 characters or less";
  return null;
}

function validateYear(value: string): string | null {
  const year = parseInt(value, 10);
  if (isNaN(year)) return "Year must be a number";
  if (!Number.isInteger(year)) return "Year must be a whole number";
  if (year < ValidationConstants.YEAR.MIN) {
    return `Year must be ${ValidationConstants.YEAR.MIN} or later`;
  }
  if (year > ValidationConstants.YEAR.MAX) {
    return `Year must be ${ValidationConstants.YEAR.MAX} or earlier`;
  }
  return null;
}

function validateLatitude(value: string): string | null {
  if (!value) return "Latitude is required";
  const lat = parseFloat(value);
  if (isNaN(lat)) return "Latitude must be a number";
  if (lat < ValidationConstants.COORDINATES.LAT_MIN) {
    return `Latitude must be ${ValidationConstants.COORDINATES.LAT_MIN} or greater`;
  }
  if (lat > ValidationConstants.COORDINATES.LAT_MAX) {
    return `Latitude must be ${ValidationConstants.COORDINATES.LAT_MAX} or less`;
  }
  return null;
}

function validateLongitude(value: string): string | null {
  if (!value) return "Longitude is required";
  const lon = parseFloat(value);
  if (isNaN(lon)) return "Longitude must be a number";
  if (lon < ValidationConstants.COORDINATES.LON_MIN) {
    return `Longitude must be ${ValidationConstants.COORDINATES.LON_MIN} or greater`;
  }
  if (lon > ValidationConstants.COORDINATES.LON_MAX) {
    return `Longitude must be ${ValidationConstants.COORDINATES.LON_MAX} or less`;
  }
  return null;
}

function validateLicense(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "License is required";
  if (trimmed.length > 100) return "License must be 100 characters or less";
  return null;
}

function validateCredit(value: string): string | null {
  const trimmed = value.trim();
  if (trimmed.length === 0) return "Credit/photographer is required";
  if (trimmed.length > 255) return "Credit must be 255 characters or less";
  return null;
}

function validateCompetition(value: string): string | null {
  if (value.length === 0) return null; // Optional
  if (value.length > 255) return "Competition must be 255 characters or less";
  return null;
}

function validatePlace(value: string): string | null {
  if (value.length === 0) return null; // Optional
  if (value.length > 255) return "Place must be 255 characters or less";
  return null;
}

function validateEmail(value: string): string | null {
  if (value.length === 0) return null; // Optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(value)) return "Please enter a valid email address";
  return null;
}

function validateSourceUrl(value: string): string | null {
  if (value.length === 0) return null; // Optional
  try {
    new URL(value);
    return null;
  } catch {
    return "Please enter a valid URL";
  }
}

/**
 * Main custom hook for photo submission
 */
export function usePhotoSubmission(userEmail?: string): UsePhotoSubmissionReturn {
  // Initialize state with user email if available
  const [formData, setFormData] = useState<PhotoSubmissionFormData>({
    ...initialFormData,
    submitter_email: userEmail || "",
  });
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>({});
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  /**
   * Update a single field in form data
   */
  const updateField = useCallback(
    <K extends keyof PhotoSubmissionFormData>(field: K, value: PhotoSubmissionFormData[K]) => {
      setFormData((prev) => ({ ...prev, [field]: value }));

      // Clear error for this field when user starts typing
      if (validationErrors[field]) {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newErrors[field];
          return newErrors;
        });
      }
    },
    [validationErrors]
  );

  /**
   * Update photo file and generate preview
   */
  const updatePhoto = useCallback(
    (file: File | null) => {
      // Clean up previous preview URL
      if (photoPreview) {
        URL.revokeObjectURL(photoPreview);
      }

      if (file) {
        const error = validatePhotoFile(file);
        if (error) {
          setValidationErrors((prev) => ({ ...prev, photo_file: error }));
          setPhotoPreview(null);
          setFormData((prev) => ({ ...prev, photo_file: null }));
          return;
        }

        // Generate preview
        const previewUrl = URL.createObjectURL(file);
        setPhotoPreview(previewUrl);
        setFormData((prev) => ({ ...prev, photo_file: file }));
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          delete newErrors.photo_file;
          return newErrors;
        });
      } else {
        setPhotoPreview(null);
        setFormData((prev) => ({ ...prev, photo_file: null }));
      }
    },
    [photoPreview]
  );

  /**
   * Validate a single field
   */
  const validateField = useCallback(
    (field: keyof PhotoSubmissionFormData): boolean => {
      let error: string | null = null;

      switch (field) {
        case "photo_file":
          error = validatePhotoFile(formData.photo_file);
          break;
        case "event_name":
          error = validateEventName(formData.event_name);
          break;
        case "year_utc":
          error = validateYear(formData.year_utc);
          break;
        case "lat":
          error = validateLatitude(formData.lat);
          break;
        case "lon":
          error = validateLongitude(formData.lon);
          break;
        case "license":
          error = validateLicense(formData.license);
          break;
        case "credit":
          error = validateCredit(formData.credit);
          break;
        case "competition":
          error = validateCompetition(formData.competition);
          break;
        case "place":
          error = validatePlace(formData.place);
          break;
        case "submitter_email":
          error = validateEmail(formData.submitter_email);
          break;
        case "source_url":
          error = validateSourceUrl(formData.source_url);
          break;
        // Other fields (description, notes, tags) have no validation
        default:
          return true;
      }

      if (error) {
        setValidationErrors((prev) => ({ ...prev, [field]: error }));
        return false;
      } else {
        setValidationErrors((prev) => {
          const newErrors = { ...prev };
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete newErrors[field];
          return newErrors;
        });
        return true;
      }
    },
    [formData]
  );

  /**
   * Validate all fields
   */
  const validateAllFields = useCallback((): boolean => {
    const requiredFields: (keyof PhotoSubmissionFormData)[] = [
      "photo_file",
      "event_name",
      "year_utc",
      "lat",
      "lon",
      "license",
      "credit",
    ];
    const optionalFields: (keyof PhotoSubmissionFormData)[] = ["competition", "place", "submitter_email", "source_url"];

    let isValid = true;
    // const errors: ValidationErrors = {};

    // Validate required fields
    for (const field of requiredFields) {
      if (!validateField(field)) {
        isValid = false;
      }
    }

    // Validate optional fields only if they have values
    for (const field of optionalFields) {
      const value = formData[field];
      if (typeof value === "string" && value.length > 0) {
        if (!validateField(field)) {
          isValid = false;
        }
      }
    }

    return isValid;
  }, [formData, validateField]);

  /**
   * Compute if form is valid
   */
  const isFormValid = (() => {
    const requiredFieldsValid =
      formData.photo_file !== null &&
      validatePhotoFile(formData.photo_file) === null &&
      validateEventName(formData.event_name) === null &&
      validateYear(formData.year_utc) === null &&
      validateLatitude(formData.lat) === null &&
      validateLongitude(formData.lon) === null &&
      validateLicense(formData.license) === null &&
      validateCredit(formData.credit) === null;

    const optionalFieldsValid =
      (formData.competition === "" || validateCompetition(formData.competition) === null) &&
      (formData.place === "" || validatePlace(formData.place) === null) &&
      (formData.submitter_email === "" || validateEmail(formData.submitter_email) === null) &&
      (formData.source_url === "" || validateSourceUrl(formData.source_url) === null);

    return requiredFieldsValid && optionalFieldsValid;
  })();

  /**
   * Submit photo to API
   */
  const submitPhoto = useCallback(async () => {
    // 1. Validate all fields
    setSubmissionState({ status: "validating" });
    if (!validateAllFields()) {
      setSubmissionState({ status: "idle" });
      return;
    }

    // 2. Prepare FormData
    const apiFormData = new FormData();
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
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

        // Handle validation errors (400)
        if (response.status === 400 && errorData.details) {
          const fieldErrors = mapApiErrorsToFields(errorData.details);
          setValidationErrors(fieldErrors);
        }

        throw new Error(errorData.error || "Submission failed");
      }

      const result: PhotoSubmissionResponseDTO = await response.json();
      setSubmissionState({ status: "success", result });
    } catch (error) {
      setSubmissionState({
        status: "error",
        error: error instanceof Error ? error.message : "Failed to submit photo",
      });
    }
  }, [formData, validateAllFields]);

  /**
   * Reset form to initial state
   */
  const resetForm = useCallback(() => {
    // Clean up photo preview
    if (photoPreview) {
      URL.revokeObjectURL(photoPreview);
    }

    setFormData({ ...initialFormData, submitter_email: userEmail || "" });
    setValidationErrors({});
    setSubmissionState({ status: "idle" });
    setPhotoPreview(null);
  }, [photoPreview, userEmail]);

  return {
    formData,
    validationErrors,
    submissionState,
    photoPreview,
    isFormValid,
    updateField,
    updatePhoto,
    validateField,
    validateAllFields,
    submitPhoto,
    resetForm,
  };
}

/**
 * Map API error details to field-level errors
 */
function mapApiErrorsToFields(details: string[]): ValidationErrors {
  const errors: ValidationErrors = {};

  details.forEach((detail) => {
    const lower = detail.toLowerCase();

    if (lower.includes("year")) errors.year_utc = detail;
    if (lower.includes("lat") && !lower.includes("latitude")) errors.lat = detail;
    if (lower.includes("latitude")) errors.lat = detail;
    if (lower.includes("lon") && !lower.includes("longitude")) errors.lon = detail;
    if (lower.includes("longitude")) errors.lon = detail;
    if (lower.includes("license")) errors.license = detail;
    if (lower.includes("credit")) errors.credit = detail;
    if (lower.includes("event")) errors.event_name = detail;
    if (lower.includes("photo") || lower.includes("file")) errors.photo_file = detail;
    if (lower.includes("competition")) errors.competition = detail;
    if (lower.includes("place")) errors.place = detail;
    if (lower.includes("email")) errors.submitter_email = detail;
    if (lower.includes("url")) errors.source_url = detail;
  });

  return errors;
}
