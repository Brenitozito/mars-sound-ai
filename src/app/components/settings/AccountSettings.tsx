import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth, useCurrentUser } from "../../context/AuthContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import {
  collectErrors,
  hasErrors,
  PASSWORD_MIN_LENGTH,
  validateEmail,
  validateNewPassword,
  validatePasswordConfirmation,
  validateRequiredPassword,
  type FieldErrors,
} from "../../utils/validation";
import { ConfirmDialog } from "../feedback/ConfirmDialog";
import { FormErrorMessage, FormField, PasswordInput, TextInput } from "../forms/FormControls";
import { Button } from "../ui/button";
import { SettingsPanel, SettingsRow } from "./SettingsPanel";

function EmailForm() {
  const currentUser = useCurrentUser();
  const { updateEmail } = useAuth();
  const [email, setEmail] = useState(currentUser.email);
  const [emailError, setEmailError] = useState<string | null>(null);
  const submission = useAsyncAction();
  const isDirty = email.trim().toLowerCase() !== currentUser.email;

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const validationError = validateEmail(email);
    setEmailError(validationError);
    if (validationError) return;
    const requestedEmail = email.trim();
    await submission.run(async () => {
      const { isConfirmationPending } = await updateEmail(requestedEmail);
      if (!isConfirmationPending) {
        toast.success("E-mail atualizado.");
        return;
      }
      setEmail(currentUser.email);
      toast.success("Confirme o novo e-mail", {
        description: `Enviamos um link para ${requestedEmail}. A troca vale depois da confirmação.`,
      });
    }, "Não foi possível atualizar o e-mail.");
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
        <FormField id="account-email" label="E-mail" error={emailError} className="flex-1">
          <TextInput
            id="account-email"
            type="email"
            autoComplete="email"
            value={email}
            hasError={Boolean(emailError)}
            onChange={(event) => {
              setEmail(event.target.value);
              setEmailError(null);
            }}
          />
        </FormField>
        <Button type="submit" variant="primary" size="touch" disabled={!isDirty || submission.isPending} className="sm:mb-0">
          {submission.isPending ? "Salvando..." : "Atualizar e-mail"}
        </Button>
      </div>
      <FormErrorMessage message={submission.errorMessage} />
    </form>
  );
}

type PasswordField = "currentPassword" | "newPassword" | "confirmPassword";
const EMPTY_PASSWORDS: Record<PasswordField, string> = { currentPassword: "", newPassword: "", confirmPassword: "" };

function PasswordForm() {
  const { changePassword } = useAuth();
  const [passwords, setPasswords] = useState(EMPTY_PASSWORDS);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<PasswordField>>({});
  const submission = useAsyncAction();

  const updatePassword = (field: PasswordField, value: string) => {
    setPasswords((previous) => ({ ...previous, [field]: value }));
    setFieldErrors((previous) => ({ ...previous, [field]: undefined }));
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = collectErrors({
      currentPassword: validateRequiredPassword(passwords.currentPassword),
      newPassword:
        validateNewPassword(passwords.newPassword) ??
        (passwords.newPassword === passwords.currentPassword ? "A nova senha deve ser diferente da atual." : null),
      confirmPassword: validatePasswordConfirmation(passwords.newPassword, passwords.confirmPassword),
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const isSuccessful = await submission.run(
      () => changePassword({ currentPassword: passwords.currentPassword, newPassword: passwords.newPassword }),
      "Não foi possível alterar a senha.",
    );
    if (isSuccessful) {
      setPasswords(EMPTY_PASSWORDS);
      toast.success("Senha alterada com sucesso.");
    }
  };

  const fields: Array<{ field: PasswordField; label: string; autoComplete: string; hint?: string }> = [
    { field: "currentPassword", label: "Senha atual", autoComplete: "current-password" },
    { field: "newPassword", label: "Nova senha", autoComplete: "new-password", hint: `Mínimo de ${PASSWORD_MIN_LENGTH} caracteres, com letras e números.` },
    { field: "confirmPassword", label: "Confirmar nova senha", autoComplete: "new-password" },
  ];

  return (
    <form className="flex flex-col gap-4 border-t border-[#30292b] pt-6" onSubmit={handleSubmit} noValidate>
      <p className="text-[16px] font-semibold text-[#ebe9e9]">Alterar senha</p>
      <div className="grid gap-4 sm:grid-cols-3">
        {fields.map(({ field, label, autoComplete, hint }) => (
          <FormField key={field} id={`account-${field}`} label={label} error={fieldErrors[field]} hint={hint}>
            <PasswordInput
              id={`account-${field}`}
              autoComplete={autoComplete}
              value={passwords[field]}
              hasError={Boolean(fieldErrors[field])}
              onChange={(event) => updatePassword(field, event.target.value)}
            />
          </FormField>
        ))}
      </div>
      <FormErrorMessage message={submission.errorMessage} />
      <div className="flex justify-end">
        <Button type="submit" variant="primary" size="touch" disabled={submission.isPending}>
          {submission.isPending ? "Salvando..." : "Alterar senha"}
        </Button>
      </div>
    </form>
  );
}

function SessionAndDeletion() {
  const { signOut, deleteAccount } = useAuth();
  const [isSignOutDialogOpen, setIsSignOutDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  return (
    <SettingsPanel title="Sair da conta ou excluir">
      <div className="border-b border-[#30292b] pb-4">
        <SettingsRow
          title="Sair da conta"
          description="Encerrar sua sessão neste dispositivo"
          action={
            <Button variant="primary" size="touch" onClick={() => setIsSignOutDialogOpen(true)}>
              Sair da conta
            </Button>
          }
        />
      </div>
      <ConfirmDialog
        variant="primary"
        open={isSignOutDialogOpen}
        onOpenChange={setIsSignOutDialogOpen}
        title="Sair da conta?"
        description="Você precisará entrar novamente para acessar sua biblioteca neste dispositivo."
        confirmLabel="Sair"
        pendingLabel="Saindo..."
        errorFallbackMessage="Não foi possível sair da conta."
        onConfirm={signOut}
      />
      <SettingsRow
        title="Encerrar conta"
        description="Excluir permanentemente sua conta e todos os seus dados"
        action={
          <Button variant="brandOutline" size="touch" onClick={() => setIsDeleteDialogOpen(true)}>
            Excluir conta
          </Button>
        }
      />
      <ConfirmDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        title="Excluir conta permanentemente?"
        description="Esta ação é irreversível. Seu perfil, suas músicas e suas playlists serão excluídos permanentemente."
        confirmLabel="Confirmar exclusão"
        pendingLabel="Excluindo..."
        errorFallbackMessage="Não foi possível excluir a conta."
        onConfirm={async () => {
          await deleteAccount();
          toast.success("Sua conta foi excluída.");
        }}
      />
    </SettingsPanel>
  );
}

export function AccountSettings() {
  return (
    <div className="flex flex-col gap-4">
      <SettingsPanel title="Informações da conta">
        <EmailForm />
        <PasswordForm />
      </SettingsPanel>
      <SessionAndDeletion />
    </div>
  );
}
