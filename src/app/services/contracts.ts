import type {
  AuthUser,
  CatalogOptions,
  HomeFeed,
  PaginatedResult,
  Playlist,
  PlaylistInput,
  ProfileStats,
  ProfileUpdate,
  Track,
  TrackSort,
  TrackUploadInput,
  UserProfile,
} from "../types/domain";

/**
 * Contratos da camada de dados. Componentes e contextos dependem apenas destas interfaces,
 * nunca do SDK do Supabase; falhas esperadas devem ser lançadas como `ServiceError` para
 * que a UI exiba mensagens consistentes.
 */

export interface SignInCredentials {
  email: string;
  password: string;
}

export interface SignUpData {
  displayName: string;
  email: string;
  password: string;
}

export interface PasswordChange {
  currentPassword: string;
  newPassword: string;
}

/** Com confirmação de e-mail ativa, o cadastro termina sem sessão até o usuário abrir o link. */
export type SignUpResult = { kind: "signed_in"; user: AuthUser } | { kind: "confirmation_pending"; email: string };

/** A troca de e-mail só é efetivada depois que o usuário confirma o novo endereço. */
export interface EmailUpdateResult {
  user: AuthUser;
  isConfirmationPending: boolean;
}

/**
 * Mudanças de sessão que acontecem fora de uma chamada direta da UI: retorno de OAuth, link de
 * recuperação de senha, logout em outra aba ou expiração do token.
 */
export type AuthChangeEvent =
  | { type: "signed_in" | "user_updated"; userId: string }
  | { type: "signed_out" }
  | { type: "password_recovery" }
  | { type: "auth_link_failed"; message: string };

export type AuthChangeListener = (event: AuthChangeEvent) => void;

export interface AuthService {
  getCurrentUser(): Promise<AuthUser | null>;
  signIn(credentials: SignInCredentials): Promise<AuthUser>;
  signUp(data: SignUpData): Promise<SignUpResult>;
  /** Retorna `null` quando o login continua por redirecionamento para o provedor. */
  signInWithGoogle(): Promise<AuthUser | null>;
  signOut(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  /** Só funciona dentro da sessão de recuperação aberta pelo link enviado por e-mail. */
  completePasswordReset(newPassword: string): Promise<AuthUser>;
  changePassword(change: PasswordChange): Promise<void>;
  updateEmail(newEmail: string): Promise<EmailUpdateResult>;
  deleteAccount(): Promise<void>;
  /** Retorna a função que cancela a inscrição. */
  subscribeToAuthChanges(listener: AuthChangeListener): () => void;
}

export interface UserService {
  getProfileByHandle(handle: string): Promise<UserProfile>;
  getProfileStats(userId: string): Promise<ProfileStats>;
  updateProfile(userId: string, update: ProfileUpdate): Promise<UserProfile>;
  isFollowing(followerId: string, targetUserId: string): Promise<boolean>;
  setFollowing(followerId: string, targetUserId: string, shouldFollow: boolean): Promise<UserProfile>;
}

export interface TrackSearchParams {
  query?: string;
  genres?: readonly string[];
  moods?: readonly string[];
  sort?: TrackSort;
  offset?: number;
  limit?: number;
}

export type UploadProgressListener = (percentComplete: number) => void;

export interface CatalogService {
  getCatalogOptions(): Promise<CatalogOptions>;
  getHomeFeed(): Promise<HomeFeed>;
  getRecommendedTracks(userId: string, limit?: number): Promise<Track[]>;
  searchTracks(params: TrackSearchParams): Promise<PaginatedResult<Track>>;
  getTracksByIds(trackIds: readonly string[]): Promise<Track[]>;
  getTracksByArtist(artistId: string): Promise<Track[]>;
  publishTrack(artist: UserProfile, input: TrackUploadInput, onProgress?: UploadProgressListener): Promise<Track>;
}

export interface LibraryService {
  getFavoriteTrackIds(userId: string): Promise<string[]>;
  setFavorite(userId: string, trackId: string, isFavorite: boolean): Promise<void>;
  getRecentlyPlayedTrackIds(userId: string): Promise<string[]>;
  recordPlay(userId: string, trackId: string): Promise<void>;
  getPlaylists(userId: string): Promise<Playlist[]>;
  getPublicPlaylists(ownerId: string): Promise<Playlist[]>;
  getPlaylistById(viewerId: string, playlistId: string): Promise<Playlist>;
  createPlaylist(userId: string, input: PlaylistInput): Promise<Playlist>;
  updatePlaylist(userId: string, playlistId: string, input: PlaylistInput): Promise<Playlist>;
  deletePlaylist(userId: string, playlistId: string): Promise<void>;
  addTrackToPlaylist(userId: string, playlistId: string, trackId: string): Promise<Playlist>;
  removeTrackFromPlaylist(userId: string, playlistId: string, trackId: string): Promise<Playlist>;
  reorderPlaylistTracks(userId: string, playlistId: string, orderedTrackIds: readonly string[]): Promise<Playlist>;
}

export interface AppServices {
  authService: AuthService;
  userService: UserService;
  catalogService: CatalogService;
  libraryService: LibraryService;
}
