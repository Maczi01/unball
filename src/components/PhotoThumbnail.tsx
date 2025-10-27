import { useState } from "react";
import { Image } from "lucide-react";

import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface PhotoThumbnailProps {
  thumbnailUrl: string | null;
  alt: string;
  className?: string;
}

export const PhotoThumbnail = ({ thumbnailUrl, alt, className }: PhotoThumbnailProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  if (!thumbnailUrl || hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-neutral-100 dark:bg-neutral-800",
          className
        )}
      >
        <div className="flex flex-col items-center gap-2 text-neutral-400">
          <Image className="h-8 w-8" />
          <span className="text-xs">No preview</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("relative overflow-hidden bg-neutral-100", className)}>
      {isLoading && <Skeleton className="absolute inset-0" />}
      <img
        src={thumbnailUrl}
        alt={alt}
        className={cn("h-full w-full object-cover transition-opacity", {
          "opacity-0": isLoading,
          "opacity-100": !isLoading,
        })}
        onLoad={() => setIsLoading(false)}
        onError={() => {
          setIsLoading(false);
          setHasError(true);
        }}
      />
    </div>
  );
};
