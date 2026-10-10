import type { Playlist, Track, UserProfile } from "../../types/domain";
import { DEFAULT_COVER_URL } from "../../utils/placeholders";
import type { Database } from "./database.types";
import { getPublicMediaUrl, MEDIA_BUCKETS } from "./supabaseStorage";

type PublicSchema = Database["public"];

/** Colunas de `profiles` que o front usa; nunca inclui `role` nem `last_login_at`. */
export const PROFILE_COLUMNS =
  "id, display_name, handle, bio, avatar_path, banner_path, is_public, favorite_genres, moods, followers_count, following_count";

export const TRACK_COLUMNS =
  "id, artist_id, artist_handle, title, genre, moods, album, description, tags, ai_generator, prompt, audio_path, cover_path, duration_seconds, play_count, created_at";

export const PLAYLIST_COLUMNS =
  "id, owner_id, owner_handle, title, description, cover_path, is_public, track_ids, created_at, updated_at";

export type ProfileRow = Pick<
  PublicSchema["Tables"]["profiles"]["Row"],
  | "id"
  | "display_name"
  | "handle"
  | "bio"
  | "avatar_path"
  | "banner_path"
  | "is_public"
  | "favorite_genres"
  | "moods"
  | "followers_count"
  | "following_count"
>;

type TrackViewRow = PublicSchema["Views"]["tracks_with_artist"]["Row"];

export type TrackRow = Pick<
  TrackViewRow,
  | "id"
  | "artist_id"
  | "artist_handle"
  | "title"
  | "genre"
  | "moods"
  | "album"
  | "description"
  | "tags"
  | "ai_generator"
  | "prompt"
  | "audio_path"
  | "cover_path"
  | "duration_seconds"
  | "play_count"
  | "created_at"
>;

export type PlaylistRow = PublicSchema["Views"]["playlists_with_details"]["Row"];

const UNKNOWN_HANDLE = "desconhecido";

function toOptionalText(value: string | null | undefined): string | undefined {
  const trimmedValue = value?.trim();
  return trimmedValue ? trimmedValue : undefined;
}

export function toUserProfile(row: ProfileRow): UserProfile {
  return {
    id: row.id,
    displayName: row.display_name,
    handle: row.handle,
    avatarUrl: getPublicMediaUrl(MEDIA_BUCKETS.userMedia, row.avatar_path),
    bannerUrl: getPublicMediaUrl(MEDIA_BUCKETS.userMedia, row.banner_path),
    bio: row.bio,
    followersCount: row.followers_count,
    followingCount: row.following_count,
    isPublic: row.is_public,
    favoriteGenres: row.favorite_genres,
    moods: row.moods,
  };
}

/** Colunas de views chegam tipadas como anuláveis, embora as de origem sejam NOT NULL. */
export function toTrack(row: TrackRow): Track {
  return {
    id: row.id ?? "",
    title: row.title ?? "",
    artistId: row.artist_id ?? "",
    artistHandle: row.artist_handle ?? UNKNOWN_HANDLE,
    coverUrl: getPublicMediaUrl(MEDIA_BUCKETS.trackCover, row.cover_path) ?? DEFAULT_COVER_URL,
    audioUrl: getPublicMediaUrl(MEDIA_BUCKETS.audio, row.audio_path) ?? "",
    durationSeconds: row.duration_seconds ?? 0,
    genre: row.genre ?? "",
    moods: row.moods ?? [],
    album: toOptionalText(row.album),
    description: toOptionalText(row.description),
    tags: row.tags ?? [],
    aiGenerator: toOptionalText(row.ai_generator),
    prompt: toOptionalText(row.prompt),
    playCount: row.play_count ?? 0,
    createdAt: row.created_at ?? "",
  };
}

export function toPlaylist(row: PlaylistRow): Playlist {
  return {
    id: row.id ?? "",
    ownerId: row.owner_id ?? "",
    ownerHandle: row.owner_handle ?? UNKNOWN_HANDLE,
    title: row.title ?? "",
    description: row.description ?? "",
    coverUrl: getPublicMediaUrl(MEDIA_BUCKETS.playlistCover, row.cover_path),
    isPublic: row.is_public ?? false,
    trackIds: row.track_ids ?? [],
    createdAt: row.created_at ?? "",
    updatedAt: row.updated_at ?? "",
  };
}

/** Reordena o resultado de um `in (...)` conforme a ordem pedida, descartando ids não visíveis. */
export function orderByIds<TItem extends { id: string }>(items: readonly TItem[], orderedIds: readonly string[]): TItem[] {
  const itemsById = new Map(items.map((item) => [item.id, item]));
  return orderedIds.map((id) => itemsById.get(id)).filter((item): item is TItem => Boolean(item));
}
