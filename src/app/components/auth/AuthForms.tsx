import { MailCheck } from "lucide-react";
import { useState, type FormEvent, type ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "../../context/AuthContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { getErrorMessage } from "../../services";
import {
  collectErrors,
  hasErrors,
  PASSWORD_MIN_LENGTH,
  validateDisplayName,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequiredPassword,
  type FieldErrors,
} from "../../utils/validation";
import { FormErrorMessage, FormField, PasswordInput, TextInput } from "../forms/FormControls";
import { Button } from "../ui/button";
import { FooterPrompt, GoogleSignInButton, InlineLinkButton, OrDivider, SubmitButton } from "./AuthPrimitives";

const FORM_CLASS = "flex w-full flex-col gap-6";
const NEW_PASSWORD_HINT = `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.`;

/** `onFieldEdited` permite descartar o erro geral do envio assim que o usuário corrige um campo. */
function useFieldErrors<TField extends string>(onFieldEdited?: () => void) {
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<TField>>({});
  const clearFieldError = (field: TField) => {
    onFieldEdited?.();
    setFieldErrors((previous) => (previous[field] ? { ...previous, [field]: undefined } : previous));
  };
  return { fieldErrors, setFieldErrors, clearFieldError };
}

function useGoogleSignIn() {
  const { signInWithGoogle } = useAuth();
  const [isPending, setIsPending] = useState(false);

  const handleGoogleSignIn = async () => {
    setIsPending(true);
    try {
      await signInWithGoogle();
    } catch (error) {
      toast.error(getErrorMessage(error, "Não foi possível entrar com o Google."));
    } finally {
      setIsPending(false);
    }
  };

  return { isPending, handleGoogleSignIn };
}

interface LoginFormProps {
  initialEmail: string;
  onGoRegister: () => void;
  onGoForgot: (email: string) => void;
}

export function LoginForm({ initialEmail, onGoRegister, onGoForgot }: LoginFormProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const submission = useAsyncAction();
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors<"email" | "password">(submission.clearError);
  const google = useGoogleSignIn();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = collectErrors({ email: validateEmail(email), password: validateRequiredPassword(password) });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    await submission.run(() => signIn({ email, password }), "Não foi possível entrar. Tente novamente.");
  };

  return (
    <form className={FORM_CLASS} onSubmit={handleSubmit} noValidate>
      <FormField id="login-email" label="Endereço de e-mail" error={fieldErrors.email}>
        <TextInput
          id="login-email"
          type="email"
          autoComplete="email"
          placeholder="email@seuemail.com"
          value={email}
          hasError={Boolean(fieldErrors.email)}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
        />
      </FormField>
      <FormField
        id="login-password"
        label="Senha"
        error={fieldErrors.password}
        labelAction={<InlineLinkButton onClick={() => onGoForgot(email)}>Esqueceu a senha?</InlineLinkButton>}
      >
        <PasswordInput
          id="login-password"
          autoComplete="current-password"
          placeholder="Digite sua senha"
          value={password}
          hasError={Boolean(fieldErrors.password)}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
        />
      </FormField>
      <FormErrorMessage message={submission.errorMessage} />
      <SubmitButton isPending={submission.isPending} pendingLabel="Entrando...">
        Entrar
      </SubmitButton>
      <OrDivider />
      <GoogleSignInButton label="Google" isPending={google.isPending} onClick={google.handleGoogleSignIn} />
      <FooterPrompt text="Não tem uma conta?" linkText="Cadastre-se" onClick={onGoRegister} />
    </form>
  );
}

interface RegisterFormProps {
  onGoLogin: () => void;
  onConfirmationPending: (email: string) => void;
}

