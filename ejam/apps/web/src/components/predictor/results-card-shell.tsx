import { DashboardCardShell } from "@/components/dashboard-card-shell";
import { CardDescription, CardTitle } from "@/components/ui/card";

const RESULTS_DESCRIPTION =
  "Programs matched to your rank, have fun exploring!";

export function ResultsCardShell({
  children,
  headerExtra,
  toolbar,
  footer,
  contentClassName,
  description = RESULTS_DESCRIPTION,
}: {
  children: React.ReactNode;
  headerExtra?: React.ReactNode;
  toolbar?: React.ReactNode;
  footer?: React.ReactNode;
  contentClassName?: string;
  description?: string | null;
}) {
  return (
    <DashboardCardShell
      header={
        <>
          <CardTitle className="text-pretty">Prediction results</CardTitle>
          {description ? (
            <CardDescription className="text-pretty">
              {description}
            </CardDescription>
          ) : null}
        </>
      }
      headerExtra={headerExtra}
      toolbar={toolbar}
      footer={footer}
      contentClassName={contentClassName}
    >
      {children}
    </DashboardCardShell>
  );
}
