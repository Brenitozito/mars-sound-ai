import { useCallback, useState } from "react";
import { getErrorMessage } from "../services/serviceError";

export function useAsyncAction() {
  const [isPending, setIsPending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const run = useCallback(async (action: () => Promise<void>, fallbackErrorMessage: string): Promise<boolean> => {
    setIsPending(true);
    setErrorMessage(null);
    try {
      await action();
      return true;
    } catch (error) {
      setErrorMessage(getErrorMessage(error, fallbackErrorMessage));
      return false;
    } finally {
      setIsPending(false);
    }
  }, []);

  const clearError = useCallback(() => setErrorMessage(null), []);

  return { isPending, errorMessage, run, clearError };
}
