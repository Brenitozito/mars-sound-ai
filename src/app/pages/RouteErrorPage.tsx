import { isRouteErrorResponse, useRouteError } from "react-router";
import { Button } from "../components/ui/button";

function isChunkLoadError(error: unknown): boolean {
  return error instanceof Error && /dynamically imported module|Importing a module script failed/i.test(error.message);
}

export function RouteErrorPage() {
  const error = useRouteError();
  const description = isRouteErrorResponse(error)
    ? `Erro ${error.status}: ${error.statusText}`
    : isChunkLoadError(error)
      ? "Uma nova versão do app foi publicada. Recarregue a página para continuar."
      : "Ocorreu um erro inesperado. Tente recarregar a página.";

  if (import.meta.env.DEV) console.error(error);

  return (
    <div role="alert" className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-[var(--color-bg-base)] px-6 text-center">
      <h1 className="text-2xl font-bold text-[#ebe9e9]">Algo deu errado</h1>
      <p className="max-w-md text-sm text-[#a19a9b]">{description}</p>
      <div className="flex gap-3">
        <Button variant="primary" size="touch" onClick={() => window.location.reload()}>
          Recarregar
        </Button>
        <Button variant="brandOutline" size="touch" onClick={() => window.location.assign("/")}>
          Ir para o início
        </Button>
      </div>
    </div>
  );
}
