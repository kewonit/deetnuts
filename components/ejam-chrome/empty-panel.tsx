import { LoopIllustration } from "@ejam/ui/components/predictor/loop-illustration";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
} from "@ejam/ui/components/ui/empty";
import { PREDICTOR_ILLUSTRATIONS } from "@ejam/ui/lib/static-image";

export function EmptyPanel({
  title,
  description,
}: {
  title?: string;
  description: string;
}) {
  return (
    <Empty className="min-h-48 border border-border">
      <EmptyHeader>
        <EmptyMedia className="mb-0 aspect-square w-full max-w-48">
          <LoopIllustration src={PREDICTOR_ILLUSTRATIONS.empty} />
        </EmptyMedia>
        {title ? (
          <p className="font-heading text-sm font-medium tracking-tight text-foreground">
            {title}
          </p>
        ) : null}
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
