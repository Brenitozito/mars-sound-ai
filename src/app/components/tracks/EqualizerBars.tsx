import { cn } from "../ui/utils";

const BAR_ANIMATIONS = [
  { heightClass: "h-full", animation: "barBounce 0.8s ease-in-out infinite alternate" },
  { heightClass: "h-[55%]", animation: "barBounce 0.6s ease-in-out infinite alternate 0.2s" },
  { heightClass: "h-[78%]", animation: "barBounce 0.9s ease-in-out infinite alternate 0.1s" },
];

interface EqualizerBarsProps {
  className?: string;
  barClassName?: string;
}

export function EqualizerBars({ className, barClassName = "bg-[#ff164c]" }: EqualizerBarsProps) {
  return (
    <span className={cn("flex h-[14px] items-end gap-[2px]", className)} aria-hidden="true">
      {BAR_ANIMATIONS.map(({ heightClass, animation }) => (
        <span
          key={animation}
          className={cn("w-[3px] origin-bottom", heightClass, barClassName)}
          style={{ animation }}
        />
      ))}
    </span>
  );
}
