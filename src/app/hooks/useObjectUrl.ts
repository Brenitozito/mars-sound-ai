import { useEffect, useState } from "react";

export function useObjectUrl(blob: Blob | null): string | null {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setObjectUrl(null);
      return;
    }
    const createdUrl = URL.createObjectURL(blob);
    setObjectUrl(createdUrl);
    return () => URL.revokeObjectURL(createdUrl);
  }, [blob]);

  return objectUrl;
}
