import { COLLEGE_PREDICTOR_LCP_PRELOAD } from "@ejam/ui/lib/static-image";
import { EjamPageLayout } from "@/components/ejam-chrome/ejam-page-layout";

export default function CollegePredictorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EjamPageLayout chrome="tool" toaster>
      <link
        rel="preload"
        as="image"
        href={COLLEGE_PREDICTOR_LCP_PRELOAD}
        type="image/webp"
        fetchPriority="high"
      />
      {children}
    </EjamPageLayout>
  );
}
