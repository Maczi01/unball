import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoSource {
  url: string;
  title: string;
  source_type: string;
}

interface PhotoSourcesInputProps {
  value: PhotoSource[];
  onChange: (sources: PhotoSource[]) => void;
  disabled?: boolean;
}

const SOURCE_TYPES = [
  { value: "article", label: "Article" },
  { value: "wikipedia", label: "Wikipedia" },
  { value: "official", label: "Official Site" },
  { value: "news", label: "News" },
  { value: "other", label: "Other" },
];

export function PhotoSourcesInput({ value, onChange, disabled }: PhotoSourcesInputProps) {
  const addSource = () => {
    onChange([...value, { url: "", title: "", source_type: "" }]);
  };

  const removeSource = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateSource = (index: number, field: keyof PhotoSource, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label>Sources</Label>
        <Button type="button" variant="outline" size="sm" onClick={addSource} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add Source
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No sources added yet. Click &quot;Add Source&quot; to add one.
        </p>
      ) : (
        <div className="space-y-4">
          {value.map((source, index) => (
            <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Source {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeSource(index)}
                  disabled={disabled}
                  aria-label={`Remove source ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`source-url-${index}`}>URL *</Label>
                <Input
                  id={`source-url-${index}`}
                  type="url"
                  value={source.url}
                  onChange={(e) => updateSource(index, "url", e.target.value)}
                  placeholder="https://example.com/article"
                  disabled={disabled}
                  className={cn(!source.url && "border-neutral-300")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`source-title-${index}`}>Title</Label>
                <Input
                  id={`source-title-${index}`}
                  type="text"
                  value={source.title}
                  onChange={(e) => updateSource(index, "title", e.target.value)}
                  placeholder="e.g., Official Match Report"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`source-type-${index}`}>Type</Label>
                <Select
                  value={source.source_type}
                  onValueChange={(val) => updateSource(index, "source_type", val)}
                  disabled={disabled}
                >
                  <SelectTrigger id={`source-type-${index}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {SOURCE_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          ))}
        </div>
      )}

      <p className="text-xs text-neutral-500 dark:text-neutral-400">
        Add URLs to articles, Wikipedia pages, or other sources about this photo or event
      </p>
    </div>
  );
}
