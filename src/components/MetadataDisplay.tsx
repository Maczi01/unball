import { Badge } from "@/components/ui/badge";
import type { AdminPhotoSubmissionDetailDTO } from "@/types";

interface MetadataDisplayProps {
  submission: AdminPhotoSubmissionDetailDTO;
}

export const MetadataDisplay = ({ submission }: MetadataDisplayProps) => {
  const fields = [
    { label: "Event Name", value: submission.event_name },
    { label: "Competition", value: submission.competition },
    { label: "Year", value: submission.year_utc },
    { label: "Place", value: submission.place },
    {
      label: "Coordinates",
      value: submission.lat && submission.lon ? `${submission.lat.toFixed(6)}, ${submission.lon.toFixed(6)}` : null,
    },
    { label: "Description", value: submission.description },
    { label: "Source URL", value: submission.source_url, isLink: true },
    { label: "License", value: submission.license },
    { label: "Credit", value: submission.credit },
    { label: "Submitter Email", value: submission.submitter_email },
    { label: "Notes", value: submission.notes },
  ];

  return (
    <div className="space-y-4">
      <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {fields.map((field) => {
          if (!field.value) return null;

          return (
            <div key={field.label} className="space-y-1">
              <dt className="text-sm font-medium text-neutral-600 dark:text-neutral-400">{field.label}</dt>
              <dd className="text-sm text-neutral-900 dark:text-neutral-100">
                {field.isLink ? (
                  <a
                    href={field.value as string}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:underline dark:text-blue-400"
                  >
                    {field.value}
                  </a>
                ) : (
                  field.value
                )}
              </dd>
            </div>
          );
        })}
      </dl>

      {submission.tags && submission.tags.length > 0 && (
        <div className="pt-2 border-t border-neutral-200 dark:border-neutral-800">
          <div className="text-sm font-medium text-neutral-600 dark:text-neutral-400 mb-2">Tags</div>
          <div className="flex flex-wrap gap-2">
            {submission.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
