"use client";

import { useEffect, useState } from "react";

// One request per page load, shared by the desktop and mobile star buttons.
let starLabelRequest: Promise<string | null> | null = null;

function loadStarLabel() {
  starLabelRequest ??= fetch("/api/github-stars", { credentials: "omit" })
    .then((response) => (response.ok ? response.json() : null))
    .then((data: { label?: unknown } | null) =>
      typeof data?.label === "string" ? data.label : null,
    )
    .catch(() => null)
    .then((label) => {
      if (label === null) starLabelRequest = null;
      return label;
    });
  return starLabelRequest;
}

export function useGitHubStarLabel() {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void loadStarLabel().then((value) => {
      if (active) setLabel(value);
    });
    return () => {
      active = false;
    };
  }, []);

  return label;
}

export function GitHubStarCount() {
  const label = useGitHubStarLabel();

  return label ? (
    <span className="rounded-full border-2 border-black bg-white px-2 py-0.5 text-xs leading-none">
      {label}
    </span>
  ) : (
    <span className="text-xs leading-none text-gray-700">on GitHub</span>
  );
}
