import { Share2 } from "lucide-react";
import { shareLink } from "../../utils/share";
import { cn } from "../ui/utils";

interface ShareButtonProps {
  path: string;
  title: string;
  label: string;
  className?: string;
}

export function ShareButton({ path, title, label, className }: ShareButtonProps) {
  return (
    <button
      type="button"
      onClick={() => shareLink(path, title)}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-10 shrink-0 items-center justify-center text-[#ff164c] transition-opacity duration-150 hover:opacity-70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff164c]/60",
        className,
      )}
    >
      <Share2 className="size-5" />
    </button>
  );
}
