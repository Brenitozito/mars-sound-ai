import { usePlaybackProgress, usePlayer } from "../../context/PlayerContext";
import { formatHandle } from "../../utils/format";
import { CoverImage } from "../ui/CoverImage";
import { IconTooltip } from "../ui/IconTooltip";
import { cn } from "../ui/utils";
import { TrackFavoriteButton } from "../tracks/TrackFavoriteButton";
import { getPlaybackActionLabel, PlaybackStatusGlyph } from "./PlaybackStatusGlyph";

function MiniProgressLine() {
  const { currentTimeSeconds, durationSeconds } = usePlaybackProgress();
  const playbackPercent = durationSeconds > 0 ? (currentTimeSeconds / durationSeconds) * 100 : 0;

  return (
    <div className="h-[2px] w-full bg-[#30292b]" aria-hidden="true">
      <div className="h-full bg-[#ff164c] transition-[width] duration-300 ease-linear" style={{ width: `${playbackPercent}%` }} />
    </div>
  );
}

export function MiniPlayer() {
  const { currentTrack, playbackStatus, togglePlay, openFullscreen } = usePlayer();
  const hasPlaybackError = playbackStatus === "error";
  const playLabel = getPlaybackActionLabel(playbackStatus);

  if (!currentTrack) return null;

  return (
    <div
      aria-label="Player de música"
      role="region"
      className="fixed right-0 bottom-[60px] left-0 z-[90] bg-[#1c1315] shadow-[0_-1px_0_rgba(255,255,255,0.06)] lg:hidden"
    >
      <MiniProgressLine />
      <div className="flex items-center gap-3 px-3 py-2">
        <button
          type="button"
          onClick={openFullscreen}
          aria-label={`Abrir player: ${currentTrack.title}`}
          className="flex min-w-0 flex-1 items-center gap-3 text-left transition-opacity focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 active:opacity-70"
        >
          <CoverImage src={currentTrack.coverUrl} className="size-11 shrink-0 object-cover" />
          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-semibold leading-[1.3] text-white">{currentTrack.title}</span>
            <span className={cn("block truncate text-[11px] leading-[1.3]", hasPlaybackError ? "text-[#ff164c]" : "text-[#a19a9b]")}>
              {hasPlaybackError ? "Não foi possível reproduzir" : formatHandle(currentTrack.artistHandle)}
            </span>
          </span>
        </button>
        <TrackFavoriteButton trackId={currentTrack.id} size="sm" className="shrink-0" />
        <IconTooltip label={playLabel}>
          <button
            type="button"
            onClick={togglePlay}
            aria-label={playLabel}
            aria-busy={playbackStatus === "loading" || undefined}
            className={cn(
              "flex size-11 shrink-0 items-center justify-center transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 active:scale-90",
              hasPlaybackError ? "text-[#ff164c]" : "text-white",
            )}
          >
            <PlaybackStatusGlyph status={playbackStatus} size={22} />
          </button>
        </IconTooltip>
      </div>
    </div>
  );
}
