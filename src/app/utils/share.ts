import { toast } from "sonner";

export async function shareLink(path: string, title: string): Promise<void> {
  const url = new URL(path, window.location.origin).toString();

  if (navigator.share) {
    try {
      await navigator.share({ title, url });
      return;
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast.success("Link copiado para a área de transferência.");
  } catch {
    toast.error("Não foi possível copiar o link.", { description: url });
  }
}
