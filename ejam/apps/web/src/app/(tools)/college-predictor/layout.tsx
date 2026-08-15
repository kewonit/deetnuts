import { COLLEGE_PREDICTOR_LCP_PRELOAD } from "@/lib/static-image";

export default function CollegePredictorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={COLLEGE_PREDICTOR_LCP_PRELOAD}
        type="image/webp"
        fetchPriority="high"
      />
      {children}
    </>
  );
}
