import { useEffect, useRef, useState } from "react";
import { Upload, MapPin, ImagePlus, Loader2, CheckCircle2, MapPinned } from "lucide-react";
import { cn } from "@/lib/utils";
import { LocationPicker } from "@/components/LocationPicker";
import exifr from "exifr";

interface PhotoSubmissionFormProps {
  userEmail?: string;
  onSuccess?: (submissionId: string) => void;
  onCancel?: () => void;
}

export function PhotoSubmissionForm({ userEmail }: PhotoSubmissionFormProps) {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [place, setPlace] = useState("");
  const [lat, setLat] = useState("");
  const [lon, setLon] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [submissionId, setSubmissionId] = useState<string | null>(null);
  const [extractingLocation, setExtractingLocation] = useState(false);
  const [locationExtracted, setLocationExtracted] = useState(false);
  const formTopRef = useRef<HTMLDivElement>(null);

  // Generate preview for uploaded file
  useEffect(() => {
    if (!file) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  // Warn on leaving page with unsaved changes
  useEffect(() => {
    const hasChanges = file !== null || title !== "" || place !== "";

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges && !success) {
        e.preventDefault();
        e.returnValue = "";
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [file, title, place, success]);

  const extractLocationFromPhoto = async (file: File) => {
    setExtractingLocation(true);
    setLocationExtracted(false);

    // eslint-disable-next-line no-console
    console.log("📸 Starting EXIF extraction for:", file.name);

    try {
      // Parse EXIF data from the image
      const exifData = await exifr.parse(file, {
        gps: true,
        pick: ["latitude", "longitude"],
      });

      // eslint-disable-next-line no-console
      console.log("📍 EXIF data:", exifData);

      if (exifData && exifData.latitude && exifData.longitude) {
        // eslint-disable-next-line no-console
        console.log("✅ Location found:", {
          latitude: exifData.latitude,
          longitude: exifData.longitude,
          formatted: `${exifData.latitude.toFixed(6)}, ${exifData.longitude.toFixed(6)}`,
        });

        // Set the coordinates
        setLat(exifData.latitude.toFixed(6));
        setLon(exifData.longitude.toFixed(6));
        setLocationExtracted(true);
        setErrors((prev) => ({ ...prev, location: "", lat: "", lon: "" }));
      } else {
        // eslint-disable-next-line no-console
        console.log("⚠️ No GPS data found in photo");
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error("❌ EXIF extraction error:", error);
    } finally {
      setExtractingLocation(false);
    }
  };

  const handleFiles = async (files: FileList | null) => {
    const f = files && files[0];
    if (!f) return;

    const isImage = /^image\//.test(f.type);
    if (!isImage) {
      setErrors((e) => ({ ...e, file: "Please choose an image file." }));
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (f.size > maxSize) {
      setErrors((e) => ({ ...e, file: "File size must be under 10MB." }));
      return;
    }

    setErrors((e) => ({ ...e, file: "" }));
    setFile(f);

    // Try to extract location from photo
    await extractLocationFromPhoto(f);
  };

  const parseTags = (v: string): string[] =>
    v
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

  const validate = (): boolean => {
    const next: Record<string, string> = {};

    if (!file) next.file = "Photo is required.";
    if (!place) next.place = "Please add a location.";
    if (!lat || !lon) {
      next.location = "Please select location on map.";
    } else {
      const latNum = parseFloat(lat);
      const lonNum = parseFloat(lon);
      if (isNaN(latNum) || latNum < -90 || latNum > 90) {
        next.lat = "Invalid latitude.";
      }
      if (isNaN(lonNum) || lonNum < -180 || lonNum > 180) {
        next.lon = "Invalid longitude.";
      }
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate() || !file) return;

    setSubmitting(true);

    try {
      const apiFormData = new FormData();
      apiFormData.append("photo_file", file);
      apiFormData.append("place", place);
      apiFormData.append("lat", lat);
      apiFormData.append("lon", lon);

      if (title) apiFormData.append("title", title);
      const tagArray = parseTags(tags);
      if (tagArray.length > 0) apiFormData.append("tags", JSON.stringify(tagArray));
      if (userEmail) apiFormData.append("submitter_email", userEmail);

      const response = await fetch("/api/photo-submissions", {
        method: "POST",
        body: apiFormData,
      });

      const result = await response.json();

      if (!response.ok || "error" in result) {
        setErrors({ submit: result.error || "Failed to submit photo" });
        formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        setSuccess(true);
        setSubmissionId(result.submission_id);
      }
    } catch (error) {
      setErrors({ submit: error instanceof Error ? error.message : "Failed to submit photo" });
      formTopRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setFile(null);
    setPreview(null);
    setTitle("");
    setTags("");
    setPlace("");
    setLat("");
    setLon("");
    setErrors({});
    setSuccess(false);
    setSubmissionId(null);
    setLocationExtracted(false);
  };

  // Success view
  if (success && submissionId) {
    return (
      <div className="min-h-[60vh] grid place-content-center text-center px-4">
        <div className="max-w-md mx-auto space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-green-100 dark:bg-green-950 grid place-content-center">
            <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-slate-100">Submission Received!</h2>
            <p className="text-slate-600 dark:text-slate-400">
              Your photo has been submitted for review. We&#39;ll review it soon and notify you once it&#39;s approved.
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
            <button
              onClick={handleReset}
              className="px-5 py-2.5 rounded-xl text-sm font-medium border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900 transition-colors"
            >
              Submit Another
            </button>
            <button
              onClick={() => (window.location.href = "/my-submissions")}
              className="px-5 py-2.5 rounded-xl text-sm font-medium bg-sky-600 text-white hover:bg-sky-700 transition-colors"
            >
              View My Submissions
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-sky-50 dark:from-slate-950 dark:to-slate-900">
      <header className="sticky top-0 z-20 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-950/60 bg-white/70 dark:bg-slate-950/70 border-b border-slate-100 dark:border-slate-800">
        <div className="mx-auto max-w-3xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImagePlus className="h-4 w-4 text-sky-600 dark:text-sky-400" />
            <span className="font-semibold tracking-tight text-slate-900 dark:text-slate-100">Add a Photo</span>
          </div>
          <div className="text-xs text-slate-600 dark:text-slate-400">Upload your football shot</div>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-8 md:py-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div ref={formTopRef} />

          {/* Error banner */}
          {errors.submit && (
            <div className="rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 p-4">
              <p className="text-sm text-red-700 dark:text-red-300">{errors.submit}</p>
            </div>
          )}

          {/* Photo Upload */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm">
            <div className="px-4 py-3 border-b border-slate-100 dark:border-slate-800 text-sm text-slate-600 dark:text-slate-400 flex items-center gap-2">
              <ImagePlus className="h-4 w-4 text-sky-600 dark:text-sky-400" /> Photo
            </div>
            <div className="p-4">
              <label
                htmlFor="file"
                className={cn(
                  "relative block w-full rounded-xl border-2 border-dashed bg-slate-50/60 dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer",
                  errors.file ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-700"
                )}
              >
                <input
                  id="file"
                  name="file"
                  type="file"
                  accept="image/*"
                  className="sr-only"
                  onChange={(e) => handleFiles(e.currentTarget.files)}
                  disabled={submitting}
                />
                <div className="grid place-content-center text-center p-8">
                  {preview ? (
                    <img src={preview} alt="preview" className="w-full max-h-80 object-contain rounded-md" />
                  ) : (
                    <div className="flex flex-col items-center gap-2 text-slate-500 dark:text-slate-400">
                      <Upload className="h-6 w-6" />
                      <p className="text-sm">Drag & drop or click to upload</p>
                      <p className="text-xs text-slate-400 dark:text-slate-500">JPEG, PNG, HEIC · up to 10MB</p>
                    </div>
                  )}
                </div>
              </label>
              {errors.file && <p className="mt-2 text-xs text-red-600 dark:text-red-400">{errors.file}</p>}

              {/* Location extraction status */}
              {extractingLocation && (
                <div className="mt-3 flex items-center gap-2 text-sm text-sky-600 dark:text-sky-400">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Extracting location from photo...</span>
                </div>
              )}
              {locationExtracted && (
                <div className="mt-3 flex items-center gap-2 text-sm text-green-600 dark:text-green-400">
                  <MapPinned className="h-4 w-4" />
                  <span>Location automatically extracted from photo!</span>
                </div>
              )}
            </div>
          </section>

          {/* Details */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm p-4 space-y-4">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Title <span className="text-slate-400 dark:text-slate-500 font-normal">(optional)</span>
              </label>
              <input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="E.g., Sunrise over old town"
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Tags <span className="text-slate-400 dark:text-slate-500 font-normal">(comma separated)</span>
              </label>
              <input
                id="tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="city, coast, night"
                disabled={submitting}
                className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
              />
            </div>
          </section>

          {/* Location */}
          <section className="rounded-2xl bg-white dark:bg-slate-900 ring-1 ring-slate-100 dark:ring-slate-800 shadow-sm p-4 space-y-4">
            <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800 pb-3">
              <MapPin className="h-4 w-4 text-sky-600 dark:text-sky-400" />
              Location
            </div>
            <div>
              <label htmlFor="place" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Place
              </label>
              <input
                id="place"
                value={place}
                onChange={(e) => {
                  setPlace(e.target.value);
                  setErrors((prev) => ({ ...prev, place: "" }));
                }}
                placeholder="City, Country"
                disabled={submitting}
                className={cn(
                  "w-full rounded-xl border px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-sky-200 dark:focus:ring-sky-800 bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 placeholder:text-slate-400",
                  errors.place ? "border-red-300 dark:border-red-900" : "border-slate-200 dark:border-slate-700"
                )}
              />
              {errors.place && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{errors.place}</p>}
            </div>

            {/* Location Picker */}
            <div className="pt-2">
              <LocationPicker
                lat={lat}
                lon={lon}
                onChange={({ lat, lon }) => {
                  setLat(lat);
                  setLon(lon);
                  setErrors((prev) => ({ ...prev, location: "", lat: "", lon: "" }));
                  setLocationExtracted(false); // User manually changed location
                }}
                error={errors.location || errors.lat || errors.lon}
                disabled={submitting}
              />
            </div>
          </section>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => {
                setFile(null);
                setPreview(null);
                setTitle("");
                setPlace("");
                setTags("");
                setLat("");
                setLon("");
                setErrors({});
                setLocationExtracted(false);
              }}
              disabled={submitting}
              className="px-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium transition-colors"
            >
              Clear
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-medium shadow-sm text-sm transition-colors",
                submitting
                  ? "bg-slate-300 dark:bg-slate-700 cursor-not-allowed"
                  : "bg-sky-600 hover:bg-sky-700 dark:bg-sky-700 dark:hover:bg-sky-600"
              )}
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Uploading…
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" /> Submit Photo
                </>
              )}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
