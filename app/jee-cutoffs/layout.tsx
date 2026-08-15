import { JeeCutoffShell } from "@/components/jee-cutoffs/JeeCutoffShell";
import "./cutoffs.css";

export default function Layout({ children }: { children: React.ReactNode }) {
  return <JeeCutoffShell>{children}</JeeCutoffShell>;
}
