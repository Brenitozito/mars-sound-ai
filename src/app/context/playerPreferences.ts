const STORAGE_KEY = "mars-sound-ai:player-preferences";

export interface PlayerPreferences {
  volume: number;
  isMuted: boolean;
}

export const DEFAULT_PLAYER_PREFERENCES: PlayerPreferences = { volume: 70, isMuted: false };

function isValidVolume(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 100;
}

export function loadPlayerPreferences(): PlayerPreferences {
  try {
    const rawValue = window.localStorage.getItem(STORAGE_KEY);
    if (!rawValue) return DEFAULT_PLAYER_PREFERENCES;
    const parsed: unknown = JSON.parse(rawValue);
    if (typeof parsed !== "object" || parsed === null) return DEFAULT_PLAYER_PREFERENCES;
    const { volume, isMuted } = parsed as Partial<Record<keyof PlayerPreferences, unknown>>;
    return {
      volume: isValidVolume(volume) ? volume : DEFAULT_PLAYER_PREFERENCES.volume,
      isMuted: typeof isMuted === "boolean" ? isMuted : DEFAULT_PLAYER_PREFERENCES.isMuted,
    };
  } catch {
    return DEFAULT_PLAYER_PREFERENCES;
  }
}

export function savePlayerPreferences(preferences: PlayerPreferences): void {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  } catch {
    // Preferência é conveniência: storage cheio ou bloqueado (modo privado) não pode quebrar a reprodução.
  }
}
