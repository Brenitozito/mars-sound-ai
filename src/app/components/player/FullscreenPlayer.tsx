import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronDown } from "lucide-react";
import { motion, useDragControls, useReducedMotion, type PanInfo } from "motion/react";
import { useEffect, type PointerEvent } from "react";
import { Link } from "react-router";
import { usePlayer } from "../../context/PlayerContext";
import { useReturnFocus } from "../../hooks/useReturnFocus";
import { buildProfilePath } from "../../routes/paths";
import { formatHandle } from "../../utils/format";
import { TrackActionsMenu } from "../tracks/TrackActionsMenu";
import { TrackFavoriteButton } from "../tracks/TrackFavoriteButton";
import { CoverImage } from "../ui/CoverImage";
import { PlaybackControls } from "./PlaybackControls";
import { PlaybackErrorNotice } from "./PlaybackErrorNotice";
import { PlaybackProgressBar } from "./PlaybackProgressBar";

const DESKTOP_MEDIA_QUERY = "(min-width: 1024px)";
const DISMISS_DISTANCE_PX = 120;
const DISMISS_VELOCITY_PX_PER_SECOND = 600;

export function FullscreenPlayer() {
  const { currentTrack, isFullscreenOpen, closeFullscreen } = usePlayer();
  const isOpen = isFullscreenOpen && Boolean(currentTrack);
  const dragControls = useDragControls();
  const shouldReduceMotion = useReducedMotion();
  const returnFocusHandlers = useReturnFocus();

  useEffect(() => {
    if (!isOpen) return;
    const desktopQuery = window.matchMedia(DESKTOP_MEDIA_QUERY);
    const closeOnDesktop = () => {
      if (desktopQuery.matches) closeFullscreen();
    };
    closeOnDesktop();
    desktopQuery.addEventListener("change", closeOnDesktop);
    return () => desktopQuery.removeEventListener("change", closeOnDesktop);
  }, [isOpen, closeFullscreen]);

  const handleDragEnd = (_event: unknown, info: PanInfo) => {
    if (info.offset.y > DISMISS_DISTANCE_PX || info.velocity.y > DISMISS_VELOCITY_PX_PER_SECOND) closeFullscreen();
  };

  // O gesto só começa no cabeçalho/capa: na área dos controles o arraste vertical conflitaria com os sliders.
  const startDismissGesture = (event: PointerEvent<HTMLDivElement>) => {
    if (!shouldReduceMotion) dragControls.start(event);
  };

  return (
    <DialogPrimitive.Root open={isOpen} onOpenChange={(open) => !open && closeFullscreen()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Content
          aria-describedby={undefined}
          {...returnFocusHandlers}
          className="fixed inset-0 z-[110] data-[state=closed]:animate-out data-[state=closed]:slide-out-to-bottom data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom lg:hidden"
        >
          <motion.div
            drag="y"
            dragListener={false}
            dragControls={dragControls}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.7 }}
            onDragEnd={handleDragEnd}
            className="flex h-full flex-col overflow-y-auto bg-gradient-to-b from-[#24191b] to-[#1c1315] pt-[env(safe-area-inset-top)] pb-[env(safe-area-inset-bottom)]"
          >
            {currentTrack && (
              <>
                <div onPointerDown={startDismissGesture} className="touch-none">
                  <div className="flex justify-center pt-2" aria-hidden="true">
                    <span className="h-1 w-10 rounded-full bg-white/25" />
                  </div>
                  <div className="flex items-center justify-between px-4 pt-2 pb-4">
                    <DialogPrimitive.Close
                      aria-label="Minimizar player"
                      className="flex size-11 items-center justify-center text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60"
                    >
                      <ChevronDown className="size-6" />
                    </DialogPrimitive.Close>
                    <DialogPrimitive.Title className="flex-1 text-center text-xs font-medium tracking-wider text-white">
                      TOCANDO AGORA
                    </DialogPrimitive.Title>
                    <TrackActionsMenu track={currentTrack} triggerClassName="size-11 text-white" />
                  </div>
                </div>

                <div className="mx-auto flex w-full max-w-[520px] flex-1 flex-col md:justify-center">
                  <div
                    onPointerDown={startDismissGesture}
                    className="flex touch-none items-center justify-center px-6 py-6"
                  >
                    <CoverImage
                      src={currentTrack.coverUrl}
                      alt={`Capa de ${currentTrack.title}`}
                      draggable={false}
                      className="aspect-square w-full max-w-[340px] border border-[#30292b] object-cover shadow-2xl md:max-w-[440px]"
                    />
                  </div>

                  <div className="mt-auto flex items-start justify-between gap-4 px-6 pb-4 md:mt-4">
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 truncate text-2xl font-bold text-white">{currentTrack.title}</p>
                      <Link
                        to={buildProfilePath(currentTrack.artistHandle)}
                        onClick={closeFullscreen}
                        className="block truncate text-base text-[#a19a9b] hover:text-white"
                      >
                        {formatHandle(currentTrack.artistHandle)}
                      </Link>
                      <PlaybackErrorNotice className="mt-2 text-[14px]" />
                    </div>
                    <TrackFavoriteButton trackId={currentTrack.id} size="lg" className="shrink-0" />
                  </div>

                  <PlaybackProgressBar layout="stacked" className="px-6 pb-4" />

                  <div className="px-6 pb-10">
                    <PlaybackControls variant="fullscreen" />
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
