"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap } from "leaflet";
import { Maximize, RefreshCw } from "lucide-react";
import { z } from "zod";
import {
  displaySessions,
  countdownTarget,
  exams,
  getExam,
} from "@/lib/timekeeper/exams";
import {
  avatarSeed,
  avatarUrl,
  ensureStudyIdentity,
  getStudyClient,
  studyLocation,
} from "@/lib/timekeeper/study-client";
import { generateDeterministicSessions } from "@/lib/timekeeper/demo-sessions";
import { CountdownDigits } from "./Countdown";
import { useNow } from "./useNow";
import "leaflet/dist/leaflet.css";

const sessionSchema = z.object({
  id: z.string(),
  latitude: z.number().min(6).max(38),
  longitude: z.number().min(68).max(98),
  city: z.string().nullable(),
  state: z.string().nullable(),
  avatar_seed: z.string().max(100),
  exam_slug: z.string().nullable(),
  exam_name: z.string().nullable(),
  subject: z.string().nullable(),
  started_at: z.string(),
  is_demonstration: z.boolean().optional(),
});
type StudySession = z.infer<typeof sessionSchema>;

export default function StudyMap({ examSlug }: { examSlug?: string }) {
  const element = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLDivElement>(null);
  const map = useRef<LeafletMap | null>(null);
  const markers = useRef<LayerGroup | null>(null);
  const now = useNow();
  const [selection, setSelection] = useState(examSlug ?? "");
  const [sessionName, setSessionName] = useState("");
  const [subject, setSubject] = useState("");
  const [sessions, setSessions] = useState<StudySession[]>([]);
  const [status, setStatus] = useState("Connecting…");
  const [message, setMessage] = useState("");
  const [joined, setJoined] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [busy, setBusy] = useState(false);
  const starts = useRef<number[]>([]);
  const exam = getExam(selection);
  const displayed = exam ? displaySessions(exam.sessions, now) : [];
  const session =
    displayed.find((item) => item.session === sessionName) ??
    displayed.find((item) => Date.parse(item.endDate ?? item.date) >= now) ??
    displayed[0];
  const demoSlot = Math.floor(now / 30_000);
  const demonstrations = useMemo(
    () => (demoSlot ? generateDeterministicSessions(demoSlot * 30_000) : []),
    [demoSlot],
  );

  const refresh = useCallback(async () => {
    const client = await getStudyClient();
    const { data, error } = await client.rpc("get_active_study_sessions");
    if (error) throw new Error("Could not refresh study sessions");
    setSessions(
      (Array.isArray(data) ? data : []).flatMap((item) => {
        const parsed = sessionSchema.safeParse(item);
        return parsed.success ? [parsed.data] : [];
      }),
    );
  }, []);

  useEffect(() => {
    let cancelled = false;
    let cleanup: (() => void) | undefined;
    let polling: ReturnType<typeof setInterval> | undefined;
    async function initialize() {
      const L = await import("leaflet");
      if (cancelled || !canvas.current) return;
      const instance = L.map(canvas.current, {
        scrollWheelZoom: false,
      }).setView([22.5, 79], 4);
      map.current = instance;
      markers.current = L.layerGroup().addTo(instance);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_nolabels/{z}/{x}/{y}{r}.png",
        {
          subdomains: "abcd",
          maxZoom: 18,
          attribution:
            '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>',
        },
      ).addTo(instance);
      L.tileLayer(
        "https://{s}.basemaps.cartocdn.com/light_only_labels/{z}/{x}/{y}{r}.png",
        { subdomains: "abcd", maxZoom: 18 },
      ).addTo(instance);
      const resize = new ResizeObserver(() => instance.invalidateSize());
      resize.observe(canvas.current);
      cleanup = () => {
        resize.disconnect();
        instance.remove();
        map.current = null;
        markers.current = null;
      };
      const client = await getStudyClient();
      await ensureStudyIdentity(client);
      if (cancelled) return;
      await refresh();
      if (cancelled) return;
      const channel = client
        .channel(`timekeeper-study-map-${crypto.randomUUID()}`)
        .on(
          "postgres_changes",
          { event: "*", schema: "public", table: "study_sessions" },
          () => {
            void refresh().catch(() => setStatus("Reconnecting…"));
          },
        )
        .subscribe((connection) => {
          if (!cancelled)
            setStatus(
              connection === "SUBSCRIBED"
                ? "Live"
                : connection === "CHANNEL_ERROR" || connection === "TIMED_OUT"
                  ? "Reconnecting…"
                  : "Connecting…",
            );
        });
      const removeMap = cleanup;
      cleanup = () => {
        void client.removeChannel(channel);
        removeMap();
      };
      polling = setInterval(() => {
        if (!cancelled && document.visibilityState === "visible")
          void refresh().catch(() => setStatus("Reconnecting…"));
      }, 30_000);
    }
    void initialize().catch(() => {
      if (!cancelled) {
        setStatus("Unavailable");
        setMessage(
          "The study map is temporarily unavailable. Countdown timers still work.",
        );
      }
    });
    return () => {
      cancelled = true;
      clearInterval(polling);
      cleanup?.();
    };
  }, [refresh]);

  useEffect(() => {
    let cancelled = false;
    void import("leaflet").then((L) => {
      if (cancelled || !markers.current) return;
      markers.current.clearLayers();
      for (const student of [...sessions, ...demonstrations]) {
        const picture = document.createElement("img");
        picture.src = avatarUrl(student.avatar_seed);
        picture.alt = student.is_demonstration
          ? "Example study session"
          : "Student studying";
        picture.width = 40;
        picture.height = 40;
        picture.className = `tk-avatar${student.is_demonstration ? " tk-avatar-demo" : ""}`;
        picture.referrerPolicy = "no-referrer";
        const marker = L.marker([student.latitude, student.longitude], {
          icon: L.divIcon({
            html: picture,
            className: "",
            iconSize: [40, 40],
            iconAnchor: [20, 20],
          }),
        });
        const popup = document.createElement("div");
        const heading = document.createElement("strong");
        heading.textContent = student.exam_name ?? "Study session";
        popup.append(heading);
        const details = document.createElement("p");
        details.textContent = [student.subject, student.city, student.state]
          .filter(Boolean)
          .join(" · ");
        popup.append(details);
        if (student.is_demonstration) {
          const label = document.createElement("small");
          label.textContent = "Example session";
          popup.append(label);
        }
        marker.bindPopup(popup);
        marker.addTo(markers.current);
      }
    });
    return () => {
      cancelled = true;
    };
  }, [sessions, demonstrations]);

  useEffect(() => {
    if (!joined) return;
    const heartbeat = setInterval(() => {
      void getStudyClient()
        .then((client) => client.rpc("heartbeat_session"))
        .then(({ error }) => {
          if (error)
            setMessage("Connection interrupted; retrying your study session.");
        })
        .catch(() =>
          setMessage("Connection interrupted; retrying your study session."),
        );
    }, 30_000);
    return () => {
      clearInterval(heartbeat); /* The server expires absent heartbeats. */
    };
  }, [joined]);

  async function toggleStudy() {
    setBusy(true);
    setMessage("");
    try {
      const client = await getStudyClient();
      if (joined) {
        const result = await client.rpc("end_study_session");
        if (result.error)
          throw new Error("Could not end the session. Please try again.");
        setJoined(false);
      } else {
        starts.current = starts.current.filter(
          (time) => time > Date.now() - 60_000,
        );
        if (starts.current.length >= 5)
          throw new Error(
            "Please wait a minute before starting another session.",
          );
        starts.current.push(Date.now());
        await ensureStudyIdentity(client);
        const location = await studyLocation();
        const result = await client.rpc("upsert_study_session", {
          p_exam_slug: exam?.slug ?? null,
          p_exam_name: exam?.name ?? null,
          p_subject: subject || null,
          p_session_name: session?.session ?? null,
          p_latitude: location.latitude,
          p_longitude: location.longitude,
          p_city: location.city,
          p_state: location.state,
          p_avatar_seed: avatarSeed(),
        });
        if (result.error || !result.data)
          throw new Error(
            "Could not start the study session. Please try again.",
          );
        setStartedAt(Date.now());
        setJoined(true);
      }
      await refresh();
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Could not update the study session",
      );
    } finally {
      setBusy(false);
    }
  }

  async function fullscreen() {
    try {
      if (document.fullscreenElement === element.current)
        await document.exitFullscreen();
      else await element.current?.requestFullscreen();
    } catch {
      setMessage("Fullscreen is not available in this browser.");
    }
  }

  return (
    <div>
      <div
        ref={element}
        className="tk-map"
        style={examSlug ? { height: 400 } : undefined}
      >
        <div
          ref={canvas}
          className="tk-map-canvas"
          role="region"
          aria-label="Live study sessions across India"
        />
        <div className="tk-map-toolbar">
          <div>
            <span role="status">{status}</span> ·{" "}
            <strong>{sessions.length}</strong> studying now
          </div>
          <div className="flex gap-1">
            <button
              type="button"
              className="tk-button"
              aria-label="Refresh study map"
              onClick={() =>
                void refresh().catch(() =>
                  setMessage("Could not refresh the map"),
                )
              }
            >
              <RefreshCw size={16} />
            </button>
            <button
              type="button"
              className="tk-button"
              aria-label="Fullscreen study map"
              onClick={() => void fullscreen()}
            >
              <Maximize size={16} />
            </button>
          </div>
        </div>
        {!examSlug && (
          <div className="tk-map-timer">
            <label htmlFor="study-exam" className="block text-xs mb-2">
              COUNTDOWN
            </label>
            <select
              id="study-exam"
              className="tk-field text-sm mb-2"
              value={selection}
              disabled={joined}
              onChange={(event) => {
                setSelection(event.target.value);
                setSubject("");
                setSessionName("");
              }}
            >
              <option value="">Select exam…</option>
              {exams.map((option) => (
                <option key={option.slug} value={option.slug}>
                  {option.name}
                </option>
              ))}
            </select>
            {displayed.length > 1 && (
              <select
                className="tk-field text-xs mb-3"
                aria-label="Study countdown session"
                value={session?.session ?? ""}
                onChange={(event) => setSessionName(event.target.value)}
              >
                {displayed.map((item) => (
                  <option key={item.session} value={item.session}>
                    {item.session}
                  </option>
                ))}
              </select>
            )}
            {session && (
              <>
                <CountdownDigits
                  target={countdownTarget(session, now)}
                  compact
                />
                {session.predicted && (
                  <p className="text-xs mt-2 themed-text-secondary">
                    Predicted · Awaiting official confirmation
                  </p>
                )}
              </>
            )}
          </div>
        )}
        <div className="tk-map-join">
          <div>
            <p className="font-medium">
              {joined ? "Studying!" : "🎯 Start Study Session"}
            </p>
            <p className="text-xs themed-text-secondary">
              {joined
                ? `${Math.floor(Math.max(0, now - startedAt) / 60000)} minutes studied`
                : "Join the map & track your progress"}
            </p>
            {exam && !joined && (
              <select
                aria-label="Study subject"
                className="tk-field text-xs mt-2"
                value={subject}
                onChange={(event) => setSubject(event.target.value)}
              >
                <option value="">All subjects</option>
                {exam.subjects.map((option) => (
                  <option key={option}>{option}</option>
                ))}
              </select>
            )}
          </div>
          <button
            type="button"
            className="tk-button"
            disabled={busy || status === "Unavailable"}
            onClick={() => void toggleStudy()}
          >
            {busy ? "Please wait…" : joined ? "End Session" : "Start"}
          </button>
        </div>
      </div>
      {message && (
        <p role="status" className="text-sm themed-text-secondary mt-3">
          {message}
        </p>
      )}
      <p className="text-xs themed-text-secondary mt-3">
        Only your approximate city location is shared, with up to 5km of
        randomization. Sessions update every 30 seconds. Gray markers show
        example sessions; they are excluded from the live count.
      </p>
    </div>
  );
}
