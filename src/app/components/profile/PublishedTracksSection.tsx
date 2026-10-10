import { Music2 } from "lucide-react";
import type { ReactNode } from "react";
import { useAsyncData } from "../../hooks/useAsyncData";
import { catalogService } from "../../services";
import { summarizeTracks } from "../../utils/format";
import { EmptyState, ErrorState, LoadingState } from "../feedback/StatusViews";
import { PlayAllButton } from "../tracks/PlayAllButton";
import { TrackTable } from "../tracks/TrackTable";

const TRACKS_ERROR_MESSAGE = "Não foi possível carregar as músicas.";

interface PublishedTracksSectionProps {
  artistId: string;
  emptyTitle: string;
  emptyDescription: string;
  emptyAction?: ReactNode;
}

export function PublishedTracksSection({ artistId, emptyTitle, emptyDescription, emptyAction }: PublishedTracksSectionProps) {
  const { data: tracks, errorMessage, isLoading, reload } = useAsyncData(
    () => catalogService.getTracksByArtist(artistId),
    [artistId],
    TRACKS_ERROR_MESSAGE,
  );

  if (isLoading && !tracks) return <LoadingState label="Carregando músicas..." />;
  if (errorMessage || !tracks) {
    return <ErrorState message={errorMessage ?? TRACKS_ERROR_MESSAGE} onRetry={reload} />;
  }
  if (tracks.length === 0) {
    return <EmptyState icon={<Music2 className="size-10" />} title={emptyTitle} description={emptyDescription} action={emptyAction} />;
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-4">
        <PlayAllButton tracks={tracks} />
        <p className="text-[13px] text-[#bababa]">{summarizeTracks(tracks)}</p>
      </div>
      <TrackTable tracks={tracks} />
    </div>
  );
}
