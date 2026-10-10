export type ServiceErrorCode =
  | "invalid_credentials"
  | "unauthenticated"
  | "not_found"
  | "conflict"
  | "validation"
  | "unknown";

export class ServiceError extends Error {
  readonly code: ServiceErrorCode;

  constructor(code: ServiceErrorCode, message: string) {
    super(message);
    this.name = "ServiceError";
    this.code = code;
  }
}

export const GENERIC_ERROR_MESSAGE = "Algo deu errado. Tente novamente em instantes.";

/**
 * Mensagens específicas do serviço (sessão expirada, sem conexão, conflito...) têm prioridade.
 * Quando o serviço só sabe dizer "algo deu errado", o `fallbackMessage` da tela explica o que falhou.
 */
export function getErrorMessage(error: unknown, fallbackMessage = GENERIC_ERROR_MESSAGE): string {
  if (error instanceof ServiceError && error.message !== GENERIC_ERROR_MESSAGE) return error.message;
  return fallbackMessage;
}
