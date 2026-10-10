import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router";
import { toast } from "sonner";
import { ErrorState, LoadingState } from "../components/feedback/StatusViews";
import { FormErrorMessage, FormField, TextAreaInput, TextInput } from "../components/forms/FormControls";
import { PageContainer, PageHeader } from "../components/layout/PageContainer";
import { SettingsPanel } from "../components/settings/SettingsPanel";
import { Button } from "../components/ui/button";
import { Checkbox } from "../components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { CategoryChip } from "../components/ui/CategoryChip";
import { cn } from "../components/ui/utils";
import { AudioPreviewPlayer } from "../components/upload/AudioPreviewPlayer";
import { FileDropZone } from "../components/upload/FileDropZone";
import { TagInput } from "../components/upload/TagInput";
import { useCurrentUser } from "../context/AuthContext";
import { UPLOAD_LIMITS } from "../config/uploadLimits";
import { useAsyncAction } from "../hooks/useAsyncAction";
import { invalidateCatalogOptions, useCatalogOptions } from "../hooks/useCatalogOptions";
import { useObjectUrl } from "../hooks/useObjectUrl";
import { usePageMeta } from "../hooks/usePageMeta";
import { ROUTES } from "../routes/paths";
import { catalogService } from "../services";
import { formatFileSize, validateFile } from "../utils/files";
import { IMAGE_ACCEPT_ATTRIBUTE, validateImageFile } from "../utils/imageUpload";
import uploadPaths from "../../imports/svg-r7seo7qk5p";

const TITLE_MAX_LENGTH = 80;
const ALBUM_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;
const PROMPT_MAX_LENGTH = 1000;
const MAX_MOODS = 3;
const AUDIO_ACCEPT_ATTRIBUTE = [...UPLOAD_LIMITS.audioMimeTypes, ...UPLOAD_LIMITS.audioExtensions].join(",");

type UploadField = "audio" | "cover" | "title" | "genre" | "terms";

interface UploadFormValues {
  audioFile: File | null;
  coverFile: File | null;
  title: string;
  genre: string;
  moods: string[];
  album: string;
  description: string;
  aiGenerator: string;
  tags: string[];
  prompt: string;
  hasAcceptedTerms: boolean;
}

const INITIAL_VALUES: UploadFormValues = {
  audioFile: null,
  coverFile: null,
  title: "",
  genre: "",
  moods: [],
  album: "",
  description: "",
  aiGenerator: "",
  tags: [],
  prompt: "",
  hasAcceptedTerms: false,
};

function validateAudioFile(file: File): string | null {
  return validateFile(file, {
    maxBytes: UPLOAD_LIMITS.audioMaxBytes,
    mimeTypes: UPLOAD_LIMITS.audioMimeTypes,
    extensions: UPLOAD_LIMITS.audioExtensions,
    typeLabel: "MP3 ou WAV",
  });
}

function MusicFileIcon() {
  return (
    <svg className="h-[59px] w-[72px] shrink-0" fill="none" viewBox="0 0 72.4171 59.2504" aria-hidden="true">
      <path d={uploadPaths.p6552b80} fill="#F8F8F8" />
    </svg>
  );
}

function PictureIcon() {
  return (
    <svg className="size-[64px] shrink-0" fill="none" viewBox="0 0 64.6567 64.6567" aria-hidden="true">
      <path d={uploadPaths.p959d900} fill="#EBE9E9" />
      <path d={uploadPaths.p12218b00} fill="#EBE9E9" />
    </svg>
  );
}

interface MoodSelectorProps {
  moods: readonly string[];
  selectedMoods: string[];
  onChange: (moods: string[]) => void;
}

