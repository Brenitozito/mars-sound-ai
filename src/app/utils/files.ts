interface FileRules {
  maxBytes: number;
  mimeTypes: readonly string[];
  extensions: readonly string[];
  typeLabel: string;
}

export function validateFile(file: File, rules: FileRules): string | null {
  const lowerCaseName = file.name.toLowerCase();
  const hasAllowedType =
    rules.mimeTypes.includes(file.type) || rules.extensions.some((extension) => lowerCaseName.endsWith(extension));

  if (!hasAllowedType) return `Formato inválido. Envie um arquivo ${rules.typeLabel}.`;
  if (file.size > rules.maxBytes) return `O arquivo excede o limite de ${formatFileSize(rules.maxBytes)}.`;
  return null;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const megabytes = bytes / (1024 * 1024);
  return megabytes >= 1 ? `${megabytes.toFixed(1).replace(/\.0$/, "")} MB` : `${Math.ceil(bytes / 1024)} KB`;
}

export function readAudioDuration(audioUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const probe = new Audio();
    probe.preload = "metadata";
    probe.onloadedmetadata = () => resolve(Number.isFinite(probe.duration) ? Math.round(probe.duration) : 0);
    probe.onerror = () => resolve(0);
    probe.src = audioUrl;
  });
}
