import type { ReactNode } from "react";

interface SettingsPanelProps {
  title: string;
  description?: string;
  children: ReactNode;
}

export function SettingsPanel({ title, description, children }: SettingsPanelProps) {
  const headingId = `settings-${title.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <section aria-labelledby={headingId} className="w-full border border-[#30292b] bg-[#24191b]">
      <div className="flex flex-col gap-6 p-4 sm:p-6">
        <header className="flex flex-col gap-1">
          <h2 id={headingId} className="text-[20px] font-bold leading-[1.5] text-[#ebe9e9] sm:text-[24px]">
            {title}
          </h2>
          {description && <p className="text-[13px] text-[#bababa]">{description}</p>}
        </header>
        {children}
      </div>
    </section>
  );
}

export function SettingsRow({ title, description, action }: { title: string; description: string; action: ReactNode }) {
  return (
    <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
      <div className="flex flex-col gap-1">
        <p className="text-[16px] font-semibold leading-[1.5] text-[#ebe9e9]">{title}</p>
        <p className="text-[12px] text-[#bababa]">{description}</p>
      </div>
      {action}
    </div>
  );
}

export function toggleListItem<TItem>(items: readonly TItem[], item: TItem): TItem[] {
  return items.includes(item) ? items.filter((current) => current !== item) : [...items, item];
}

export function haveSameItems<TItem>(first: readonly TItem[], second: readonly TItem[]): boolean {
  return first.length === second.length && first.every((item) => second.includes(item));
}