function MoodSelector({ moods, selectedMoods, onChange }: MoodSelectorProps) {
  const hasReachedLimit = selectedMoods.length >= MAX_MOODS;

  const toggleMood = (mood: string) => {
    if (selectedMoods.includes(mood)) onChange(selectedMoods.filter((selectedMood) => selectedMood !== mood));
    else if (!hasReachedLimit) onChange([...selectedMoods, mood]);
  };

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-2 text-[12px] leading-[1.25] text-[#bababa]">Moods (até {MAX_MOODS})</legend>
      <div className="flex flex-wrap gap-2">
        {moods.map((mood) => {
          const isSelected = selectedMoods.includes(mood);
          return (
            <CategoryChip
              key={mood}
              label={mood}
              active={isSelected}
              disabled={!isSelected && hasReachedLimit}
              onClick={() => toggleMood(mood)}
            />
          );
        })}
      </div>
    </fieldset>
  );
}

export default function UploadMusicPage() {
  usePageMeta("Carregar música", "Publique suas músicas criadas com AI e compartilhe com a comunidade.");
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const [values, setValues] = useState<UploadFormValues>(INITIAL_VALUES);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<UploadField, string | null>>>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const coverPreviewUrl = useObjectUrl(values.coverFile);
  const submission = useAsyncAction();
  const catalog = useCatalogOptions();

  const updateValues = (patch: Partial<UploadFormValues>, clearedField?: UploadField) => {
    setValues((previous) => ({ ...previous, ...patch }));
    if (clearedField) setFieldErrors((previous) => ({ ...previous, [clearedField]: null }));
  };

  const handleAudioSelected = (file: File) => {
    const validationError = validateAudioFile(file);
    setFieldErrors((previous) => ({ ...previous, audio: validationError }));
    if (!validationError) updateValues({ audioFile: file });
  };

  const handleCoverSelected = (file: File) => {
    const validationError = validateImageFile(file);
    setFieldErrors((previous) => ({ ...previous, cover: validationError }));
    if (!validationError) updateValues({ coverFile: file });
  };

  const validateForm = (): Partial<Record<UploadField, string | null>> => ({
    audio: values.audioFile ? null : `Envie um arquivo de áudio (MP3 ou WAV até ${formatFileSize(UPLOAD_LIMITS.audioMaxBytes)}).`,
    title: values.title.trim() ? null : "O título da música é obrigatório.",
    genre: values.genre ? null : "Escolha um gênero para a música.",
    terms: values.hasAcceptedTerms ? null : "Você precisa concordar com os Termos de uso para continuar.",
  });

  const handleCancel = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate(ROUTES.home);
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.values(errors).some(Boolean) || !values.audioFile) return;

    const audioFile = values.audioFile;
    setUploadProgress(0);
    const isSuccessful = await submission.run(async () => {
      await catalogService.publishTrack(
        currentUser,
        {
          title: values.title,
          genre: values.genre,
          moods: values.moods,
          album: values.album,
          description: values.description,
          aiGenerator: values.aiGenerator,
          tags: values.tags,
          prompt: values.prompt,
          audioFile,
          coverFile: values.coverFile,
        },
        setUploadProgress,
      );
    }, "Não foi possível publicar a música. Tente novamente.");

    setUploadProgress(null);
    if (isSuccessful) {
      invalidateCatalogOptions();
      toast.success(`“${values.title.trim()}” foi publicada!`);
      navigate(ROUTES.myProfile);
    }
  };

  const isPublishing = submission.isPending;
  const header = (
    <div className="mb-6">
      <PageHeader title="Carregue sua música" description="Compartilhe suas criações de IA com a comunidade" />
    </div>
  );

  if (!catalog.catalogOptions) {
    return (
      <PageContainer width="narrow">
        {header}
        {catalog.errorMessage ? (
          <ErrorState message={catalog.errorMessage} onRetry={catalog.reload} className="min-h-[40vh]" />
        ) : (
          <LoadingState label="Preparando o formulário..." className="min-h-[40vh]" />
        )}
      </PageContainer>
    );
  }

  const { genres, moods, aiGenerators, popularTags } = catalog.catalogOptions;

  return (
    <PageContainer width="narrow">
      {header}

      <form className="flex flex-col gap-[22px]" onSubmit={handleSubmit} noValidate>
        <SettingsPanel title="Faça upload da sua música e capa">
          <div className="flex flex-col gap-6 sm:flex-row">
            <FileDropZone
              title="Carregar áudio"
              hint={`MP3 ou WAV até ${formatFileSize(UPLOAD_LIMITS.audioMaxBytes)}`}
              accept={AUDIO_ACCEPT_ATTRIBUTE}
              icon={<MusicFileIcon />}
              selectLabel={values.audioFile ? "Trocar arquivo" : "Selecionar arquivo"}
              error={fieldErrors.audio}
              onFileSelected={handleAudioSelected}
              preview={
                values.audioFile && (
                  <div className="flex w-full flex-col items-center gap-2">
                    <MusicFileIcon />
                    <p className="max-w-full break-all text-[16px] font-bold text-[#f8f8f8]">{values.audioFile.name}</p>
                    <p className="text-[12px] text-[#bababa]">{formatFileSize(values.audioFile.size)} · pronto para publicar</p>
                    <AudioPreviewPlayer file={values.audioFile} />
                  </div>
                )
              }
            />
            <FileDropZone
              title="Carregar capa"
              hint={`PNG ou JPEG até ${formatFileSize(UPLOAD_LIMITS.imageMaxBytes)} (opcional)`}
              accept={IMAGE_ACCEPT_ATTRIBUTE}
              icon={<PictureIcon />}
              selectLabel={values.coverFile ? "Alterar capa" : "Selecionar arquivo"}
              error={fieldErrors.cover}
              onFileSelected={handleCoverSelected}
              clearLabel="Remover capa"
              onClear={() => updateValues({ coverFile: null }, "cover")}
              preview={
                coverPreviewUrl && (
                  <img src={coverPreviewUrl} alt="Pré-visualização da capa" className="size-[140px] border border-[#30292b] object-cover" />
                )
              }
            />
          </div>
        </SettingsPanel>

        <SettingsPanel title="Detalhes da música">
          <FormField id="upload-title" label="Título da música" error={fieldErrors.title} required>
            <TextInput
              id="upload-title"
              value={values.title}
              maxLength={TITLE_MAX_LENGTH}
              placeholder="Ex.: Neon Gênesis..."
              hasError={Boolean(fieldErrors.title)}
              onChange={(event) => updateValues({ title: event.target.value }, "title")}
            />
          </FormField>

          <div className="flex flex-col gap-4 sm:flex-row">
            <FormField id="upload-genre" label="Gênero" error={fieldErrors.genre} required>
              <Select value={values.genre} onValueChange={(genre) => updateValues({ genre }, "genre")}>
                <SelectTrigger
                  id="upload-genre"
                  aria-invalid={Boolean(fieldErrors.genre) || undefined}
                  className={cn(
                    "h-11 min-h-[44px] w-full rounded-none bg-transparent px-6 text-[16px] font-semibold text-[#f8f8f8] data-[placeholder]:font-normal data-[placeholder]:text-[#f8f8f8]/30 [&_svg]:text-[#ff164c] [&_svg]:opacity-100",
                    fieldErrors.genre ? "border-[#ff164c]" : "border-[#30292b] hover:border-[#ff164c]/50",
                  )}
                >
                  <SelectValue placeholder="Selecione um gênero" />
                </SelectTrigger>
                <SelectContent className="z-[150] max-h-72 rounded-none border-[#30292b] bg-[#24191b] text-[#f8f8f8]">
                  {genres.map((genre) => (
                    <SelectItem key={genre} value={genre} className="min-h-10 cursor-pointer focus:bg-white/5 focus:text-[#f8f8f8]">
                      {genre}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FormField>

            <FormField id="upload-ai-generator" label="Nome da IA geradora">
              <TextInput
                id="upload-ai-generator"
                value={values.aiGenerator}
                maxLength={40}
                placeholder={aiGenerators[0] ? `Ex.: ${aiGenerators[0]}` : "Ferramenta usada para criar a música"}
                list="ai-generator-suggestions"
                onChange={(event) => updateValues({ aiGenerator: event.target.value })}
              />
              <datalist id="ai-generator-suggestions">
                {aiGenerators.map((generator) => (
                  <option key={generator} value={generator} />
                ))}
              </datalist>
            </FormField>
          </div>

          <MoodSelector moods={moods} selectedMoods={values.moods} onChange={(selectedMoods) => updateValues({ moods: selectedMoods })} />

          <FormField id="upload-album" label="Álbum (opcional)">
            <TextInput
              id="upload-album"
              value={values.album}
              maxLength={ALBUM_MAX_LENGTH}
              placeholder="Ex.: Marte ataca"
              onChange={(event) => updateValues({ album: event.target.value })}
            />
          </FormField>

          <FormField id="upload-description" label="Descrição (opcional)" hint={`${values.description.length}/${DESCRIPTION_MAX_LENGTH}`}>
            <TextAreaInput
              id="upload-description"
              rows={3}
              maxLength={DESCRIPTION_MAX_LENGTH}
              placeholder="Conte a história por trás desta música..."
              value={values.description}
              onChange={(event) => updateValues({ description: event.target.value })}
            />
          </FormField>

          <FormField id="upload-tags" label="Tags (clima, sensação, uso)">
            <TagInput id="upload-tags" tags={values.tags} suggestions={popularTags} onChange={(tags) => updateValues({ tags })} />
          </FormField>

          <FormField
            id="upload-prompt"
            label="Prompt de geração (opcional)"
            hint="Seu prompt pode ser visto por outros usuários da plataforma e utilizado em novas músicas."
          >
            <TextAreaInput
              id="upload-prompt"
              rows={4}
              maxLength={PROMPT_MAX_LENGTH}
              placeholder="Cole aqui o prompt que você usou para criar esta música..."
              value={values.prompt}
              onChange={(event) => updateValues({ prompt: event.target.value })}
            />
          </FormField>

          <div className="h-px w-full bg-[#766c6e]" />

          {uploadProgress !== null && (
            <div className="flex flex-col gap-2" role="status" aria-live="polite">
              <div className="h-1 w-full overflow-hidden bg-[#5b4f51]">
                <div
                  className="h-full bg-gradient-to-r from-[#ff164c] to-[#ea5858] transition-[width] duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="text-[12px] font-semibold text-[#bababa]">Publicando... {uploadProgress}%</p>
            </div>
          )}
          <FormErrorMessage message={submission.errorMessage} />

          <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
            <div className="flex flex-col gap-1">
              <div className="flex items-start gap-3">
                <Checkbox
                  id="upload-terms"
                  checked={values.hasAcceptedTerms}
                  onCheckedChange={(checked) => updateValues({ hasAcceptedTerms: checked === true }, "terms")}
                  aria-invalid={Boolean(fieldErrors.terms) || undefined}
                  className="mt-0.5 size-5 rounded-none border-[#5b4f51] bg-[#30292b] data-[state=checked]:border-[#ff164c] data-[state=checked]:bg-[#ff164c] data-[state=checked]:text-white"
                />
                <label htmlFor="upload-terms" className="cursor-pointer text-[12px] leading-[1.5] text-[#bababa]">
                  Concordo com os <strong className="text-[#ff164c]">Termos de uso</strong> e as{" "}
                  <strong className="text-[#ff164c]">Políticas de privacidade</strong> da plataforma.{" "}
                  <span className="text-[#ff164c]" aria-hidden="true">
                    *
                  </span>
                </label>
              </div>
              {fieldErrors.terms && (
                <p role="alert" className="text-[12px] leading-[1.25] text-[#ff164c]">
                  {fieldErrors.terms}
                </p>
              )}
            </div>

            <div className="flex w-full shrink-0 items-center gap-3 sm:w-auto">
              <Button type="button" variant="brandOutline" size="touch" className="flex-1 sm:flex-none" onClick={handleCancel} disabled={isPublishing}>
                Cancelar
              </Button>
              <Button type="submit" variant="primary" size="touch" className="flex-1 sm:flex-none" disabled={isPublishing}>
                {isPublishing ? "Publicando..." : "Publicar música"}
              </Button>
            </div>
          </div>
        </SettingsPanel>
      </form>
    </PageContainer>
  );
}
