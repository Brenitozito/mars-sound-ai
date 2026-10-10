import { ImagePlus } from "lucide-react";
import { useRef, useState, type FormEvent } from "react";
import { toast } from "sonner";
import { useAuth, useCurrentUser } from "../../context/AuthContext";
import { useAsyncAction } from "../../hooks/useAsyncAction";
import { useEditableImage } from "../../hooks/useEditableImage";
import { IMAGE_ACCEPT_ATTRIBUTE, IMAGE_MAX_DIMENSIONS } from "../../utils/imageUpload";
import {
  collectErrors,
  hasErrors,
  normalizeHandle,
  validateDisplayName,
  validateHandle,
  type FieldErrors,
} from "../../utils/validation";
import { FormErrorMessage, FormField, TextAreaInput, TextInput } from "../forms/FormControls";
import { UserAvatar } from "../profile/UserAvatar";
import { Button } from "../ui/button";
import { Switch } from "../ui/switch";
import { SettingsPanel } from "./SettingsPanel";

const BIO_MAX_LENGTH = 160;

interface ProfileFormValues {
  displayName: string;
  handle: string;
  bio: string;
  isPublic: boolean;
}

export function ProfileSettingsForm() {
  const currentUser = useCurrentUser();
  const { updateProfile } = useAuth();
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const savedValues: ProfileFormValues = {
    displayName: currentUser.displayName,
    handle: currentUser.handle,
    bio: currentUser.bio,
    isPublic: currentUser.isPublic,
  };
  const [values, setValues] = useState<ProfileFormValues>(savedValues);
  const avatar = useEditableImage(currentUser.avatarUrl, IMAGE_MAX_DIMENSIONS.avatar);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors<"displayName" | "handle">>({});
  const submission = useAsyncAction();

  const isDirty =
    avatar.isDirty ||
    (Object.keys(savedValues) as Array<keyof ProfileFormValues>).some((field) => values[field] !== savedValues[field]);

  const updateValues = (patch: Partial<ProfileFormValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (avatar.isProcessing) return;
    const errors = collectErrors({
      displayName: validateDisplayName(values.displayName),
      handle: validateHandle(values.handle),
    });
    setFieldErrors(errors);
    if (hasErrors(errors)) return;

    const isSuccessful = await submission.run(
      () =>
        updateProfile({
          displayName: values.displayName.trim(),
          handle: normalizeHandle(values.handle),
          bio: values.bio.trim(),
          avatar: avatar.change,
          isPublic: values.isPublic,
        }),
      "Não foi possível salvar o perfil.",
    );
    if (isSuccessful) {
      avatar.reset();
      setValues((previous) => ({ ...previous, displayName: previous.displayName.trim(), handle: normalizeHandle(previous.handle), bio: previous.bio.trim() }));
      toast.success("Perfil atualizado.");
    }
  };

  return (
    <SettingsPanel title="Informações do perfil">
      <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
        <div className="flex flex-col items-start gap-6 sm:flex-row">
          <div className="flex flex-col gap-2">
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              aria-label="Alterar foto do perfil"
              className="group relative size-[120px] shrink-0 overflow-hidden border border-[#30292b] transition-colors hover:border-[#ff164c] focus-visible:border-[#ff164c] focus-visible:outline-none"
            >
              <UserAvatar profile={{ displayName: values.displayName || "?", avatarUrl: avatar.previewUrl }} shape="square" className="size-full text-3xl" />
              <span className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-black/60 text-[13px] font-semibold text-[#f8f8f8] opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100">
                <ImagePlus className="size-5" aria-hidden="true" />
                Alterar foto
              </span>
            </button>
            {avatar.previewUrl && (
              <button
                type="button"
                className="min-h-8 text-left text-[12px] text-[#a19a9b] underline hover:text-[#f8f8f8]"
                onClick={avatar.remove}
              >
                Remover foto
              </button>
            )}
            {avatar.errorMessage && <p className="max-w-[120px] text-[12px] text-[#ff164c]">{avatar.errorMessage}</p>}
            <input ref={avatarInputRef} type="file" accept={IMAGE_ACCEPT_ATTRIBUTE} className="hidden" onChange={avatar.handleFileInputChange} />
          </div>

          <div className="flex w-full min-w-0 flex-1 flex-col gap-4">
            <div className="flex flex-col gap-4 sm:flex-row">
              <FormField id="settings-display-name" label="Nome" error={fieldErrors.displayName}>
                <TextInput
                  id="settings-display-name"
                  value={values.displayName}
                  maxLength={50}
                  autoComplete="name"
                  hasError={Boolean(fieldErrors.displayName)}
                  onChange={(event) => {
                    updateValues({ displayName: event.target.value });
                    setFieldErrors((previous) => ({ ...previous, displayName: undefined }));
                  }}
                />
              </FormField>
              <FormField id="settings-handle" label="@username" error={fieldErrors.handle}>
                <TextInput
                  id="settings-handle"
                  value={values.handle}
                  maxLength={31}
                  autoCapitalize="none"
                  spellCheck={false}
                  hasError={Boolean(fieldErrors.handle)}
                  onChange={(event) => {
                    updateValues({ handle: event.target.value });
                    setFieldErrors((previous) => ({ ...previous, handle: undefined }));
                  }}
                />
              </FormField>
            </div>
            <FormField id="settings-bio" label="Bio" hint={`${values.bio.length}/${BIO_MAX_LENGTH}`}>
              <TextAreaInput
                id="settings-bio"
                rows={3}
                maxLength={BIO_MAX_LENGTH}
                placeholder="Uma frase para representar seu perfil."
                value={values.bio}
                onChange={(event) => updateValues({ bio: event.target.value })}
              />
            </FormField>
          </div>
        </div>

        <FormErrorMessage message={submission.errorMessage} />

        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <label className="flex cursor-pointer flex-col gap-2">
            <span className="flex items-center gap-3">
              <span className="text-[14px] font-semibold text-[#f8f8f8]">Perfil público</span>
              <Switch checked={values.isPublic} onCheckedChange={(isPublic) => updateValues({ isPublic })} />
            </span>
            <span className="text-[12px] text-[#bababa]">Outros usuários poderão ver seu perfil e encontrá-lo nas buscas</span>
          </label>
          <Button type="submit" variant="primary" size="touch" disabled={!isDirty || submission.isPending || avatar.isProcessing}>
            {submission.isPending ? "Salvando..." : avatar.isProcessing ? "Processando imagem..." : "Salvar alterações"}
          </Button>
        </div>
      </form>
    </SettingsPanel>
  );
}
