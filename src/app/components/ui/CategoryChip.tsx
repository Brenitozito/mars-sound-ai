import { cn } from "./utils";

interface CategoryChipProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  className?: string;
}

export function CategoryChip({ label, active = false, disabled = false, onClick, className }: CategoryChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-pressed={active}
      className={cn(
        "min-h-9 rounded-full px-5 py-2 text-sm font-semibold whitespace-nowrap transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 disabled:cursor-not-allowed disabled:opacity-40",
        active
          ? "bg-[#ff164c] text-white"
          : "border border-[#30292b] bg-transparent text-[#a19a9b] enabled:hover:border-[#ff164c] enabled:hover:text-white",
        className,
      )}
    >
      {label}
    </button>
  );
}
