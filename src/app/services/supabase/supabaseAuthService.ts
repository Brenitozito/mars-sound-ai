import {
  FunctionsHttpError,
  type AuthChangeEvent as SupabaseAuthEvent,
  type EmailOtpType,
  type Session,
  type User,
} from "@supabase/supabase-js";
import { ROUTES } from "../../routes/paths";
import type { AuthUser } from "../../types/domain";
import type { AuthChangeEvent, AuthChangeListener, AuthService } from "../contracts";
import { ServiceError } from "../serviceError";
import { getSupabase, getSupabaseConfig } from "./client";
import { PROFILE_COLUMNS, toUserProfile } from "./supabaseMappers";
import { SESSION_EXPIRED_MESSAGE, toServiceError, unwrap } from "./supabaseErrors";

/** Marca o retorno do link de recuperação, já que a troca do `code` PKCE nem sempre sinaliza o tipo do fluxo. */
const AUTH_FLOW_PARAM = "fluxo";
const RECOVERY_FLOW = "recuperacao";
const AUTH_URL_PARAMS = [AUTH_FLOW_PARAM, "token_hash", "type", "error", "error_code", "error_description"];
const EMAIL_LINK_TYPES: readonly EmailOtpType[] = ["signup", "invite", "magiclink", "recovery", "email_change", "email"];

const INVALID_LINK_MESSAGE = "Link inválido ou expirado. Solicite um novo.";
const RECOVERY_SESSION_MISSING_MESSAGE = "Abra novamente o link de recuperação enviado para o seu e-mail.";

const customEventListeners = new Set<AuthChangeListener>();
let authRedirectHandling: Promise<void> | null = null;

/**
 * Listeners rodam fora do callback do Supabase: chamar a API de Auth dentro de `onAuthStateChange`
 * trava o lock interno da sessão.
 */
function notifyLater(listener: AuthChangeListener, event: AuthChangeEvent) {
  window.setTimeout(() => listener(event), 0);
}

function emitCustomEvent(event: AuthChangeEvent) {
  customEventListeners.forEach((listener) => notifyLater(listener, event));
}

function toContractEvent(event: SupabaseAuthEvent, session: Session | null): AuthChangeEvent | null {
  switch (event) {
    case "SIGNED_IN":
      return session ? { type: "signed_in", userId: session.user.id } : null;
    case "USER_UPDATED":
      return session ? { type: "user_updated", userId: session.user.id } : null;
    case "SIGNED_OUT":
      return { type: "signed_out" };
    case "PASSWORD_RECOVERY":
      return { type: "password_recovery" };
    default:
      return null;
  }
}

function isEmailLinkType(value: string | null): value is EmailOtpType {
  return EMAIL_LINK_TYPES.some((linkType) => linkType === value);
}

function buildRedirectUrl(path: string, searchParams?: Record<string, string>): string {
  const redirectUrl = new URL(path, `${getSupabaseConfig().siteUrl}/`);
  Object.entries(searchParams ?? {}).forEach(([key, value]) => redirectUrl.searchParams.set(key, value));
  return redirectUrl.toString();
}

function removeAuthParamsFromUrl(url: URL) {
  const hashParams = new URLSearchParams(url.hash.slice(1));
  const hadHashError = hashParams.has("error") || hashParams.has("error_description");
  const hadSearchParams = AUTH_URL_PARAMS.some((param) => url.searchParams.has(param));
  if (!hadHashError && !hadSearchParams) return;

  AUTH_URL_PARAMS.forEach((param) => url.searchParams.delete(param));
  if (hadHashError) url.hash = "";
  window.history.replaceState(window.history.state, "", url.toString());
}

/**
 * Processa o retorno de links de e-mail (confirmação, recuperação, troca de e-mail) uma única vez.
 * Aceita tanto o template padrão (`?code=`, trocado pelo `detectSessionInUrl`) quanto o template com
 * `token_hash`, que funciona mesmo quando o link é aberto em outro dispositivo.
 */
