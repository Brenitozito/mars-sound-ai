import { History, ListMusic, Plus } from "lucide-react";
import { Link } from "react-router";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { PlaylistCreationButton } from "../components/playlists/PlaylistCreationButton";
import { PlaylistGrid } from "../components/playlists/PlaylistGrid";
import { TrackTable } from "../components/tracks/TrackTable";
import { Button } from "../components/ui/button";
import { useLibrary } from "../context/LibraryContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTracksByIds } from "../hooks/useTracksByIds";
import { ROUTES } from "../routes/paths";

function RecentlyPlayedSection() {
  const { recentlyPlayedTrackIds, isLoading: isLibraryLoading, loadErrorMessage } = useLibrary();
  const { tracks, errorMessage, isLoading, reload } = useTracksByIds(recentlyPlayedTrackIds);

  const renderContent = () => {
    if (isLibraryLoading || isLoading) return <LoadingState label="Carregando músicas..." />;
    if (errorMessage) return <ErrorState message={errorMessage} onRetry={reload} />;
    if (tracks.length === 0) {
      return (
        <EmptyState
          icon={<History className="size-10" />}
          title="Nada tocado ainda"
          description="As músicas que você ouvir aparecerão aqui."
          action={
            <Button asChild variant="brandOutline" size="touch">
              <Link to={ROUTES.discover}>Descobrir músicas</Link>
            </Button>
          }
        />
      );
    }
    return <TrackTable tracks={tracks} showAlbum={false} showDuration={false} />;
  };

  // A falha da biblioteca já aparece com "Tentar novamente" na seção de playlists logo acima.
  if (loadErrorMessage) return null;

  return (
    <section aria-labelledby="recently-played-heading">
      <h2 id="recently-played-heading" className="mb-4 text-[20px] font-semibold leading-[1.5] text-[#ebe9e9] sm:text-[24px]">
        Tocadas recentemente
      </h2>
      {renderContent()}
    </section>
  );
}

export default function PlaylistsPage() {
  usePageMeta("Playlists");
  const { playlists, isLoading, loadErrorMessage, reloadLibrary } = useLibrary();

  const renderPlaylists = () => {
    if (isLoading) return <LoadingState label="Carregando playlists..." />;
    if (loadErrorMessage) return <ErrorState message={loadErrorMessage} onRetry={reloadLibrary} />;
    if (playlists.length === 0) {
      return (
        <EmptyState
          icon={<ListMusic className="size-10" />}
          title="Sua biblioteca está vazia"
          description="Crie sua primeira playlist para organizar as músicas que você curte."
          action={<PlaylistCreationButton variant="primary">Criar playlist</PlaylistCreationButton>}
        />
      );
    }
    return <PlaylistGrid playlists={playlists} />;
  };

  return (
    <PageContainer className="space-y-8">
      <PageHeader
        title="Playlists"
        description="Sua coleção pessoal de músicas criadas com AI"
        actions={
          <PlaylistCreationButton variant="brandOutline">
            <Plus className="size-4" aria-hidden="true" />
            Nova playlist
          </PlaylistCreationButton>
        }
      />
      <section aria-label="Suas playlists">{renderPlaylists()}</section>
      <RecentlyPlayedSection />
    </PageContainer>
  );
}
