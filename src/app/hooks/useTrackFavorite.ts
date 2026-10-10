import { toast } from "sonner";
import { useLibrary } from "../context/LibraryContext";
import { getErrorMessage } from "../services/serviceError";

interface ToggleOptions {
  announceResult?: boolean;
}

export function useTrackFavorite(trackId: string) {
  const { isFavorite, toggleFavorite } = useLibrary();

  const toggle = ({ announceResult = false }: ToggleOptions = {}) => {
    toggleFavorite(trackId)
      .then((isNowFavorite) => {
        if (announceResult) toast.success(isNowFavorite ? "Adicionada aos favoritos." : "Removida dos favoritos.");
      })
      .catch((error: unknown) => {
        toast.error(getErrorMessage(error, "Não foi possível atualizar seus favoritos."));
      });
  };

  return { isFavorite: isFavorite(trackId), toggle };
}
