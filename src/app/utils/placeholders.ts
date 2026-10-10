function createGradientSvgDataUri(fromColor: string, toColor: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${fromColor}"/><stop offset="1" stop-color="${toColor}"/></linearGradient></defs><rect width="400" height="400" fill="url(#g)"/></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export const DEFAULT_COVER_URL = createGradientSvgDataUri("#3d0515", "#150f10");
export const DEFAULT_BANNER_URL = createGradientSvgDataUri("#2c1e20", "#0b0708");

export function getInitials(displayName: string): string {
  const initials = displayName
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word[0]?.toUpperCase() ?? "")
    .join("");
  return initials || "?";
}
