import type { ReactNode } from "react";
import type { ProfileStats, UserProfile } from "../../types/domain";
import { formatCompactNumber, formatHandle } from "../../utils/format";
import { DEFAULT_BANNER_URL } from "../../utils/placeholders";
import { CoverImage } from "../ui/CoverImage";
import { UserAvatar } from "./UserAvatar";

export const PROFILE_SHARE_BUTTON_CLASS = "size-11 border border-[#ff164c] text-[#f8f8f8]";

interface ProfileHeaderProps {
  profile: UserProfile;
  stats?: ProfileStats;
  bannerAction?: ReactNode;
  actions: ReactNode;
}

function ProfileStat({ value, singular, plural }: { value: number; singular: string; plural: string }) {
  return (
    <span className="flex items-center gap-2">
      <span className="text-[16px] font-bold text-[#f8f8f8]">{formatCompactNumber(value)}</span>
      <span className="text-[14px] text-[#a19a9b]">{value === 1 ? singular : plural}</span>
    </span>
  );
}

export function ProfileHeader({ profile, stats, bannerAction, actions }: ProfileHeaderProps) {
  return (
    <div className="relative w-full">
      <div className="relative h-[180px] w-full overflow-hidden sm:h-[245px]">
        <CoverImage
          src={profile.bannerUrl}
          fallbackSrc={DEFAULT_BANNER_URL}
          className="pointer-events-none size-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent from-50% to-[#150f10]/70" />
        {bannerAction && <div className="absolute top-4 right-4 z-10 sm:top-6 sm:right-6">{bannerAction}</div>}
      </div>

      <div className="relative -mt-16 w-full px-4 sm:-mt-20 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-end">
            <UserAvatar
              profile={profile}
              shape="square"
              className="size-[112px] shrink-0 border-4 border-[#0a0608] text-3xl sm:size-[140px]"
            />
            <div className="flex min-w-0 flex-col gap-2 pb-1">
              <div className="min-w-0">
                <h1 className="break-words text-[24px] font-bold leading-[1.3] text-[#ebe9e9] sm:text-[32px] lg:text-[40px]">
                  {profile.displayName}
                </h1>
                <p className="text-[16px] font-semibold leading-[1.5] text-[#bababa]">{formatHandle(profile.handle)}</p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1" aria-label="Estatísticas do perfil">
                {stats && <ProfileStat value={stats.tracksCount} singular="música" plural="músicas" />}
                {stats && <ProfileStat value={stats.totalPlays} singular="play" plural="plays" />}
                <ProfileStat value={profile.followersCount} singular="seguidor" plural="seguidores" />
                <ProfileStat value={profile.followingCount} singular="seguindo" plural="seguindo" />
              </div>
              {profile.bio && <p className="max-w-md text-[13px] leading-[1.5] text-[#bababa]">{profile.bio}</p>}
            </div>
          </div>
          <div className="flex items-center gap-2">{actions}</div>
        </div>
      </div>
    </div>
  );
}
