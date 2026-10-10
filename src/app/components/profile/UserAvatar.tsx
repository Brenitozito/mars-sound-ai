import { useState } from "react";
import type { UserProfile } from "../../types/domain";
import { getInitials } from "../../utils/placeholders";
import { cn } from "../ui/utils";

interface UserAvatarProps {
  profile: Pick<UserProfile, "displayName" | "avatarUrl">;
  shape?: "circle" | "square";
  className?: string;
}

/** Sem foto ou com falha ao carregar do Storage, mostra as iniciais do nome. */
export function UserAvatar({ profile, shape = "circle", className }: UserAvatarProps) {
  const [failedAvatarUrl, setFailedAvatarUrl] = useState<string | null>(null);
  const shapeClass = shape === "circle" ? "rounded-full" : "rounded-none";
  const avatarUrl = profile.avatarUrl && profile.avatarUrl !== failedAvatarUrl ? profile.avatarUrl : null;

  if (avatarUrl) {
    return (
      <img
        src={avatarUrl}
        alt=""
        onError={() => setFailedAvatarUrl(avatarUrl)}
        className={cn("object-cover", shapeClass, className)}
      />
    );
  }

  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex items-center justify-center bg-gradient-to-br from-[#ff164c] to-[#3d0515] font-bold text-[#f8f8f8]",
        shapeClass,
        className,
      )}
    >
      {getInitials(profile.displayName)}
    </span>
  );
}
