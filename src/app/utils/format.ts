export function formatPlaybackTime(totalSeconds: number): string {
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, "0")}`;
}

export function formatCollectionDuration(totalSeconds: number): string {
  if (totalSeconds > 0 && totalSeconds < 60) return `${Math.round(totalSeconds)} s`;
  const totalMinutes = Math.round(totalSeconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`;
}

export function formatTrackCount(trackCount: number): string {
  return trackCount === 1 ? "1 música" : `${trackCount} músicas`;
}

export function summarizeTracks(tracks: ReadonlyArray<{ durationSeconds: number }>): string {
  const totalSeconds = tracks.reduce((sum, track) => sum + track.durationSeconds, 0);
  return `${formatTrackCount(tracks.length)} · ${formatCollectionDuration(totalSeconds)}`;
}

const compactNumberFormatter = new Intl.NumberFormat("pt-BR", { notation: "compact", maximumFractionDigits: 1 });

export function formatCompactNumber(value: number): string {
  return compactNumberFormatter.format(value);
}

export function formatHandle(handle: string): string {
  return `@${handle}`;
}

export function formatPlayCount(playCount: number): string {
  return playCount === 1 ? "1 play" : `${formatCompactNumber(playCount)} plays`;
}

export function formatGreeting(displayName: string, now: Date = new Date()): string {
  const hour = now.getHours();
  const salutation = hour >= 5 && hour < 12 ? "Bom dia" : hour >= 12 && hour < 18 ? "Boa tarde" : "Boa noite";
  const firstName = displayName.trim().split(/\s+/)[0];
  return firstName ? `${salutation}, ${firstName}` : salutation;
}
