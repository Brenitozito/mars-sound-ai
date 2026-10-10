import { X } from "lucide-react";
import { useState, type KeyboardEvent } from "react";

const MAX_TAGS = 10;
const MAX_TAG_LENGTH = 24;

interface TagInputProps {
  id: string;
  tags: string[];
  suggestions: readonly string[];
  onChange: (tags: string[]) => void;
}

function normalizeTag(rawTag: string): string {
  return rawTag.trim().replace(/^#+/, "").slice(0, MAX_TAG_LENGTH);
}

export function TagInput({ id, tags, suggestions, onChange }: TagInputProps) {
  const [draftTag, setDraftTag] = useState("");
  const hasReachedLimit = tags.length >= MAX_TAGS;

  const addTag = (rawTag: string) => {
    const tag = normalizeTag(rawTag);
    const isDuplicate = tags.some((existingTag) => existingTag.toLowerCase() === tag.toLowerCase());
    if (tag && !isDuplicate && !hasReachedLimit) onChange([...tags, tag]);
    setDraftTag("");
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" || event.key === ",") {
      event.preventDefault();
      addTag(draftTag);
    } else if (event.key === "Backspace" && !draftTag && tags.length > 0) {
      onChange(tags.slice(0, -1));
    }
  };

  const availableSuggestions = suggestions.filter(
    (suggestion) => !tags.some((tag) => tag.toLowerCase() === suggestion.toLowerCase()),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex min-h-[44px] flex-wrap items-center gap-2 border border-[#30292b] px-4 py-2 transition-colors focus-within:border-[#ff164c] hover:border-[#ff164c]/50">
        {tags.map((tag) => (
          <span key={tag} className="flex items-center gap-1 border border-[#ff164c] py-0.5 pr-1 pl-3 text-[13px] font-semibold text-[#f8f8f8]">
            #{tag}
            <button
              type="button"
              onClick={() => onChange(tags.filter((existingTag) => existingTag !== tag))}
              aria-label={`Remover tag ${tag}`}
              className="flex size-6 items-center justify-center text-[#a19a9b] transition-colors hover:text-[#f8f8f8]"
            >
              <X className="size-3" />
            </button>
          </span>
        ))}
        <input
          id={id}
          type="text"
          value={draftTag}
          maxLength={MAX_TAG_LENGTH}
          disabled={hasReachedLimit}
          onChange={(event) => setDraftTag(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => draftTag && addTag(draftTag)}
          placeholder={hasReachedLimit ? `Limite de ${MAX_TAGS} tags` : tags.length === 0 ? "Adicione tags (pressione Enter)" : ""}
          className="min-w-[160px] flex-1 bg-transparent py-1 text-[14px] font-semibold text-[#f8f8f8] caret-[#ff164c] outline-none placeholder:font-normal placeholder:text-[#f8f8f8]/30"
        />
      </div>
      {availableSuggestions.length > 0 && !hasReachedLimit && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12px] leading-[1.25] text-[#bababa]">Sugestões</span>
          {availableSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="flex min-h-[32px] items-center gap-1 border border-[#ff164c] px-2 py-1 text-[13px] font-semibold text-[#f8f8f8] transition-colors hover:bg-[#ff164c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
            >
              <span className="text-[#ff164c]" aria-hidden="true">
                +
              </span>
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
