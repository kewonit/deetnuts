import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";
import { MhtFooter } from "@/components/admissions/MhtFooter";
import { MhtNavbar } from "@/components/admissions/MhtNavbar";
import { googleSans } from "@/components/admissions/mht-font";
import "@/components/admissions/mht-base.css";

export default function MhtCetLayout({ children }: { children: React.ReactNode }) {
  return (
    <EjamPageLayout chrome="document" className={googleSans.variable}>
      <div className="mht">
        <MhtNavbar />
        <div className="mht-body">{children}</div>
        <MhtFooter />
      </div>
    </EjamPageLayout>
  );
}
