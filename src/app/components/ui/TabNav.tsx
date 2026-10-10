import { useRef, type KeyboardEvent } from "react";
import { cn } from "./utils";

export interface TabDefinition<TTabId extends string> {
  id: TTabId;
  label: string;
}

interface TabNavProps<TTabId extends string> {
  tabs: ReadonlyArray<TabDefinition<TTabId>>;
  activeTabId: TTabId;
  onSelect: (tabId: TTabId) => void;
  idPrefix: string;
  ariaLabel: string;
  className?: string;
}

export function getTabPanelProps(idPrefix: string, tabId: string) {
  return {
    id: `${idPrefix}-panel-${tabId}`,
    role: "tabpanel" as const,
    "aria-labelledby": `${idPrefix}-tab-${tabId}`,
  };
}

/** Lista de abas acessível (padrão WAI-ARIA): setas e Home/End movem o foco e selecionam a aba. */
export function TabNav<TTabId extends string>({ tabs, activeTabId, onSelect, idPrefix, ariaLabel, className }: TabNavProps<TTabId>) {
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const focusTabAt = (index: number) => {
    const normalizedIndex = (index + tabs.length) % tabs.length;
    tabRefs.current[normalizedIndex]?.focus();
    onSelect(tabs[normalizedIndex].id);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const keyOffsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 };
    if (event.key in keyOffsets) focusTabAt(index + keyOffsets[event.key]);
    else if (event.key === "Home") focusTabAt(0);
    else if (event.key === "End") focusTabAt(tabs.length - 1);
    else return;
    event.preventDefault();
  };

  return (
    <div role="tablist" aria-label={ariaLabel} className={cn("flex items-center gap-3", className)}>
      {tabs.map((tab, index) => {
        const isActive = tab.id === activeTabId;
        return (
          <button
            key={tab.id}
            ref={(element) => {
              tabRefs.current[index] = element;
            }}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={isActive}
            aria-controls={`${idPrefix}-panel-${tab.id}`}
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(tab.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex min-h-11 items-center justify-center px-5 py-2 text-[14px] font-semibold whitespace-nowrap text-[#f8f8f8] transition-colors duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60",
              isActive ? "bg-gradient-to-r from-[#ff164c] from-[57%] to-[#ea5858]" : "border border-[#ff164c] hover:bg-[#ff164c]/10",
            )}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
