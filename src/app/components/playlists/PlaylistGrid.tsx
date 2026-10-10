import { useMemo } from "react";
import { useTracksByIds } from "../../hooks/useTracksByIds";
import type { Playlist, Track } from "../../types/domain";
import { PlaylistCard } from "./PlaylistCard";

/** Carrega de uma vez as faixas de todas as playlists para montar capas e resumos sem N requisições. */
export function PlaylistGrid({ playlists }: { playlists: readonly Playlist[] }) {
  const playlistTrackIds = useMemo(
    () => Array.from(new Set(playlists.flatMap((playlist) => playlist.trackIds))),
    [playlists],
  );
  const { tracksById } = useTracksByIds(playlistTrackIds);

  const getPlaylistTracks = (trackIds: string[]): Track[] =>
    trackIds.map((trackId) => tracksById.get(trackId)).filter((track): track is Track => Boolean(track));

  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-4">
      {playlists.map((playlist) => (
        <PlaylistCard key={playlist.id} playlist={playlist} playlistTracks={getPlaylistTracks(playlist.trackIds)} />
      ))}
    </div>
  );
}
