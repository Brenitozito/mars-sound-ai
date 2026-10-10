import { ArrowDown, ArrowUp, Heart, HeartOff, ListPlus, MoreVertical, Plus, Trash2, UserRound } from "lucide-react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { useLibrary } from "../../context/LibraryContext";
import { useTrackFavorite } from "../../hooks/useTrackFavorite";
import { buildProfilePath } from "../../routes/paths";
import { getErrorMessage } from "../../services/serviceError";
import type { Track } from "../../types/domain";
import { usePlaylistCreation } from "../playlists/PlaylistCreationProvider";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { IconTooltip } from "../ui/IconTooltip";
import { MENU_ITEM_CLASS, MENU_SEPARATOR_CLASS, MENU_SURFACE_CLASS } from "../ui/surfaceStyles";
import { cn } from "../ui/utils";

/** Ações disponíveis apenas quando a faixa é exibida dentro de uma playlist do próprio usuário. */
export interface PlaylistTrackActions {
  onRemove: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
}

interface TrackActionsMenuProps {
  track: Track;
  playlistActions?: PlaylistTrackActions;
  triggerClassName?: string;
}

function AddToPlaylistSubmenu({ track }: { track: Track }) {
  const { playlists, addTrackToPlaylist } = useLibrary();
  const { openPlaylistCreation } = usePlaylistCreation();

  const handleAddToPlaylist = async (playlistId: string, playlistTitle: string) => {
    try {
      await addTrackToPlaylist(playlistId, track.id);
      toast.success(`“${track.title}” adicionada a ${playlistTitle}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível adicionar à playlist."));
    }
  };

  return (
    <DropdownMenuSub>
      <DropdownMenuSubTrigger className={MENU_ITEM_CLASS}>
        <ListPlus className="mr-2 size-4" />
        Adicionar à playlist
      </DropdownMenuSubTrigger>
      <DropdownMenuSubContent className={cn(MENU_SURFACE_CLASS, "max-h-64 overflow-y-auto")}>
        <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={() => openPlaylistCreation({ trackToAdd: track })}>
          <Plus className="mr-2 size-4" />
          Nova playlist
        </DropdownMenuItem>
        {playlists.length > 0 && <DropdownMenuSeparator className={MENU_SEPARATOR_CLASS} />}
        {playlists.map((playlist) => {
          const alreadyAdded = playlist.trackIds.includes(track.id);
          return (
            <DropdownMenuItem
              key={playlist.id}
              disabled={alreadyAdded}
              className={MENU_ITEM_CLASS}
              onSelect={() => handleAddToPlaylist(playlist.id, playlist.title)}
            >
              <span className="truncate">{playlist.title}</span>
              {alreadyAdded && <span className="ml-auto pl-3 text-xs text-[#a19a9b]">Adicionada</span>}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuSubContent>
    </DropdownMenuSub>
  );
}

function PlaylistOrderItems({ actions }: { actions: PlaylistTrackActions }) {
  return (
    <>
      <DropdownMenuSeparator className={MENU_SEPARATOR_CLASS} />
      <DropdownMenuItem className={MENU_ITEM_CLASS} disabled={!actions.onMoveUp} onSelect={actions.onMoveUp}>
        <ArrowUp className="mr-2 size-4" />
        Mover para cima
      </DropdownMenuItem>
      <DropdownMenuItem className={MENU_ITEM_CLASS} disabled={!actions.onMoveDown} onSelect={actions.onMoveDown}>
        <ArrowDown className="mr-2 size-4" />
        Mover para baixo
      </DropdownMenuItem>
      <DropdownMenuSeparator className={MENU_SEPARATOR_CLASS} />
      <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={actions.onRemove}>
        <Trash2 className="mr-2 size-4" />
        Remover desta playlist
      </DropdownMenuItem>
    </>
  );
}

export function TrackActionsMenu({ track, playlistActions, triggerClassName }: TrackActionsMenuProps) {
  const navigate = useNavigate();
  const favorite = useTrackFavorite(track.id);
  const FavoriteIcon = favorite.isFavorite ? HeartOff : Heart;

  return (
    <DropdownMenu>
      <IconTooltip label="Adicionar à playlist e mais opções">
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            onKeyDown={(event) => event.stopPropagation()}
            className={cn(
              "flex size-8 shrink-0 items-center justify-center text-[#a19a9b] transition-colors hover:bg-white/10 hover:text-[#f8f8f8] focus-visible:outline-2 focus-visible:outline-[#ff164c] active:scale-90 data-[state=open]:bg-white/10 data-[state=open]:text-[#f8f8f8]",
              triggerClassName,
            )}
            aria-label={`Mais opções para ${track.title}, incluindo adicionar à playlist`}
          >
            <MoreVertical className="size-4" />
          </button>
        </DropdownMenuTrigger>
      </IconTooltip>
      <DropdownMenuContent align="end" className={MENU_SURFACE_CLASS} onClick={(event) => event.stopPropagation()}>
        <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={() => favorite.toggle({ announceResult: true })}>
          <FavoriteIcon className="mr-2 size-4" />
          {favorite.isFavorite ? "Remover dos favoritos" : "Adicionar aos favoritos"}
        </DropdownMenuItem>
        <AddToPlaylistSubmenu track={track} />
        <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={() => navigate(buildProfilePath(track.artistHandle))}>
          <UserRound className="mr-2 size-4" />
          Ver perfil do artista
        </DropdownMenuItem>
        {playlistActions && <PlaylistOrderItems actions={playlistActions} />}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
