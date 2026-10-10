import { motion, useReducedMotion } from "motion/react";
import { useState, type MouseEvent } from "react";
import { IconTooltip } from "./IconTooltip";
import { cn } from "./utils";

type FavoriteButtonSize = "sm" | "md" | "lg";

interface FavoriteButtonProps {
  isFavorite: boolean;
  onToggle: () => void;
  size?: FavoriteButtonSize;
  className?: string;
}

const SIZE_STYLES: Record<FavoriteButtonSize, { buttonClass: string; iconSize: number }> = {
  sm: { buttonClass: "size-8", iconSize: 16 },
  md: { buttonClass: "size-9", iconSize: 18 },
  lg: { buttonClass: "size-11", iconSize: 22 },
};

const HEART_PATH =
  "M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z";

function HeartIcon({ isFilled, size }: { isFilled: boolean; size: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={isFilled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={isFilled ? 0 : 1.5}
      aria-hidden="true"
    >
      <path d={HEART_PATH} />
    </svg>
  );
}

export function FavoriteButton({ isFavorite, onToggle, size = "md", className }: FavoriteButtonProps) {
  const shouldReduceMotion = useReducedMotion();
  const [toggleCount, setToggleCount] = useState(0);
  const { buttonClass, iconSize } = SIZE_STYLES[size];
  const shouldAnimate = toggleCount > 0 && !shouldReduceMotion;

  // Botão vive dentro de linhas e cards clicáveis (que disparam o play); o clique não pode borbulhar.
  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setToggleCount((count) => count + 1);
    onToggle();
  };

  const label = isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos";

  return (
    <IconTooltip label={label}>
      <button
        type="button"
        onClick={handleClick}
        aria-label={label}
        aria-pressed={isFavorite}
        className={cn(
          "flex shrink-0 cursor-pointer items-center justify-center text-[#ff164c] transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 active:scale-90",
          buttonClass,
          className,
        )}
      >
        <motion.span
          key={toggleCount}
          className="flex"
          initial={shouldAnimate ? { scale: isFavorite ? 1.35 : 0.8 } : false}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 520, damping: 14 }}
        >
          <HeartIcon isFilled={isFavorite} size={iconSize} />
        </motion.span>
      </button>
    </IconTooltip>
  );
}
