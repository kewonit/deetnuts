"use client";
import { useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";

const StudyMap = dynamic(() => import("./StudyMap"), {
  ssr: false,
  loading: () => (
    <p className="p-6 text-sm themed-text-secondary">Loading study map…</p>
  ),
});
export default function LazyStudyMap({
  examSlug,
  eager = false,
}: {
  examSlug?: string;
  eager?: boolean;
}) {
  const container = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(eager);
  useEffect(() => {
    if (eager || !container.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: "150px" },
    );
    observer.observe(container.current);
    return () => observer.disconnect();
  }, [eager]);
  return (
    <div ref={container} style={{ minHeight: eager ? 500 : 400 }}>
      {visible ? (
        <StudyMap examSlug={examSlug} />
      ) : (
        <p className="p-6 text-sm themed-text-secondary">
          The live study map loads when you reach it.
        </p>
      )}
    </div>
  );
}
