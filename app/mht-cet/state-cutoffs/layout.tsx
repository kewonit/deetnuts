import type { Metadata } from "next";

import NuqsRouteAdapter from "@/components/NuqsRouteAdapter";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "MHT-CET State Cutoffs",
  description:
    "Explore official Maharashtra state MHT-CET cutoffs by year, round, college, program, and seat pool.",
  alternates: { canonical: "/mht-cet/state-cutoffs" },
};

export default function StateCutoffsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsRouteAdapter>
      {children}
      <Toaster position="top-right" richColors closeButton />
    </NuqsRouteAdapter>
  );
}
