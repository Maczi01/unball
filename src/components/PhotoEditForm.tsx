import { useState, useCallback } from "react";
import { toast } from "sonner";
import { Loader2, Save, ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { LocationPicker } from "@/components/LocationPicker";
import { TagsInput } from "@/components/TagsInput";
import type { AdminPhotoDTO, UpdatePhotoCommand } from "@/types";
import { cn } from "@/lib/utils";

interface PhotoEditFormProps {
  photo: AdminPhotoDTO;
  onSuccess?: () => void;
  onCancel?: () => void;
}

const COMMON_LICENSES = [
  "CC-BY-SA 4.0",
  "CC-BY 4.0",
  "CC-BY-NC 4.0",
  "CC-BY-NC-SA 4.0",
  "Public Domain",
  "CC0 1.0",
];

export function PhotoEditForm({ photo, onSuccess, onCancel }: PhotoEditFormProps) {
  const [formData, setFormData] = useState({
    event_name: photo.event_name,
    competition: photo.competition || "",
    year_utc: photo.year_utc.toString(),
    place: photo.place || "",
    lat: photo.lat.toString(),
    lon: photo.lon.toString(),
    description: photo.description || "",
    source_url: photo.source_url || "",
    license: photo.license,
    credit: photo.credit,
    tags: photo.tags || [],
    notes: photo.notes || "",
    is_daily_eligible: photo.is_daily_eligible,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  const validateForm = useCallback((): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.event_name.trim()) {
      errors.event_name = "Event name is required";
    }

    const year = parseInt(formData.year_utc);
    if (isNaN(year) || year < 1880 || year > 2025) {
      errors.year_utc = "Year must be between 1880 and 2025";
    }

    const lat = parseFloat(formData.lat);
    if (isNaN(lat) || lat < -90 || lat > 90) {
      errors.lat = "Latitude must be between -90 and 90";
    }

    const lon = parseFloat(formData.lon);
    if (isNaN(lon) || lon < -180 || lon > 180) {
      errors.lon = "Longitude must be between -180 and 180";
    }

    if (!formData.license.trim()) {
      errors.license = "License is required";
    }

    if (!formData.credit.trim()) {
      errors.credit = "Credit/attribution is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  }, [formData]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();

      if (!validateForm()) {
        toast.error("Please fix validation errors before saving");
        return;
      }

      setIsSaving(true);

      try {
        const updates: UpdatePhotoCommand = {
          event_name: formData.event_name.trim(),
          competition: formData.competition.trim() || undefined,
          year_utc: parseInt(formData.year_utc),
          place: formData.place.trim() || undefined,
          lat: parseFloat(formData.lat),
          lon: parseFloat(formData.lon),
          description: formData.description.trim() || undefined,
          source_url: formData.source_url.trim() || undefined,
          license: formData.license.trim(),
          credit: formData.credit.trim(),
          tags: formData.tags.length > 0 ? formData.tags : undefined,
          notes: formData.notes.trim() || undefined,
          is_daily_eligible: formData.is_daily_eligible,
        };

        const response = await fetch(`/api/admin/photos/${photo.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updates),
        });

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || "Failed to update photo");
        }

        toast.success("Photo updated successfully!");

        if (onSuccess) {
          onSuccess();
        } else {
          setTimeout(() => {
            window.location.href = "/admin/photos";
          }, 1000);
        }
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Failed to update photo");
      } finally {
        setIsSaving(false);
      }
    },
    [formData, photo.id, validateForm, onSuccess]
  );

  const handleLocationChange = useCallback((lat: number, lon: number) => {
    setFormData((prev) => ({
      ...prev,
      lat: lat.toString(),
      lon: lon.toString(),
    }));
  }, []);

  const handleCancel = useCallback(() => {
    if (onCancel) {
      onCancel();
    } else {
      window.location.href = "/admin/photos";
    }
  }, [onCancel]);

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100">
            Edit Photo
          </h1>
          <Button type="button" variant="ghost" size="sm" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to List
          </Button>
        </div>

        {/* Photo Preview */}
        <div className="mt-4 rounded-lg overflow-hidden bg-neutral-100 dark:bg-neutral-800">
          <img
            src={photo.photo_url}
            alt={photo.event_name}
            className="w-full h-auto max-h-96 object-contain"
          />
        </div>
      </div>

      {/* Event Information */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Event Information
        </h2>

        <div>
          <Label htmlFor="event_name">
            Event Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="event_name"
            value={formData.event_name}
            onChange={(e) => setFormData({ ...formData, event_name: e.target.value })}
            className={cn(validationErrors.event_name && "border-red-500")}
            placeholder="e.g., Champions League Final 2005"
          />
          {validationErrors.event_name && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.event_name}</p>
          )}
        </div>

        <div>
          <Label htmlFor="competition">Competition/Tournament</Label>
          <Input
            id="competition"
            value={formData.competition}
            onChange={(e) => setFormData({ ...formData, competition: e.target.value })}
            placeholder="e.g., UEFA Champions League"
          />
        </div>

        <div>
          <Label htmlFor="year_utc">
            Year <span className="text-red-500">*</span>
          </Label>
          <Input
            id="year_utc"
            type="number"
            min="1880"
            max="2025"
            value={formData.year_utc}
            onChange={(e) => setFormData({ ...formData, year_utc: e.target.value })}
            className={cn(validationErrors.year_utc && "border-red-500")}
          />
          {validationErrors.year_utc && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.year_utc}</p>
          )}
        </div>

        <div>
          <Label htmlFor="place">Location (City, Stadium, etc.)</Label>
          <Input
            id="place"
            value={formData.place}
            onChange={(e) => setFormData({ ...formData, place: e.target.value })}
            placeholder="e.g., Atatürk Stadium, Istanbul"
          />
        </div>
      </div>

      {/* Location Picker */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 mb-4">
          Geographic Location <span className="text-red-500">*</span>
        </h2>
        <LocationPicker
          initialLat={photo.lat}
          initialLon={photo.lon}
          onChange={handleLocationChange}
        />
        {(validationErrors.lat || validationErrors.lon) && (
          <p className="text-sm text-red-500 mt-2">
            {validationErrors.lat || validationErrors.lon}
          </p>
        )}
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg shadow-sm p-6 space-y-4">
        <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
          Photo Details
        </h2>

        <div>
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            placeholder="Describe what's happening in the photo..."
          />
        </div>

        <div>
          <Label htmlFor="source_url">Source URL</Label>
          <Input
            id="source_url"
            type="url"
            value={formData.source_url}
            onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
            placeholder="https://..."
          />
        </div>

        <div>
          <Label htmlFor="license">
            License <span className="text-red-500">*</span>
          </Label>
          <Input
            id="license"
            value={formData.license}
            onChange={(e) => setFormData({ ...formData, license: e.target.value })}
            list="license-suggestions"
            className={cn(validationErrors.license && "border-red-500")}
          />
          <datalist id="license-suggestions">
            {COMMON_LICENSES.map((license) => (
              <option key={license} value={license} />
            ))}
          </datalist>
          {validationErrors.license && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.license}</p>
          )}
        </div>

        <div>
          <Label htmlFor="credit">
            Credit/Attribution <span className="text-red-500">*</span>
          </Label>
          <Input
            id="credit"
            value={formData.credit}
            onChange={(e) => setFormData({ ...formData, credit: e.target.value })}
            className={cn(validationErrors.credit && "border-red-500")}
            placeholder="Photo by..."
          />
          {validationErrors.credit && (
            <p className="text-sm text-red-500 mt-1">{validationErrors.credit}</p>
          )}
        </div>

        <div>
          <Label>Tags</Label>
          <TagsInput value={formData.tags} onChange={(tags) => setFormData({ ...formData, tags })} />
        </div>

        <div>
          <Label htmlFor="notes">Admin Notes (Internal)</Label>
          <Textarea
            id="notes"
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            rows={2}
            placeholder="Internal notes for admins..."
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <Checkbox
            id="is_daily_eligible"
            checked={formData.is_daily_eligible}
            onCheckedChange={(checked) =>
              setFormData({ ...formData, is_daily_eligible: checked as boolean })
            }
          />
          <Label htmlFor="is_daily_eligible" className="font-normal cursor-pointer">
            Eligible for daily challenges
          </Label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex gap-3">
        <Button type="submit" disabled={isSaving} className="flex-1">
          {isSaving ? (
            <>
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
        <Button type="button" variant="outline" onClick={handleCancel} disabled={isSaving}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
