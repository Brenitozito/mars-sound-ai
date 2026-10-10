import { ImagePlus } from "lucide-react";
import { useId, useRef, useState, type FormEvent } from "react";
import { useEditableImage } from "../../hooks/useEditableImage";
import { getErrorMessage } from "../../services/serviceError";
import type { PlaylistInput } from "../../types/domain";
import { IMAGE_ACCEPT_ATTRIBUTE, IMAGE_MAX_DIMENSIONS } from "../../utils/imageUpload";
import { FormField, TextAreaInput, TextInput } from "../forms/FormControls";
import { Button } from "../ui/button";
import { CoverImage } from "../ui/CoverImage";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "../ui/dialog";
import { DIALOG_SURFACE_CLASS } from "../ui/surfaceStyles";
import { Switch } from "../ui/switch";

const TITLE_MAX_LENGTH = 60;
const DESCRIPTION_MAX_LENGTH = 300;

export interface PlaylistFormValues {
  title: string;
  description: string;
  isPublic: boolean;
  coverUrl: string | null;
}

interface PlaylistFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "create" | "edit";
  initialValues?: PlaylistFormValues;
  onSubmit: (input: PlaylistInput) => Promise<void>;
}

const EMPTY_PLAYLIST: PlaylistFormValues = { title: "", description: "", isPublic: true, coverUrl: null };

export function PlaylistFormDialog({ open, onOpenChange, mode, initialValues, onSubmit }: PlaylistFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={DIALOG_SURFACE_CLASS}>
        <DialogTitle className="text-[24px] font-bold leading-[1.5] text-[#ebe9e9]">
          {mode === "edit" ? "Editar playlist" : "Criar playlist"}
        </DialogTitle>
        <DialogDescription className="sr-only">Defina nome, descrição, capa e visibilidade da playlist.</DialogDescription>
        <div className="h-px bg-[#766c6e]" />
        <PlaylistForm
          initialValues={initialValues ?? EMPTY_PLAYLIST}
          submitLabel={mode === "edit" ? "Salvar alterações" : "Criar playlist"}
          onCancel={() => onOpenChange(false)}
          onSubmit={onSubmit}
        />
      </DialogContent>
    </Dialog>
  );
}

interface PlaylistFormProps {
  initialValues: PlaylistFormValues;
  submitLabel: string;
  onCancel: () => void;
  onSubmit: (input: PlaylistInput) => Promise<void>;
}

type PlaylistTextValues = Omit<PlaylistFormValues, "coverUrl">;

function PlaylistForm({ initialValues, submitLabel, onCancel, onSubmit }: PlaylistFormProps) {
  const fieldIdPrefix = useId();
  const coverInputRef = useRef<HTMLInputElement>(null);
  const [values, setValues] = useState<PlaylistTextValues>(initialValues);
  const cover = useEditableImage(initialValues.coverUrl, IMAGE_MAX_DIMENSIONS.cover);
  const [titleError, setTitleError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const updateValues = (patch: Partial<PlaylistTextValues>) => setValues((previous) => ({ ...previous, ...patch }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (cover.isProcessing) return;
    if (!values.title.trim()) {
      setTitleError("Dê um nome para a playlist.");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await onSubmit({
        title: values.title,
        description: values.description,
        isPublic: values.isPublic,
        cover: cover.change,
      });
    } catch (error) {
      setSubmitError(getErrorMessage(error, "Não foi possível salvar a playlist."));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="flex flex-col gap-6" onSubmit={handleSubmit} noValidate>
      <div className="flex flex-col gap-6 sm:flex-row">
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={() => coverInputRef.current?.click()}
            className="relative flex size-[137px] shrink-0 flex-col items-center justify-center gap-3 overflow-hidden border border-[#30292b] transition-colors hover:border-[#ff164c] focus-visible:border-[#ff164c] focus-visible:outline-none"
            aria-label={cover.previewUrl ? "Alterar capa da playlist" : "Adicionar capa da playlist"}
          >
            {cover.previewUrl ? (
              <CoverImage src={cover.previewUrl} className="absolute inset-0 size-full object-cover" />
            ) : (
              <>
                <ImagePlus className="size-6 text-[#ebe9e9]" aria-hidden="true" />
                <span className="text-[16px] font-semibold text-[#f8f8f8]">Capa</span>
              </>
            )}
          </button>
          <input
            ref={coverInputRef}
            type="file"
            accept={IMAGE_ACCEPT_ATTRIBUTE}
            className="hidden"
            onChange={cover.handleFileInputChange}
          />
          {cover.previewUrl && (
            <button
              type="button"
              className="min-h-8 text-left text-[12px] text-[#a19a9b] underline hover:text-[#f8f8f8]"
              onClick={cover.remove}
            >
              Remover capa
            </button>
          )}
          {cover.errorMessage && <p className="max-w-[137px] text-[12px] text-[#ff164c]">{cover.errorMessage}</p>}
        </div>

        <div className="flex min-w-0 flex-1 flex-col gap-4">
          <FormField id={`${fieldIdPrefix}-title`} label="Nome da playlist" error={titleError} required>
            <TextInput
              id={`${fieldIdPrefix}-title`}
              value={values.title}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Ex.: Noite eletrônica"
              hasError={Boolean(titleError)}
              data-autofocus
              onChange={(event) => {
                updateValues({ title: event.target.value });
                setTitleError(null);
              }}
            />
          </FormField>
          <FormField id={`${fieldIdPrefix}-description`} label="Descrição (opcional)">
            <TextAreaInput
              id={`${fieldIdPrefix}-description`}
              value={values.description}
              maxLength={DESCRIPTION_MAX_LENGTH}
              rows={3}
              placeholder="Sobre o que é esta playlist?"
              onChange={(event) => updateValues({ description: event.target.value })}
            />
          </FormField>
        </div>
      </div>

      {submitError && (
        <p role="alert" className="text-[13px] text-[#ff164c]">
          {submitError}
        </p>
      )}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <label className="flex cursor-pointer flex-col gap-1">
          <span className="flex items-center gap-3">
            <span className="text-[16px] font-semibold text-[#f8f8f8]">Pública</span>
            <Switch checked={values.isPublic} onCheckedChange={(isPublic) => updateValues({ isPublic })} />
          </span>
          <span className="text-[12px] text-[#bababa]">Outros usuários poderão ver e ouvir</span>
        </label>
        <div className="flex gap-3">
          <Button type="button" variant="brandOutline" size="touch" className="flex-1 sm:flex-none" onClick={onCancel}>
            Cancelar
          </Button>
          <Button
            type="submit"
            variant="primary"
            size="touch"
            className="flex-1 sm:flex-none"
            disabled={isSubmitting || cover.isProcessing}
          >
            {isSubmitting ? "Salvando..." : cover.isProcessing ? "Processando imagem..." : submitLabel}
          </Button>
        </div>
      </div>
    </form>
  );
}
