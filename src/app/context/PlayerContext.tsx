import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { toast } from "sonner";
import type { Track } from "../types/domain";
import { loadPlayerPreferences, savePlayerPreferences } from "./playerPreferences";

export type RepeatMode = "off" | "all" | "one";

export type PlaybackStatus = "idle" | "loading" | "playing" | "paused" | "error";

interface PlayerContextValue {
  currentTrack: Track | null;
  queue: Track[];
  playbackStatus: PlaybackStatus;
  /** Verdadeiro enquanto o usuário quer ouvir: inclui o carregamento/buffer antes do som sair. */
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isShuffleEnabled: boolean;
  repeatMode: RepeatMode;
  isFullscreenOpen: boolean;
  playTrack: (track: Track, contextQueue?: Track[]) => void;
  togglePlay: () => void;
  retryCurrentTrack: () => void;
  pausePlayback: () => void;
  playNext: () => void;
  playPrevious: () => void;
  seekToPercent: (percent: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  openFullscreen: () => void;
  closeFullscreen: () => void;
}

export interface PlaybackProgress {
  currentTimeSeconds: number;
  durationSeconds: number;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);
// Progresso fica em contexto separado: ele muda várias vezes por segundo e só os players precisam dele.
const PlaybackProgressContext = createContext<PlaybackProgress>({ currentTimeSeconds: 0, durationSeconds: 0 });

const RESTART_THRESHOLD_SECONDS = 3;
const PLAYBACK_ERROR_TOAST_ID = "playback-error";
const REPEAT_MODE_SEQUENCE: RepeatMode[] = ["off", "all", "one"];

function clampPercent(value: number): number {
  return Math.min(100, Math.max(0, value));
}

function resolveNextIndex(
  currentIndex: number,
  queueLength: number,
  isShuffleEnabled: boolean,
  repeatMode: RepeatMode,
): number | null {
  if (queueLength === 0) return null;
  if (isShuffleEnabled && queueLength > 1) {
    const offset = 1 + Math.floor(Math.random() * (queueLength - 1));
    return (currentIndex + offset) % queueLength;
  }
  if (currentIndex < queueLength - 1) return currentIndex + 1;
  return repeatMode === "all" ? 0 : null;
}

/** `play()` rejeitado: troca de faixa no meio (Abort) é esperada; bloqueio de autoplay só pausa. */
function resolveRejectedPlayStatus(error: unknown): PlaybackStatus | null {
  if (!(error instanceof DOMException)) return "error";
  if (error.name === "AbortError") return null;
  if (error.name === "NotAllowedError") return "paused";
  return "error";
}

interface PlayerProviderProps {
  children: ReactNode;
  /** Chamado uma vez por carregamento, quando o áudio realmente começa a tocar. */
  onTrackStarted?: (track: Track) => void;
}

export function PlayerProvider({ children, onTrackStarted }: PlayerProviderProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [queue, setQueue] = useState<Track[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>("idle");
  const pendingStartedTrackRef = useRef<Track | null>(null);
  const [initialPreferences] = useState(loadPlayerPreferences);
  const [volume, setVolumeState] = useState(initialPreferences.volume);
  const [isMuted, setIsMuted] = useState(initialPreferences.isMuted);
  const [isShuffleEnabled, setIsShuffleEnabled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [isFullscreenOpen, setIsFullscreenOpen] = useState(false);
  const [progress, setProgress] = useState<PlaybackProgress>({ currentTimeSeconds: 0, durationSeconds: 0 });

  const currentTrack = queue[currentIndex] ?? null;
  const isPlaying = playbackStatus === "playing" || playbackStatus === "loading";

  const latestStateRef = useRef({ queue, currentIndex, isShuffleEnabled, repeatMode, currentTrack, onTrackStarted, playbackStatus });
  latestStateRef.current = { queue, currentIndex, isShuffleEnabled, repeatMode, currentTrack, onTrackStarted, playbackStatus };

  const getAudio = useCallback((): HTMLAudioElement => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "auto";
    }
    return audioRef.current;
  }, []);

  const requestPlay = useCallback((audio: HTMLAudioElement) => {
    audio.play().catch((error: unknown) => {
      const nextStatus = resolveRejectedPlayStatus(error);
      if (nextStatus) setPlaybackStatus(nextStatus);
    });
  }, []);

  const loadAndPlay = useCallback(
    (track: Track) => {
      const audio = getAudio();
      pendingStartedTrackRef.current = track;
      setPlaybackStatus("loading");
      audio.src = track.audioUrl;
      setProgress({ currentTimeSeconds: 0, durationSeconds: track.durationSeconds });
      requestPlay(audio);
    },
    [getAudio, requestPlay],
  );

  const retryCurrentTrack = useCallback(() => {
    const track = latestStateRef.current.currentTrack;
    if (track) loadAndPlay(track);
  }, [loadAndPlay]);

  const playIndex = useCallback(
    (index: number) => {
      const track = latestStateRef.current.queue[index];
      if (!track) return;
      setCurrentIndex(index);
      loadAndPlay(track);
    },
    [loadAndPlay],
  );

  const togglePlay = useCallback(() => {
    const { currentTrack: track, playbackStatus: status } = latestStateRef.current;
    if (!track) return;
    if (status === "error") {
      loadAndPlay(track);
      return;
    }
    const audio = getAudio();
    if (audio.paused) requestPlay(audio);
    else audio.pause();
  }, [getAudio, loadAndPlay, requestPlay]);

  const pausePlayback = useCallback(() => {
    audioRef.current?.pause();
  }, []);

  const playTrack = useCallback(
    (track: Track, contextQueue?: Track[]) => {
      if (latestStateRef.current.currentTrack?.id === track.id) {
        togglePlay();
        return;
      }
      const nextQueue = contextQueue?.some((queuedTrack) => queuedTrack.id === track.id) ? contextQueue : [track];
      const nextIndex = nextQueue.findIndex((queuedTrack) => queuedTrack.id === track.id);
      latestStateRef.current.queue = nextQueue;
      setQueue(nextQueue);
      setCurrentIndex(nextIndex);
      loadAndPlay(track);
    },
    [loadAndPlay, togglePlay],
  );

  const playNext = useCallback(() => {
    const { currentIndex: index, queue: currentQueue, isShuffleEnabled: shuffle, repeatMode: repeat } =
      latestStateRef.current;
    const nextIndex = resolveNextIndex(index, currentQueue.length, shuffle, repeat === "one" ? "all" : repeat);
    if (nextIndex !== null) playIndex(nextIndex);
  }, [playIndex]);

  const playPrevious = useCallback(() => {
    const audio = getAudio();
    const { currentIndex: index, queue: currentQueue, repeatMode: repeat } = latestStateRef.current;
    const shouldRestart = audio.currentTime > RESTART_THRESHOLD_SECONDS || (index <= 0 && repeat !== "all");
    if (shouldRestart) {
      audio.currentTime = 0;
      return;
    }
    playIndex(index > 0 ? index - 1 : currentQueue.length - 1);
  }, [getAudio, playIndex]);

  const seekToPercent = useCallback(
    (percent: number) => {
      const audio = getAudio();
      if (!Number.isFinite(audio.duration) || audio.duration <= 0) return;
      audio.currentTime = (clampPercent(percent) / 100) * audio.duration;
    },
    [getAudio],
  );

  const setVolume = useCallback((nextVolume: number) => {
    const clampedVolume = clampPercent(nextVolume);
    setVolumeState(clampedVolume);
    if (clampedVolume > 0) setIsMuted(false);
  }, []);

  useEffect(() => {
    const audio = getAudio();
    audio.volume = volume / 100;
    audio.muted = isMuted;
  }, [getAudio, volume, isMuted]);

  useEffect(() => {
    const saveTimeoutId = window.setTimeout(() => savePlayerPreferences({ volume, isMuted }), 300);
    return () => window.clearTimeout(saveTimeoutId);
  }, [volume, isMuted]);

  useEffect(() => {
    const audio = getAudio();

    const handlePlayRequested = () => setPlaybackStatus("loading");
    const handleWaiting = () => setPlaybackStatus("loading");
    const handlePlaying = () => {
      setPlaybackStatus("playing");
      const startedTrack = pendingStartedTrackRef.current;
      if (!startedTrack) return;
      pendingStartedTrackRef.current = null;
      latestStateRef.current.onTrackStarted?.(startedTrack);
    };
    const handlePause = () => {
      if (!audio.error) setPlaybackStatus("paused");
    };
    const handleTimeUpdate = () =>
      setProgress((previous) => ({ ...previous, currentTimeSeconds: audio.currentTime }));
    const handleDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setProgress((previous) => ({ ...previous, durationSeconds: audio.duration }));
      }
    };
    const handleError = () => {
      if (!audio.getAttribute("src")) return;
      pendingStartedTrackRef.current = null;
      setPlaybackStatus("error");
      toast.error("Não foi possível reproduzir esta faixa.", {
        id: PLAYBACK_ERROR_TOAST_ID,
        description: "Verifique sua conexão ou tente outra música.",
        action: { label: "Tentar de novo", onClick: () => playIndex(latestStateRef.current.currentIndex) },
      });
    };
    const handleEnded = () => {
      const { currentIndex: index, queue: currentQueue, isShuffleEnabled: shuffle, repeatMode: repeat } =
        latestStateRef.current;
      if (repeat === "one") {
        audio.currentTime = 0;
        requestPlay(audio);
        return;
      }
      const nextIndex = resolveNextIndex(index, currentQueue.length, shuffle, repeat);
      if (nextIndex !== null) playIndex(nextIndex);
    };

    audio.addEventListener("play", handlePlayRequested);
    audio.addEventListener("waiting", handleWaiting);
    audio.addEventListener("playing", handlePlaying);
    audio.addEventListener("pause", handlePause);
    audio.addEventListener("timeupdate", handleTimeUpdate);
    audio.addEventListener("durationchange", handleDurationChange);
    audio.addEventListener("error", handleError);
    audio.addEventListener("ended", handleEnded);

    return () => {
      audio.removeEventListener("play", handlePlayRequested);
      audio.removeEventListener("waiting", handleWaiting);
      audio.removeEventListener("playing", handlePlaying);
      audio.removeEventListener("pause", handlePause);
      audio.removeEventListener("timeupdate", handleTimeUpdate);
      audio.removeEventListener("durationchange", handleDurationChange);
      audio.removeEventListener("error", handleError);
      audio.removeEventListener("ended", handleEnded);
    };
  }, [getAudio, playIndex, requestPlay]);

  useEffect(() => {
    return () => {
      const audio = audioRef.current;
      if (!audio) return;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
    };
  }, []);

  useEffect(() => {
    if (!("mediaSession" in navigator) || !currentTrack) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentTrack.title,
      artist: `@${currentTrack.artistHandle}`,
      artwork: [{ src: currentTrack.coverUrl }],
    });
    navigator.mediaSession.setActionHandler("play", togglePlay);
    navigator.mediaSession.setActionHandler("pause", togglePlay);
    navigator.mediaSession.setActionHandler("nexttrack", playNext);
    navigator.mediaSession.setActionHandler("previoustrack", playPrevious);
  }, [currentTrack, togglePlay, playNext, playPrevious]);

  const value = useMemo<PlayerContextValue>(
    () => ({
      currentTrack,
      queue,
      playbackStatus,
      isPlaying,
      volume,
      isMuted,
      isShuffleEnabled,
      repeatMode,
      isFullscreenOpen,
      playTrack,
      togglePlay,
      retryCurrentTrack,
      pausePlayback,
      playNext,
      playPrevious,
      seekToPercent,
      setVolume,
      toggleMute: () => setIsMuted((muted) => !muted),
      toggleShuffle: () => setIsShuffleEnabled((enabled) => !enabled),
      cycleRepeatMode: () =>
        setRepeatMode(
          (mode) => REPEAT_MODE_SEQUENCE[(REPEAT_MODE_SEQUENCE.indexOf(mode) + 1) % REPEAT_MODE_SEQUENCE.length],
        ),
      openFullscreen: () => setIsFullscreenOpen(true),
      closeFullscreen: () => setIsFullscreenOpen(false),
    }),
    [
      currentTrack,
      queue,
      playbackStatus,
      isPlaying,
      volume,
      isMuted,
      isShuffleEnabled,
      repeatMode,
      isFullscreenOpen,
      playTrack,
      togglePlay,
      retryCurrentTrack,
      pausePlayback,
      playNext,
      playPrevious,
      seekToPercent,
      setVolume,
    ],
  );

  return (
    <PlayerContext.Provider value={value}>
      <PlaybackProgressContext.Provider value={progress}>{children}</PlaybackProgressContext.Provider>
    </PlayerContext.Provider>
  );
}

export function usePlayer(): PlayerContextValue {
  const context = useContext(PlayerContext);
  if (!context) throw new Error("usePlayer deve ser usado dentro de PlayerProvider.");
  return context;
}

/** Estado de reprodução visto por uma faixa específica: só a faixa atual sai de "idle". */
export function useTrackPlaybackStatus(trackId: string): PlaybackStatus {
  const { currentTrack, playbackStatus } = usePlayer();
  return currentTrack?.id === trackId ? playbackStatus : "idle";
}

export function usePlaybackProgress(): PlaybackProgress {
  return useContext(PlaybackProgressContext);
}
