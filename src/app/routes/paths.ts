export const ROUTES = {
  home: "/",
  discover: "/descobrir",
  playlists: "/playlists",
  favorites: "/favoritos",
  myProfile: "/perfil",
  settings: "/configuracoes",
  upload: "/carregar-musica",
  signIn: "/entrar",
} as const;

export const ROUTE_PATTERNS = {
  playlistDetail: `${ROUTES.playlists}/:playlistId`,
  publicProfile: "/u/:handle",
} as const;

export function buildPlaylistPath(playlistId: string): string {
  return ROUTE_PATTERNS.playlistDetail.replace(":playlistId", encodeURIComponent(playlistId));
}

export function buildProfilePath(handle: string): string {
  return ROUTE_PATTERNS.publicProfile.replace(":handle", encodeURIComponent(handle));
}
