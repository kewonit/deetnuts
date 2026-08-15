import type { Metadata } from "next";
import { AppShell } from "@ejam/ui/components/app-shell";
import { Dashboard } from "@ejam/ui/components/predictor/dashboard";

export const metadata: Metadata = {
  title: "College Predictor",
  description:
    "Estimate admission chances across JoSAA, CSAB, and JEE Advanced from your rank.",
};

export const dynamic = "force-dynamic";

export default function CollegePredictorPage() {
  return (
    <AppShell mhtCetEnabled={false}>
      <Dashboard />
    </AppShell>
  );
}
