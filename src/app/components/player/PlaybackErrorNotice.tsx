import { usePlayer } from "../../context/PlayerContext";
import { cn } from "../ui/utils";

/** Substitui a linha do artista enquanto a faixa atual não consegue tocar. */
export function PlaybackErrorNotice({ className }: { className?: string }) {
  const { playbackStatus, retryCurrentTrack } = usePlayer();
  if (playbackStatus !== "error") return null;

  return (
    <p role="alert" className={cn("flex min-w-0 items-center gap-1 text-[12px] leading-[1.4] text-[#ff164c]", className)}>
      <span className="truncate">Não foi possível reproduzir.</span>
      <button
        type="button"
        onClick={retryCurrentTrack}
        className="shrink-0 font-semibold underline underline-offset-2 transition-colors hover:text-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
      >
        Tentar de novo
      </button>
    </p>
  );
}
