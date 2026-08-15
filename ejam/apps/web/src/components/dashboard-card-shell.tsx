import { predictorHeaderStripClass } from "@/components/app-layout";
import { DashboardCard } from "@/components/dashboard-card";
import { DecorIcon } from "@/components/decor-icon";
import { CardContent, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function DashboardCardShell({
  children,
  header,
  headerExtra,
  toolbar,
  footer,
  contentClassName,
  className,
}: {
  children: React.ReactNode;
  header?: React.ReactNode;
  headerExtra?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  className?: string;
}) {
  const showHeader = header ?? headerExtra ?? toolbar;

  return (
    <DashboardCard
      className={cn(
        "relative h-full min-h-0 w-full min-w-0 gap-0 overflow-visible py-0",
        className,
      )}
    >
      <DecorIcon position="top-left" />
      <DecorIcon position="top-right" />
      <DecorIcon position="bottom-left" />
      <DecorIcon position="bottom-right" />
      {showHeader ? (
        <CardHeader
          className={cn(
            "relative shrink-0 overflow-visible rounded-none border-b px-4 pt-4 pb-4",
            predictorHeaderStripClass,
          )}
        >
          <DecorIcon position="bottom-left" />
          <DecorIcon position="bottom-right" />
          <div className="flex min-w-0 flex-row items-start justify-between gap-3 sm:gap-4">
            {header ? (
              <div className="flex min-w-0 flex-1 flex-col gap-1">{header}</div>
            ) : (
              <div className="min-w-0 flex-1" />
            )}
            {headerExtra}
          </div>
          {toolbar ? (
            <div className="mt-3 min-w-0 border-t border-border pt-3">
              {toolbar}
            </div>
          ) : null}
        </CardHeader>
      ) : null}
      <CardContent
        className={cn(
          "flex min-h-0 min-w-0 flex-1 flex-col px-0 py-0",
          contentClassName,
        )}
      >
        {children}
      </CardContent>
      {footer}
    </DashboardCard>
  );
}
