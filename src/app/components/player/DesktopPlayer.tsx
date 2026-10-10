import { Music2 } from "lucide-react";
import { Link } from "react-router";
import { usePlayer } from "../../context/PlayerContext";
import { buildProfilePath } from "../../routes/paths";
import { formatHandle } from "../../utils/format";
import { TrackActionsMenu } from "../tracks/TrackActionsMenu";
import { TrackFavoriteButton } from "../tracks/TrackFavoriteButton";
import { CoverImage } from "../ui/CoverImage";
import { IconTooltip } from "../ui/IconTooltip";
import { MediaSlider } from "./MediaSlider";
import { PlaybackControls } from "./PlaybackControls";
import { PlaybackErrorNotice } from "./PlaybackErrorNotice";
import { PlaybackProgressBar } from "./PlaybackProgressBar";
import { VolumeIcon, VolumeMutedIcon } from "./PlayerIcons";

const NOW_PLAYING_WIDTH_CLASS = "flex w-[320px] shrink-0 items-center xl:w-[360px]";

function NowPlayingInfo() {
  const { currentTrack, playbackStatus } = usePlayer();

  if (!currentTrack) {
    return (
      <div className={NOW_PLAYING_WIDTH_CLASS}>
        <div className="flex size-16 shrink-0 items-center justify-center border border-[#30292b] bg-[#24191b]">
          <Music2 className="size-6 text-[#5b4f51]" aria-hidden="true" />
        </div>
        <div className="flex min-w-0 flex-col px-3 py-3 xl:px-[18px]">
          <p className="truncate text-[16px] font-semibold leading-[1.5] text-[#bababa]">Nenhuma música tocando</p>
          <p className="truncate text-[12px] leading-[1.25] text-[#a19a9b]">Escolha uma faixa para começar</p>
        </div>
      </div>
    );
  }

  return (
    <div className={NOW_PLAYING_WIDTH_CLASS}>
      <CoverImage src={currentTrack.coverUrl} className="size-16 shrink-0 border border-[#30292b] object-cover" />
      <div className="flex min-w-0 flex-1 flex-col px-3 py-3 xl:px-[18px]">
        <p className="truncate text-[16px] font-semibold leading-[1.5] text-[#bababa]" title={currentTrack.title}>
          {currentTrack.title}
        </p>
        {playbackStatus === "error" ? (
          <PlaybackErrorNotice />
        ) : (
          <Link
            to={buildProfilePath(currentTrack.artistHandle)}
            className="truncate text-[12px] leading-[1.25] text-[#bababa] hover:text-[#f8f8f8] hover:underline"
          >
            {formatHandle(currentTrack.artistHandle)}
          </Link>
        )}
      </div>
      <TrackFavoriteButton trackId={currentTrack.id} />
      <TrackActionsMenu track={currentTrack} />
    </div>
  );
}

function VolumeControl() {
  const { volume, isMuted, setVolume, toggleMute } = usePlayer();
  const displayedVolume = isMuted ? 0 : volume;
  const muteLabel = isMuted ? "Ativar som" : "Silenciar";

  return (
    <div className="flex w-[160px] shrink-0 items-center justify-end gap-2">
      <IconTooltip label={muteLabel}>
        <button
          type="button"
          onClick={toggleMute}
          aria-label={muteLabel}
          aria-pressed={isMuted}
          className="flex size-8 items-center justify-center text-[#a19a9b] transition-colors hover:text-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
        >
          {displayedVolume > 0 ? <VolumeIcon size={18} /> : <VolumeMutedIcon />}
        </button>
      </IconTooltip>
      <MediaSlider
        value={displayedVolume}
        label="Volume"
        valueText={`${Math.round(displayedVolume)}%`}
        step={5}
        className="w-[105px]"
        onValueChange={setVolume}
      />
    </div>
  );
}

export function DesktopPlayer() {
  return (
    <footer
      aria-label="Player de música"
      className="fixed right-0 bottom-0 left-0 z-[100] hidden h-[90px] items-center gap-4 border-t border-[#30292b] bg-[#1c1315] px-6 lg:flex xl:gap-6 xl:px-[37px]"
    >
      <NowPlayingInfo />
      <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
        <PlaybackControls variant="desktop" />
        <PlaybackProgressBar layout="inline" className="max-w-[752px]" />
      </div>
      <VolumeControl />
    </footer>
  );
}
