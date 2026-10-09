import LazyStudyMap from "@/components/timekeeper/LazyStudyMap";
import JsonLd from "@/components/timekeeper/JsonLd";
import { pageSchema, timekeeperMetadata } from "@/lib/timekeeper/metadata";
export const metadata = timekeeperMetadata(
  "/exam-countdown/study-map",
  "Live Study Map | Study Together Across India",
  "See fellow students preparing for competitive exams across India. Select your exam, track its countdown and join a live study session with an approximate city location.",
);
export default function Page() {
  return (
    <main className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-8">
      <JsonLd
        value={pageSchema(
          "/exam-countdown/study-map",
          "Live Study Map",
          "Study together with students across India using an approximate city location.",
        )}
      />
      <h1 className="font-serif italic text-xl mb-6">🗺️ Live Study Map</h1>
      <section className="themed-bg-secondary border border-dashed themed-border p-4 sm:p-6 rounded-lg mb-6">
        <h2 className="font-serif italic text-xl mb-2">
          Study Together, Across India
        </h2>
        <p className="text-sm themed-text-secondary">
          See fellow students preparing for competitive exams across the
          country. Select an exam, start your countdown, and join the live map
          to share your study session. Your exact location is never shared – we
          only show your city for privacy.
        </p>
      </section>
      <LazyStudyMap eager />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-6">
        {[
          [
            "🔒 Privacy First",
            "Your location is randomized within 5km for privacy. Only city names are shown.",
          ],
          [
            "⚡ Real-time Updates",
            "See students join and leave in real-time. Updates every 30 seconds.",
          ],
          [
            "🎯 Integrated Timer",
            "Select your exam and track the countdown while studying with others on the map.",
          ],
        ].map(([title, text]) => (
          <section
            key={title}
            className="themed-bg-secondary border border-dashed themed-border rounded-lg p-4"
          >
            <h2 className="text-sm mb-2">{title}</h2>
            <p className="text-xs themed-text-secondary">{text}</p>
          </section>
        ))}
      </div>
    </main>
  );
}
