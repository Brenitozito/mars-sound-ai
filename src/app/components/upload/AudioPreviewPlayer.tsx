import { Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { usePlayer } from "../../context/PlayerContext";
import { useObjectUrl } from "../../hooks/useObjectUrl";
import { formatPlaybackTime } from "../../utils/format";

interface PreviewProgress {
  currentTimeSeconds: number;
  durationSeconds: number;
}

/**
 * Pré-escuta local do arquivo antes da publicação. Usa um elemento de áudio próprio e
 * pausa o player global (e vice-versa) para nunca haver duas músicas tocando ao mesmo tempo.
 */
export function AudioPreviewPlayer({ file }: { file: File }) {
  const audioUrl = useObjectUrl(file);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { isPlaying: isGlobalPlayerPlaying, pausePlayback } = usePlayer();
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState<PreviewProgress>({ currentTimeSeconds: 0, durationSeconds: 0 });

  useEffect(() => {
    if (isGlobalPlayerPlaying) audioRef.current?.pause();
  }, [isGlobalPlayerPlaying]);

  const togglePreview = () => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      return;
    }
    pausePlayback();
    audio.play().catch(() => setIsPlaying(false));
  };

  const progressPercent = progress.durationSeconds > 0 ? (progress.currentTimeSeconds / progress.durationSeconds) * 100 : 0;

  return (
    <div className="flex w-full max-w-[280px] items-center gap-3" onClick={(event) => event.stopPropagation()}>
      <button
        type="button"
        onClick={togglePreview}
        disabled={!audioUrl}
        aria-label={isPlaying ? "Pausar pré-escuta" : "Ouvir pré-escuta"}
        className="flex size-11 shrink-0 items-center justify-center bg-[#ff164c] text-white transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 focus-visible:ring-offset-2 focus-visible:ring-offset-[#24191b] disabled:opacity-50"
      >
        {isPlaying ? <Pause className="size-5" aria-hidden="true" /> : <Play className="size-5" aria-hidden="true" />}
      </button>
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <div className="h-1 w-full overflow-hidden bg-[#5b4f51]" aria-hidden="true">
          <div className="h-full bg-[#ff164c] transition-[width] duration-200" style={{ width: `${progressPercent}%` }} />
        </div>
        <p className="text-left text-[12px] tabular-nums text-[#bababa]">
          {formatPlaybackTime(progress.currentTimeSeconds)} / {formatPlaybackTime(progress.durationSeconds)}
        </p>
      </div>
      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          preload="metadata"
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
          onEnded={() => setIsPlaying(false)}
          onLoadedMetadata={(event) =>
            setProgress({ currentTimeSeconds: 0, durationSeconds: event.currentTarget.duration || 0 })
          }
          onTimeUpdate={(event) => {
            const currentTimeSeconds = event.currentTarget.currentTime;
            setProgress((previous) => ({ ...previous, currentTimeSeconds }));
          }}
        />
      )}
    </div>
  );
}
