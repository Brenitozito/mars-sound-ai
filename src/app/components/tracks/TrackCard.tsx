import { usePlayer, useTrackPlaybackStatus } from "../../context/PlayerContext";
import type { Track } from "../../types/domain";
import { formatHandle } from "../../utils/format";
import { CoverImage } from "../ui/CoverImage";
import { cn } from "../ui/utils";
import { TrackActionsMenu } from "./TrackActionsMenu";
import { TrackFavoriteButton } from "./TrackFavoriteButton";
import { getTrackPlayActionLabel, hasPlaybackIndicator, TrackPlaybackIndicator } from "./TrackPlaybackIndicator";

interface TrackCardProps {
  track: Track;
  queue: Track[];
  variant?: "card" | "list";
  imageAspect?: "square" | "wide";
  className?: string;
}

function PlayGlyph() {
  return (
    <svg width="10" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <polygon points="5,3 19,12 5,21" />
    </svg>
  );
}

function PauseGlyph() {
  return (
    <svg width="10" height="12" viewBox="0 0 24 24" fill="white" aria-hidden="true">
      <rect x="5" y="3" width="5" height="18" />
      <rect x="14" y="3" width="5" height="18" />
    </svg>
  );
}

export function TrackCard({ track, queue, variant = "card", imageAspect = "square", className }: TrackCardProps) {
  const { playTrack } = usePlayer();
  const playbackStatus = useTrackPlaybackStatus(track.id);
  const isCurrent = playbackStatus !== "idle";
  const showsIndicator = hasPlaybackIndicator(playbackStatus);
  const playLabel = getTrackPlayActionLabel(playbackStatus, track);
  const handlePlay = () => playTrack(track, queue);

  if (variant === "list") {
    return (
      <article
        className={cn(
          "group flex items-center gap-2 border px-3 py-2 transition-colors duration-150",
          isCurrent ? "border-[#ff164c]/60 bg-[#ff164c]/[0.06]" : "border-transparent hover:border-[#30292b] hover:bg-white/5",
          className,
        )}
      >
        <button
          type="button"
          onClick={handlePlay}
          aria-label={playLabel}
          aria-busy={playbackStatus === "loading" || undefined}
          className="flex min-w-0 flex-1 items-center gap-4 text-left outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]"
        >
          <span className="relative size-12 shrink-0 overflow-hidden border border-[#30292b]">
            <CoverImage src={track.coverUrl} loading="lazy" className="size-full object-cover" />
            {showsIndicator ? (
              <span className="absolute inset-0 flex items-center justify-center bg-black/60">
                <TrackPlaybackIndicator status={playbackStatus} />
              </span>
            ) : (
              <span className="absolute inset-0 hidden items-center justify-center bg-black/50 group-hover:flex group-focus-within:flex">
                <PlayGlyph />
              </span>
            )}
          </span>
          <span className="min-w-0">
            <span className={cn("block truncate text-base font-semibold", isCurrent ? "text-[#ff164c]" : "text-[#f8f8f8]")}>
              {track.title}
            </span>
            <span className="block truncate text-sm text-[#a19a9b]">
              {formatHandle(track.artistHandle)} · {track.genre}
            </span>
          </span>
        </button>
        <TrackFavoriteButton trackId={track.id} />
        <TrackActionsMenu track={track} />
      </article>
    );
  }

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <button
        type="button"
        onClick={handlePlay}
        aria-label={playLabel}
        aria-busy={playbackStatus === "loading" || undefined}
        className="flex flex-col text-left outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]"
      >
        <span
          className={cn(
            "relative block w-full overflow-hidden border transition-colors duration-150",
            imageAspect === "wide" ? "aspect-[16/9]" : "aspect-square",
            showsIndicator ? "border-2 border-[#ff164c]" : "border-[#30292b] group-hover:border-[#ff164c]/50",
          )}
        >
          <CoverImage
            src={track.coverUrl}
            loading="lazy"
            className="size-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <span className="absolute inset-0 bg-gradient-to-b from-transparent from-[38%] to-black/80" />
          <span className="absolute bottom-3 left-3">
            {showsIndicator && (
              <span className={cn("flex bg-[#ff164c] p-1", playbackStatus === "playing" && "group-hover:hidden")}>
                <TrackPlaybackIndicator status={playbackStatus} toneClassName="text-[#150f10]/85" />
              </span>
            )}
            <span
              className={cn(
                "size-8 items-center justify-center bg-[#ff164c] transition-transform active:scale-90",
                showsIndicator
                  ? playbackStatus === "playing"
                    ? "hidden group-hover:flex"
                    : "hidden"
                  : "hidden group-hover:flex group-focus-within:flex",
              )}
            >
              {playbackStatus === "playing" ? <PauseGlyph /> : <PlayGlyph />}
            </span>
          </span>
        </span>
        <span className={cn("px-1 py-2.5", isCurrent ? "text-[#ffe8ed]" : "text-[#bababa]")}>
          <span className="block truncate text-[14px] font-semibold leading-[1.5]">{track.title}</span>
          <span className="block truncate text-[12px] leading-[1.25]">{formatHandle(track.artistHandle)}</span>
        </span>
      </button>

      <div className="absolute top-2 right-2 flex items-center gap-1 bg-black/70 backdrop-blur-sm transition-opacity duration-150 pointer-fine:opacity-0 pointer-fine:group-hover:opacity-100 pointer-fine:group-focus-within:opacity-100">
        <TrackFavoriteButton trackId={track.id} size="sm" />
        <TrackActionsMenu track={track} triggerClassName="text-[#f8f8f8]" />
      </div>
    </article>
  );
}
