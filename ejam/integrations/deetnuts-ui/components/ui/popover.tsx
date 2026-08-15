"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

export { PopoverContent } from "@ejam/ui/components/ui/popover-content";
export { PopoverTrigger } from "@ejam/ui/components/ui/popover-trigger";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export { Popover };
