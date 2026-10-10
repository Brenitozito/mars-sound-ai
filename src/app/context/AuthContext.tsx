import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import {
  authService,
  userService,
  type AuthChangeEvent,
  type PasswordChange,
  type SignInCredentials,
  type SignUpData,
  type SignUpResult,
} from "../services";
import type { AuthUser, ProfileUpdate } from "../types/domain";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface EmailChangeOutcome {
  isConfirmationPending: boolean;
}

interface AuthContextValue {
  status: AuthStatus;
  currentUser: AuthUser | null;
  /** Verdadeiro quando a sessão foi aberta por um link de recuperação e a nova senha ainda não foi definida. */
  isRecoveringPassword: boolean;
  /** Verdadeiro após logout, exclusão de conta ou saída em outra aba; o próximo login não deve voltar à rota anterior. */
  hasEndedSession: boolean;
  signIn: (credentials: SignInCredentials) => Promise<void>;
  signUp: (data: SignUpData) => Promise<SignUpResult>;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  requestPasswordReset: (email: string) => Promise<void>;
  completePasswordReset: (newPassword: string) => Promise<void>;
  updateProfile: (update: ProfileUpdate) => Promise<void>;
  refreshCurrentUser: () => Promise<void>;
  updateEmail: (newEmail: string) => Promise<EmailChangeOutcome>;
  changePassword: (change: PasswordChange) => Promise<void>;
  deleteAccount: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [isRecoveringPassword, setIsRecoveringPassword] = useState(false);
  const [hasEndedSession, setHasEndedSession] = useState(false);
  const currentUserIdRef = useRef<string | null>(null);

  const applySession = useCallback((user: AuthUser | null) => {
    currentUserIdRef.current = user?.id ?? null;
    if (user) setHasEndedSession(false);
    setCurrentUser(user);
    setStatus(user ? "authenticated" : "unauthenticated");
  }, []);

  const endSession = useCallback(() => {
    setIsRecoveringPassword(false);
    setHasEndedSession(true);
    applySession(null);
  }, [applySession]);

  useEffect(() => {
    let isActive = true;
    const loadCurrentUser = () =>
      authService
        .getCurrentUser()
        .then((user) => {
          if (isActive) applySession(user);
        })
        .catch(() => {
          if (isActive) applySession(null);
        });

    const handleAuthChange = (event: AuthChangeEvent) => {
      switch (event.type) {
        case "password_recovery":
          setIsRecoveringPassword(true);
          return;
        case "auth_link_failed":
          toast.error(event.message);
          return;
        case "signed_out":
          endSession();
          return;
        case "signed_in":
          if (currentUserIdRef.current === event.userId) return;
          void loadCurrentUser();
          return;
        case "user_updated":
          void loadCurrentUser();
          return;
      }
    };

    // A inscrição precisa existir antes da primeira leitura: é ela que recebe o evento do link de recuperação.
    const unsubscribe = authService.subscribeToAuthChanges(handleAuthChange);
    void loadCurrentUser();

    return () => {
      isActive = false;
      unsubscribe();
    };
  }, [applySession, endSession]);

  const requireUser = useCallback((): AuthUser => {
    if (!currentUser) throw new Error("Nenhum usuário autenticado.");
    return currentUser;
  }, [currentUser]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      currentUser,
      isRecoveringPassword,
      hasEndedSession,
      signIn: async (credentials) => applySession(await authService.signIn(credentials)),
      signUp: async (data) => {
        const result = await authService.signUp(data);
        if (result.kind === "signed_in") applySession(result.user);
        return result;
      },
      signInWithGoogle: async () => {
        const user = await authService.signInWithGoogle();
        if (user) applySession(user);
      },
      signOut: async () => {
        await authService.signOut();
        endSession();
      },
      requestPasswordReset: (email) => authService.requestPasswordReset(email),
      completePasswordReset: async (newPassword) => {
        const user = await authService.completePasswordReset(newPassword);
        setIsRecoveringPassword(false);
        applySession(user);
      },
      updateProfile: async (update) => {
        const user = requireUser();
        const updatedProfile = await userService.updateProfile(user.id, update);
        setCurrentUser({ ...updatedProfile, email: user.email });
      },
      refreshCurrentUser: async () => {
        const refreshedUser = await authService.getCurrentUser();
        if (refreshedUser) setCurrentUser(refreshedUser);
      },
      updateEmail: async (newEmail) => {
        const { user, isConfirmationPending } = await authService.updateEmail(newEmail);
        setCurrentUser(user);
        return { isConfirmationPending };
      },
      changePassword: (change) => authService.changePassword(change),
      deleteAccount: async () => {
        await authService.deleteAccount();
        endSession();
      },
    }),
    [status, currentUser, isRecoveringPassword, hasEndedSession, applySession, endSession, requireUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth deve ser usado dentro de AuthProvider.");
  return context;
}

export function useCurrentUser(): AuthUser {
  const { currentUser } = useAuth();
  if (!currentUser) throw new Error("useCurrentUser exige uma rota autenticada.");
  return currentUser;
}
