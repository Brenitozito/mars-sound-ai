import { useTrackFavorite } from "../../hooks/useTrackFavorite";
import { FavoriteButton } from "../ui/FavoriteButton";

interface TrackFavoriteButtonProps {
  trackId: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export function TrackFavoriteButton({ trackId, size, className }: TrackFavoriteButtonProps) {
  const favorite = useTrackFavorite(trackId);
  return <FavoriteButton isFavorite={favorite.isFavorite} onToggle={() => favorite.toggle()} size={size} className={className} />;
}
