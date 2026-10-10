import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { usePlaylistCreation } from "./PlaylistCreationProvider";

interface PlaylistCreationButtonProps {
  variant: "primary" | "brandOutline";
  children: ReactNode;
}

export function PlaylistCreationButton({ variant, children }: PlaylistCreationButtonProps) {
  const { openPlaylistCreation } = usePlaylistCreation();
  return (
    <Button variant={variant} size="touch" onClick={() => openPlaylistCreation()}>
      {children}
    </Button>
  );
}
