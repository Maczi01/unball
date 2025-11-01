import { useCallback, useEffect } from "react";
import { usePhotoSubmission } from "@/components/hooks/usePhotoSubmission";
import { PhotoFileUpload } from "@/components/PhotoFileUpload";
import { LocationPicker } from "@/components/LocationPicker";
import { TagsInput } from "@/components/TagsInput";
import { SubmissionSuccess } from "@/components/SubmissionSuccess";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoSubmissionFormProps {
  userEmail?: string;
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
}

const COMMON_LICENSES = ["CC-BY-SA 4.0", "CC-BY 4.0", "CC-BY-NC 4.0", "CC-BY-NC-SA 4.0", "Public Domain", "CC0 1.0"];

export function PhotoSubmissionForm({ userEmail, onCancel }: PhotoSubmissionFormProps) {
  const {
    formData,
    validationErrors,
    submissionState,
    photoPreview,
    isFormValid,
    updateField,
    updatePhoto,
    validateField,
    submitPhoto,
    resetForm,
  } = usePhotoSubmission(userEmail);

  // Warn on leaving page with unsaved changes
  useEffect(() => {
    const hasChanges =
      formData.photo_file !== null ||
      formData.event_name !== "" ||
      formData.year_utc !== "" ||
      formData.lat !== "" ||
      formData.lon !== "";

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && submissionState.status !== "success") {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, submissionState.status]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      await submitPhoto();
    },
    [submitPhoto]
  );

  const handleSubmitAnother = useCallback(() => {
    resetForm();
  }, [resetForm]);

  const handleViewSubmissions = useCallback(() => {
    window.location.href = "/my-submissions";
  }, []);

  const handleCancelClick = useCallback(() => {
    const hasChanges = formData.photo_file !== null || formData.event_name !== "" || formData.year_utc !== "";

    if (hasChanges) {
      const confirmed = window.confirm("You have unsaved changes. Are you sure you want to leave?");
      if (!confirmed) return;
    }

    if (onCancel) {
      onCancel();
    } else {
      window.history.back();
    }
  }, [formData, onCancel]);

  // Show success modal
  if (submissionState.status === "success" && submissionState.result) {
    return (
      <SubmissionSuccess
        submission={submissionState.result}
        onSubmitAnother={handleSubmitAnother}
        onViewSubmissions={handleViewSubmissions}
      />
    );
  }

  const isSubmitting = submissionState.status === "submitting" || submissionState.status === "validating";

  return (
    <form onSubmit={handleSubmit} className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Submit a Photo</h1>
        <p className="text-neutral-500 dark:text-neutral-400">
          Share your football photos with the community. All submissions will be reviewed before being added to the
          game.
        </p>
      </div>

      {/* Error banner */}
      {submissionState.status === "error" && submissionState.error && (
        <div
          className="flex items-start gap-3 p-4 rounded-lg border border-red-200 bg-red-50 dark:border-red-900 dark:bg-red-950/50"
          role="alert"
        >
          <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-red-900 dark:text-red-100">Submission Error</h3>
            <p className="text-sm text-red-700 dark:text-red-300">{submissionState.error}</p>
          </div>
        </div>
      )}

      {/* Photo Upload */}
      <section className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold mb-2">
            Photo <span className="text-red-500">*</span>
          </h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Upload a clear, high-quality photo of a football event.
          </p>
        </div>
        <PhotoFileUpload
          value={formData.photo_file}
          onChange={updatePhoto}
          preview={photoPreview}
          error={validationErrors.photo_file}
          disabled={isSubmitting}
        />
      </section>

      {/* Required Fields */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Event Details</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Required information about the football event.
          </p>
        </div>

        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="event_name">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_name"
            type="text"
            value={formData.event_name}
            onChange={(e) => updateField("event_name", e.target.value)}
            onBlur={() => validateField("event_name")}
            disabled={isSubmitting}
            placeholder="e.g., 1998 FIFA World Cup Final"
            maxLength={255}
            className={cn(validationErrors.event_name && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.event_name}
            aria-describedby={validationErrors.event_name ? "event_name-error" : undefined}
          />
          {validationErrors.event_name && (
            <p id="event_name-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.event_name}
            </p>
          )}
        </div>

        {/* Year */}
        <div className="space-y-2">
          <Label htmlFor="year_utc">
            Year <span className="text-red-500">*</span>
          </Label>
          <Input
            id="year_utc"
            type="number"
            min={1880}
            max={2025}
            value={formData.year_utc}
            onChange={(e) => updateField("year_utc", e.target.value)}
            onBlur={() => validateField("year_utc")}
            disabled={isSubmitting}
            placeholder="e.g., 1998"
            className={cn(validationErrors.year_utc && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.year_utc}
            aria-describedby={validationErrors.year_utc ? "year_utc-error" : undefined}
          />
          {validationErrors.year_utc && (
            <p id="year_utc-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.year_utc}
            </p>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">Year of the event (1880-2025)</p>
        </div>

        {/* Location */}
        <LocationPicker
          lat={formData.lat}
          lon={formData.lon}
          onChange={({ lat, lon }) => {
            updateField("lat", lat);
            updateField("lon", lon);
          }}
          error={validationErrors.lat || validationErrors.lon}
          disabled={isSubmitting}
        />

        {/* License */}
        <div className="space-y-2">
          <Label htmlFor="license">
            License <span className="text-red-500">*</span>
          </Label>
          <Input
            id="license"
            type="text"
            value={formData.license}
            onChange={(e) => updateField("license", e.target.value)}
            onBlur={() => validateField("license")}
            disabled={isSubmitting}
            placeholder="e.g., CC-BY-SA 4.0"
            maxLength={100}
            list="license-suggestions"
            className={cn(validationErrors.license && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.license}
            aria-describedby={validationErrors.license ? "license-error" : "license-description"}
          />
          <datalist id="license-suggestions">
            {COMMON_LICENSES.map((license) => (
              <option key={license} value={license} />
            ))}
          </datalist>
          {validationErrors.license && (
            <p id="license-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.license}
            </p>
          )}
          <p id="license-description" className="text-xs text-neutral-500 dark:text-neutral-400">
            Photo license (e.g., Creative Commons). Start typing to see suggestions.
          </p>
        </div>

        {/* Credit */}
        <div className="space-y-2">
          <Label htmlFor="credit">
            Credit / Photographer <span className="text-red-500">*</span>
          </Label>
          <Input
            id="credit"
            type="text"
            value={formData.credit}
            onChange={(e) => updateField("credit", e.target.value)}
            onBlur={() => validateField("credit")}
            disabled={isSubmitting}
            placeholder="e.g., John Smith"
            maxLength={255}
            className={cn(validationErrors.credit && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.credit}
            aria-describedby={validationErrors.credit ? "credit-error" : undefined}
          />
          {validationErrors.credit && (
            <p id="credit-error" className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.credit}
            </p>
          )}
        </div>
      </section>

      {/* Optional Fields */}
      <section className="space-y-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">Additional Information</h2>
          <p className="text-sm text-neutral-500 dark:text-neutral-400">
            Optional details that help provide more context.
          </p>
        </div>

        {/* Competition */}
        <div className="space-y-2">
          <Label htmlFor="competition">Competition</Label>
          <Input
            id="competition"
            type="text"
            value={formData.competition}
            onChange={(e) => updateField("competition", e.target.value)}
            onBlur={() => validateField("competition")}
            disabled={isSubmitting}
            placeholder="e.g., FIFA World Cup"
            maxLength={255}
            className={cn(validationErrors.competition && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.competition}
          />
          {validationErrors.competition && (
            <p className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.competition}
            </p>
          )}
        </div>

        {/* Place */}
        <div className="space-y-2">
          <Label htmlFor="place">Place / Location Name</Label>
          <Input
            id="place"
            type="text"
            value={formData.place}
            onChange={(e) => updateField("place", e.target.value)}
            onBlur={() => validateField("place")}
            disabled={isSubmitting}
            placeholder="e.g., Stade de France, Paris"
            maxLength={255}
            className={cn(validationErrors.place && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.place}
          />
          {validationErrors.place && (
            <p className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.place}
            </p>
          )}
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => updateField("description", e.target.value)}
            disabled={isSubmitting}
            placeholder="Describe the moment captured in the photo..."
            rows={4}
            className="resize-none"
          />
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Provide context about what&#39;s happening in the photo
          </p>
        </div>

        {/* Source URL */}
        <div className="space-y-2">
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            type="url"
            value={formData.source_url}
            onChange={(e) => updateField("source_url", e.target.value)}
            onBlur={() => validateField("source_url")}
            disabled={isSubmitting}
            placeholder="https://example.com/photo-source"
            className={cn(validationErrors.source_url && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.source_url}
          />
          {validationErrors.source_url && (
            <p className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.source_url}
            </p>
          )}
        </div>

        {/* Tags */}
        <TagsInput value={formData.tags} onChange={(tags) => updateField("tags", tags)} disabled={isSubmitting} />

        {/* Notes */}
        <div className="space-y-2">
          <Label htmlFor="notes">Notes for Moderators</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => updateField("notes", e.target.value)}
            disabled={isSubmitting}
            placeholder="Any additional information for the review team..."
            rows={3}
            className="resize-none"
          />
        </div>

        {/* Email */}
        <div className="space-y-2">
          <Label htmlFor="submitter_email">Your Email</Label>
          <Input
            id="submitter_email"
            type="email"
            value={formData.submitter_email}
            onChange={(e) => updateField("submitter_email", e.target.value)}
            onBlur={() => validateField("submitter_email")}
            disabled={isSubmitting}
            placeholder="your.email@example.com"
            className={cn(validationErrors.submitter_email && "border-red-500 focus-visible:ring-red-500")}
            aria-invalid={!!validationErrors.submitter_email}
          />
          {validationErrors.submitter_email && (
            <p className="text-sm text-red-500 dark:text-red-400" role="alert">
              {validationErrors.submitter_email}
            </p>
          )}
          <p className="text-xs text-neutral-500 dark:text-neutral-400">
            Optional: Receive updates about your submission
          </p>
        </div>
      </section>

      {/* Form Actions */}
      <div className="flex flex-col-reverse sm:flex-row gap-3 pt-6 border-t border-neutral-200 dark:border-neutral-800">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancelClick}
          disabled={isSubmitting}
          className="w-full sm:w-auto"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={!isFormValid || isSubmitting} className="w-full sm:w-auto sm:ml-auto">
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Submitting...
            </>
          ) : (
            "Submit Photo"
          )}
        </Button>
      </div>

      {!isFormValid && Object.keys(validationErrors).length > 0 && (
        <p className="text-sm text-red-500 dark:text-red-400 text-center" role="alert">
          Please fix {Object.keys(validationErrors).length} error(s) before submitting
        </p>
      )}
    </form>
  );
}
