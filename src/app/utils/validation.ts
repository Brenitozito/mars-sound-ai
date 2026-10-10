export const PASSWORD_MIN_LENGTH = 8;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const HANDLE_PATTERN = /^[a-z0-9_.]{3,30}$/;

export function validateEmail(email: string): string | null {
  if (!email.trim()) return "Informe seu e-mail.";
  if (!EMAIL_PATTERN.test(email.trim())) return "Informe um e-mail válido.";
  return null;
}

export function validateRequiredPassword(password: string): string | null {
  return password ? null : "Informe sua senha.";
}

export function validateNewPassword(password: string): string | null {
  if (!password) return "Crie uma senha.";
  if (password.length < PASSWORD_MIN_LENGTH) return `A senha deve ter pelo menos ${PASSWORD_MIN_LENGTH} caracteres.`;
  if (!/[a-zA-Z]/.test(password) || !/\d/.test(password)) return "Use letras e números na senha.";
  return null;
}

export function validatePasswordConfirmation(password: string, confirmation: string): string | null {
  if (!confirmation) return "Confirme a senha.";
  return password === confirmation ? null : "As senhas não coincidem.";
}

export function validateDisplayName(displayName: string): string | null {
  const trimmedName = displayName.trim();
  if (!trimmedName) return "Informe seu nome.";
  if (trimmedName.length < 2) return "O nome deve ter pelo menos 2 caracteres.";
  if (trimmedName.length > 50) return "O nome deve ter no máximo 50 caracteres.";
  return null;
}

export function normalizeHandle(handle: string): string {
  return handle.trim().replace(/^@/, "").toLowerCase();
}

export function validateHandle(handle: string): string | null {
  const normalizedHandle = normalizeHandle(handle);
  if (!normalizedHandle) return "Informe um @username.";
  if (!HANDLE_PATTERN.test(normalizedHandle)) {
    return "Use de 3 a 30 caracteres: letras minúsculas, números, ponto ou _.";
  }
  return null;
}

export type FieldErrors<TField extends string> = Partial<Record<TField, string>>;

export function collectErrors<TField extends string>(
  validations: Record<TField, string | null>,
): FieldErrors<TField> {
  const errors: FieldErrors<TField> = {};
  for (const field of Object.keys(validations) as TField[]) {
    const message = validations[field];
    if (message) errors[field] = message;
  }
  return errors;
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}
