import type { Playlist, PlaylistInput } from "../../types/domain";
import type { LibraryService } from "../contracts";
import { ServiceError } from "../serviceError";
import { getSupabase } from "./client";
import { toServiceError, unwrap } from "./supabaseErrors";
import { PLAYLIST_COLUMNS, toPlaylist, type PlaylistRow } from "./supabaseMappers";
import { MEDIA_BUCKETS, persistWithMediaChanges, removeObjectsQuietly } from "./supabaseStorage";

const RECENTLY_PLAYED_LIMIT = 20;
const PLAYLIST_NOT_FOUND_MESSAGE = "Playlist não encontrada.";
const UNIQUE_VIOLATION = "23505";
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const PLAYLIST_ERROR_MESSAGES = {
  validation: "Verifique os dados da playlist e tente novamente.",
  unknown: "Não foi possível salvar a playlist. Tente novamente.",
};

function playlistsQuery() {
  return getSupabase().from("playlists_with_details").select(PLAYLIST_COLUMNS);
}

function validatePlaylistInput(input: PlaylistInput): void {
  if (!input.title.trim()) throw new ServiceError("validation", "Dê um nome para a playlist.");
}

/** Ids malformados (vindos da URL) viram "não encontrada" em vez de erro de tipo do Postgres. */
async function requirePlaylistRow(playlistId: string): Promise<PlaylistRow> {
  const playlistRow = UUID_PATTERN.test(playlistId)
    ? unwrap(await playlistsQuery().eq("id", playlistId).maybeSingle())
    : null;
  if (!playlistRow) throw new ServiceError("not_found", PLAYLIST_NOT_FOUND_MESSAGE);
  return playlistRow;
}

async function requirePlaylist(playlistId: string): Promise<Playlist> {
  return toPlaylist(await requirePlaylistRow(playlistId));
}

async function requireOwnedPlaylistCoverPath(userId: string, playlistId: string): Promise<string | null> {
  const playlistRow = await requirePlaylistRow(playlistId);
  if (playlistRow.owner_id !== userId) throw new ServiceError("not_found", PLAYLIST_NOT_FOUND_MESSAGE);
  return playlistRow.cover_path;
}

function ignoreDuplicate(error: { code?: string } | null): void {
  if (error && error.code !== UNIQUE_VIOLATION) throw toServiceError(error);
}

export const supabaseLibraryService: LibraryService = {
  async getFavoriteTrackIds(userId) {
    const rows = unwrap(
      await getSupabase()
        .from("favorites")
        .select("track_id")
        .eq("user_id", userId)
        .order("created_at", { ascending: false }),
    );
    return rows.map((row) => row.track_id);
  },

  async setFavorite(userId, trackId, isFavorite) {
    const favorites = getSupabase().from("favorites");
    if (isFavorite) {
      const { error } = await favorites.insert({ user_id: userId, track_id: trackId });
      ignoreDuplicate(error);
      return;
    }
    unwrap(await favorites.delete().eq("user_id", userId).eq("track_id", trackId));
  },

  async getRecentlyPlayedTrackIds() {
    const rows = unwrap(await getSupabase().rpc("get_recently_played", { p_limit: RECENTLY_PLAYED_LIMIT }));
    return rows.map((row) => row.track_id);
  },

  async recordPlay(userId, trackId) {
    unwrap(await getSupabase().from("plays").insert({ user_id: userId, track_id: trackId }));
  },

  async getPlaylists(userId) {
    const rows = unwrap(await playlistsQuery().eq("owner_id", userId).order("created_at", { ascending: false }));
    return rows.map(toPlaylist);
  },

  async getPublicPlaylists(ownerId) {
    const rows = unwrap(
      await playlistsQuery().eq("owner_id", ownerId).eq("is_public", true).order("created_at", { ascending: false }),
    );
    return rows.map(toPlaylist);
  },

  async getPlaylistById(_viewerId, playlistId) {
    return requirePlaylist(playlistId);
  },

  async createPlaylist(userId, input) {
    validatePlaylistInput(input);
    const playlistId = crypto.randomUUID();
    return persistWithMediaChanges(
      MEDIA_BUCKETS.playlistCover,
      userId,
      [{ currentPath: null, change: input.cover }],
      async ([coverPath]) => {
        unwrap(
          await getSupabase().from("playlists").insert({
            id: playlistId,
            owner_id: userId,
            title: input.title.trim(),
            description: input.description.trim(),
            is_public: input.isPublic,
            cover_path: coverPath,
          }),
          PLAYLIST_ERROR_MESSAGES,
        );
        return requirePlaylist(playlistId);
      },
    );
  },

  async updatePlaylist(userId, playlistId, input) {
    validatePlaylistInput(input);
    const currentCoverPath = await requireOwnedPlaylistCoverPath(userId, playlistId);
    return persistWithMediaChanges(
      MEDIA_BUCKETS.playlistCover,
      userId,
      [{ currentPath: currentCoverPath, change: input.cover }],
      async ([coverPath]) => {
        const updatedRows = unwrap(
          await getSupabase()
            .from("playlists")
            .update({
              title: input.title.trim(),
              description: input.description.trim(),
              is_public: input.isPublic,
              cover_path: coverPath,
            })
            .eq("id", playlistId)
            .select("id"),
          PLAYLIST_ERROR_MESSAGES,
        );
        if (updatedRows.length === 0) throw new ServiceError("not_found", PLAYLIST_NOT_FOUND_MESSAGE);
        return requirePlaylist(playlistId);
      },
    );
  },

  async deletePlaylist(userId, playlistId) {
    const coverPath = await requireOwnedPlaylistCoverPath(userId, playlistId);
    const deletedRows = unwrap(await getSupabase().from("playlists").delete().eq("id", playlistId).select("id"));
    if (deletedRows.length === 0) throw new ServiceError("not_found", PLAYLIST_NOT_FOUND_MESSAGE);
    await removeObjectsQuietly(MEDIA_BUCKETS.playlistCover, [coverPath]);
  },

  async addTrackToPlaylist(_userId, playlistId, trackId) {
    unwrap(
      await getSupabase().rpc("add_track_to_playlist", { p_playlist_id: playlistId, p_track_id: trackId }),
      { unknown: "Não foi possível adicionar a música. Tente novamente." },
    );
    return requirePlaylist(playlistId);
  },

  async removeTrackFromPlaylist(_userId, playlistId, trackId) {
    unwrap(
      await getSupabase().rpc("remove_track_from_playlist", { p_playlist_id: playlistId, p_track_id: trackId }),
      { unknown: "Não foi possível remover a música. Tente novamente." },
    );
    return requirePlaylist(playlistId);
  },

  async reorderPlaylistTracks(_userId, playlistId, orderedTrackIds) {
    unwrap(
      await getSupabase().rpc("reorder_playlist_tracks", {
        p_playlist_id: playlistId,
        p_track_ids: [...orderedTrackIds],
      }),
      { conflict: "A playlist mudou enquanto você reordenava. Recarregue e tente novamente." },
    );
    return requirePlaylist(playlistId);
  },
};
