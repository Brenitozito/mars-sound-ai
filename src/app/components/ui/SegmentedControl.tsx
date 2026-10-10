import { cn } from "./utils";

interface SegmentedOption<TValue extends string> {
  value: TValue;
  label: string;
}

interface SegmentedControlProps<TValue extends string> {
  options: ReadonlyArray<SegmentedOption<TValue>>;
  value: TValue;
  onChange: (value: TValue) => void;
  ariaLabel: string;
  className?: string;
}

export function SegmentedControl<TValue extends string>({
  options,
  value,
  onChange,
  ariaLabel,
  className,
}: SegmentedControlProps<TValue>) {
  return (
    <div role="group" aria-label={ariaLabel} className={cn("inline-flex border border-[#30292b]", className)}>
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            aria-pressed={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              "min-h-9 px-4 text-[13px] font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:relative focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60",
              isSelected ? "bg-[#ff164c] text-white" : "text-[#a19a9b] hover:bg-white/5 hover:text-white",
            )}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
