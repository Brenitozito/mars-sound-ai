import type { ComponentType } from "react";
import { NavLink } from "react-router";
import { ROUTES } from "../../routes/paths";
import { cn } from "../ui/utils";
import {
  MobileDiscoverIcon,
  MobileFavoritesIcon,
  MobileHomeIcon,
  MobilePlaylistIcon,
  MobileProfileIcon,
} from "./NavigationIcons";

const BOTTOM_NAV_LINKS: Array<{ to: string; label: string; Icon: ComponentType<{ size?: number }>; end?: boolean }> = [
  { to: ROUTES.home, label: "Início", Icon: MobileHomeIcon, end: true },
  { to: ROUTES.discover, label: "Descobrir", Icon: MobileDiscoverIcon },
  { to: ROUTES.playlists, label: "Playlists", Icon: MobilePlaylistIcon },
  { to: ROUTES.favorites, label: "Favoritos", Icon: MobileFavoritesIcon },
  { to: ROUTES.myProfile, label: "Perfil", Icon: MobileProfileIcon },
];

export function BottomNav() {
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed right-0 bottom-0 left-0 z-[95] flex h-[60px] items-stretch border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-sidebar)] lg:hidden"
    >
      {BOTTOM_NAV_LINKS.map(({ to, label, Icon, end }) => (
        <NavLink
          key={to}
          to={to}
          end={end}
          className={({ isActive }) =>
            cn(
              "flex min-w-[44px] flex-1 flex-col items-center justify-center gap-0.5 text-[10px] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#ff164c]/60",
              isActive ? "text-[var(--color-brand)]" : "text-[var(--color-text-muted)]",
            )
          }
        >
          <Icon size={22} />
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
