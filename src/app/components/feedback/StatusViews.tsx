import type { ReactNode } from "react";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export function LoadingState({ label = "Carregando...", className }: { label?: string; className?: string }) {
  return (
    <div role="status" className={cn("flex min-h-[200px] flex-col items-center justify-center gap-3", className)}>
      <span className="size-8 animate-spin rounded-full border-2 border-[#30292b] border-t-[#ff164c]" aria-hidden="true" />
      <span className="text-sm text-[#a19a9b]">{label}</span>
    </div>
  );
}

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ message, onRetry, className }: ErrorStateProps) {
  return (
    <div role="alert" className={cn("flex min-h-[200px] flex-col items-center justify-center gap-4 text-center", className)}>
      <p className="text-base font-semibold text-[#ebe9e9]">{message}</p>
      {onRetry && (
        <Button variant="brandOutline" size="touch" onClick={onRetry}>
          Tentar novamente
        </Button>
      )}
    </div>
  );
}

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex min-h-[200px] flex-col items-center justify-center gap-3 border border-dashed border-[#30292b] px-6 py-10 text-center",
        className,
      )}
    >
      {icon && <span className="text-[#5b4f51]">{icon}</span>}
      <p className="text-base font-semibold text-[#ebe9e9]">{title}</p>
      {description && <p className="max-w-sm text-sm text-[#a19a9b]">{description}</p>}
      {action}
    </div>
  );
}
