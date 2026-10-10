import { UPLOAD_LIMITS } from "../config/uploadLimits";
import { ServiceError } from "../services/serviceError";
import { validateFile } from "./files";

export const IMAGE_MAX_DIMENSIONS = {
  avatar: 512,
  cover: 800,
  banner: 1600,
} as const;

const OUTPUT_IMAGE_TYPE = "image/jpeg";
const OUTPUT_IMAGE_QUALITY = 0.85;

export const IMAGE_ACCEPT_ATTRIBUTE = UPLOAD_LIMITS.imageMimeTypes.join(",");

export function validateImageFile(file: File): string | null {
  return validateFile(file, {
    maxBytes: UPLOAD_LIMITS.imageMaxBytes,
    mimeTypes: UPLOAD_LIMITS.imageMimeTypes,
    extensions: UPLOAD_LIMITS.imageExtensions,
    typeLabel: "PNG ou JPEG",
  });
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new ServiceError("unknown", "Seu navegador não conseguiu processar a imagem."))),
      OUTPUT_IMAGE_TYPE,
      OUTPUT_IMAGE_QUALITY,
    );
  });
}

/**
 * Valida e reduz a imagem no cliente antes do upload: diminui o payload enviado ao
 * Storage e padroniza o formato (JPEG) independentemente do arquivo original.
 */
export async function prepareImageUpload(file: File, maxDimension: number): Promise<Blob> {
  const validationError = validateImageFile(file);
  if (validationError) throw new ServiceError("validation", validationError);

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new ServiceError("validation", "Não foi possível ler a imagem selecionada.");
  }

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);

  const context = canvas.getContext("2d");
  if (!context) {
    bitmap.close();
    throw new ServiceError("unknown", "Seu navegador não conseguiu processar a imagem.");
  }
  context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  return canvasToBlob(canvas);
}
