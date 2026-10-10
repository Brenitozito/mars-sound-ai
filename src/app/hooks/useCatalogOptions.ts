import { catalogService } from "../services";
import type { CatalogOptions } from "../types/domain";
import { useAsyncData } from "./useAsyncData";

const CATALOG_OPTIONS_ERROR_MESSAGE = "Não foi possível carregar gêneros, moods e sugestões.";

// Listas de referência mudam raramente: uma requisição por sessão atende todas as telas.
let cachedCatalogOptions: Promise<CatalogOptions> | null = null;

function loadCatalogOptions(): Promise<CatalogOptions> {
  cachedCatalogOptions ??= catalogService.getCatalogOptions().catch((error: unknown) => {
    cachedCatalogOptions = null;
    throw error;
  });
  return cachedCatalogOptions;
}

/** As tags populares mudam a cada publicação; a próxima leitura volta a consultar o banco. */
export function invalidateCatalogOptions(): void {
  cachedCatalogOptions = null;
}

export function useCatalogOptions() {
  const { data, errorMessage, isLoading, reload } = useAsyncData(loadCatalogOptions, [], CATALOG_OPTIONS_ERROR_MESSAGE);
  return { catalogOptions: data, errorMessage, isLoading, reload };
}
