import { Heart } from "lucide-react";
import { useMemo } from "react";
import { Link, useSearchParams } from "react-router";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { PlayAllButton } from "../components/tracks/PlayAllButton";
import { TrackTable } from "../components/tracks/TrackTable";
import { Button } from "../components/ui/button";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { useLibrary } from "../context/LibraryContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTracksByIds } from "../hooks/useTracksByIds";
import { ROUTES } from "../routes/paths";
import type { Track } from "../types/domain";
import { summarizeTracks } from "../utils/format";

const HERO_PATTERN =
  "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ff164c' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")";

const ORDER_PARAM = "ordem";

type FavoritesOrder = "recentes" | "titulo" | "artista";

const ORDER_OPTIONS: ReadonlyArray<{ value: FavoritesOrder; label: string }> = [
  { value: "recentes", label: "Recentes" },
  { value: "titulo", label: "Título" },
  { value: "artista", label: "Artista" },
];

const textCollator = new Intl.Collator("pt-BR", { sensitivity: "base", numeric: true });

function parseOrder(rawOrder: string | null): FavoritesOrder {
  return ORDER_OPTIONS.find((option) => option.value === rawOrder)?.value ?? "recentes";
}

/** Os IDs de favoritos já chegam do mais recente para o mais antigo; só as outras ordens reordenam. */
function sortFavorites(tracks: Track[], order: FavoritesOrder): Track[] {
  if (order === "titulo") return [...tracks].sort((first, second) => textCollator.compare(first.title, second.title));
  if (order === "artista") {
    return [...tracks].sort(
      (first, second) =>
        textCollator.compare(first.artistHandle, second.artistHandle) || textCollator.compare(first.title, second.title),
    );
  }
  return tracks;
}

export default function FavoritesPage() {
  usePageMeta("Favoritos");
  const [searchParams, setSearchParams] = useSearchParams();
  const order = parseOrder(searchParams.get(ORDER_PARAM));
  const { favoriteTrackIds, isLoading: isLibraryLoading, loadErrorMessage, reloadLibrary } = useLibrary();
  const { tracks, errorMessage, isLoading: areTracksLoading, reload } = useTracksByIds(favoriteTrackIds);
  const sortedTracks = useMemo(() => sortFavorites(tracks, order), [tracks, order]);

  const changeOrder = (nextOrder: FavoritesOrder) => {
    setSearchParams(nextOrder === "recentes" ? {} : { [ORDER_PARAM]: nextOrder }, { replace: true });
  };

  const renderTracks = () => {
    if (isLibraryLoading || areTracksLoading) return <LoadingState label="Carregando favoritos..." />;
    if (loadErrorMessage) return <ErrorState message={loadErrorMessage} onRetry={reloadLibrary} />;
    if (errorMessage) return <ErrorState message={errorMessage} onRetry={reload} />;
    if (sortedTracks.length === 0) {
      return (
        <EmptyState
          icon={<Heart className="size-10" />}
          title="Nenhuma música favorita ainda"
          description="Toque no coração de qualquer música para salvá-la aqui."
          action={
            <Button asChild variant="primary" size="touch">
              <Link to={ROUTES.discover}>Descobrir músicas</Link>
            </Button>
          }
        />
      );
    }
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <PlayAllButton tracks={sortedTracks} label="Tocar todas" />
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#a19a9b]">Ordenar</span>
            <SegmentedControl ariaLabel="Ordenar favoritos" options={ORDER_OPTIONS} value={order} onChange={changeOrder} />
          </div>
        </div>
        <TrackTable tracks={sortedTracks} />
      </div>
    );
  };

  return (
    <PageContainer className="space-y-6">
      <PageHeader title="Favoritos" description="Músicas marcadas como favoritas" />

      <div className="relative flex min-h-[200px] items-center justify-center overflow-hidden border border-[#30292b] bg-gradient-to-br from-[#ff164c]/15 to-[#150f10]/80 p-6 lg:p-8">
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: HERO_PATTERN }} aria-hidden="true" />
        <div className="relative flex flex-col items-center gap-4 text-center">
          <Heart className="size-16 fill-[#ff164c] text-[#ff164c] lg:size-20" aria-hidden="true" />
          <div>
            <p className="mb-1 text-[12px] font-semibold uppercase leading-[1.5] tracking-wide text-[#bababa]">Coleção pessoal</p>
            <h2 className="text-[28px] font-bold leading-[1.2] text-[#ebe9e9] lg:text-[40px]">Músicas favoritas</h2>
            <p className="mt-2 text-[14px] leading-[1.5] text-[#bababa]">{summarizeTracks(tracks)}</p>
          </div>
        </div>
      </div>

      <section aria-label="Lista de favoritos">{renderTracks()}</section>
    </PageContainer>
  );
}