async function handleAuthRedirect(): Promise<void> {
  const supabase = getSupabase();
  // Aguarda a inicialização do cliente, que consome o `code` PKCE da URL antes de a limparmos.
  const { data: sessionData } = await supabase.auth.getSession();

  const url = new URL(window.location.href);
  const hashParams = new URLSearchParams(url.hash.slice(1));
  const tokenHash = url.searchParams.get("token_hash");
  const linkType = url.searchParams.get("type");
  const hasLinkError = Boolean(
    url.searchParams.get("error_description") ?? hashParams.get("error_description") ?? hashParams.get("error"),
  );
  const isRecoveryReturn = url.searchParams.get(AUTH_FLOW_PARAM) === RECOVERY_FLOW;
  removeAuthParamsFromUrl(url);

  if (hasLinkError) {
    emitCustomEvent({ type: "auth_link_failed", message: INVALID_LINK_MESSAGE });
    return;
  }

  if (tokenHash && isEmailLinkType(linkType)) {
    const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: linkType });
    if (error) {
      emitCustomEvent({ type: "auth_link_failed", message: toServiceError(error).message });
      return;
    }
    if (linkType === "recovery") emitCustomEvent({ type: "password_recovery" });
    return;
  }

  if (isRecoveryReturn && sessionData.session) emitCustomEvent({ type: "password_recovery" });
}

function ensureAuthRedirectHandled(): Promise<void> {
  authRedirectHandling ??= handleAuthRedirect().catch((error: unknown) => {
    if (import.meta.env.DEV) console.error("[supabase] falha ao processar o link de autenticação", error);
  });
  return authRedirectHandling;
}

async function buildAuthUser(user: User): Promise<AuthUser> {
  const response = await getSupabase().from("profiles").select(PROFILE_COLUMNS).eq("id", user.id).maybeSingle();
  const profileRow = unwrap(response);
  if (!profileRow) throw new ServiceError("unauthenticated", SESSION_EXPIRED_MESSAGE);
  return { ...toUserProfile(profileRow), email: user.email ?? "" };
}

async function requireSessionUser(): Promise<User> {
  const { data, error } = await getSupabase().auth.getUser();
  if (error || !data.user) throw new ServiceError("unauthenticated", SESSION_EXPIRED_MESSAGE);
  return data.user;
}

/**
 * Sem esta checagem, um provedor desativado no painel levaria o usuário a uma página de erro em JSON
 * do Supabase. Se a consulta falhar, o login segue normalmente.
 */
async function isOAuthProviderEnabled(provider: "google"): Promise<boolean> {
  const { url, publishableKey } = getSupabaseConfig();
  try {
    const response = await fetch(`${url}/auth/v1/settings`, { headers: { apikey: publishableKey } });
    if (!response.ok) return true;
    const settings = (await response.json()) as { external?: Partial<Record<string, boolean>> };
    return settings.external?.[provider] !== false;
  } catch {
    return true;
  }
}

async function readFunctionErrorMessage(error: unknown): Promise<string | null> {
  if (!(error instanceof FunctionsHttpError)) return null;
  try {
    const body: unknown = await (error.context as Response).json();
    if (typeof body === "object" && body !== null && "error" in body && typeof body.error === "string") return body.error;
  } catch {
    // Corpo não-JSON: cai na mensagem genérica.
  }
  return null;
}

