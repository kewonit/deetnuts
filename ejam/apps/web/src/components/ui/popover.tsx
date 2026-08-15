"use client";

import { Popover as PopoverPrimitive } from "@base-ui/react/popover";

export { PopoverContent } from "@/components/ui/popover-content";
export { PopoverTrigger } from "@/components/ui/popover-trigger";

function Popover({ ...props }: PopoverPrimitive.Root.Props) {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

export { Popover };
