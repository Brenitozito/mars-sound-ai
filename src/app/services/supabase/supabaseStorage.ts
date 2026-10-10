import type { DetailedError } from "tus-js-client";
import type { MediaChange } from "../../types/domain";
import type { UploadProgressListener } from "../contracts";
import { ServiceError } from "../serviceError";
import { getSupabase, getSupabaseConfig } from "./client";
import { SESSION_EXPIRED_MESSAGE, toServiceError, unwrap } from "./supabaseErrors";

export const MEDIA_BUCKETS = {
  audio: "audio-tracks",
  trackCover: "track-covers",
  userMedia: "user-avatars",
  playlistCover: "playlist-covers",
} as const;

export type MediaBucket = (typeof MEDIA_BUCKETS)[keyof typeof MEDIA_BUCKETS];

/** Os nomes são únicos por versão do arquivo, então a CDN pode guardá-los por um ano. */
const IMMUTABLE_CACHE_SECONDS = "31536000";
/** Tamanho de chunk exigido pelo endpoint resumível do Supabase Storage. */
const TUS_CHUNK_SIZE_BYTES = 6 * 1024 * 1024;
const TUS_RETRY_DELAYS_MS = [0, 3000, 5000, 10000, 20000];

const EXTENSION_BY_CONTENT_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "audio/mpeg": "mp3",
  "audio/mp3": "mp3",
  "audio/wav": "wav",
  "audio/x-wav": "wav",
  "audio/wave": "wav",
};

const CONTENT_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  mp3: "audio/mpeg",
  wav: "audio/wav",
};

function readFileExtension(file: Blob): string | undefined {
  return file instanceof File ? file.name.split(".").pop()?.toLowerCase() : undefined;
}

export function resolveContentType(file: Blob): string {
  if (file.type) return file.type;
  const extension = readFileExtension(file);
  return (extension && CONTENT_TYPE_BY_EXTENSION[extension]) || "application/octet-stream";
}

export function resolveFileExtension(file: Blob): string {
  return EXTENSION_BY_CONTENT_TYPE[resolveContentType(file)] ?? readFileExtension(file) ?? "bin";
}

/** As políticas do Storage só aceitam objetos dentro da pasta `<auth.uid()>/`. */
export function buildObjectPath(ownerId: string, file: Blob, options: { fileId?: string; prefix?: string } = {}): string {
  const fileId = options.fileId ?? crypto.randomUUID();
  const fileName = options.prefix ? `${options.prefix}-${fileId}` : fileId;
  return `${ownerId}/${fileName}.${resolveFileExtension(file)}`;
}

export function getPublicMediaUrl(bucket: MediaBucket, path: string | null | undefined): string | null {
  if (!path) return null;
  return getSupabase().storage.from(bucket).getPublicUrl(path).data.publicUrl;
}

export async function uploadObject(bucket: MediaBucket, path: string, file: Blob): Promise<void> {
  const response = await getSupabase().storage.from(bucket).upload(path, file, {
    contentType: resolveContentType(file),
    cacheControl: IMMUTABLE_CACHE_SECONDS,
    upsert: false,
  });
  unwrap(response, { unknown: "Não foi possível enviar o arquivo. Tente novamente." });
}

/** Limpeza de melhor esforço: um arquivo órfão não deve mascarar o erro original nem bloquear o fluxo. */
export async function removeObjectsQuietly(bucket: MediaBucket, paths: ReadonlyArray<string | null | undefined>) {
  const existingPaths = paths.filter((path): path is string => Boolean(path));
  if (existingPaths.length === 0) return;
  const { error } = await getSupabase().storage.from(bucket).remove(existingPaths);
  if (error && import.meta.env.DEV) console.warn("[supabase] falha ao remover arquivos", existingPaths, error);
}

export interface MediaChangeRequest {
  currentPath: string | null;
  change: MediaChange | undefined;
  prefix?: string;
}

interface PreparedMediaChange {
  nextPath: string | null;
  uploadedPath: string | null;
  obsoletePath: string | null;
}

