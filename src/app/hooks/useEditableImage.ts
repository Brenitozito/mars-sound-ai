import { useRef, useState, type ChangeEvent } from "react";
import { getErrorMessage } from "../services/serviceError";
import { KEEP_MEDIA, type MediaChange } from "../types/domain";
import { prepareImageUpload } from "../utils/imageUpload";
import { useObjectUrl } from "./useObjectUrl";

/**
 * Estado de um campo de imagem em formulário: mantém a URL salva até o envio e
 * expõe a alteração como `MediaChange`, deixando o upload real para o service.
 * Enquanto a imagem é preparada, `isProcessing` permite bloquear o envio do formulário
 * para que a nova imagem não seja descartada.
 */
export function useEditableImage(savedUrl: string | null, maxDimension: number) {
  const [change, setChange] = useState<MediaChange>(KEEP_MEDIA);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const latestSelectionRef = useRef(0);
  const replacementUrl = useObjectUrl(change.kind === "replace" ? change.file : null);

  const previewUrl = change.kind === "replace" ? replacementUrl : change.kind === "remove" ? null : savedUrl;

  const handleFileInputChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    const selectionId = ++latestSelectionRef.current;
    const isLatestSelection = () => selectionId === latestSelectionRef.current;
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const preparedFile = await prepareImageUpload(file, maxDimension);
      if (isLatestSelection()) setChange({ kind: "replace", file: preparedFile });
    } catch (error) {
      if (isLatestSelection()) setErrorMessage(getErrorMessage(error, "Não foi possível usar esta imagem."));
    } finally {
      if (isLatestSelection()) setIsProcessing(false);
    }
  };

  const cancelPendingSelection = () => {
    latestSelectionRef.current += 1;
    setIsProcessing(false);
    setErrorMessage(null);
  };

  const remove = () => {
    cancelPendingSelection();
    setChange(savedUrl ? { kind: "remove" } : KEEP_MEDIA);
  };

  const reset = () => {
    cancelPendingSelection();
    setChange(KEEP_MEDIA);
  };

  return {
    change,
    previewUrl,
    errorMessage,
    isProcessing,
    isDirty: change.kind !== "keep",
    handleFileInputChange,
    remove,
    reset,
  };
}
