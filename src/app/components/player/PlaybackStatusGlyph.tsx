import { LoaderCircle, RotateCcw } from "lucide-react";
import type { PlaybackStatus } from "../../context/PlayerContext";
import { PauseIcon, PlayIcon } from "./PlayerIcons";

const PLAYBACK_ACTION_LABELS: Record<PlaybackStatus, string> = {
  idle: "Reproduzir",
  paused: "Reproduzir",
  loading: "Carregando música (pausar)",
  playing: "Pausar",
  error: "Tentar reproduzir novamente",
};

/** Rótulo do botão principal: descreve o que o clique vai fazer no estado atual. */
export function getPlaybackActionLabel(status: PlaybackStatus): string {
  return PLAYBACK_ACTION_LABELS[status];
}

export function PlaybackStatusGlyph({ status, size }: { status: PlaybackStatus; size: number }) {
  const iconStyle = { width: size, height: size };
  switch (status) {
    case "loading":
      return <LoaderCircle className="animate-spin" style={iconStyle} aria-hidden="true" />;
    case "error":
      return <RotateCcw style={iconStyle} aria-hidden="true" />;
    case "playing":
      return <PauseIcon size={size} />;
    default:
      return <PlayIcon size={size} />;
  }
}
