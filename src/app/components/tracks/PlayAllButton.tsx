import { LoaderCircle, Pause, Play } from "lucide-react";
import { usePlayer } from "../../context/PlayerContext";
import type { Track } from "../../types/domain";
import { Button } from "../ui/button";

interface PlayAllButtonProps {
  tracks: Track[];
  label?: string;
}

/** Toca a coleção do início ou, se ela já estiver tocando, alterna play/pausa. */
export function PlayAllButton({ tracks, label = "Tocar tudo" }: PlayAllButtonProps) {
  const { currentTrack, isPlaying, playbackStatus, playTrack, togglePlay } = usePlayer();
  const isPlayingThisCollection = Boolean(currentTrack && tracks.some((track) => track.id === currentTrack.id));
  const shouldShowPause = isPlayingThisCollection && isPlaying;
  const isLoadingThisCollection = isPlayingThisCollection && playbackStatus === "loading";

  const handleClick = () => {
    if (isPlayingThisCollection) togglePlay();
    else if (tracks[0]) playTrack(tracks[0], tracks);
  };

  const renderIcon = () => {
    if (isLoadingThisCollection) return <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />;
    if (shouldShowPause) return <Pause className="size-4" aria-hidden="true" />;
    return <Play className="size-4" aria-hidden="true" />;
  };

  return (
    <Button
      variant="primary"
      size="touch"
      onClick={handleClick}
      disabled={tracks.length === 0}
      aria-busy={isLoadingThisCollection || undefined}
      className="px-6 active:scale-[0.98]"
    >
      {renderIcon()}
      {shouldShowPause ? "Pausar" : label}
    </Button>
  );
}
