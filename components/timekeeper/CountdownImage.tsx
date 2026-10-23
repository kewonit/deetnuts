import {
  countdownTarget,
  examCycle,
  formatExamDate,
  nextSession,
  sessionLabel,
  timeRemaining,
  type Exam,
} from "@/lib/timekeeper/exams";

// Shared by the phone wallpaper and the share image. next/og supports flexbox
// and inline styles only.
export default function CountdownImage({
  exam,
  now,
  portrait,
}: {
  exam: Exam;
  now: number;
  portrait: boolean;
}) {
  const session = nextSession(exam.sessions, now);
  const target = session ? countdownTarget(session, now) : undefined;
  const remaining = target ? timeRemaining(target, now) : undefined;
  const label = `${exam.name} ${examCycle(exam, now)}`;
  const scale = portrait ? 1 : 0.62;
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: portrait ? "center" : "space-between",
        padding: portrait ? "0 96px" : "64px 80px",
        background: "#07120e",
        color: "#ecfdf5",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column" }}>
        <div style={{ display: "flex", fontSize: 88 * scale, fontWeight: 700 }}>
          {label}
        </div>
        {remaining && !remaining.expired ? (
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              marginTop: 24 * scale,
            }}
          >
            <div
              style={{
                display: "flex",
                fontSize: 360 * scale,
                fontWeight: 700,
                lineHeight: 1,
                color: "#10b981",
              }}
            >
              {remaining.days}
            </div>
            <div
              style={{ display: "flex", fontSize: 72 * scale, marginLeft: 24 }}
            >
              {remaining.days === 1 ? "day left" : "days left"}
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", fontSize: 72 * scale, marginTop: 24 }}>
            Under way
          </div>
        )}
        {session && target && (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              fontSize: 44 * scale,
              color: "#a7f3d0",
              marginTop: 32 * scale,
            }}
          >
            <div style={{ display: "flex" }}>{sessionLabel(session)}</div>
            {/* Estimates stay labelled; confirmed dates need no tag. */}
            <div style={{ display: "flex", marginTop: 8 * scale }}>
              {formatExamDate(target)}
              {session.predicted ? " (expected)" : ""}
            </div>
          </div>
        )}
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 32 * scale,
          color: "#6ee7b7",
          marginTop: portrait ? 160 : 0,
        }}
      >
        deetnuts.com/exam-countdown
      </div>
    </div>
  );
}
