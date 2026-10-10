import { Lock } from "lucide-react";
import { Link } from "react-router";
import { buildPlaylistPath } from "../../routes/paths";
import type { Playlist, Track } from "../../types/domain";
import { summarizeTracks } from "../../utils/format";
import { DEFAULT_COVER_URL } from "../../utils/placeholders";
import { CoverImage } from "../ui/CoverImage";

export function resolvePlaylistCover(playlist: Playlist, playlistTracks: readonly Track[]): string {
  return playlist.coverUrl ?? playlistTracks[0]?.coverUrl ?? DEFAULT_COVER_URL;
}

interface PlaylistCardProps {
  playlist: Playlist;
  playlistTracks: readonly Track[];
}

export function PlaylistCard({ playlist, playlistTracks }: PlaylistCardProps) {
  return (
    <Link
      to={buildPlaylistPath(playlist.id)}
      className="flex flex-col border border-[#30292b] outline-none transition-all duration-200 hover:-translate-y-0.5 hover:border-[#ff164c] hover:shadow-[0_0_16px_rgba(255,22,76,0.25)] focus-visible:border-[#ff164c] focus-visible:ring-2 focus-visible:ring-[#ff164c]/50"
    >
      <span className="relative block aspect-square w-full overflow-hidden">
        <CoverImage
          src={resolvePlaylistCover(playlist, playlistTracks)}
          loading="lazy"
          className="absolute inset-0 size-full object-cover"
        />
        <span className="absolute inset-0 bg-gradient-to-b from-transparent from-[38%] to-black" />
        {!playlist.isPublic && (
          <span className="absolute top-3 right-3 flex items-center gap-1 bg-black/70 px-2 py-1 text-[11px] font-semibold text-[#bababa]">
            <Lock className="size-3" aria-hidden="true" />
            Privada
          </span>
        )}
      </span>
      <span className="px-[18px] py-[12px]">
        <span className="block truncate text-[16px] font-semibold leading-[1.5] text-[#bababa]">{playlist.title}</span>
        <span className="block text-[12px] leading-[1.25] text-[#bababa]">{summarizeTracks(playlistTracks)}</span>
      </span>
    </Link>
  );
}
