import { useState } from "react";
import { Download, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";

interface PhotoPreviewProps {
  photoUrl: string;
  alt: string;
}

export const PhotoPreview = ({ photoUrl, alt }: PhotoPreviewProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDownload = () => {
    window.open(photoUrl, "_blank");
  };

  if (hasError) {
    return (
      <div className="w-full aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg flex items-center justify-center">
        <p className="text-neutral-500">Failed to load image</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="relative w-full aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
        {isLoading && (
          <Skeleton className="absolute inset-0" />
        )}
        <img
          src={photoUrl}
          alt={alt}
          className="w-full h-full object-contain"
          onLoad={() => setIsLoading(false)}
          onError={() => {
            setIsLoading(false);
            setHasError(true);
          }}
        />
      </div>
      <div className="flex justify-end">
        <Button
          variant="outline"
          size="sm"
          onClick={handleDownload}
          disabled={isLoading || hasError}
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          ) : (
            <Download className="h-4 w-4 mr-2" />
          )}
          Download
        </Button>
      </div>
    </div>
  );
};
