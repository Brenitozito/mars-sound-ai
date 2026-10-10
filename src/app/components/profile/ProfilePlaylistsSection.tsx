import { ListMusic } from "lucide-react";
import type { ReactNode } from "react";
import { useLibrary } from "../../context/LibraryContext";
import { useAsyncData } from "../../hooks/useAsyncData";
import { libraryService } from "../../services";
import type { Playlist } from "../../types/domain";
import { EmptyState, ErrorState, LoadingState } from "../feedback/StatusViews";
import { PlaylistCreationButton } from "../playlists/PlaylistCreationButton";
import { PlaylistGrid } from "../playlists/PlaylistGrid";

const PLAYLISTS_ERROR_MESSAGE = "Não foi possível carregar as playlists.";

interface PlaylistsPanelProps {
  playlists: readonly Playlist[] | undefined;
  isLoading: boolean;
  errorMessage: string | null;
  onRetry: () => void;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
}

function PlaylistsPanel({ playlists, isLoading, errorMessage, onRetry, emptyTitle, emptyDescription, emptyAction }: PlaylistsPanelProps) {
  if (isLoading && !playlists) return <LoadingState label="Carregando playlists..." />;
  if (errorMessage || !playlists) {
    return <ErrorState message={errorMessage ?? PLAYLISTS_ERROR_MESSAGE} onRetry={onRetry} />;
  }
  if (playlists.length === 0) {
    return <EmptyState icon={<ListMusic className="size-10" />} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }
  return <PlaylistGrid playlists={playlists} />;
}

export function OwnProfilePlaylists() {
  const { playlists, isLoading, loadErrorMessage, reloadLibrary } = useLibrary();
  return (
    <PlaylistsPanel
      playlists={playlists}
      isLoading={isLoading}
      errorMessage={loadErrorMessage}
      onRetry={reloadLibrary}
      emptyTitle="Você ainda não tem playlists"
      emptyDescription="Playlists públicas aparecem para quem visita seu perfil."
      emptyAction={<PlaylistCreationButton variant="primary">Criar playlist</PlaylistCreationButton>}
    />
  );
}

export function PublicProfilePlaylists({ ownerId, ownerName }: { ownerId: string; ownerName: string }) {
  const { data, errorMessage, isLoading, reload } = useAsyncData(
    () => libraryService.getPublicPlaylists(ownerId),
    [ownerId],
    PLAYLISTS_ERROR_MESSAGE,
  );
  return (
    <PlaylistsPanel
      playlists={data}
      isLoading={isLoading}
      errorMessage={errorMessage}
      onRetry={reload}
      emptyTitle="Nenhuma playlist pública"
      emptyDescription={`${ownerName} ainda não compartilhou playlists.`}
    />
  );
}