export function RegisterForm({ onGoLogin, onConfirmationPending }: RegisterFormProps) {
  const { signUp } = useAuth();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const submission = useAsyncAction();
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors<"displayName" | "email" | "password">(
    submission.clearError,
  );
  const google = useGoogleSignIn();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = collectErrors({
      displayName: validateDisplayName(displayName),
      email: validateEmail(email),
      password: validateNewPassword(password),
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    await submission.run(async () => {
      const result = await signUp({ displayName, email, password });
      if (result.kind === "confirmation_pending") onConfirmationPending(result.email);
      else toast.success("Conta criada! Boas-vindas ao Mars Sound AI.");
    }, "Não foi possível criar sua conta. Tente novamente.");
  };

  return (
    <form className={FORM_CLASS} onSubmit={handleSubmit} noValidate>
      <FormField id="register-name" label="Nome" error={fieldErrors.displayName}>
        <TextInput
          id="register-name"
          autoComplete="name"
          placeholder="Como deseja ser chamado?"
          value={displayName}
          maxLength={50}
          hasError={Boolean(fieldErrors.displayName)}
          onChange={(event) => {
            setDisplayName(event.target.value);
            clearFieldError("displayName");
          }}
        />
      </FormField>
      <FormField id="register-email" label="E-mail" error={fieldErrors.email}>
        <TextInput
          id="register-email"
          type="email"
          autoComplete="email"
          placeholder="Seu melhor e-mail"
          value={email}
          hasError={Boolean(fieldErrors.email)}
          onChange={(event) => {
            setEmail(event.target.value);
            clearFieldError("email");
          }}
        />
      </FormField>
      <FormField id="register-password" label="Senha" error={fieldErrors.password} hint={NEW_PASSWORD_HINT}>
        <PasswordInput
          id="register-password"
          autoComplete="new-password"
          placeholder="Crie uma senha forte"
          value={password}
          hasError={Boolean(fieldErrors.password)}
          onChange={(event) => {
            setPassword(event.target.value);
            clearFieldError("password");
          }}
        />
      </FormField>
      <FormErrorMessage message={submission.errorMessage} />
      <SubmitButton isPending={submission.isPending} pendingLabel="Criando conta...">
        Cadastrar
      </SubmitButton>
      <OrDivider />
      <GoogleSignInButton label="Cadastrar com Google" isPending={google.isPending} onClick={google.handleGoogleSignIn} />
      <FooterPrompt text="Já tem uma conta?" linkText="Fazer login" onClick={onGoLogin} />
    </form>
  );
}

interface ForgotRequestFormProps {
  initialEmail: string;
  onBack: () => void;
  onSent: (email: string) => void;
}

export function ForgotRequestForm({ initialEmail, onBack, onSent }: ForgotRequestFormProps) {
  const { requestPasswordReset } = useAuth();
  const [email, setEmail] = useState(initialEmail);
  const [emailError, setEmailError] = useState<string | null>(null);
  const submission = useAsyncAction();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmail(email);
    setEmailError(validationError);
    if (validationError) return;
    const isSuccessful = await submission.run(
      () => requestPasswordReset(email),
      "Não foi possível enviar o link. Tente novamente.",
    );
    if (isSuccessful) onSent(email.trim());
  };

  return (
    <form className={FORM_CLASS} onSubmit={handleSubmit} noValidate>
      <p className="text-center text-[14px] leading-[1.6] text-[#bababa]">
        Digite o e-mail da sua conta e enviaremos um link para redefinir sua senha.
      </p>
      <FormField id="forgot-email" label="Endereço de e-mail" error={emailError}>
        <TextInput
          id="forgot-email"
          type="email"
          autoComplete="email"
          placeholder="email@seuemail.com"
          value={email}
          hasError={Boolean(emailError)}
          onChange={(event) => {
            setEmail(event.target.value);
            setEmailError(null);
            submission.clearError();
          }}
        />
      </FormField>
      <FormErrorMessage message={submission.errorMessage} />
      <SubmitButton isPending={submission.isPending} pendingLabel="Enviando...">
        Enviar link de recuperação
      </SubmitButton>
      <FooterPrompt text="Lembrou a senha?" linkText="Voltar ao login" onClick={onBack} />
    </form>
  );
}

