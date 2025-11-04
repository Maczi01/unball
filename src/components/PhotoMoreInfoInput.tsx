import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PhotoMoreInfo {
  info_type: "youtube" | "video" | "article" | "interview" | "documentary" | "other";
  url: string;
  title: string;
  description: string;
}

interface PhotoMoreInfoInputProps {
  value: PhotoMoreInfo[];
  onChange: (moreInfo: PhotoMoreInfo[]) => void;
  disabled?: boolean;
}

const INFO_TYPES = [
  { value: "youtube", label: "YouTube Video" },
  { value: "video", label: "Video" },
  { value: "article", label: "Article" },
  { value: "interview", label: "Interview" },
  { value: "documentary", label: "Documentary" },
  { value: "other", label: "Other" },
] as const;

export function PhotoMoreInfoInput({ value, onChange, disabled }: PhotoMoreInfoInputProps) {
  const addMoreInfo = () => {
    onChange([...value, { info_type: "youtube", url: "", title: "", description: "" }]);
  };

  const removeMoreInfo = (index: number) => {
    onChange(value.filter((_, i) => i !== index));
  };

  const updateMoreInfo = (index: number, field: keyof PhotoMoreInfo, fieldValue: string) => {
    const updated = [...value];
    updated[index] = { ...updated[index], [field]: fieldValue };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <Label>Additional Information</Label>
          <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
            Add YouTube videos, articles, interviews, or other media about this photo
          </p>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={addMoreInfo} disabled={disabled}>
          <Plus className="h-4 w-4 mr-2" />
          Add Info
        </Button>
      </div>

      {value.length === 0 ? (
        <p className="text-sm text-neutral-500 dark:text-neutral-400">
          No additional information added yet. Click &quot;Add Info&quot; to add YouTube videos, articles, or other media.
        </p>
      ) : (
        <div className="space-y-4">
          {value.map((info, index) => (
            <div key={index} className="p-4 border border-neutral-200 dark:border-neutral-800 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-neutral-700 dark:text-neutral-300">Info Item {index + 1}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => removeMoreInfo(index)}
                  disabled={disabled}
                  aria-label={`Remove info item ${index + 1}`}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`info-type-${index}`}>Type *</Label>
                <Select
                  value={info.info_type}
                  onValueChange={(val) => updateMoreInfo(index, "info_type", val)}
                  disabled={disabled}
                >
                  <SelectTrigger id={`info-type-${index}`}>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {INFO_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor={`info-url-${index}`}>URL *</Label>
                <Input
                  id={`info-url-${index}`}
                  type="url"
                  value={info.url}
                  onChange={(e) => updateMoreInfo(index, "url", e.target.value)}
                  placeholder="https://youtube.com/watch?v=..."
                  disabled={disabled}
                  className={cn(!info.url && "border-neutral-300")}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`info-title-${index}`}>Title</Label>
                <Input
                  id={`info-title-${index}`}
                  type="text"
                  value={info.title}
                  onChange={(e) => updateMoreInfo(index, "title", e.target.value)}
                  placeholder="e.g., Behind the Scenes Video"
                  disabled={disabled}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor={`info-description-${index}`}>Description</Label>
                <Textarea
                  id={`info-description-${index}`}
                  value={info.description}
                  onChange={(e) => updateMoreInfo(index, "description", e.target.value)}
                  placeholder="Brief description of this content..."
                  disabled={disabled}
                  rows={2}
                  className="resize-none"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
