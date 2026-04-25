"use client";

import { Button } from "@/components/ui/button";
import { useState } from "react";

export function QuestionReviewPanel({
  questionId,
  sourceApproved,
}: {
  questionId: string;
  sourceApproved: boolean;
}) {
  const [status, setStatus] = useState<string | null>(null);
  const [isSourceApproved, setIsSourceApproved] = useState(sourceApproved);

  async function review(action: "approved" | "rejected" | "approve_source") {
    setStatus("Saving");
    const response = await fetch(
      `/api/mht-cet/admin/questions/${questionId}/review`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      },
    );

    if (response.ok && action === "approve_source") {
      setIsSourceApproved(true);
    }

    setStatus(response.ok ? action : "Review failed");
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button
        disabled={!isSourceApproved}
        onClick={() => review("approved")}
        size="sm"
      >
        Approve
      </Button>
      {!isSourceApproved ? (
        <Button
          onClick={() => review("approve_source")}
          size="sm"
          variant="neutral"
        >
          Approve Source
        </Button>
      ) : null}
      <Button onClick={() => review("rejected")} size="sm" variant="neutral">
        Reject
      </Button>
      {status ? <span className="text-sm font-base">{status}</span> : null}
    </div>
  );
}
