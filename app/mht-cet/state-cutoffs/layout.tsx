import NuqsRouteAdapter from "@/components/NuqsRouteAdapter";
import { Toaster } from "sonner";

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
