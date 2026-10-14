import { MhtShell } from "@/components/admissions/MhtShell";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <MhtShell footer="jee">{children}</MhtShell>;
}
