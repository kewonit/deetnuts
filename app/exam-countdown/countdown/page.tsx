import CustomCountdowns from "@/components/timekeeper/CustomCountdowns";
import JsonLd from "@/components/timekeeper/JsonLd";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";
export const metadata = timekeeperMetadata(
  "/exam-countdown/countdown",
  "Custom Countdown Timer",
  "Create personalized countdown timers for your important events, exams and study goals. Save, edit, share and export your TimeKeeper countdowns.",
);
export default function Page() {
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8 mb-8">
      <JsonLd
        value={pageSchema(
          "/exam-countdown/countdown",
          "Custom Countdown Timer",
          "Create and save personalized countdowns for exams and important events.",
        )}
      />
      <CustomCountdowns />
    </main>
  );
}
