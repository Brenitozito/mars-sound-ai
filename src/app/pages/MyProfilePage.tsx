import { ImageIcon, MoreVertical, Trash2 } from "lucide-react";
import { useRef, useState, type ChangeEvent } from "react";
import { Link } from "react-router";
import { toast } from "sonner";
import { ShareButton } from "../components/feedback/ShareButton";
import { ProfileContentTabs } from "../components/profile/ProfileContentTabs";
import { PROFILE_SHARE_BUTTON_CLASS, ProfileHeader } from "../components/profile/ProfileHeader";
import { OwnProfilePlaylists } from "../components/profile/ProfilePlaylistsSection";
import { PublishedTracksSection } from "../components/profile/PublishedTracksSection";
import { MENU_ITEM_CLASS, MENU_SURFACE_CLASS } from "../components/ui/surfaceStyles";
import { Button } from "../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../components/ui/dropdown-menu";
import { useAuth, useCurrentUser } from "../context/AuthContext";
import { usePageMeta } from "../hooks/usePageMeta";
import { useProfileStats } from "../hooks/useProfileStats";
import { buildProfilePath, ROUTES } from "../routes/paths";
import { getErrorMessage } from "../services/serviceError";
import type { MediaChange } from "../types/domain";
import { IMAGE_ACCEPT_ATTRIBUTE, IMAGE_MAX_DIMENSIONS, prepareImageUpload } from "../utils/imageUpload";

function BannerMenu() {
  const currentUser = useCurrentUser();
  const { updateProfile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const saveBanner = async (banner: MediaChange, successMessage: string) => {
    setIsSaving(true);
    try {
      await updateProfile({ banner });
      toast.success(successMessage);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o banner."));
    } finally {
      setIsSaving(false);
    }
  };

  const handleBannerSelected = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    try {
      const bannerFile = await prepareImageUpload(file, IMAGE_MAX_DIMENSIONS.banner);
      await saveBanner({ kind: "replace", file: bannerFile }, "Banner atualizado.");
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível usar esta imagem."));
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Opções do banner"
            disabled={isSaving}
            className="flex size-10 items-center justify-center rounded bg-black/40 text-[#f8f8f8] transition-colors duration-150 hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60 disabled:cursor-wait disabled:opacity-60"
          >
            <MoreVertical className="size-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className={MENU_SURFACE_CLASS}>
          <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={() => fileInputRef.current?.click()}>
            <ImageIcon className="mr-2 size-4" />
            {currentUser.bannerUrl ? "Trocar banner" : "Adicionar banner"}
          </DropdownMenuItem>
          {currentUser.bannerUrl && (
            <DropdownMenuItem className={MENU_ITEM_CLASS} onSelect={() => saveBanner({ kind: "remove" }, "Banner removido.")}>
              <Trash2 className="mr-2 size-4" />
              Remover banner
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <input ref={fileInputRef} type="file" accept={IMAGE_ACCEPT_ATTRIBUTE} className="hidden" onChange={handleBannerSelected} />
    </>
  );
}

export default function MyProfilePage() {
  const currentUser = useCurrentUser();
  const stats = useProfileStats(currentUser.id);
  usePageMeta(currentUser.displayName, currentUser.bio);

  return (
    <div className="min-h-full w-full">
      <ProfileHeader
        profile={currentUser}
        stats={stats}
        bannerAction={<BannerMenu />}
        actions={
          <>
            <Button asChild variant="primary" size="touch">
              <Link to={ROUTES.settings}>Editar perfil</Link>
            </Button>
            {currentUser.isPublic && (
              <ShareButton
                path={buildProfilePath(currentUser.handle)}
                title={currentUser.displayName}
                label="Compartilhar perfil"
                className={PROFILE_SHARE_BUTTON_CLASS}
              />
            )}
          </>
        }
      />
      <ProfileContentTabs
        tracksPanel={
          <PublishedTracksSection
            artistId={currentUser.id}
            emptyTitle="Você ainda não publicou músicas"
            emptyDescription="Envie sua primeira criação feita com AI e ela aparecerá aqui."
            emptyAction={
              <Button asChild variant="primary" size="touch">
                <Link to={ROUTES.upload}>Carregar música AI</Link>
              </Button>
            }
          />
        }
        playlistsPanel={<OwnProfilePlaylists />}
      />
    </div>
  );
}
