import ImportCountdowns from "@/components/timekeeper/ImportCountdowns";
export const metadata = {
  title: "Import TimeKeeper countdowns",
  robots: { index: false, follow: false },
  alternates: { canonical: "https://www.deetnuts.com/exam-countdown/import" },
};
export default function Page() {
  return <ImportCountdowns />;
}
