import type { KeyboardEvent } from "react";
import { usePlayer, type PlaybackStatus } from "../../context/PlayerContext";
import type { Track } from "../../types/domain";
import { formatHandle, formatPlaybackTime } from "../../utils/format";
import { CoverImage } from "../ui/CoverImage";
import { cn } from "../ui/utils";
import { TrackActionsMenu, type PlaylistTrackActions } from "./TrackActionsMenu";
import { TrackFavoriteButton } from "./TrackFavoriteButton";
import { getTrackPlayActionLabel, hasPlaybackIndicator, TrackPlaybackIndicator } from "./TrackPlaybackIndicator";

export type MoveOffset = -1 | 1;

export interface EditablePlaylistHandlers {
  onRemove: (track: Track) => void;
  onMove: (track: Track, offset: MoveOffset) => void;
}

interface TrackTableProps {
  tracks: Track[];
  showAlbum?: boolean;
  showDuration?: boolean;
  showFavorite?: boolean;
  editablePlaylist?: EditablePlaylistHandlers;
}

function buildPlaylistActions(
  handlers: EditablePlaylistHandlers | undefined,
  track: Track,
  index: number,
  totalTracks: number,
): PlaylistTrackActions | undefined {
  if (!handlers) return undefined;
  return {
    onRemove: () => handlers.onRemove(track),
    onMoveUp: index > 0 ? () => handlers.onMove(track, -1) : undefined,
    onMoveDown: index < totalTracks - 1 ? () => handlers.onMove(track, 1) : undefined,
  };
}

const CELL_PADDING_CLASS = "px-2 py-3 sm:px-4";
const HEADER_CELL_CLASS = cn(CELL_PADDING_CLASS, "text-[12px] font-semibold uppercase tracking-wide text-[#a19a9b]");

export function TrackTable({
  tracks,
  showAlbum = true,
  showDuration = true,
  showFavorite = true,
  editablePlaylist,
}: TrackTableProps) {
  const { currentTrack, playbackStatus, playTrack } = usePlayer();

  return (
    <div className="overflow-x-auto">
      <table className="w-full table-fixed">
        <thead>
          <tr className="border-b border-[#30292b]">
            <th className={cn(HEADER_CELL_CLASS, "w-10 text-center sm:w-14")}>#</th>
            <th className={cn(HEADER_CELL_CLASS, "text-left")}>Título</th>
            {showAlbum && <th className={cn(HEADER_CELL_CLASS, "hidden text-left md:table-cell")}>Álbum</th>}
            {showDuration && <th className={cn(HEADER_CELL_CLASS, "hidden w-24 text-center sm:table-cell")}>Tempo</th>}
            {showFavorite && (
              <th className={cn(HEADER_CELL_CLASS, "w-12 text-center sm:w-16")}>
                <span className="sr-only sm:not-sr-only">Salvar</span>
              </th>
            )}
            <th className="w-12">
              <span className="sr-only">Ações</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              position={index + 1}
              playbackStatus={currentTrack?.id === track.id ? playbackStatus : "idle"}
              onPlay={() => playTrack(track, tracks)}
              showAlbum={showAlbum}
              showDuration={showDuration}
              showFavorite={showFavorite}
              playlistActions={buildPlaylistActions(editablePlaylist, track, index, tracks.length)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

interface TrackRowProps {
  track: Track;
  position: number;
  playbackStatus: PlaybackStatus;
  onPlay: () => void;
  showAlbum: boolean;
  showDuration: boolean;
  showFavorite: boolean;
  playlistActions?: PlaylistTrackActions;
}

function TrackRow({
  track,
  position,
  playbackStatus,
  onPlay,
  showAlbum,
  showDuration,
  showFavorite,
  playlistActions,
}: TrackRowProps) {
  const isCurrent = playbackStatus !== "idle";
  const handleKeyDown = (event: KeyboardEvent<HTMLTableRowElement>) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      onPlay();
    }
  };

  return (
    <tr
      tabIndex={0}
      onClick={onPlay}
      onKeyDown={handleKeyDown}
      aria-label={getTrackPlayActionLabel(playbackStatus, track)}
      aria-current={isCurrent ? "true" : undefined}
      aria-busy={playbackStatus === "loading" || undefined}
      className={cn(
        "group cursor-pointer border-b border-[#30292b] outline-none transition-colors duration-150 focus-visible:bg-white/5",
        isCurrent ? "bg-[#ff164c]/[0.08]" : "hover:bg-white/[0.04]",
      )}
    >
      <td className={CELL_PADDING_CLASS}>
        <div className="flex w-6 items-center justify-center">
          {hasPlaybackIndicator(playbackStatus) ? (
            <TrackPlaybackIndicator status={playbackStatus} />
          ) : (
            <>
              <span
                className={cn(
                  "text-[14px] font-semibold group-hover:hidden group-focus-visible:hidden",
                  isCurrent ? "text-[#ff164c]" : "text-[#a19a9b]",
                )}
              >
                {position}
              </span>
              <svg
                className="hidden group-hover:block group-focus-visible:block"
                width="12"
                height="14"
                viewBox="0 0 12 14"
                aria-hidden="true"
              >
                <path d="M1 1L11 7L1 13V1Z" fill="#ff164c" />
              </svg>
            </>
          )}
        </div>
      </td>

      <td className={CELL_PADDING_CLASS}>
        <div className="flex min-w-0 items-center gap-3">
          <CoverImage
            src={track.coverUrl}
            loading="lazy"
            className={cn("size-12 shrink-0 border object-cover", isCurrent ? "border-[#ff164c]" : "border-[#30292b]")}
          />
          <div className="min-w-0">
            <p className={cn("truncate text-[14px] font-semibold", isCurrent ? "text-[#ff164c]" : "text-[#f8f8f8]")}>
              {track.title}
            </p>
            <p className="truncate text-[12px] text-[#bababa]">{formatHandle(track.artistHandle)}</p>
          </div>
        </div>
      </td>

      {showAlbum && (
        <td className="hidden truncate px-4 py-3 text-[14px] font-semibold text-[#bababa] md:table-cell">
          {track.album ?? "—"}
        </td>
      )}

      {showDuration && (
        <td className="hidden px-4 py-3 text-center text-[14px] font-semibold text-[#bababa] sm:table-cell">
          {formatPlaybackTime(track.durationSeconds)}
        </td>
      )}

      {showFavorite && (
        <td className={CELL_PADDING_CLASS}>
          <div className="flex justify-center">
            <TrackFavoriteButton trackId={track.id} size="sm" />
          </div>
        </td>
      )}

      <td className="py-3 pr-2">
        <TrackActionsMenu track={track} playlistActions={playlistActions} />
      </td>
    </tr>
  );
}
