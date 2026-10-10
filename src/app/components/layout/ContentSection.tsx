import { useId, type ReactNode } from "react";
import { Link } from "react-router";

interface ContentSectionProps {
  title: string;
  description?: ReactNode;
  seeAllHref?: string;
  children: ReactNode;
}

export function ContentSection({ title, description, seeAllHref, children }: ContentSectionProps) {
  const headingId = useId();

  return (
    <section aria-labelledby={headingId}>
      <div className="mb-4 flex items-end justify-between gap-4">
        <div className="min-w-0">
          <h2 id={headingId} className="text-lg font-semibold text-white sm:text-xl lg:text-[24px]">
            {title}
          </h2>
          {description && <div className="mt-1 text-[13px] text-[#a19a9b]">{description}</div>}
        </div>
        {seeAllHref && (
          <Link
            to={seeAllHref}
            aria-label={`Ver tudo: ${title}`}
            className="flex min-h-9 shrink-0 items-center text-sm text-[var(--color-text-muted)] transition-colors duration-150 hover:text-[var(--color-brand)] focus-visible:text-[var(--color-brand)] focus-visible:outline-none"
          >
            Ver tudo
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}
