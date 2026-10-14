import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";
import { MhtFooter } from "@/components/admissions/MhtFooter";
import { googleSans } from "@/components/admissions/mht-font";
import "@/components/admissions/mht-base.css";

// The page frame for MHT-CET, JEE and /creators: body and footer in the section's light
// and dark theme, under the site navbar. RouteAwareFooter skips routes that use it.
export function MhtShell({
  children,
  footer = "mht",
}: {
  children: React.ReactNode;
  footer?: "mht" | "jee";
}) {
  return (
    <EjamPageLayout chrome="document" className={googleSans.variable}>
      <div className="mht">
        <div className="mht-body">{children}</div>
        <MhtFooter variant={footer} />
      </div>
    </EjamPageLayout>
  );
}
