import { Toaster } from "sonner";
import { COLLEGE_PREDICTOR_LCP_PRELOAD } from "@ejam/ui/lib/static-image";
import { cn } from "@ejam/ui/lib/utils";
import "./route.css";

export default function CollegePredictorLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <link rel="stylesheet" href="/ejam/ui.css" />
      <link
        rel="preload"
        as="image"
        href={COLLEGE_PREDICTOR_LCP_PRELOAD}
        type="image/webp"
        fetchPriority="high"
      />
      <div
        className={cn(
          "deetnuts-ejam-shell dark min-h-screen bg-background text-foreground antialiased",
          "font-sans",
        )}
      >
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{ style: { fontFamily: "var(--font-sans)" } }}
        />
      </div>
    </>
  );
}
