import { useCallback, useRef } from "react";
import { resolveMenuTrigger } from "../utils/focusManagement";

type AutoFocusHandler = (event: Event) => void;

interface ReturnFocusHandlers {
  onOpenAutoFocus?: AutoFocusHandler;
  onCloseAutoFocus?: AutoFocusHandler;
}

const AUTOFOCUS_SELECTOR = "[data-autofocus]";

function captureReturnFocusTarget(dialogContainer: EventTarget | null): HTMLElement | null {
  const activeElement = document.activeElement;
  if (!(activeElement instanceof HTMLElement) || activeElement === document.body) return null;
  if (dialogContainer instanceof Node && dialogContainer.contains(activeElement)) return null;
  return resolveMenuTrigger(activeElement);
}

/**
 * Devolve o foco ao elemento que abriu um diálogo controlado por estado.
 * O Radix só restaura o foco para o próprio `Trigger`; sem ele o foco cairia no `body`.
 * Use `data-autofocus` (e não `autoFocus`) para escolher o foco inicial: o `autoFocus` do React
 * dispara antes deste hook e apagaria a referência de retorno.
 */
export function useReturnFocus({ onOpenAutoFocus, onCloseAutoFocus }: ReturnFocusHandlers = {}) {
  const returnFocusTargetRef = useRef<HTMLElement | null>(null);

  const handleOpenAutoFocus = useCallback(
    (event: Event) => {
      returnFocusTargetRef.current = captureReturnFocusTarget(event.currentTarget);
      onOpenAutoFocus?.(event);
      if (event.defaultPrevented || !(event.currentTarget instanceof HTMLElement)) return;

      const preferredFocusTarget = event.currentTarget.querySelector<HTMLElement>(AUTOFOCUS_SELECTOR);
      if (!preferredFocusTarget) return;
      event.preventDefault();
      preferredFocusTarget.focus({ preventScroll: true });
    },
    [onOpenAutoFocus],
  );

  const handleCloseAutoFocus = useCallback(
    (event: Event) => {
      onCloseAutoFocus?.(event);
      const returnFocusTarget = returnFocusTargetRef.current;
      returnFocusTargetRef.current = null;
      if (event.defaultPrevented || !returnFocusTarget?.isConnected) return;
      event.preventDefault();
      returnFocusTarget.focus({ preventScroll: true });
    },
    [onCloseAutoFocus],
  );

  return { onOpenAutoFocus: handleOpenAutoFocus, onCloseAutoFocus: handleCloseAutoFocus };
}
