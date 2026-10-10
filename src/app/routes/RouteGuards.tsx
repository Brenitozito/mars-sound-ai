import { Navigate, Outlet, useLocation } from "react-router";
import { LoadingState } from "../components/feedback/StatusViews";
import { useAuth } from "../context/AuthContext";
import { ROUTES } from "./paths";

interface RedirectState {
  from?: string;
}

function FullScreenLoading() {
  return <LoadingState label="Carregando sua sessão..." className="min-h-screen bg-[var(--color-bg-base)]" />;
}

export function RequireAuthentication() {
  const { status, hasEndedSession } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoading />;
  if (status === "unauthenticated") {
    const redirectState: RedirectState | undefined = hasEndedSession
      ? undefined
      : { from: `${location.pathname}${location.search}` };
    return <Navigate to={ROUTES.signIn} replace state={redirectState} />;
  }
  return <Outlet />;
}

export function RequireGuest() {
  const { status, isRecoveringPassword } = useAuth();
  const location = useLocation();

  if (status === "loading") return <FullScreenLoading />;
  // O link de recuperação abre uma sessão, mas o usuário precisa permanecer na tela de nova senha.
  if (status === "authenticated" && !isRecoveringPassword) {
    const redirectTarget = (location.state as RedirectState | null)?.from ?? ROUTES.home;
    return <Navigate to={redirectTarget} replace />;
  }
  return <Outlet />;
}