async function prepareMediaChange(bucket: MediaBucket, ownerId: string, request: MediaChangeRequest) {
  const { currentPath, change, prefix } = request;
  if (!change || change.kind === "keep") {
    return { nextPath: currentPath, uploadedPath: null, obsoletePath: null } satisfies PreparedMediaChange;
  }
  if (change.kind === "remove") {
    return { nextPath: null, uploadedPath: null, obsoletePath: currentPath } satisfies PreparedMediaChange;
  }
  const uploadedPath = buildObjectPath(ownerId, change.file, { prefix });
  await uploadObject(bucket, uploadedPath, change.file);
  return { nextPath: uploadedPath, uploadedPath, obsoletePath: currentPath } satisfies PreparedMediaChange;
}

/**
 * Envia as mídias novas, persiste o registro e só então apaga as antigas. Se a persistência falhar,
 * os arquivos recém-enviados são removidos e os antigos continuam válidos.
 */
export async function persistWithMediaChanges<TResult>(
  bucket: MediaBucket,
  ownerId: string,
  requests: readonly MediaChangeRequest[],
  persist: (nextPaths: Array<string | null>) => Promise<TResult>,
): Promise<TResult> {
  const preparedChanges: PreparedMediaChange[] = [];
  try {
    for (const request of requests) {
      preparedChanges.push(await prepareMediaChange(bucket, ownerId, request));
    }
    const result = await persist(preparedChanges.map((prepared) => prepared.nextPath));
    await removeObjectsQuietly(
      bucket,
      preparedChanges.map((prepared) => prepared.obsoletePath),
    );
    return result;
  } catch (error) {
    await removeObjectsQuietly(
      bucket,
      preparedChanges.map((prepared) => prepared.uploadedPath),
    );
    throw toServiceError(error);
  }
}

async function requireAccessToken(): Promise<string> {
  const { data } = await getSupabase().auth.getSession();
  const accessToken = data.session?.access_token;
  if (!accessToken) throw new ServiceError("unauthenticated", SESSION_EXPIRED_MESSAGE);
  return accessToken;
}

function toUploadServiceError(error: Error | DetailedError): ServiceError {
  const response = "originalResponse" in error ? error.originalResponse : null;
  return toServiceError(
    { statusCode: response ? String(response.getStatus()) : "", message: response?.getBody() || error.message },
    { unknown: "Não foi possível enviar o arquivo de áudio. Tente novamente." },
  );
}

interface ResumableUploadOptions {
  bucket: MediaBucket;
  path: string;
  file: File;
  onProgress?: UploadProgressListener;
}

/**
 * Upload resumível (TUS): reporta progresso real e retoma após quedas de conexão dentro da mesma
 * tentativa. Não retoma envios de tentativas anteriores, pois eles apontam para outro caminho de objeto.
 */
export async function uploadResumable({ bucket, path, file, onProgress }: ResumableUploadOptions): Promise<void> {
  const accessToken = await requireAccessToken();
  const { url, publishableKey } = getSupabaseConfig();
  // Carregado sob demanda: só o fluxo de publicação precisa do cliente TUS.
  const { Upload } = await import("tus-js-client");

  await new Promise<void>((resolve, reject) => {
    const upload = new Upload(file, {
      endpoint: `${url}/storage/v1/upload/resumable`,
      retryDelays: TUS_RETRY_DELAYS_MS,
      chunkSize: TUS_CHUNK_SIZE_BYTES,
      uploadDataDuringCreation: true,
      storeFingerprintForResuming: false,
      headers: {
        authorization: `Bearer ${accessToken}`,
        apikey: publishableKey,
        "x-upsert": "false",
      },
      metadata: {
        bucketName: bucket,
        objectName: path,
        contentType: resolveContentType(file),
        cacheControl: IMMUTABLE_CACHE_SECONDS,
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        if (bytesTotal > 0) onProgress?.(Math.min(100, Math.round((bytesUploaded / bytesTotal) * 100)));
      },
      onSuccess: () => resolve(),
      onError: (error) => reject(toUploadServiceError(error)),
    });
    upload.start();
  });
}
