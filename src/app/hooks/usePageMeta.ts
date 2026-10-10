import { useEffect } from "react";

const APP_NAME = "Mars Sound AI";
const DESCRIPTION_SELECTORS = ['meta[name="description"]', 'meta[property="og:description"]'];
const TITLE_SELECTORS = ['meta[property="og:title"]'];

const defaultDescription =
  document.querySelector<HTMLMetaElement>(DESCRIPTION_SELECTORS[0])?.content ??
  "Descubra, publique e compartilhe músicas criadas com inteligência artificial.";

function setMetaContent(selectors: readonly string[], content: string): void {
  selectors.forEach((selector) => document.querySelector<HTMLMetaElement>(selector)?.setAttribute("content", content));
}

/** Atualiza título e descrição da aba (e as tags Open Graph correspondentes) para a página atual. */
export function usePageMeta(pageTitle: string | null | undefined, description?: string) {
  useEffect(() => {
    const fullTitle = pageTitle ? `${pageTitle} · ${APP_NAME}` : APP_NAME;
    document.title = fullTitle;
    setMetaContent(TITLE_SELECTORS, fullTitle);
    setMetaContent(DESCRIPTION_SELECTORS, description?.trim() || defaultDescription);
  }, [pageTitle, description]);
}
