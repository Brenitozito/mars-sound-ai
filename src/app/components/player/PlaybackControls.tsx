import type { ReactNode } from "react";
import { usePlayer, type RepeatMode } from "../../context/PlayerContext";
import { IconTooltip } from "../ui/IconTooltip";
import { cn } from "../ui/utils";
import { getPlaybackActionLabel, PlaybackStatusGlyph } from "./PlaybackStatusGlyph";
import { NextIcon, PreviousIcon, RepeatIcon, ShuffleIcon } from "./PlayerIcons";

const REPEAT_MODE_LABELS: Record<RepeatMode, string> = {
  off: "Repetir: desativado",
  all: "Repetir: fila inteira",
  one: "Repetir: música atual",
};

interface ControlButtonProps {
  label: string;
  onClick: () => void;
  disabled: boolean;
  isActive?: boolean;
  isPressed?: boolean;
  isBusy?: boolean;
  className?: string;
  children: ReactNode;
}

function ControlButton({ label, onClick, disabled, isActive, isPressed, isBusy, className, children }: ControlButtonProps) {
  return (
    <IconTooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        disabled={disabled}
        aria-label={label}
        aria-pressed={isPressed}
        aria-busy={isBusy || undefined}
        className={cn(
          "relative flex shrink-0 items-center justify-center transition-[color,transform,border-color] duration-150 hover:text-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 disabled:cursor-not-allowed disabled:opacity-40",
          className,
          isActive && "text-[#ff164c] hover:text-[#ff164c]",
        )}
      >
        {children}
      </button>
    </IconTooltip>
  );
}

interface PlaybackControlsProps {
  variant: "desktop" | "fullscreen";
}

export function PlaybackControls({ variant }: PlaybackControlsProps) {
  const {
    currentTrack,
    playbackStatus,
    isShuffleEnabled,
    repeatMode,
    togglePlay,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
  } = usePlayer();
  const isDisabled = !currentTrack;
  const isDesktop = variant === "desktop";
  const secondaryIconSize = isDesktop ? 20 : 24;
  const secondaryButtonClass = isDesktop ? "size-[34px] text-[#a19a9b]" : "size-12 text-[#a19a9b]";
  const skipButtonClass = isDesktop ? "size-[34px] text-[#a19a9b]" : "size-12 text-white";

  return (
    <div className={cn("flex items-center", isDesktop ? "gap-7" : "justify-between")}>
      <ControlButton
        label={isShuffleEnabled ? "Desativar modo aleatório" : "Ativar modo aleatório"}
        onClick={toggleShuffle}
        disabled={isDisabled}
        isActive={isShuffleEnabled}
        isPressed={isShuffleEnabled}
        className={secondaryButtonClass}
      >
        <ShuffleIcon size={secondaryIconSize} />
      </ControlButton>

      <ControlButton label="Música anterior" onClick={playPrevious} disabled={isDisabled} className={skipButtonClass}>
        <PreviousIcon size={secondaryIconSize} />
      </ControlButton>

      <ControlButton
        label={getPlaybackActionLabel(playbackStatus)}
        onClick={togglePlay}
        disabled={isDisabled}
        isBusy={playbackStatus === "loading"}
        className={
          isDesktop
            ? "size-[43px] border border-[#30292b] bg-black text-[#ff164c] hover:border-[#ff164c] hover:text-[#ff164c] active:scale-95"
            : "size-16 rounded-full bg-white text-[#150f10] hover:text-[#150f10] active:scale-95"
        }
      >
        <PlaybackStatusGlyph status={playbackStatus} size={isDesktop ? 24 : 32} />
      </ControlButton>

      <ControlButton label="Próxima música" onClick={playNext} disabled={isDisabled} className={skipButtonClass}>
        <NextIcon size={secondaryIconSize} />
      </ControlButton>

      <ControlButton
        label={REPEAT_MODE_LABELS[repeatMode]}
        onClick={cycleRepeatMode}
        disabled={isDisabled}
        isActive={repeatMode !== "off"}
        className={secondaryButtonClass}
      >
        <RepeatIcon size={secondaryIconSize} />
        {repeatMode === "one" && (
          <span className="absolute top-0 right-0 flex size-3.5 items-center justify-center rounded-full bg-[#ff164c] text-[9px] font-bold text-white">
            1
          </span>
        )}
      </ControlButton>
    </div>
  );
}
