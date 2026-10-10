import { Music2, Upload } from "lucide-react";
import type { ReactNode } from "react";
import { Link } from "react-router";
import { GenreCategoryGrid } from "../components/discover/GenreCategoryGrid";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { ContentSection } from "../components/layout/ContentSection";
import { HorizontalScroller, PageContainer } from "../components/layout/PageContainer";
import { CreatorCard } from "../components/profile/CreatorCard";
import { TrackCard } from "../components/tracks/TrackCard";
import { Button } from "../components/ui/button";
import { useCurrentUser } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { usePageMeta } from "../hooks/usePageMeta";
import { buildDiscoverPath } from "../routes/discoverFilters";
import { ROUTES } from "../routes/paths";
import { catalogService } from "../services";
import type { Track } from "../types/domain";
import { formatGreeting } from "../utils/format";

const FEED_ERROR_MESSAGE = "Não foi possível carregar as músicas.";
const COMPACT_CARD_CLASS = "w-[140px] flex-none sm:w-[160px] lg:w-[175px]";
const WIDE_CARD_CLASS = "min-w-[260px] flex-1 sm:min-w-[300px] lg:min-w-[340px]";

interface TrackRowProps {
  title: string;
  tracks: Track[];
  variant: "compact" | "wide";
  seeAllHref?: string;
  description?: ReactNode;
}

function TrackRow({ title, tracks, variant, seeAllHref, description }: TrackRowProps) {
  if (tracks.length === 0) return null;
  return (
    <ContentSection title={title} description={description} seeAllHref={seeAllHref}>
      <HorizontalScroller label={title}>
        {tracks.map((track) => (
          <TrackCard
            key={track.id}
            track={track}
            queue={tracks}
            imageAspect={variant === "wide" ? "wide" : "square"}
            className={variant === "wide" ? WIDE_CARD_CLASS : COMPACT_CARD_CLASS}
          />
        ))}
      </HorizontalScroller>
    </ContentSection>
  );
}

function PersonalizeHint() {
  return (
    <>
      Escolha seus gêneros e moods em{" "}
      <Link to={ROUTES.settings} className="text-[#ff164c] underline">
        Configurações
      </Link>{" "}
      para recomendações mais certeiras.
    </>
  );
}

function EmptyFeed() {
  return (
    <EmptyState
      icon={<Music2 className="size-10" />}
      title="Nenhuma música publicada ainda"
      description="Quando a comunidade publicar faixas, elas aparecem aqui. Que tal ser o primeiro?"
      action={
        <Button asChild variant="primary" size="touch" className="px-6">
          <Link to={ROUTES.upload}>
            <Upload className="size-4" aria-hidden="true" />
            Publicar música
          </Link>
        </Button>
      }
    />
  );
}

export default function HomePage() {
  const currentUser = useCurrentUser();
  const hasPreferences = currentUser.favoriteGenres.length > 0 || currentUser.moods.length > 0;
  const preferencesKey = [...currentUser.favoriteGenres, "|", ...currentUser.moods].join(",");
  usePageMeta("Início");

  const { data, errorMessage, isLoading, reload } = useAsyncData(
    async () => {
      const [feed, recommended] = await Promise.all([
        catalogService.getHomeFeed(),
        catalogService.getRecommendedTracks(currentUser.id),
      ]);
      return { feed, recommended };
    },
    [currentUser.id, preferencesKey],
    FEED_ERROR_MESSAGE,
  );

  if (isLoading && !data) return <LoadingState label="Carregando músicas..." className="min-h-[60vh]" />;
  if (errorMessage || !data) {
    return <ErrorState message={errorMessage ?? FEED_ERROR_MESSAGE} onRetry={reload} className="min-h-[60vh]" />;
  }

  const { feed, recommended } = data;
  const hasAnyTrack = [recommended, feed.trending, feed.recentReleases, feed.weeklyHighlights].some(
    (tracks) => tracks.length > 0,
  );

  return (
    <PageContainer className="space-y-8 lg:space-y-[38px]">
      <header>
        <h1 className="text-[24px] font-bold leading-[1.3] text-[#ebe9e9] sm:text-[32px]">
          {formatGreeting(currentUser.displayName)}
        </h1>
        <p className="mt-1 text-[14px] text-[#a19a9b]">O que vamos ouvir hoje?</p>
      </header>

      {!hasAnyTrack && <EmptyFeed />}

      <TrackRow
        title="Recomendados para você"
        tracks={recommended}
        variant="compact"
        description={hasPreferences ? "Com base nos seus gêneros e moods favoritos" : <PersonalizeHint />}
        seeAllHref={
          hasPreferences
            ? buildDiscoverPath({ genres: currentUser.favoriteGenres, moods: currentUser.moods })
            : undefined
        }
      />

      {feed.topCreators.length > 0 && (
        <ContentSection title="Top criadores">
          <HorizontalScroller label="Top criadores">
            {feed.topCreators.map((creator) => (
              <CreatorCard key={creator.id} creator={creator} />
            ))}
          </HorizontalScroller>
        </ContentSection>
      )}

      <TrackRow
        title="Em alta agora"
        tracks={feed.trending}
        variant="compact"
        seeAllHref={buildDiscoverPath({ sort: "popular" })}
      />
      <TrackRow
        title="Lançamentos recentes"
        tracks={feed.recentReleases}
        variant="compact"
        seeAllHref={buildDiscoverPath({ sort: "recent" })}
      />

      {feed.featuredGenres.length > 0 && (
        <ContentSection title="Categorias" seeAllHref={buildDiscoverPath()}>
          <GenreCategoryGrid genres={feed.featuredGenres} />
        </ContentSection>
      )}

      <TrackRow title="Destaques da semana" tracks={feed.weeklyHighlights} variant="wide" />
    </PageContainer>
  );
}
