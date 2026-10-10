import { isAuthError, isAuthWeakPasswordError } from "@supabase/supabase-js";
import { GENERIC_ERROR_MESSAGE, ServiceError, type ServiceErrorCode } from "../serviceError";

export const SESSION_EXPIRED_MESSAGE = "Sua sessão expirou. Entre novamente.";
const NETWORK_ERROR_MESSAGE = "Não foi possível conectar ao servidor. Verifique sua internet e tente novamente.";

export type ErrorMessageOverrides = Partial<Record<ServiceErrorCode, string>>;

const DEFAULT_MESSAGES: Record<ServiceErrorCode, string> = {
  invalid_credentials: "E-mail ou senha incorretos.",
  unauthenticated: SESSION_EXPIRED_MESSAGE,
  not_found: "Conteúdo não encontrado.",
  conflict: "Este registro já existe.",
  validation: "Verifique os dados informados e tente novamente.",
  unknown: GENERIC_ERROR_MESSAGE,
};

const AUTH_ERRORS: Record<string, { code: ServiceErrorCode; message: string }> = {
  invalid_credentials: { code: "invalid_credentials", message: DEFAULT_MESSAGES.invalid_credentials },
  email_not_confirmed: {
    code: "invalid_credentials",
    message: "Confirme seu e-mail antes de entrar. Verifique sua caixa de entrada.",
  },
  user_already_exists: { code: "conflict", message: "Já existe uma conta com este e-mail." },
  email_exists: { code: "conflict", message: "Este e-mail já está em uso por outra conta." },
  email_address_invalid: {
    code: "validation",
    message: "Este endereço de e-mail não é aceito. Verifique o domínio ou use outro e-mail.",
  },
  email_address_not_authorized: {
    code: "unknown",
    message: "Não foi possível enviar e-mails para este endereço no momento. Tente mais tarde ou use outro e-mail.",
  },
  same_password: { code: "validation", message: "A nova senha precisa ser diferente da atual." },
  otp_expired: { code: "invalid_credentials", message: "Link inválido ou expirado. Solicite um novo." },
  over_email_send_rate_limit: {
    code: "validation",
    message: "O limite de envio de e-mails foi atingido. Tente novamente mais tarde.",
  },
  over_request_rate_limit: {
    code: "validation",
    message: "Muitas tentativas em pouco tempo. Aguarde alguns minutos e tente novamente.",
  },
  session_not_found: { code: "unauthenticated", message: SESSION_EXPIRED_MESSAGE },
  session_expired: { code: "unauthenticated", message: SESSION_EXPIRED_MESSAGE },
  refresh_token_not_found: { code: "unauthenticated", message: SESSION_EXPIRED_MESSAGE },
  user_not_found: { code: "unauthenticated", message: SESSION_EXPIRED_MESSAGE },
  provider_disabled: { code: "unknown", message: "Este método de login está desativado no momento." },
  signup_disabled: { code: "unknown", message: "Novos cadastros estão temporariamente desativados." },
};

const DATABASE_ERROR_CODES: Record<string, ServiceErrorCode> = {
  "23505": "conflict",
  PT409: "conflict",
  PT404: "not_found",
  PGRST116: "not_found",
  "42501": "not_found",
  "23514": "validation",
  "23503": "validation",
  "23502": "validation",
  "22001": "validation",
  "22P02": "validation",
  PGRST301: "unauthenticated",
  PGRST303: "unauthenticated",
};

/** Mensagens geradas pelo Postgres (constraints, permissões) são técnicas e em inglês; as nossas não. */
const TECHNICAL_MESSAGE_PATTERN = /violates|constraint|permission denied|row-level security|invalid input|value too long|null value/i;

interface CodedError {
  code?: unknown;
  message?: unknown;
  statusCode?: unknown;
  status?: unknown;
}

function asCodedError(error: unknown): CodedError | null {
  return typeof error === "object" && error !== null ? (error as CodedError) : null;
}

