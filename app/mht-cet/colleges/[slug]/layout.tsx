import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";

export default function CollegeDetailLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <EjamPageLayout chrome="document">{children}</EjamPageLayout>;
}
