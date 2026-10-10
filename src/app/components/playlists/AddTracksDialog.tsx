import { Check, Plus, Search } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useLibrary } from "../../context/LibraryContext";
import { useDebouncedValue } from "../../hooks/useDebouncedValue";
import { useTrackSearch } from "../../hooks/useTrackSearch";
import { getErrorMessage } from "../../services/serviceError";
import type { Playlist, Track } from "../../types/domain";
import { formatHandle } from "../../utils/format";
import { EmptyState, ErrorState, LoadingState } from "../feedback/StatusViews";
import { TextInput } from "../forms/FormControls";
import { Button } from "../ui/button";
import { CoverImage } from "../ui/CoverImage";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { DIALOG_SURFACE_CLASS } from "../ui/surfaceStyles";

const SEARCH_DEBOUNCE_MS = 300;

interface AddTracksDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playlist: Playlist;
}

export function AddTracksDialog({ open, onOpenChange, playlist }: AddTracksDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SURFACE_CLASS}>
        <DialogTitle className="text-[24px] font-bold leading-[1.5] text-[#ebe9e9]">Adicionar músicas</DialogTitle>
        <DialogDescription className="text-[13px] text-[#a19a9b]">
          Busque no catálogo e adicione à playlist “{playlist.title}”.
        </DialogDescription>
        <AddTracksSearch playlist={playlist} />
      </DialogContent>
    </Dialog>
  );
}

function AddTracksSearch({ playlist }: { playlist: Playlist }) {
  const { addTrackToPlaylist } = useLibrary();
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS);
  const search = useTrackSearch({ query: debouncedQuery });
  const [pendingTrackIds, setPendingTrackIds] = useState<ReadonlySet<string>>(new Set());
  const addedTrackIds = new Set(playlist.trackIds);

  const setTrackPending = (trackId: string, isPending: boolean) =>
    setPendingTrackIds((previous) => {
      const next = new Set(previous);
      if (isPending) next.add(trackId);
      else next.delete(trackId);
      return next;
    });

  const handleAdd = async (track: Track) => {
    setTrackPending(track.id, true);
    try {
      await addTrackToPlaylist(playlist.id, track.id);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível adicionar a música."));
    } finally {
      setTrackPending(track.id, false);
    }
  };

  const renderResults = () => {
    if (search.isLoading) return <LoadingState label="Buscando músicas..." />;
    if (search.errorMessage) return <ErrorState message={search.errorMessage} onRetry={search.reload} />;
    if (search.tracks.length === 0) {
      const description = debouncedQuery.trim()
        ? "Tente outro termo."
        : "Ainda não há músicas publicadas no catálogo.";
      return <EmptyState icon={<Search className="size-8" />} title="Nenhuma música encontrada" description={description} />;
    }
    return (
      <ul className="flex flex-col">
        {search.tracks.map((track) => {
          const isAdded = addedTrackIds.has(track.id);
          const isPending = pendingTrackIds.has(track.id);
          return (
            <li key={track.id} className="flex items-center gap-3 border-b border-[#30292b] py-2 last:border-b-0">
              <CoverImage src={track.coverUrl} loading="lazy" className="size-11 shrink-0 border border-[#30292b] object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-[14px] font-semibold text-[#f8f8f8]">{track.title}</p>
                <p className="truncate text-[12px] text-[#a19a9b]">
                  {formatHandle(track.artistHandle)} · {track.genre}
                </p>
              </div>
              <Button
                variant={isAdded ? "brandOutline" : "primary"}
                className="shrink-0"
                disabled={isAdded || isPending}
                onClick={() => handleAdd(track)}
                aria-label={isAdded ? `${track.title} já está na playlist` : `Adicionar ${track.title}`}
              >
                {isAdded ? <Check className="size-4" aria-hidden="true" /> : <Plus className="size-4" aria-hidden="true" />}
                {isAdded ? "Adicionada" : isPending ? "Adicionando..." : "Adicionar"}
              </Button>
            </li>
          );
        })}
      </ul>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <label htmlFor="add-tracks-search" className="sr-only">
        Buscar músicas
      </label>
      <TextInput
        id="add-tracks-search"
        type="search"
        placeholder="Buscar por título, artista, álbum ou tag"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      <div className="min-h-[200px]">{renderResults()}</div>
      {search.hasMore && !search.isLoading && (
        <Button variant="brandOutline" size="touch" onClick={search.loadMore} disabled={search.isLoadingMore}>
          {search.isLoadingMore ? "Carregando..." : "Carregar mais"}
        </Button>
      )}
    </div>
  );
}
