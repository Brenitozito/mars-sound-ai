import { useState } from "react";
import { Navigate, useParams } from "react-router";
import { toast } from "sonner";
import { ShareButton } from "../components/feedback/ShareButton";
import { ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { ProfileContentTabs } from "../components/profile/ProfileContentTabs";
import { PROFILE_SHARE_BUTTON_CLASS, ProfileHeader } from "../components/profile/ProfileHeader";
import { PublicProfilePlaylists } from "../components/profile/ProfilePlaylistsSection";
import { PublishedTracksSection } from "../components/profile/PublishedTracksSection";
import { Button } from "../components/ui/button";
import { useAuth, useCurrentUser } from "../context/AuthContext";
import { useAsyncData } from "../hooks/useAsyncData";
import { usePageMeta } from "../hooks/usePageMeta";
import { useProfileStats } from "../hooks/useProfileStats";
import { buildProfilePath, ROUTES } from "../routes/paths";
import { getErrorMessage, userService } from "../services";
import type { UserProfile } from "../types/domain";
import { normalizeHandle } from "../utils/validation";
import { NotFoundPage } from "./NotFoundPage";

interface ProfileWithRelationship {
  profile: UserProfile;
  isFollowing: boolean;
}

function FollowButton({ isFollowing, isPending, onToggle }: { isFollowing: boolean; isPending: boolean; onToggle: () => void }) {
  return (
    <Button
      variant={isFollowing ? "brandOutline" : "primary"}
      size="touch"
      onClick={onToggle}
      disabled={isPending}
      aria-pressed={isFollowing}
      className="min-w-[132px]"
    >
      {isPending ? "Aguarde..." : isFollowing ? "Seguindo" : "Seguir perfil"}
    </Button>
  );
}

function PublicProfile({ handle }: { handle: string }) {
  const currentUser = useCurrentUser();
  const { refreshCurrentUser } = useAuth();
  const [isFollowPending, setIsFollowPending] = useState(false);
  const [relationshipOverride, setRelationshipOverride] = useState<ProfileWithRelationship | null>(null);

  const { data, errorMessage, errorCode, isLoading, reload } = useAsyncData(
    async (): Promise<ProfileWithRelationship> => {
      const profile = await userService.getProfileByHandle(handle);
      const isFollowing = await userService.isFollowing(currentUser.id, profile.id);
      return { profile, isFollowing };
    },
    [handle, currentUser.id],
    "Não foi possível carregar o perfil.",
  );

  const current = relationshipOverride ?? data;
  const stats = useProfileStats(current?.profile.id);
  usePageMeta(current?.profile.displayName ?? "Perfil", current?.profile.bio);

  if (isLoading && !current) return <LoadingState label="Carregando perfil..." className="min-h-[60vh]" />;
  if (errorMessage && errorCode !== "not_found") {
    return <ErrorState message={errorMessage} onRetry={reload} className="min-h-[60vh]" />;
  }
  if (!current) {
    return <NotFoundPage title="Perfil não encontrado" description="Este perfil não existe ou é privado." />;
  }

  const handleToggleFollow = async () => {
    const shouldFollow = !current.isFollowing;
    setIsFollowPending(true);
    try {
      const updatedProfile = await userService.setFollowing(currentUser.id, current.profile.id, shouldFollow);
      setRelationshipOverride({ profile: updatedProfile, isFollowing: shouldFollow });
      await refreshCurrentUser();
      toast.success(shouldFollow ? `Você agora segue ${updatedProfile.displayName}.` : `Você deixou de seguir ${updatedProfile.displayName}.`);
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível atualizar o perfil."));
    } finally {
      setIsFollowPending(false);
    }
  };

  return (
    <div className="min-h-full w-full">
      <ProfileHeader
        profile={current.profile}
        stats={stats}
        actions={
          <>
            <FollowButton isFollowing={current.isFollowing} isPending={isFollowPending} onToggle={handleToggleFollow} />
            <ShareButton
              path={buildProfilePath(current.profile.handle)}
              title={current.profile.displayName}
              label="Compartilhar perfil"
              className={PROFILE_SHARE_BUTTON_CLASS}
            />
          </>
        }
      />
      <ProfileContentTabs
        tracksPanel={
          <PublishedTracksSection
            artistId={current.profile.id}
            emptyTitle="Nenhuma música publicada"
            emptyDescription={`${current.profile.displayName} ainda não publicou músicas.`}
          />
        }
        playlistsPanel={<PublicProfilePlaylists ownerId={current.profile.id} ownerName={current.profile.displayName} />}
      />
    </div>
  );
}

export default function PublicProfilePage() {
  const { handle = "" } = useParams();
  const currentUser = useCurrentUser();
  const normalizedHandle = normalizeHandle(handle);

  if (normalizedHandle === currentUser.handle) return <Navigate to={ROUTES.myProfile} replace />;
  return <PublicProfile key={normalizedHandle} handle={normalizedHandle} />;
}
