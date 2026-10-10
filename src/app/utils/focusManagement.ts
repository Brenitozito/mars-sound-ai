const OPEN_MODAL_DIALOG_SELECTOR = "[role='dialog'][data-state='open'], [role='alertdialog'][data-state='open']";

export function isFocusInsideOpenDialog(): boolean {
  return document.activeElement?.closest(OPEN_MODAL_DIALOG_SELECTOR) != null;
}

// Itens de menu são desmontados quando o menu fecha; o alvo estável é o botão que abriu o menu.
export function resolveMenuTrigger(element: HTMLElement): HTMLElement {
  let currentElement = element;
  let menu = currentElement.closest<HTMLElement>("[role='menu']");
  while (menu) {
    const triggerId = menu.getAttribute("aria-labelledby");
    const trigger = triggerId ? document.getElementById(triggerId) : null;
    if (!trigger) break;
    currentElement = trigger;
    menu = currentElement.closest<HTMLElement>("[role='menu']");
  }
  return currentElement;
}
