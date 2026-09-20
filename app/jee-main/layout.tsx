import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";
import "../jee-cutoffs/cutoffs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <EjamPageLayout chrome="document">{children}</EjamPageLayout>;
}
