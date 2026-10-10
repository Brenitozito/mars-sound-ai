import * as SliderPrimitive from "@radix-ui/react-slider";
import { cn } from "../ui/utils";

interface MediaSliderProps {
  value: number;
  label: string;
  valueText?: string;
  step?: number;
  disabled?: boolean;
  className?: string;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
}

export function MediaSlider({
  value,
  label,
  valueText,
  step = 0.5,
  disabled,
  className,
  onValueChange,
  onValueCommit,
}: MediaSliderProps) {
  return (
    <SliderPrimitive.Root
      value={[value]}
      min={0}
      max={100}
      step={step}
      disabled={disabled}
      onValueChange={([nextValue]) => onValueChange(nextValue)}
      onValueCommit={([nextValue]) => onValueCommit?.(nextValue)}
      className={cn(
        "group relative flex h-4 w-full cursor-pointer touch-none items-center select-none data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
        className,
      )}
    >
      <SliderPrimitive.Track className="relative h-1 grow overflow-hidden bg-[#5b4f51] transition-[height] duration-150 group-hover:h-1.5">
        <SliderPrimitive.Range className="absolute h-full bg-[#ff164c]" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb
        aria-label={label}
        aria-valuetext={valueText}
        className="block size-3 rounded-full bg-[#f8f8f8] opacity-0 shadow transition-opacity group-hover:opacity-100 focus-visible:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]"
      />
    </SliderPrimitive.Root>
  );
}
