import { SearchX } from "lucide-react";
import { useEffect } from "react";
import { useSearchParams } from "react-router";
import { FilterChipGroup } from "../components/discover/FilterChipGroup";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { TrackCard } from "../components/tracks/TrackCard";
import { Button } from "../components/ui/button";
import { SegmentedControl } from "../components/ui/SegmentedControl";
import { Skeleton } from "../components/ui/skeleton";
import { useCatalogOptions } from "../hooks/useCatalogOptions";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTrackSearch } from "../hooks/useTrackSearch";
import {
  buildDiscoverSearchParams,
  DISCOVER_SORT_OPTIONS,
  hasActiveDiscoverFilters,
  keepKnownFilterValues,
  parseDiscoverFilters,
  type DiscoverFilters,
} from "../routes/discoverFilters";

function formatResultCount(total: number): string {
  return total === 1 ? "1 resultado encontrado" : `${total} resultados encontrados`;
}

function toggleValue(values: readonly string[], value: string): string[] {
  return values.includes(value) ? values.filter((current) => current !== value) : [...values, value];
}

function describeResults(filters: DiscoverFilters, isLoading: boolean, total: number): string {
  if (isLoading) return "Buscando...";
  if (filters.query || hasActiveDiscoverFilters(filters)) return formatResultCount(total);
  return "Encontre sua próxima música criada com AI";
}

export default function DiscoverPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const filters = parseDiscoverFilters(searchParams);
  const search = useTrackSearch(filters);
  const catalog = useCatalogOptions();
  const hasQuery = filters.query.length > 0;
  const hasFilters = hasActiveDiscoverFilters(filters);

  useEffect(() => {
    if (!catalog.catalogOptions) return;
    const currentFilters = parseDiscoverFilters(searchParams);
    const knownFilters = keepKnownFilterValues(currentFilters, catalog.catalogOptions.genres, catalog.catalogOptions.moods);
    const hasUnknownValues =
      knownFilters.genres.length !== currentFilters.genres.length || knownFilters.moods.length !== currentFilters.moods.length;
    if (hasUnknownValues) setSearchParams(buildDiscoverSearchParams(knownFilters), { replace: true });
  }, [catalog.catalogOptions, searchParams, setSearchParams]);

  usePageMeta(
    hasQuery ? `Busca: ${filters.query}` : "Descobrir",
    "Explore músicas criadas com AI por gênero, mood e popularidade.",
  );

  const updateFilters = (patch: Partial<DiscoverFilters>) => {
    setSearchParams(buildDiscoverSearchParams({ ...filters, ...patch }), { replace: true });
  };

  const clearQuery = () => updateFilters({ query: "" });
  const clearFilters = () => updateFilters({ genres: [], moods: [] });

  const renderCatalogFilters = () => {
    if (catalog.isLoading && !catalog.catalogOptions) {
      return (
        <div role="status" aria-label="Carregando filtros" className="flex flex-col gap-3">
          <Skeleton className="h-9 w-full rounded-none bg-white/[0.05]" />
          <Skeleton className="h-9 w-full rounded-none bg-white/[0.05]" />
        </div>
      );
    }
    if (catalog.errorMessage || !catalog.catalogOptions) {
      return (
        <ErrorState
          message={catalog.errorMessage ?? "Não foi possível carregar os filtros."}
          onRetry={catalog.reload}
          className="min-h-[120px] border border-dashed border-[#30292b]"
        />
      );
    }
    return (
      <>
        <FilterChipGroup
          label="Gêneros"
          options={catalog.catalogOptions.genres}
          selectedValues={filters.genres}
          onToggle={(genre) => updateFilters({ genres: toggleValue(filters.genres, genre) })}
          onClear={() => updateFilters({ genres: [] })}
        />
        <FilterChipGroup
          label="Moods"
          options={catalog.catalogOptions.moods}
          selectedValues={filters.moods}
          onToggle={(mood) => updateFilters({ moods: toggleValue(filters.moods, mood) })}
          onClear={() => updateFilters({ moods: [] })}
        />
      </>
    );
  };

  const renderResults = () => {
    if (search.isLoading) return <LoadingState label="Buscando músicas..." />;
    if (search.errorMessage) return <ErrorState message={search.errorMessage} onRetry={search.reload} />;
    if (search.tracks.length === 0) {
      return (
        <EmptyState
          icon={<SearchX className="size-10" />}
          title="Nenhuma música encontrada"
          description={
            hasQuery || hasFilters
              ? hasFilters
                ? "Tente remover alguns filtros ou buscar por outro termo."
                : "Tente buscar por outro termo."
              : "Ainda não há músicas publicadas. Volte em breve ou publique a primeira."
          }
          action={
            (hasQuery || hasFilters) && (
              <Button variant="brandOutline" size="touch" onClick={hasFilters ? clearFilters : clearQuery}>
                {hasFilters ? "Limpar filtros" : "Limpar busca"}
              </Button>
            )
          }
        />
      );
    }

    return (
      <>
        {hasQuery ? (
          <div className="space-y-2">
            {search.tracks.map((track) => (
              <TrackCard key={track.id} track={track} queue={search.tracks} variant="list" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8">
            {search.tracks.map((track) => (
              <TrackCard key={track.id} track={track} queue={search.tracks} />
            ))}
          </div>
        )}
        {search.hasMore && (
          <div className="flex justify-center pt-8">
            <Button variant="brandOutline" size="touch" onClick={search.loadMore} disabled={search.isLoadingMore}>
              {search.isLoadingMore ? "Carregando..." : "Carregar mais"}
            </Button>
          </div>
        )}
      </>
    );
  };

  return (
    <PageContainer>
      <div className="mb-6 lg:mb-8">
        <PageHeader
          title={hasQuery ? `Resultados para “${filters.query}”` : "Descobrir"}
          description={describeResults(filters, search.isLoading, search.total)}
          actions={
            hasQuery && (
              <Button variant="brandOutline" size="touch" onClick={clearQuery}>
                Limpar busca
              </Button>
            )
          }
        />
      </div>

      <div className="mb-8 flex flex-col gap-3">
        {renderCatalogFilters()}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-3">
            <span className="text-sm font-semibold text-[#a19a9b]">Ordenar</span>
            <SegmentedControl
              ariaLabel="Ordenar músicas"
              options={DISCOVER_SORT_OPTIONS}
              value={filters.sort}
              onChange={(sort) => updateFilters({ sort })}
            />
          </div>
          {hasFilters && (
            <button
              type="button"
              onClick={clearFilters}
              className="min-h-9 text-[13px] font-semibold text-[#a19a9b] underline transition-colors duration-150 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
            >
              Limpar filtros
            </button>
          )}
        </div>
      </div>

      {renderResults()}
    </PageContainer>
  );
}
