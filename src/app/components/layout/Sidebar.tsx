import imgBrandLogo from "figma:asset/97e074a98bd267b7e793590cf7916ed3199aac5e.webp";
import { X } from "lucide-react";
import { useEffect, type ComponentType } from "react";
import { Link, NavLink } from "react-router";
import { ROUTES } from "../../routes/paths";
import { cn } from "../ui/utils";
import {
  DiscoverIcon,
  FavoritesIcon,
  HomeIcon,
  PlaylistIcon,
  ProfileIcon,
  SettingsIcon,
  UploadIcon,
} from "./NavigationIcons";

interface SidebarLink {
  to: string;
  label: string;
  Icon: ComponentType<{ size?: number }>;
  end?: boolean;
}

const NAVIGATION_GROUPS: Array<{ title: string; links: SidebarLink[] }> = [
  {
    title: "MENU",
    links: [
      { to: ROUTES.home, label: "Início", Icon: HomeIcon, end: true },
      { to: ROUTES.discover, label: "Descobrir", Icon: DiscoverIcon },
      { to: ROUTES.playlists, label: "Playlists", Icon: PlaylistIcon },
      { to: ROUTES.favorites, label: "Favoritos", Icon: FavoritesIcon },
    ],
  },
  {
    title: "CONTA",
    links: [
      { to: ROUTES.myProfile, label: "Perfil", Icon: ProfileIcon },
      { to: ROUTES.settings, label: "Configurações", Icon: SettingsIcon },
    ],
  },
];

interface SidebarProps {
  isMobileOpen: boolean;
  onMobileClose: () => void;
}

export function Sidebar({ isMobileOpen, onMobileClose }: SidebarProps) {
  useEffect(() => {
    if (!isMobileOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") onMobileClose();
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [isMobileOpen, onMobileClose]);

  return (
    <>
      {isMobileOpen && (
        <div className="fixed inset-0 z-[105] bg-black/60 lg:hidden" onClick={onMobileClose} aria-hidden="true" />
      )}

      <aside
        id="app-sidebar"
        aria-label="Navegação principal"
        className={cn(
          "fixed top-0 left-0 z-[110] flex h-full w-[260px] shrink-0 flex-col border-r border-[#30292b] bg-[#150f10]/95 backdrop-blur-[4px] transition-[transform,visibility] duration-300 ease-in-out",
          "lg:relative lg:z-auto lg:visible lg:w-fit lg:translate-x-0 lg:bg-[#150f10]/80 lg:pb-[90px]",
          isMobileOpen ? "visible translate-x-0" : "invisible -translate-x-full",
        )}
      >
        <div className="flex h-[80px] w-full shrink-0 items-center justify-between gap-[12px] py-[18px] pr-4 pl-[37px] lg:pr-[62px]">
          <Link to={ROUTES.home} onClick={onMobileClose} className="flex items-center gap-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60">
            <span className="flex h-[34px] w-[33.32px] shrink-0 items-start rounded-[16.32px] bg-[#ff164c] py-[1.36px] pr-[0.68px] pl-[1.36px]">
              <img alt="" className="pointer-events-none size-[30.6px] rounded-[15.3px] object-cover mix-blend-plus-lighter" src={imgBrandLogo} />
            </span>
            <span className="bg-gradient-to-b from-white to-[#999] bg-clip-text text-[20px] font-bold leading-[1.7] tracking-[-1.4px] whitespace-nowrap text-transparent">
              Mars sound ai
            </span>
          </Link>
          <button
            type="button"
            onClick={onMobileClose}
            aria-label="Fechar menu"
            className="flex size-11 items-center justify-center text-[#a19a9b] hover:text-[#f8f8f8] lg:hidden"
          >
            <X className="size-5" />
          </button>
        </div>

        <nav className="flex flex-1 flex-col gap-[24px] overflow-y-auto scrollbar-hide">
          {NAVIGATION_GROUPS.map((group) => (
            <div key={group.title} className="flex flex-col gap-[16px] pr-4 pl-[37px] lg:pr-[62px]">
              <p className="text-[12px] leading-[1.25] text-[#a19a9b]">{group.title}</p>
              <ul className="flex w-full flex-col">
                {group.links.map(({ to, label, Icon, end }) => (
                  <li key={to}>
                    <NavLink
                      to={to}
                      end={end}
                      onClick={onMobileClose}
                      className={({ isActive }) =>
                        cn(
                          "group flex w-full items-center gap-[12px] rounded-lg py-[8px] pr-[12px] pl-[8px] text-[14px] font-semibold leading-[1.5] whitespace-nowrap transition-colors duration-150 hover:bg-white/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60",
                          isActive ? "text-[#f8f8f8]" : "text-[#a19a9b]",
                        )
                      }
                    >
                      {({ isActive }) => (
                        <>
                          <span className={cn("shrink-0", isActive ? "text-[#ff164c]" : "text-[#a19a9b]")}>
                            <Icon />
                          </span>
                          {label}
                        </>
                      )}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}

          <div className="w-full pr-4 pl-[37px] lg:pr-[37px]">
            <NavLink
              to={ROUTES.upload}
              onClick={onMobileClose}
              className={({ isActive }) =>
                cn(
                  "flex w-full items-center justify-center gap-[12px] border border-[#ff164c] px-[16px] py-[8px] text-[14px] font-semibold leading-[1.5] whitespace-nowrap text-[#f8f8f8] transition-colors duration-150 hover:bg-[#ff164c]/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60",
                  isActive && "bg-[#ff164c]/10",
                )
              }
            >
              <UploadIcon />
              Carregar música AI
            </NavLink>
          </div>
        </nav>
      </aside>
    </>
  );
}
