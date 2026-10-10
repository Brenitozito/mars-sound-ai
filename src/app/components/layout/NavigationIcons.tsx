import sidebarPaths from "../../../imports/svg-l3bgvctykq";
import navbarPaths from "../../../imports/svg-67owiawy17";

interface IconProps {
  size?: number;
}

function createIcon(viewBox: string, paths: string[]) {
  return function NavigationIcon({ size = 16 }: IconProps) {
    return (
      <svg width={size} height={size} viewBox={viewBox} fill="currentColor" aria-hidden="true">
        {paths.map((path) => (
          <path key={path} d={path} />
        ))}
      </svg>
    );
  };
}

export const HomeIcon = createIcon("0 0 16 15.9904", [sidebarPaths.p1b846000]);
export const DiscoverIcon = createIcon("0 0 16 16", [sidebarPaths.p228fb100]);
export const PlaylistIcon = createIcon("0 0 16 16", [sidebarPaths.p37530f80]);
export const FavoritesIcon = createIcon("0 0 15.9983 15.9976", [sidebarPaths.p2a54b400]);
export const ProfileIcon = createIcon("0 0 14.6667 16", [sidebarPaths.p3a2be680]);
export const SettingsIcon = createIcon("0 0 16 16.0003", [sidebarPaths.pfb19300, sidebarPaths.p30acfa00, sidebarPaths.p23679f70]);
export const UploadIcon = createIcon("0 0 16 15.9997", [sidebarPaths.p7a0c500, sidebarPaths.p2c402cb0]);
export const SearchIcon = createIcon("0 0 24 24", [navbarPaths.p130c800]);

export const MobileHomeIcon = createIcon("0 0 24 24", [navbarPaths.p3c0bf880]);
export const MobileDiscoverIcon = createIcon("0 0 24 24", [navbarPaths.p56ff800]);
export const MobilePlaylistIcon = createIcon("0 0 24 24", [navbarPaths.p364de200]);
export const MobileFavoritesIcon = createIcon("0 0 24 24", [navbarPaths.p3d899000]);
export const MobileProfileIcon = createIcon("0 0 24 24", [
  "M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z",
]);
