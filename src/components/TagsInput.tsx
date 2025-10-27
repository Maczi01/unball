import { useState, useCallback, useRef, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

type TagsInputProps = {
  value: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  disabled?: boolean;
  label?: string;
};

export function TagsInput({
  value,
  onChange,
  placeholder = "Add a tag...",
  suggestions = ["world-cup", "champions-league", "final", "tournament", "club", "national-team"],
  maxTags = 10,
  disabled = false,
  label = "Tags",
}: TagsInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input and existing tags
  const filteredSuggestions = suggestions.filter(
    (suggestion) =>
      !value.map((t) => t.toLowerCase()).includes(suggestion.toLowerCase()) &&
      suggestion.toLowerCase().includes(inputValue.toLowerCase())
  );

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = useCallback(
    (tag: string) => {
      const trimmed = tag.trim();
      if (!trimmed) return;

      // Check if tag already exists (case-insensitive)
      if (value.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
        return;
      }

      // Check max tags limit
      if (value.length >= maxTags) {
        return;
      }

      onChange([...value, trimmed]);
      setInputValue("");
      setShowSuggestions(false);
    },
    [value, onChange, maxTags]
  );

  const removeTag = useCallback(
    (index: number) => {
      onChange(value.filter((_, i) => i !== index));
    },
    [value, onChange]
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Enter") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "," || e.key === ";") {
        e.preventDefault();
        addTag(inputValue);
      } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
        // Remove last tag on backspace when input is empty
        removeTag(value.length - 1);
      }
    },
    [inputValue, value, addTag, removeTag]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInputValue(e.target.value);
      setShowSuggestions(true);
    },
    []
  );

  const handleSuggestionClick = useCallback(
    (suggestion: string) => {
      addTag(suggestion);
      inputRef.current?.focus();
    },
    [addTag]
  );

  const handleInputFocus = useCallback(() => {
    setShowSuggestions(true);
  }, []);

  return (
    <div className="space-y-2" ref={containerRef}>
      <div className="flex items-center justify-between">
        <Label htmlFor="tags-input">{label}</Label>
        <span className="text-xs text-neutral-500 dark:text-neutral-400">
          {value.length} / {maxTags} tags
        </span>
      </div>

      <div className="space-y-2">
        {/* Tags display */}
        {value.length > 0 && (
          <div className="flex flex-wrap gap-2" role="list" aria-label="Selected tags">
            {value.map((tag, index) => (
              <Badge
                key={index}
                variant="secondary"
                className="pl-2 pr-1 py-1 flex items-center gap-1"
                role="listitem"
              >
                <span>{tag}</span>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeTag(index)}
                  disabled={disabled}
                  aria-label={`Remove ${tag} tag`}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="relative">
          <Input
            ref={inputRef}
            id="tags-input"
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={handleInputFocus}
            disabled={disabled || value.length >= maxTags}
            placeholder={
              value.length >= maxTags
                ? `Maximum ${maxTags} tags reached`
                : placeholder
            }
            aria-label="Tag input"
            aria-describedby="tags-description"
          />

          {/* Suggestions dropdown */}
          {showSuggestions &&
            !disabled &&
            value.length < maxTags &&
            filteredSuggestions.length > 0 && (
              <div
                className="absolute z-10 w-full mt-1 bg-white dark:bg-neutral-950 border border-neutral-200 dark:border-neutral-800 rounded-md shadow-lg max-h-48 overflow-y-auto"
                role="listbox"
                aria-label="Tag suggestions"
              >
                {filteredSuggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className={cn(
                      "w-full text-left px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-900 transition-colors",
                      "focus:bg-neutral-100 dark:focus:bg-neutral-900 focus:outline-none"
                    )}
                    onClick={() => handleSuggestionClick(suggestion)}
                    role="option"
                    aria-selected="false"
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
        </div>

        <p
          id="tags-description"
          className="text-xs text-neutral-500 dark:text-neutral-400"
        >
          Press Enter, comma, or semicolon to add a tag. Backspace to remove the last tag.
        </p>
      </div>
    </div>
  );
}