export const supabaseAuthService: AuthService = {
  async getCurrentUser() {
    await ensureAuthRedirectHandled();
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return null;

    // getUser valida o JWT no servidor: sessões de contas excluídas ou revogadas são descartadas aqui.
    const { data, error } = await supabase.auth.getUser();
    if (error || !data.user) {
      await supabase.auth.signOut({ scope: "local" });
      return null;
    }
    return buildAuthUser(data.user);
  },

  async signIn({ email, password }) {
    const { data, error } = await getSupabase().auth.signInWithPassword({
      email: email.trim().toLowerCase(),
      password,
    });
    if (error) throw toServiceError(error);
    return buildAuthUser(data.user);
  },

  async signUp({ displayName, email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const { data, error } = await getSupabase().auth.signUp({
      email: normalizedEmail,
      password,
      options: {
        data: { display_name: displayName.trim() },
        emailRedirectTo: buildRedirectUrl(ROUTES.home),
      },
    });
    if (error) throw toServiceError(error);
    // Com confirmação de e-mail ativa, o Supabase devolve um usuário sem identidades em vez de erro.
    if (data.user && data.user.identities?.length === 0) {
      throw new ServiceError("conflict", "Já existe uma conta com este e-mail.");
    }
    if (data.session && data.user) return { kind: "signed_in", user: await buildAuthUser(data.user) };
    return { kind: "confirmation_pending", email: normalizedEmail };
  },

  async signInWithGoogle() {
    if (!(await isOAuthProviderEnabled("google"))) {
      throw new ServiceError("unknown", "O login com Google está indisponível no momento. Entre com e-mail e senha.");
    }
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: buildRedirectUrl(ROUTES.home) },
    });
    if (error) throw toServiceError(error, { unknown: "Não foi possível entrar com o Google." });
    return null;
  },

  async signOut() {
    const { error } = await getSupabase().auth.signOut({ scope: "local" });
    if (error) throw toServiceError(error, { unknown: "Não foi possível sair. Tente novamente." });
  },

  async requestPasswordReset(email) {
    const { error } = await getSupabase().auth.resetPasswordForEmail(email.trim().toLowerCase(), {
      redirectTo: buildRedirectUrl(ROUTES.signIn, { [AUTH_FLOW_PARAM]: RECOVERY_FLOW }),
    });
    if (error) throw toServiceError(error, { unknown: "Não foi possível enviar o link. Tente novamente." });
  },

  async completePasswordReset(newPassword) {
    const supabase = getSupabase();
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) throw new ServiceError("unauthenticated", RECOVERY_SESSION_MISSING_MESSAGE);

    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw toServiceError(error, { unknown: "Não foi possível redefinir sua senha." });
    return buildAuthUser(data.user);
  },

  async changePassword({ currentPassword, newPassword }) {
    const supabase = getSupabase();
    const user = await requireSessionUser();
    if (!user.email) throw new ServiceError("unknown", "Sua conta não possui senha cadastrada.");

    const { error: reauthenticationError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });
    if (reauthenticationError) {
      const mappedError = toServiceError(reauthenticationError);
      if (mappedError.code === "invalid_credentials") {
        throw new ServiceError("invalid_credentials", "A senha atual está incorreta.");
      }
      throw mappedError;
    }

    const { error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw toServiceError(error, { unknown: "Não foi possível alterar a senha." });
  },

  async updateEmail(newEmail) {
    const normalizedEmail = newEmail.trim().toLowerCase();
    const { data, error } = await getSupabase().auth.updateUser(
      { email: normalizedEmail },
      { emailRedirectTo: buildRedirectUrl(ROUTES.settings) },
    );
    if (error) throw toServiceError(error, { conflict: "Este e-mail já está em uso por outra conta." });
    return {
      user: await buildAuthUser(data.user),
      isConfirmationPending: data.user.email?.toLowerCase() !== normalizedEmail,
    };
  },

  async deleteAccount() {
    const supabase = getSupabase();
    const { error } = await supabase.functions.invoke("delete-account", { method: "POST" });
    if (error) {
      const message = await readFunctionErrorMessage(error);
      throw new ServiceError("unknown", message ?? "Não foi possível excluir sua conta. Tente novamente.");
    }
    // O usuário já não existe no servidor; resta descartar a sessão guardada neste navegador.
    await supabase.auth.signOut({ scope: "local" });
  },

  subscribeToAuthChanges(listener) {
    customEventListeners.add(listener);
    const { data } = getSupabase().auth.onAuthStateChange((event, session) => {
      const contractEvent = toContractEvent(event, session);
      if (contractEvent) notifyLater(listener, contractEvent);
    });
    return () => {
      customEventListeners.delete(listener);
      data.subscription.unsubscribe();
    };
  },
};
