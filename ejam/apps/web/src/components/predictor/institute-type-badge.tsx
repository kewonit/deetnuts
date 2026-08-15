import { Badge } from "@/components/ui/badge";

export function InstituteTypeBadge({ type }: { type: string }) {
  return (
    <Badge
      variant="outline"
      title={type}
      className="min-w-0 max-w-40 shrink truncate rounded-none font-mono text-[10px] text-muted-foreground"
    >
      {type}
    </Badge>
  );
}