interface EmailSentPanelProps {
  title: string;
  description: ReactNode;
  onGoLogin: () => void;
}

function EmailSentPanel({ title, description, onGoLogin }: EmailSentPanelProps) {
  return (
    <div className="flex w-full flex-col items-center gap-6">
      <span className="flex size-[72px] items-center justify-center rounded-full border-2 border-[#ff164c] bg-[#ff164c]/[0.12]">
        <MailCheck className="size-8 text-[#ff164c]" aria-hidden="true" />
      </span>
      <div className="flex flex-col gap-3 text-center">
        <p className="text-[18px] font-semibold leading-[1.4] text-[#f8f8f8]">{title}</p>
        <p className="text-[14px] leading-[1.6] text-[#bababa]">{description}</p>
      </div>
      <Button variant="primary" className="h-14 w-full text-[16px]" onClick={onGoLogin}>
        Voltar ao login
      </Button>
    </div>
  );
}

export function SignUpConfirmationView({ email, onGoLogin }: { email: string; onGoLogin: () => void }) {
  return (
    <EmailSentPanel
      title="Confirme seu e-mail"
      description={
        <>
          Enviamos um link de confirmação para <strong className="text-[#f8f8f8]">{email}</strong>. Abra o e-mail para
          ativar sua conta e entrar.
        </>
      }
      onGoLogin={onGoLogin}
    />
  );
}

export function ForgotSuccessView({ email, onGoLogin }: { email: string; onGoLogin: () => void }) {
  return (
    <EmailSentPanel
      title="Link de recuperação enviado!"
      description={
        <>
          Se existir uma conta para <strong className="text-[#f8f8f8]">{email}</strong>, você receberá um e-mail com o
          link para redefinir sua senha.
        </>
      }
      onGoLogin={onGoLogin}
    />
  );
}

export function ForgotResetForm({ onBack }: { onBack: () => void }) {
  const { completePasswordReset } = useAuth();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const submission = useAsyncAction();
  const { fieldErrors, setFieldErrors, clearFieldError } = useFieldErrors<"newPassword" | "confirmPassword">(
    submission.clearError,
  );

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = collectErrors({
      newPassword: validateNewPassword(newPassword),
      confirmPassword: validatePasswordConfirmation(newPassword, confirmPassword),
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;
    const isSuccessful = await submission.run(
      () => completePasswordReset(newPassword),
      "Não foi possível redefinir sua senha.",
    );
    if (isSuccessful) toast.success("Senha redefinida com sucesso.");
  };

  return (
    <form className={FORM_CLASS} onSubmit={handleSubmit} noValidate>
      <p className="text-center text-[14px] leading-[1.6] text-[#bababa]">Crie uma nova senha para acessar sua conta.</p>
      <FormField id="reset-password" label="Nova senha" error={fieldErrors.newPassword} hint={NEW_PASSWORD_HINT}>
        <PasswordInput
          id="reset-password"
          autoComplete="new-password"
          placeholder="Digite sua nova senha"
          value={newPassword}
          hasError={Boolean(fieldErrors.newPassword)}
          onChange={(event) => {
            setNewPassword(event.target.value);
            clearFieldError("newPassword");
          }}
        />
      </FormField>
      <FormField id="reset-password-confirmation" label="Confirmar nova senha" error={fieldErrors.confirmPassword}>
        <PasswordInput
          id="reset-password-confirmation"
          autoComplete="new-password"
          placeholder="Confirme sua nova senha"
          value={confirmPassword}
          hasError={Boolean(fieldErrors.confirmPassword)}
          onChange={(event) => {
            setConfirmPassword(event.target.value);
            clearFieldError("confirmPassword");
          }}
        />
      </FormField>
      <FormErrorMessage message={submission.errorMessage} />
      <SubmitButton isPending={submission.isPending} pendingLabel="Salvando...">
        Salvar e entrar
      </SubmitButton>
      <FooterPrompt text="Lembrou a senha?" linkText="Voltar ao login" onClick={onBack} />
    </form>
  );
}