function readMessage(error: CodedError): string {
  return typeof error.message === "string" ? error.message : "";
}

function isNetworkFailure(message: string): boolean {
  return /failed to fetch|networkerror|load failed|network request failed/i.test(message);
}

function mapAuthError(error: Error & { code?: string }, overrides: ErrorMessageOverrides): ServiceError {
  if (isAuthWeakPasswordError(error)) {
    const isLeaked = error.reasons.includes("pwned");
    return new ServiceError(
      "validation",
      isLeaked
        ? "Esta senha apareceu em vazamentos de dados. Escolha outra."
        : "Senha fraca: use no mínimo 8 caracteres, com letras e números.",
    );
  }
  const knownError = error.code ? AUTH_ERRORS[error.code] : undefined;
  if (knownError) return new ServiceError(knownError.code, overrides[knownError.code] ?? knownError.message);
  if (isNetworkFailure(error.message)) return new ServiceError("unknown", NETWORK_ERROR_MESSAGE);
  return new ServiceError("unknown", overrides.unknown ?? DEFAULT_MESSAGES.unknown);
}

function mapStorageError(error: CodedError, overrides: ErrorMessageOverrides): ServiceError | null {
  const statusCode = String(error.statusCode ?? error.status ?? "");
  const message = readMessage(error);
  if (statusCode === "413" || /exceeded the maximum allowed size/i.test(message)) {
    return new ServiceError("validation", overrides.validation ?? "O arquivo excede o tamanho permitido.");
  }
  if (statusCode === "415" || /mime type/i.test(message)) {
    return new ServiceError("validation", overrides.validation ?? "Formato de arquivo não suportado.");
  }
  return null;
}

/** Converte qualquer erro do Supabase (Auth, PostgREST, Storage, rede) em `ServiceError` com mensagem em pt-BR. */
export function toServiceError(error: unknown, overrides: ErrorMessageOverrides = {}): ServiceError {
  if (error instanceof ServiceError) return error;
  if (isAuthError(error)) return mapAuthError(error, overrides);

  const codedError = asCodedError(error);
  if (!codedError) return new ServiceError("unknown", overrides.unknown ?? DEFAULT_MESSAGES.unknown);

  const message = readMessage(codedError);
  if (isNetworkFailure(message)) return new ServiceError("unknown", NETWORK_ERROR_MESSAGE);

  const storageError = mapStorageError(codedError, overrides);
  if (storageError) return storageError;

  const serviceCode = typeof codedError.code === "string" ? DATABASE_ERROR_CODES[codedError.code] : undefined;
  if (!serviceCode) {
    if (import.meta.env.DEV) console.error("[supabase] erro não mapeado", error);
    return new ServiceError("unknown", overrides.unknown ?? DEFAULT_MESSAGES.unknown);
  }

  const isDatabaseMessageReadable = message !== "" && !TECHNICAL_MESSAGE_PATTERN.test(message) && !/^PGRST/.test(String(codedError.code));
  const fallbackMessage = overrides[serviceCode] ?? DEFAULT_MESSAGES[serviceCode];
  return new ServiceError(serviceCode, isDatabaseMessageReadable ? message : fallbackMessage);
}

interface SupabaseResponse {
  data: unknown;
  error: unknown;
}

/** Respostas do Supabase são uniões `{ data, error: null } | { data: null, error }`; extrai o ramo de sucesso. */
type SuccessData<TResponse> = TResponse extends { error: null; data: infer TData } ? TData : never;

/** Lança o erro mapeado ou devolve os dados de uma resposta `{ data, error }` do Supabase. */
export function unwrap<TResponse extends SupabaseResponse>(
  response: TResponse,
  overrides?: ErrorMessageOverrides,
): SuccessData<TResponse> {
  if (response.error) throw toServiceError(response.error, overrides);
  return response.data as SuccessData<TResponse>;
}
