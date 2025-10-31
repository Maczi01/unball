import { useCallback, useRef } from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PhotoFileUploadProps {
  value: File | null;
  onChange: (file: File | null) => void;
  preview?: string | null;
  error?: string;
  disabled?: boolean;
}

export function PhotoFileUpload({ value, onChange, preview, error, disabled = false }: PhotoFileUploadProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      if (disabled) return;

      const files = e.dataTransfer.files;
      if (files && files.length > 0) {
        onChange(files[0]);
      }
    },
    [onChange, disabled]
  );

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleFileInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (files && files.length > 0) {
        onChange(files[0]);
      }
    },
    [onChange]
  );

  const handleRemove = useCallback(() => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [onChange]);

  const handleClick = useCallback(() => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  }, [disabled]);

  if (preview && value) {
    return (
      <div className="space-y-2">
        <div className="relative w-full max-w-md mx-auto">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto rounded-lg border border-neutral-200 dark:border-neutral-800"
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute top-2 right-2"
            onClick={handleRemove}
            disabled={disabled}
            aria-label="Remove photo"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-neutral-500 dark:text-neutral-400 text-center">
          {value.name} ({(value.size / (1024 * 1024)).toFixed(2)} MB)
        </p>
        {error && <p className="text-sm text-red-500 dark:text-red-400 text-center">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-lg cursor-pointer transition-colors",
          error
            ? "border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950/10"
            : "border-neutral-300 bg-neutral-50 hover:bg-neutral-100 dark:border-neutral-700 dark:bg-neutral-900/50 dark:hover:bg-neutral-900",
          disabled && "opacity-50 cursor-not-allowed"
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload photo"
        aria-describedby="upload-description"
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          onChange={handleFileInputChange}
          disabled={disabled}
          aria-label="Photo file input"
        />
        <Upload className="w-12 h-12 mb-4 text-neutral-400 dark:text-neutral-600" />
        <p className="mb-2 text-sm text-neutral-700 dark:text-neutral-300">
          <span className="font-semibold">Click to upload</span> or drag and drop
        </p>
        <p id="upload-description" className="text-xs text-neutral-500 dark:text-neutral-400">
          JPG, PNG or WebP (max. 10MB)
        </p>
      </div>
      {error && (
        <p className="text-sm text-red-500 dark:text-red-400" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
