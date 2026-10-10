import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "./utils";

function Switch(
  { className, ...props }: React.ComponentProps<typeof SwitchPrimitive.Root>
) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[22px] w-[46px] shrink-0 cursor-pointer items-center rounded-full border-0 transition-colors outline-none disabled:cursor-not-allowed disabled:opacity-50",
        "data-[state=checked]:bg-[#ff6387] data-[state=unchecked]:bg-[#5b4f51]",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[18px] rounded-full shadow-[0_1px_4px_rgba(0,0,0,0.4)] transition-transform",
          "data-[state=checked]:translate-x-[26px] data-[state=unchecked]:translate-x-[2px]",
          "data-[state=checked]:bg-[#ff164c] data-[state=unchecked]:bg-[#a19a9b]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
