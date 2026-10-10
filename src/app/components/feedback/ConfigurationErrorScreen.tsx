import { Settings2 } from "lucide-react";

export function ConfigurationErrorScreen({ missingEnvNames }: { missingEnvNames: readonly string[] }) {
  return (
    <main
      role="alert"
      className="flex min-h-dvh flex-col items-center justify-center gap-5 bg-[var(--color-bg-base)] px-6 text-center"
    >
      <span className="flex size-16 items-center justify-center rounded-full border border-[#ff164c]/40 bg-[#ff164c]/10">
        <Settings2 className="size-7 text-[#ff164c]" aria-hidden="true" />
      </span>
      <div className="flex max-w-md flex-col gap-3">
        <h1 className="text-xl font-semibold text-[#f8f8f8]">Configuração ausente</h1>
        <p className="text-sm leading-relaxed text-[#bababa]">
          O app não consegue se conectar ao banco de dados porque estas variáveis de ambiente não foram definidas:
        </p>
        <ul className="flex flex-col gap-1 font-mono text-sm text-[#f8f8f8]">
          {missingEnvNames.map((envName) => (
            <li key={envName}>{envName}</li>
          ))}
        </ul>
        <p className="text-sm leading-relaxed text-[#a19a9b]">
          Defina-as no arquivo <code>.env</code> (desenvolvimento) ou nas variáveis de ambiente da hospedagem e
          publique novamente.
        </p>
      </div>
    </main>
  );
}
