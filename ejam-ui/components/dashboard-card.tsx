import type * as React from "react";
import { Card } from "@/ejam-ui/components/ui/card";
import { cn } from "@/ejam-ui/lib/utils";

export function DashboardCard({
  className,
  ...props
}: React.ComponentProps<typeof Card>) {
  return (
    <Card
      className={cn("rounded-none bg-background shadow-none ring-0", className)}
      {...props}
    />
  );
}
