import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { catalogService, getErrorMessage, type TrackSearchParams } from "../services";
import type { Track } from "../types/domain";

const SEARCH_PAGE_SIZE = 12;

export type TrackSearchFilters = Pick<TrackSearchParams, "query" | "genres" | "moods" | "sort">;

interface TrackSearchState {
  tracks: Track[];
  total: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  errorMessage: string | null;
}

const INITIAL_STATE: TrackSearchState = { tracks: [], total: 0, isLoading: true, isLoadingMore: false, errorMessage: null };

function createFiltersKey({ query = "", genres = [], moods = [], sort = "popular" }: TrackSearchFilters): string {
  return JSON.stringify([query.trim(), [...genres].sort(), [...moods].sort(), sort]);
}

export function useTrackSearch(filters: TrackSearchFilters) {
  const [state, setState] = useState<TrackSearchState>(INITIAL_STATE);
  const [reloadCounter, setReloadCounter] = useState(0);
  const requestIdRef = useRef(0);
  const filtersKey = createFiltersKey(filters);
  const filtersRef = useRef(filters);
  filtersRef.current = filters;

  useEffect(() => {
    const requestId = ++requestIdRef.current;
    setState((previous) => ({ ...previous, isLoading: true, errorMessage: null }));

    catalogService
      .searchTracks({ ...filtersRef.current, offset: 0, limit: SEARCH_PAGE_SIZE })
      .then(({ items, total }) => {
        if (requestId === requestIdRef.current) {
          setState({ tracks: items, total, isLoading: false, isLoadingMore: false, errorMessage: null });
        }
      })
      .catch((error: unknown) => {
        if (requestId === requestIdRef.current) {
          setState((previous) => ({ ...previous, isLoading: false, errorMessage: getErrorMessage(error, "Não foi possível carregar as músicas.") }));
        }
      });
  }, [filtersKey, reloadCounter]);

  const loadedCount = state.tracks.length;
  const loadMore = useCallback(() => {
    const requestId = requestIdRef.current;
    setState((previous) => ({ ...previous, isLoadingMore: true }));

    catalogService
      .searchTracks({ ...filtersRef.current, offset: loadedCount, limit: SEARCH_PAGE_SIZE })
      .then(({ items, total }) => {
        if (requestId !== requestIdRef.current) return;
        setState((previous) => {
          const loadedIds = new Set(previous.tracks.map((track) => track.id));
          return {
            ...previous,
            tracks: [...previous.tracks, ...items.filter((item) => !loadedIds.has(item.id))],
            total,
            isLoadingMore: false,
          };
        });
      })
      .catch((error: unknown) => {
        if (requestId !== requestIdRef.current) return;
        setState((previous) => ({ ...previous, isLoadingMore: false }));
        toast.error(getErrorMessage(error, "Não foi possível carregar mais músicas."));
      });
  }, [loadedCount]);

  const reload = useCallback(() => setReloadCounter((counter) => counter + 1), []);
  const hasMore = state.tracks.length < state.total;

  return { ...state, hasMore, loadMore, reload };
}
