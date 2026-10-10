import { lazy, Suspense, type ComponentType } from "react";
import { createBrowserRouter, Outlet } from "react-router";
import { LoadingState } from "../components/feedback/StatusViews";
import { AppShell } from "../components/layout/AppShell";
import { RouteErrorPage } from "../pages/RouteErrorPage";
import { ROUTE_PATTERNS, ROUTES } from "./paths";
import { RequireAuthentication, RequireGuest } from "./RouteGuards";

function lazyPage(loader: () => Promise<{ default: ComponentType }>) {
  const Page = lazy(loader);
  return <Page />;
}

function RootLayout() {
  return (
    <Suspense fallback={<LoadingState className="min-h-dvh bg-[var(--color-bg-base)]" />}>
      <Outlet />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    element: <RootLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        element: <RequireGuest />,
        children: [{ path: ROUTES.signIn, element: lazyPage(() => import("../pages/AuthPage")) }],
      },
      {
        element: <RequireAuthentication />,
        children: [
          {
            element: <AppShell />,
            errorElement: <RouteErrorPage />,
            children: [
              { index: true, element: lazyPage(() => import("../pages/HomePage")) },
              { path: ROUTES.discover, element: lazyPage(() => import("../pages/DiscoverPage")) },
              { path: ROUTES.playlists, element: lazyPage(() => import("../pages/PlaylistsPage")) },
              { path: ROUTE_PATTERNS.playlistDetail, element: lazyPage(() => import("../pages/PlaylistDetailPage")) },
              { path: ROUTES.favorites, element: lazyPage(() => import("../pages/FavoritesPage")) },
              { path: ROUTES.myProfile, element: lazyPage(() => import("../pages/MyProfilePage")) },
              { path: ROUTE_PATTERNS.publicProfile, element: lazyPage(() => import("../pages/PublicProfilePage")) },
              { path: ROUTES.settings, element: lazyPage(() => import("../pages/SettingsPage")) },
              { path: ROUTES.upload, element: lazyPage(() => import("../pages/UploadMusicPage")) },
              { path: "*", element: lazyPage(() => import("../pages/NotFoundPage")) },
            ],
          },
        ],
      },
    ],
  },
]);
