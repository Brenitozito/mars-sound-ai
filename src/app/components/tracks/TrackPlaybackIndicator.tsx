import { AlertCircle, LoaderCircle } from "lucide-react";
import type { PlaybackStatus } from "../../context/PlayerContext";
import type { Track } from "../../types/domain";
import { formatHandle } from "../../utils/format";
import { cn } from "../ui/utils";
import { EqualizerBars } from "./EqualizerBars";

const TRACK_ACTION_PREFIX: Record<PlaybackStatus, string> = {
  idle: "Tocar",
  paused: "Continuar",
  loading: "Carregando",
  playing: "Pausar",
  error: "Tentar tocar de novo",
};

export function getTrackPlayActionLabel(status: PlaybackStatus, track: Track): string {
  return `${TRACK_ACTION_PREFIX[status]} ${track.title}, de ${formatHandle(track.artistHandle)}`;
}

interface TrackPlaybackIndicatorProps {
  status: PlaybackStatus;
  /** Cor das barras e ícones; o padrão é a cor da marca. */
  toneClassName?: string;
}

export function hasPlaybackIndicator(status: PlaybackStatus): boolean {
  return status === "loading" || status === "playing" || status === "error";
}

export function TrackPlaybackIndicator({ status, toneClassName = "text-[#ff164c]" }: TrackPlaybackIndicatorProps) {
  switch (status) {
    case "loading":
      return <LoaderCircle className={cn("size-[14px] animate-spin", toneClassName)} aria-hidden="true" />;
    case "error":
      return <AlertCircle className={cn("size-[14px]", toneClassName)} aria-hidden="true" />;
    case "playing":
      return <EqualizerBars barClassName={cn("bg-current", toneClassName)} />;
    default:
      return null;
  }
}
