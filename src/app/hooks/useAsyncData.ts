import { useCallback, useEffect, useState, type DependencyList } from "react";
import { getErrorMessage, ServiceError, type ServiceErrorCode } from "../services/serviceError";

interface AsyncDataState<TData> {
  data: TData | undefined;
  errorMessage: string | null;
  /** Permite distinguir "não existe" (`not_found`) de falhas recuperáveis com "Tentar novamente". */
  errorCode: ServiceErrorCode | null;
  isLoading: boolean;
}

export interface AsyncDataResult<TData> extends AsyncDataState<TData> {
  reload: () => void;
}

/** `fallbackErrorMessage` descreve o que falhou quando o erro não traz uma mensagem própria. */
export function useAsyncData<TData>(
  loadData: () => Promise<TData>,
  dependencies: DependencyList,
  fallbackErrorMessage?: string,
): AsyncDataResult<TData> {
  const [state, setState] = useState<AsyncDataState<TData>>({
    data: undefined,
    errorMessage: null,
    errorCode: null,
    isLoading: true,
  });
  const [reloadCounter, setReloadCounter] = useState(0);

  useEffect(() => {
    let isCurrentRequest = true;
    setState((previous) => ({ ...previous, errorMessage: null, errorCode: null, isLoading: true }));

    loadData()
      .then((data) => {
        if (isCurrentRequest) setState({ data, errorMessage: null, errorCode: null, isLoading: false });
      })
      .catch((error: unknown) => {
        if (isCurrentRequest) {
          setState((previous) => ({
            ...previous,
            errorMessage: getErrorMessage(error, fallbackErrorMessage),
            errorCode: error instanceof ServiceError ? error.code : "unknown",
            isLoading: false,
          }));
        }
      });

    return () => {
      isCurrentRequest = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- dependências declaradas pelo chamador
  }, [...dependencies, reloadCounter]);

  const reload = useCallback(() => setReloadCounter((counter) => counter + 1), []);

  return { ...state, reload };
}
