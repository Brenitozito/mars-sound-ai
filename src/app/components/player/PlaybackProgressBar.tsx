import { useState } from "react";
import { usePlaybackProgress, usePlayer } from "../../context/PlayerContext";
import { formatPlaybackTime } from "../../utils/format";
import { cn } from "../ui/utils";
import { MediaSlider } from "./MediaSlider";

interface PlaybackProgressBarProps {
  layout: "inline" | "stacked";
  className?: string;
}

export function PlaybackProgressBar({ layout, className }: PlaybackProgressBarProps) {
  const { currentTrack, seekToPercent } = usePlayer();
  const { currentTimeSeconds, durationSeconds } = usePlaybackProgress();
  const [draggingPercent, setDraggingPercent] = useState<number | null>(null);

  const playbackPercent = durationSeconds > 0 ? (currentTimeSeconds / durationSeconds) * 100 : 0;
  const displayedPercent = draggingPercent ?? playbackPercent;
  const displayedSeconds = draggingPercent !== null ? (draggingPercent / 100) * durationSeconds : currentTimeSeconds;
  const elapsedLabel = formatPlaybackTime(displayedSeconds);
  const totalLabel = formatPlaybackTime(durationSeconds);

  const slider = (
    <MediaSlider
      value={displayedPercent}
      label="Progresso da música"
      valueText={`${elapsedLabel} de ${totalLabel}`}
      disabled={!currentTrack}
      onValueChange={setDraggingPercent}
      onValueCommit={(percent) => {
        seekToPercent(percent);
        setDraggingPercent(null);
      }}
    />
  );
  const timeClass = "text-[13px] leading-[1.7] tabular-nums text-[#a19a9b]";

  if (layout === "stacked") {
    return (
      <div className={className}>
        {slider}
        <div className={cn("mt-2 flex justify-between", timeClass)}>
          <span>{elapsedLabel}</span>
          <span>{totalLabel}</span>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("flex w-full items-center gap-[14px]", className)}>
      <span className={cn("w-11 text-right", timeClass)}>{elapsedLabel}</span>
      {slider}
      <span className={cn("w-11", timeClass)}>{totalLabel}</span>
    </div>
  );
}
