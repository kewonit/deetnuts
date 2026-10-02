import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MHT-CET All India Cutoffs",
  description:
    "Explore official MHT-CET all-India cutoff evidence by counselling round, college, and program.",
  alternates: { canonical: "/mht-cet/all-india-cutoffs" },
};

export default function AllIndiaCutoffsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
