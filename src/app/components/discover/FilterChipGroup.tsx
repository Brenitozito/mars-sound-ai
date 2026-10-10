import { ChevronDown } from "lucide-react";
import { useId, useState } from "react";
import { CategoryChip } from "../ui/CategoryChip";
import { cn } from "../ui/utils";

interface FilterChipGroupProps {
  label: string;
  options: readonly string[];
  selectedValues: readonly string[];
  onToggle: (value: string) => void;
  onClear: () => void;
}

const ALL_OPTIONS_LABEL = "Todos";

export function FilterChipGroup({ label, options, selectedValues, onToggle, onClear }: FilterChipGroupProps) {
  const groupId = useId();
  const [isExpanded, setIsExpanded] = useState(false);
  const selectedSet = new Set(selectedValues);

  return (
    <div className="flex items-start gap-3 sm:gap-4">
      <span className="w-[68px] shrink-0 pt-2 text-sm font-semibold text-[#a19a9b]">{label}</span>
      <div
        id={groupId}
        role="group"
        aria-label={`Filtrar por ${label.toLowerCase()}`}
        className={cn("flex min-w-0 flex-1 gap-2", isExpanded ? "flex-wrap" : "overflow-x-auto scrollbar-hide")}
      >
        <CategoryChip label={ALL_OPTIONS_LABEL} active={selectedSet.size === 0} onClick={onClear} />
        {options.map((option) => (
          <CategoryChip key={option} label={option} active={selectedSet.has(option)} onClick={() => onToggle(option)} />
        ))}
      </div>
      <button
        type="button"
        onClick={() => setIsExpanded((expanded) => !expanded)}
        aria-expanded={isExpanded}
        aria-controls={groupId}
        aria-label={isExpanded ? `Recolher ${label.toLowerCase()}` : `Mostrar todos os ${label.toLowerCase()}`}
        className="flex size-9 shrink-0 items-center justify-center text-[#a19a9b] transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
      >
        <ChevronDown className={cn("size-4 transition-transform", isExpanded && "rotate-180")} aria-hidden="true" />
      </button>
    </div>
  );
}
