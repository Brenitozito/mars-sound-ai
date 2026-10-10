import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { libraryService } from "../services";
import type { Playlist, PlaylistInput } from "../types/domain";
import { useCurrentUser } from "./AuthContext";

interface LibraryContextValue {
  isLoading: boolean;
  loadErrorMessage: string | null;
  reloadLibrary: () => void;
  favoriteTrackIds: string[];
  isFavorite: (trackId: string) => boolean;
  toggleFavorite: (trackId: string) => Promise<boolean>;
  recentlyPlayedTrackIds: string[];
  recordPlay: (trackId: string) => void;
  playlists: Playlist[];
  getPlaylistById: (playlistId: string) => Playlist | undefined;
  createPlaylist: (input: PlaylistInput) => Promise<Playlist>;
  updatePlaylist: (playlistId: string, input: PlaylistInput) => Promise<Playlist>;
  deletePlaylist: (playlistId: string) => Promise<void>;
  addTrackToPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => Promise<void>;
  reorderPlaylistTracks: (playlistId: string, orderedTrackIds: string[]) => Promise<void>;
}

const LibraryContext = createContext<LibraryContextValue | null>(null);

function replacePlaylist(playlists: Playlist[], updatedPlaylist: Playlist): Playlist[] {
  return playlists.map((playlist) => (playlist.id === updatedPlaylist.id ? updatedPlaylist : playlist));
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const currentUser = useCurrentUser();
  const userId = currentUser.id;

  const [isLoading, setIsLoading] = useState(true);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [favoriteTrackIds, setFavoriteTrackIds] = useState<string[]>([]);
  const [recentlyPlayedTrackIds, setRecentlyPlayedTrackIds] = useState<string[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [reloadCounter, setReloadCounter] = useState(0);
  const reloadLibrary = useCallback(() => setReloadCounter((counter) => counter + 1), []);

  useEffect(() => {
    let isCurrentUser = true;
    setIsLoading(true);
    setLoadErrorMessage(null);

    Promise.all([
      libraryService.getFavoriteTrackIds(userId),
      libraryService.getRecentlyPlayedTrackIds(userId),
      libraryService.getPlaylists(userId),
    ])
      .then(([favoriteIds, recentlyPlayedIds, userPlaylists]) => {
        if (!isCurrentUser) return;
        setFavoriteTrackIds(favoriteIds);
        setRecentlyPlayedTrackIds(recentlyPlayedIds);
        setPlaylists(userPlaylists);
        setLoadErrorMessage(null);
      })
      .catch(() => {
        if (isCurrentUser) setLoadErrorMessage("Não foi possível carregar sua biblioteca.");
      })
      .finally(() => {
        if (isCurrentUser) setIsLoading(false);
      });

    return () => {
      isCurrentUser = false;
    };
  }, [userId, reloadCounter]);

  const favoriteTrackIdSet = useMemo(() => new Set(favoriteTrackIds), [favoriteTrackIds]);
  const isFavorite = useCallback((trackId: string) => favoriteTrackIdSet.has(trackId), [favoriteTrackIdSet]);

  const toggleFavorite = useCallback(
    async (trackId: string) => {
      const shouldFavorite = !favoriteTrackIdSet.has(trackId);
      const applyFavorite = (favorite: boolean) =>
        setFavoriteTrackIds((previousIds) => {
          const idsWithoutTrack = previousIds.filter((id) => id !== trackId);
          return favorite ? [trackId, ...idsWithoutTrack] : idsWithoutTrack;
        });

      applyFavorite(shouldFavorite);
      try {
        await libraryService.setFavorite(userId, trackId, shouldFavorite);
        return shouldFavorite;
      } catch (error) {
        applyFavorite(!shouldFavorite);
        throw error;
      }
    },
    [favoriteTrackIdSet, userId],
  );

  const recordPlay = useCallback(
    (trackId: string) => {
      setRecentlyPlayedTrackIds((previousIds) => [trackId, ...previousIds.filter((id) => id !== trackId)].slice(0, 20));
      libraryService.recordPlay(userId, trackId).catch(() => {
        // Histórico é não-crítico: uma falha aqui não deve interromper a reprodução.
      });
    },
    [userId],
  );

  const getPlaylistById = useCallback(
    (playlistId: string) => playlists.find((playlist) => playlist.id === playlistId),
    [playlists],
  );

  const createPlaylist = useCallback(
    async (input: PlaylistInput) => {
      const createdPlaylist = await libraryService.createPlaylist(userId, input);
      setPlaylists((previous) => [createdPlaylist, ...previous]);
      return createdPlaylist;
    },
    [userId],
  );

  const updatePlaylist = useCallback(
    async (playlistId: string, input: PlaylistInput) => {
      const updatedPlaylist = await libraryService.updatePlaylist(userId, playlistId, input);
      setPlaylists((previous) => replacePlaylist(previous, updatedPlaylist));
      return updatedPlaylist;
    },
    [userId],
  );

  const deletePlaylist = useCallback(
    async (playlistId: string) => {
      await libraryService.deletePlaylist(userId, playlistId);
      setPlaylists((previous) => previous.filter((playlist) => playlist.id !== playlistId));
    },
    [userId],
  );

  const addTrackToPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const updatedPlaylist = await libraryService.addTrackToPlaylist(userId, playlistId, trackId);
      setPlaylists((previous) => replacePlaylist(previous, updatedPlaylist));
    },
    [userId],
  );

  const removeTrackFromPlaylist = useCallback(
    async (playlistId: string, trackId: string) => {
      const updatedPlaylist = await libraryService.removeTrackFromPlaylist(userId, playlistId, trackId);
      setPlaylists((previous) => replacePlaylist(previous, updatedPlaylist));
    },
    [userId],
  );

  const reorderPlaylistTracks = useCallback(
    async (playlistId: string, orderedTrackIds: string[]) => {
      const previousPlaylist = playlists.find((playlist) => playlist.id === playlistId);
      if (!previousPlaylist) return;

      setPlaylists((previous) => replacePlaylist(previous, { ...previousPlaylist, trackIds: orderedTrackIds }));
      try {
        const updatedPlaylist = await libraryService.reorderPlaylistTracks(userId, playlistId, orderedTrackIds);
        setPlaylists((previous) => replacePlaylist(previous, updatedPlaylist));
      } catch (error) {
        setPlaylists((previous) => replacePlaylist(previous, previousPlaylist));
        throw error;
      }
    },
    [playlists, userId],
  );

  const value = useMemo<LibraryContextValue>(
    () => ({
      isLoading,
      loadErrorMessage,
      reloadLibrary,
      favoriteTrackIds,
      isFavorite,
      toggleFavorite,
      recentlyPlayedTrackIds,
      recordPlay,
      playlists,
      getPlaylistById,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      reorderPlaylistTracks,
    }),
    [
      isLoading,
      loadErrorMessage,
      reloadLibrary,
      favoriteTrackIds,
      isFavorite,
      toggleFavorite,
      recentlyPlayedTrackIds,
      recordPlay,
      playlists,
      getPlaylistById,
      createPlaylist,
      updatePlaylist,
      deletePlaylist,
      addTrackToPlaylist,
      removeTrackFromPlaylist,
      reorderPlaylistTracks,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) throw new Error("useLibrary deve ser usado dentro de LibraryProvider.");
  return context;
}
