import { Link } from "react-router";
import { buildProfilePath } from "../../routes/paths";
import type { UserProfile } from "../../types/domain";
import { formatHandle } from "../../utils/format";
import { UserAvatar } from "./UserAvatar";

export function CreatorCard({ creator }: { creator: UserProfile }) {
  return (
    <Link
      to={buildProfilePath(creator.handle)}
      aria-label={`Ver perfil de ${creator.displayName}`}
      className="group relative block h-[220px] w-[140px] flex-none overflow-hidden border border-[#30292b] outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c] sm:h-[250px] sm:w-[160px] lg:h-[279px] lg:w-[175px]"
    >
      <UserAvatar
        profile={creator}
        shape="square"
        className="absolute inset-0 size-full border-0 transition-transform duration-300 group-hover:scale-105"
      />
      <span className="absolute inset-0 bg-gradient-to-b from-transparent from-[38%] to-black" />
      <span className="absolute inset-0 bg-[#ff164c]/[0.08] opacity-0 transition-opacity duration-200 group-hover:opacity-100" />
      <span className="absolute right-0 bottom-0 left-0 p-3 lg:p-4">
        <span className="block truncate text-[14px] font-semibold leading-[1.5] text-[#ebe9e9]">{creator.displayName}</span>
        <span className="block truncate text-[12px] leading-[1.25] text-[#bababa]">{formatHandle(creator.handle)}</span>
      </span>
    </Link>
  );
}
