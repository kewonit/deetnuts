"use client";

import dynamic from "next/dynamic";

/** Agent Sync server (agentation-mcp). Omit unless this URL is reachable. */
const agentationEndpoint = process.env.NEXT_PUBLIC_AGENTATION_ENDPOINT;

const AgentationOverlay =
  process.env.NODE_ENV === "development"
    ? dynamic(
        () =>
          import("agentation").then(({ Agentation }) => {
            function DevAgentation() {
              return agentationEndpoint ? (
                <Agentation endpoint={agentationEndpoint} />
              ) : (
                <Agentation />
              );
            }
            return DevAgentation;
          }),
        { ssr: false },
      )
    : () => null;

export function AgentationDev() {
  return <AgentationOverlay />;
}
