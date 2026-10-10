import type { ReactNode } from "react";
import { cn } from "../ui/utils";

interface PageContainerProps {
  children: ReactNode;
  width?: "full" | "narrow";
  className?: string;
}

export function PageContainer({ children, width = "full", className }: PageContainerProps) {
  return (
    <div className={cn("w-full", width === "narrow" && "flex justify-center")}>
      <div
        className={cn(
          "w-full px-4 py-6 sm:px-6 lg:px-[37px] lg:py-[38px]",
          width === "narrow" && "max-w-4xl lg:px-8",
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function PageHeader({ title, description, actions }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0 flex-1">
        <h1 className="mb-1 text-[24px] font-bold leading-[1.5] text-[#ebe9e9] sm:text-[28px] lg:text-[32px]">{title}</h1>
        {description && <p className="text-[14px] font-semibold leading-[1.5] text-[#bfbbbc] sm:text-[16px]">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-3">{actions}</div>}
    </header>
  );
}

export function HorizontalScroller({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="-mx-4 overflow-x-auto scrollbar-hide sm:-mx-6 lg:mx-0" role="region" aria-label={label} tabIndex={0}>
      <div className="flex gap-4 px-4 sm:px-6 lg:px-0">{children}</div>
    </div>
  );
}
