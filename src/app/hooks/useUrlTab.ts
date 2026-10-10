import { useSearchParams } from "react-router";

const TAB_PARAM = "aba";

/** Mantém a aba ativa na URL (`?aba=`), permitindo compartilhar o link e voltar pelo histórico. */
export function useUrlTab<TTabId extends string>(tabIds: readonly TTabId[], defaultTabId: TTabId) {
  const [searchParams, setSearchParams] = useSearchParams();
  const rawTabId = searchParams.get(TAB_PARAM);
  const activeTabId = tabIds.find((tabId) => tabId === rawTabId) ?? defaultTabId;

  const selectTab = (tabId: TTabId) => {
    setSearchParams(
      (previous) => {
        const nextParams = new URLSearchParams(previous);
        if (tabId === defaultTabId) nextParams.delete(TAB_PARAM);
        else nextParams.set(TAB_PARAM, tabId);
        return nextParams;
      },
      { replace: true },
    );
  };

  return [activeTabId, selectTab] as const;
}
