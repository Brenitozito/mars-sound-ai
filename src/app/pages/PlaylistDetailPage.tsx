import { ChevronLeft, Edit, Lock, MoreVertical, Music2, Plus, Trash2 } from "lucide-react";
import { useRef, useState, type ReactNode } from "react";
import { Link, useNavigate, useParams } from "react-router";
import { toast } from "sonner";
import { ConfirmDialog } from "../components/feedback/ConfirmDialog";
import { ShareButton } from "../components/feedback/ShareButton";
import { EmptyState, ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { PageContainer } from "../components/layout/PageContainer";
import { AddTracksDialog } from "../components/playlists/AddTracksDialog";
import { resolvePlaylistCover } from "../components/playlists/PlaylistCard";
import { PlaylistFormDialog } from "../components/playlists/PlaylistFormDialog";
import { PlayAllButton } from "../components/tracks/PlayAllButton";
import { TrackTable, type MoveOffset } from "../components/tracks/TrackTable";
import { Button } from "../components/ui/button";
import { CoverImage } from "../components/ui/CoverImage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { MENU_ITEM_CLASS, MENU_SEPARATOR_CLASS, MENU_SURFACE_CLASS } from "../components/ui/surfaceStyles";
import { useCurrentUser } from "../context/AuthContext";
import { useLibrary } from "../context/LibraryContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useTracksByIds } from "../hooks/useTracksByIds";
import { buildPlaylistPath, buildProfilePath, ROUTES } from "../routes/paths";
import { libraryService } from "../services";
import { getErrorMessage } from "../services/serviceError";
import type { Playlist, PlaylistInput, Track } from "../types/domain";
import { formatHandle, summarizeTracks } from "../utils/format";
import { NotFoundPage } from "./NotFoundPage";

const EMPTY_PLAYLIST_TITLE = "Essa playlist está vazia";
const BACK_LINK_CLASS =
  "inline-flex min-h-11 items-center gap-1 text-[14px] font-semibold text-[#a19a9b] transition-colors duration-150 hover:text-[#f8f8f8]";

function moveTrackId(trackIds: readonly string[], trackId: string, offset: MoveOffset): string[] {
  const fromIndex = trackIds.indexOf(trackId);
  const toIndex = fromIndex + offset;
  if (fromIndex < 0 || toIndex < 0 || toIndex >= trackIds.length) return [...trackIds];
  const reorderedIds = [...trackIds];
  [reorderedIds[fromIndex], reorderedIds[toIndex]] = [reorderedIds[toIndex], reorderedIds[fromIndex]];
  return reorderedIds;
}

interface PlaylistHeaderProps {
  playlist: Playlist;
  tracks: Track[];
  menu?: ReactNode;
  showOwner: boolean;
  extraActions?: ReactNode;
}

function PlaylistHeader({ playlist, tracks, menu, showOwner, extraActions }: PlaylistHeaderProps) {
  return (
    <div className="relative overflow-hidden border border-[#30292b]">
      {menu}
      <div className="flex flex-col gap-5 p-5 sm:flex-row sm:items-end sm:gap-6 lg:p-8">
        <CoverImage
          src={resolvePlaylistCover(playlist, tracks)}
          alt={`Capa da playlist ${playlist.title}`}
          className="size-[140px] shrink-0 border border-[#30292b] object-cover sm:size-[160px]"
        />
        <div className="flex min-w-0 flex-1 flex-col gap-2 pr-10 sm:pr-0">
          <p className="flex items-center gap-1.5 text-[12px] font-semibold uppercase leading-[1.5] tracking-wide text-[#bababa]">
            {!playlist.isPublic && <Lock className="size-3" aria-hidden="true" />}
            {playlist.isPublic ? "Playlist pública" : "Playlist privada"}
          </p>
          <div className="flex min-w-0 items-center gap-2">
            <h1 className="min-w-0 break-words text-[24px] font-bold leading-[1.2] text-[#ebe9e9] sm:text-[32px] lg:text-[40px]">
              {playlist.title}
            </h1>
            {playlist.isPublic && (
              <ShareButton path={buildPlaylistPath(playlist.id)} title={playlist.title} label="Compartilhar playlist" />
            )}
          </div>
          {playlist.description && <p className="line-clamp-2 text-[14px] text-[#a19a9b]">{playlist.description}</p>}
          <p className="text-[14px] leading-[1.5] text-[#bababa]">
            {showOwner && (
              <>
                <Link to={buildProfilePath(playlist.ownerHandle)} className="font-semibold text-[#f8f8f8] hover:underline">
                  {formatHandle(playlist.ownerHandle)}
                </Link>
                {" · "}
              </>
            )}
            {summarizeTracks(tracks)}
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <PlayAllButton tracks={tracks} />
            {extraActions}
          </div>
        </div>
      </div>
    </div>
  );
}

function PlaylistOptionsMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Opções da playlist"
          className="absolute top-3 right-3 z-10 flex size-10 items-center justify-center rounded text-[#a19a9b] transition-colors duration-150 hover:bg-white/10 hover:text-[#f8f8f8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
        >
          <MoreVertical className="size-5" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className={MENU_SURFACE_CLASS}>
        <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={onEdit}>
          <Edit className="mr-2 size-4" />
          Editar playlist
        </DropdownMenuItem>
        <DropdownMenuSeparator className={MENU_SEPARATOR_CLASS} />
        <DropdownMenuItem variant="destructive" className="cursor-pointer" onSelect={onDelete}>
          <Trash2 className="mr-2 size-4" />
          Excluir playlist
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

interface OwnedPlaylistViewProps {
  playlist: Playlist;
  onDeleteStarted: () => void;
  onDeleteFailed: () => void;
}

function OwnedPlaylistView({ playlist, onDeleteStarted, onDeleteFailed }: OwnedPlaylistViewProps) {
  const navigate = useNavigate();
  const { updatePlaylist, deletePlaylist, removeTrackFromPlaylist, reorderPlaylistTracks } = useLibrary();
  const { tracks, errorMessage, isLoading, reload } = useTracksByIds(playlist.trackIds);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddTracksDialogOpen, setIsAddTracksDialogOpen] = useState(false);
  usePageMeta(playlist.title, playlist.description);

  const handleUpdate = async (input: PlaylistInput) => {
    await updatePlaylist(playlist.id, input);
    setIsEditDialogOpen(false);
    toast.success("Playlist atualizada.");
  };

  const handleDelete = async () => {
    onDeleteStarted();
    try {
      await deletePlaylist(playlist.id);
    } catch (error) {
      onDeleteFailed();
      throw error;
    }
    toast.success(`Playlist “${playlist.title}” excluída.`);
    navigate(ROUTES.playlists, { replace: true });
  };

  const handleRemoveTrack = async (track: Track) => {
    try {
      await removeTrackFromPlaylist(playlist.id, track.id);
      toast.success(`“${track.title}” removida da playlist.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível remover a música."));
    }
  };

  const handleMoveTrack = (track: Track, offset: MoveOffset) => {
    reorderPlaylistTracks(playlist.id, moveTrackId(playlist.trackIds, track.id, offset)).catch((error: unknown) => {
      toast.error(getErrorMessage(error, "Não foi possível reordenar a playlist."));
    });
  };

  const openAddTracks = () => setIsAddTracksDialogOpen(true);

  const renderTracks = () => {
    if (isLoading) return <LoadingState label="Carregando músicas..." />;
    if (errorMessage) return <ErrorState message={errorMessage} onRetry={reload} />;
    if (tracks.length === 0) {
      return (
        <EmptyState
          icon={<Music2 className="size-10" />}
          title={EMPTY_PLAYLIST_TITLE}
          description="Busque músicas no catálogo ou use o menu ⋮ de qualquer música para adicioná-la aqui."
          action={
            <Button variant="primary" size="touch" onClick={openAddTracks}>
              <Plus className="size-4" aria-hidden="true" />
              Adicionar músicas
            </Button>
          }
        />
      );
    }
    return <TrackTable tracks={tracks} editablePlaylist={{ onRemove: handleRemoveTrack, onMove: handleMoveTrack }} />;
  };

  return (
    <PageContainer className="space-y-6">
      <Link to={ROUTES.playlists} className={BACK_LINK_CLASS}>
        <ChevronLeft className="size-4" aria-hidden="true" />
        Playlists
      </Link>

      <PlaylistHeader
        playlist={playlist}
        tracks={tracks}
        showOwner={false}
        menu={<PlaylistOptionsMenu onEdit={() => setIsEditDialogOpen(true)} onDelete={() => setIsDeleteDialogOpen(true)} />}
        extraActions={
          tracks.length > 0 && (
            <Button variant="brandOutline" size="touch" onClick={openAddTracks}>
              <Plus className="size-4" aria-hidden="true" />
              Adicionar músicas
            </Button>
          )
        }
      />

      <section aria-label="Músicas da playlist">{renderTracks()}</section>

      <AddTracksDialog open={isAddTracksDialogOpen} onOpenChange={setIsAddTracksDialogOpen} playlist={playlist} />
      <PlaylistFormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        mode="edit"
        initialValues={{
          title: playlist.title,
          description: playlist.description,
          isPublic: playlist.isPublic,
          coverUrl: playlist.coverUrl,
        }}
        onSubmit={handleUpdate}
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir playlist?"
        description={`“${playlist.title}” será excluída permanentemente. As músicas continuarão disponíveis no catálogo.`}
        confirmLabel="Excluir"
        pendingLabel="Excluindo..."
        errorFallbackMessage="Não foi possível excluir a playlist."
        onConfirm={handleDelete}
      />
    </PageContainer>
  );
}

function SharedPlaylistView({ playlistId }: { playlistId: string }) {
  const currentUser = useCurrentUser();
  const { data: playlist, errorMessage, errorCode, isLoading, reload } = useAsyncData(
    () => libraryService.getPlaylistById(currentUser.id, playlistId),
    [currentUser.id, playlistId],
    "Não foi possível carregar a playlist.",
  );
  const tracksState = useTracksByIds(playlist?.trackIds ?? []);
  usePageMeta(playlist?.title ?? "Playlist", playlist?.description);

  if (isLoading && !playlist) return <LoadingState label="Carregando playlist..." className="min-h-[60vh]" />;
  if (errorMessage && errorCode !== "not_found") {
    return <ErrorState message={errorMessage} onRetry={reload} className="min-h-[60vh]" />;
  }
  if (!playlist) {
    return <NotFoundPage title="Playlist não encontrada" description="Ela pode ser privada, ter sido excluída ou o link está incorreto." />;
  }

  const renderTracks = () => {
    if (tracksState.isLoading) return <LoadingState label="Carregando músicas..." />;
    if (tracksState.errorMessage) return <ErrorState message={tracksState.errorMessage} onRetry={tracksState.reload} />;
    if (tracksState.tracks.length === 0) {
      return <EmptyState icon={<Music2 className="size-10" />} title={EMPTY_PLAYLIST_TITLE} description="O criador ainda não adicionou músicas." />;
    }
    return <TrackTable tracks={tracksState.tracks} />;
  };

  return (
    <PageContainer className="space-y-6">
      <Link to={buildProfilePath(playlist.ownerHandle)} className={BACK_LINK_CLASS}>
        <ChevronLeft className="size-4" aria-hidden="true" />
        Perfil de {formatHandle(playlist.ownerHandle)}
      </Link>
      <PlaylistHeader playlist={playlist} tracks={tracksState.tracks} showOwner />
      <section aria-label="Músicas da playlist">{renderTracks()}</section>
    </PageContainer>
  );
}

export default function PlaylistDetailPage() {
  const { playlistId = "" } = useParams();
  const { isLoading, getPlaylistById } = useLibrary();
  const ownedPlaylist = getPlaylistById(playlistId);
  const isDeletingRef = useRef(false);

  if (isLoading) return <LoadingState label="Carregando playlist..." className="min-h-[60vh]" />;
  if (ownedPlaylist) {
    return (
      <OwnedPlaylistView
        playlist={ownedPlaylist}
        onDeleteStarted={() => {
          isDeletingRef.current = true;
        }}
        onDeleteFailed={() => {
          isDeletingRef.current = false;
        }}
      />
    );
  }
  if (isDeletingRef.current) return null;
  return <SharedPlaylistView key={playlistId} playlistId={playlistId} />;
}
