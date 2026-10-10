import { useState, type ImgHTMLAttributes } from "react";
import { DEFAULT_COVER_URL } from "../../utils/placeholders";

interface CoverImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, "src" | "onError"> {
  src: string | null | undefined;
  fallbackSrc?: string;
}

/** Imagem vinda do Storage: sem URL ou com falha de carregamento, mostra o placeholder da marca. */
export function CoverImage({ src, fallbackSrc = DEFAULT_COVER_URL, alt = "", ...imageProps }: CoverImageProps) {
  const [failedSrc, setFailedSrc] = useState<string | null>(null);
  const resolvedSrc = src && src !== failedSrc ? src : fallbackSrc;

  return (
    <img
      {...imageProps}
      src={resolvedSrc}
      alt={alt}
      onError={() => {
        if (src) setFailedSrc(src);
      }}
    />
  );
}
