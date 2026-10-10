/** Espelha os limites dos buckets do Storage; o servidor aplica os mesmos valores. */
export const UPLOAD_LIMITS = {
  audioMaxBytes: 50 * 1024 * 1024,
  audioMimeTypes: ["audio/mpeg", "audio/mp3", "audio/wav", "audio/x-wav", "audio/wave"],
  audioExtensions: [".mp3", ".wav"],
  imageMaxBytes: 2 * 1024 * 1024,
  imageMimeTypes: ["image/png", "image/jpeg"],
  imageExtensions: [".png", ".jpg", ".jpeg"],
} as const;
