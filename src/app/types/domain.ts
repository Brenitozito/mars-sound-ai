export interface Track {
  id: string;
  title: string;
  artistId: string;
  artistHandle: string;
  coverUrl: string;
  audioUrl: string;
  durationSeconds: number;
  genre: string;
  moods: string[];
  album?: string;
  description?: string;
  tags: string[];
  aiGenerator?: string;
  prompt?: string;
  playCount: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  displayName: string;
  handle: string;
  avatarUrl: string | null;
  bannerUrl: string | null;
  bio: string;
  followersCount: number;
  followingCount: number;
  isPublic: boolean;
  favoriteGenres: string[];
  moods: string[];
}

export interface AuthUser extends UserProfile {
  email: string;
}

export interface ProfileStats {
  tracksCount: number;
  totalPlays: number;
  followersCount: number;
  followingCount: number;
}

export interface Playlist {
  id: string;
  ownerId: string;
  ownerHandle: string;
  title: string;
  description: string;
  coverUrl: string | null;
  isPublic: boolean;
  trackIds: string[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedResult<TItem> {
  items: TItem[];
  total: number;
}

export interface HomeFeed {
  topCreators: UserProfile[];
  trending: Track[];
  recentReleases: Track[];
  weeklyHighlights: Track[];
  featuredGenres: string[];
}

export type TrackSort = "popular" | "recent";

/** Listas exibidas nos formulários e filtros, mantidas no banco (tabelas de referência e tags em uso). */
export interface CatalogOptions {
  genres: string[];
  moods: string[];
  aiGenerators: string[];
  popularTags: string[];
}

/**
 * Intenção de alteração de uma mídia (capa, avatar, banner). A UI nunca produz URLs
 * definitivas: o service decide o caminho no Supabase Storage e gera a URL pública.
 */
export type MediaChange = { kind: "keep" } | { kind: "remove" } | { kind: "replace"; file: Blob };

export const KEEP_MEDIA: MediaChange = { kind: "keep" };

export type ProfileUpdate = Partial<
  Pick<UserProfile, "displayName" | "handle" | "bio" | "isPublic" | "favoriteGenres" | "moods">
> & {
  avatar?: MediaChange;
  banner?: MediaChange;
};

export interface PlaylistInput {
  title: string;
  description: string;
  isPublic: boolean;
  cover: MediaChange;
}

export interface TrackUploadInput {
  title: string;
  genre: string;
  moods: string[];
  album: string;
  description: string;
  aiGenerator: string;
  tags: string[];
  prompt: string;
  audioFile: File;
  coverFile: File | null;
}
