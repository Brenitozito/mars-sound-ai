import { useMemo } from "react";
import { catalogService } from "../services";
import type { Track } from "../types/domain";
import { useAsyncData } from "./useAsyncData";

/**
 * A lista exibida é derivada dos IDs atuais: remoções aparecem na hora e
 * apenas IDs novos dependem da resposta do serviço.
 */
export function useTracksByIds(trackIds: readonly string[]) {
  const trackIdsKey = trackIds.join("|");
  const { data: fetchedTracks, errorMessage, isLoading, reload } = useAsyncData(
    () => catalogService.getTracksByIds(trackIds),
    [trackIdsKey],
    "Não foi possível carregar as músicas.",
  );

  const tracksById = useMemo(() => new Map((fetchedTracks ?? []).map((track) => [track.id, track])), [fetchedTracks]);

  const tracks = useMemo(
    () => trackIds.map((trackId) => tracksById.get(trackId)).filter((track): track is Track => Boolean(track)),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- a chave textual representa os IDs
    [trackIdsKey, tracksById],
  );

  return {
    tracks,
    tracksById,
    errorMessage,
    isLoading: isLoading && !fetchedTracks,
    reload,
  };
}
