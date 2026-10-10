import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactElement } from "react";
import { cn } from "./utils";

interface IconTooltipProps {
  label: string;
  /** Precisa ser um único elemento focável que repasse ref e props (ex.: `<button>`). */
  children: ReactElement;
  side?: "top" | "right" | "bottom" | "left";
  className?: string;
}

/**
 * Tooltip para botões só com ícone. O texto complementa o `aria-label` do botão para quem usa
 * mouse ou teclado; em telas de toque o Radix não abre tooltips, então o rótulo acessível continua
 * sendo a fonte principal.
 */
export function IconTooltip({ label, children, side = "top", className }: IconTooltipProps) {
  return (
    <TooltipPrimitive.Root>
      <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
      <TooltipPrimitive.Portal>
        <TooltipPrimitive.Content
          side={side}
          sideOffset={6}
          collisionPadding={8}
          className={cn(
            "z-[200] max-w-[240px] border border-[#30292b] bg-[#24191b] px-2.5 py-1.5 text-[12px] font-semibold leading-[1.3] text-[#f8f8f8] shadow-lg",
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95",
            className,
          )}
        >
          {label}
          <TooltipPrimitive.Arrow className="fill-[#24191b]" width={10} height={5} />
        </TooltipPrimitive.Content>
      </TooltipPrimitive.Portal>
    </TooltipPrimitive.Root>
  );
}
