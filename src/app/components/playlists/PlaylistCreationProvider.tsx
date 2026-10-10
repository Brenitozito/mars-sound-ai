import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useLibrary } from "../../context/LibraryContext";
import { buildPlaylistPath } from "../../routes/paths";
import { getErrorMessage } from "../../services/serviceError";
import type { PlaylistInput, Track } from "../../types/domain";
import { PlaylistFormDialog } from "./PlaylistFormDialog";

interface PlaylistCreationRequest {
  trackToAdd?: Track;
}

interface PlaylistCreationContextValue {
  openPlaylistCreation: (request?: PlaylistCreationRequest) => void;
}

const PlaylistCreationContext = createContext<PlaylistCreationContextValue | null>(null);

/**
 * Um único diálogo de criação para todo o app: evita uma instância por linha de música
 * e impede que eventos do diálogo (renderizado em portal) borbulhem até a linha que o abriu.
 */
export function PlaylistCreationProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { createPlaylist, addTrackToPlaylist } = useLibrary();
  const [activeRequest, setActiveRequest] = useState<PlaylistCreationRequest | null>(null);

  const openPlaylistCreation = useCallback((request: PlaylistCreationRequest = {}) => setActiveRequest(request), []);

  const handleSubmit = async (input: PlaylistInput) => {
    const trackToAdd = activeRequest?.trackToAdd;
    const createdPlaylist = await createPlaylist(input);
    setActiveRequest(null);

    const openPlaylistAction = { label: "Abrir", onClick: () => navigate(buildPlaylistPath(createdPlaylist.id)) };
    if (!trackToAdd) {
      toast.success(`Playlist “${createdPlaylist.title}” criada.`, { action: openPlaylistAction });
      return;
    }

    try {
      await addTrackToPlaylist(createdPlaylist.id, trackToAdd.id);
      toast.success(`“${trackToAdd.title}” adicionada à nova playlist “${createdPlaylist.title}”.`, {
        action: openPlaylistAction,
      });
    } catch (error) {
      toast.error(getErrorMessage(error, "A playlist foi criada, mas não foi possível adicionar a música."));
    }
  };

  const value = useMemo(() => ({ openPlaylistCreation }), [openPlaylistCreation]);

  return (
    <PlaylistCreationContext.Provider value={value}>
      {children}
      <PlaylistFormDialog
        open={activeRequest !== null}
        onOpenChange={(open) => !open && setActiveRequest(null)}
        mode="create"
        onSubmit={handleSubmit}
      />
    </PlaylistCreationContext.Provider>
  );
}

export function usePlaylistCreation(): PlaylistCreationContextValue {
  const context = useContext(PlaylistCreationContext);
  if (!context) throw new Error("usePlaylistCreation deve ser usado dentro de PlaylistCreationProvider.");
  return context;
}
