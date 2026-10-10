import bgImage from "figma:asset/755a0ad35d80d322f261566363a27bca5637a26e.webp";
import { motion } from "motion/react";
import { Suspense, useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import { Outlet, useLocation } from "react-router";
import { LibraryProvider, useLibrary } from "../../context/LibraryContext";
import { PlayerProvider } from "../../context/PlayerContext";
import type { Track } from "../../types/domain";
import { LoadingState } from "../feedback/StatusViews";
import { DesktopPlayer } from "../player/DesktopPlayer";
import { PlaylistCreationProvider } from "../playlists/PlaylistCreationProvider";
import { FullscreenPlayer } from "../player/FullscreenPlayer";
import { MiniPlayer } from "../player/MiniPlayer";
import { BottomNav } from "./BottomNav";
import { Navbar } from "./Navbar";
import { Sidebar } from "./Sidebar";

function PlayerWithListeningHistory({ children }: { children: ReactNode }) {
  const { recordPlay } = useLibrary();
  const handleTrackStarted = useCallback((track: Track) => recordPlay(track.id), [recordPlay]);
  return <PlayerProvider onTrackStarted={handleTrackStarted}>{children}</PlayerProvider>;
}

function ShellLayout() {
  const { pathname } = useLocation();
  const scrollContainerRef = useRef<HTMLElement>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const closeSidebar = useCallback(() => setIsSidebarOpen(false), []);

  useEffect(() => {
    scrollContainerRef.current?.scrollTo({ top: 0 });
  }, [pathname]);

  return (
    <div className="relative h-dvh overflow-hidden bg-[var(--color-bg-base)]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <img src={bgImage} alt="" className="size-full object-cover opacity-10 mix-blend-lighten" />
      </div>

      <div className="relative flex h-dvh">
        <Sidebar isMobileOpen={isSidebarOpen} onMobileClose={closeSidebar} />

        <div className="flex h-dvh min-w-0 flex-1 flex-col overflow-hidden">
          <Navbar isSidebarOpen={isSidebarOpen} onMenuToggle={() => setIsSidebarOpen(true)} />
          <main ref={scrollContainerRef} className="relative flex-1 overflow-y-auto scrollbar-hide pb-[132px] lg:pb-[90px]">
            <Suspense fallback={<LoadingState />}>
              <motion.div
                key={pathname}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ ease: "easeInOut", duration: 0.25 }}
              >
                <Outlet />
              </motion.div>
            </Suspense>
          </main>
        </div>
      </div>

      <BottomNav />
      <DesktopPlayer />
      <MiniPlayer />
      <FullscreenPlayer />
    </div>
  );
}

export function AppShell() {
  return (
    <LibraryProvider>
      <PlaylistCreationProvider>
        <PlayerWithListeningHistory>
          <ShellLayout />
        </PlayerWithListeningHistory>
      </PlaylistCreationProvider>
    </LibraryProvider>
  );
}
