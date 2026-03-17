"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updateTopicStatus } from "./actions";

export default function TopicActions({ topicId }: { topicId: string }) {
  const [loading, setLoading] = useState<"reject" | "draft" | null>(null);
  const [queued, setQueued] = useState(false);
  const router = useRouter();

  async function handleReject() {
    setLoading("reject");
    await updateTopicStatus(topicId, "rejected");
    router.refresh();
    setLoading(null);
  }

  async function handleDraft() {
    setLoading("draft");

    const resp = await fetch("/api/generate-draft", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ topicId }),
    });

    if (resp.ok) {
      await updateTopicStatus(topicId, "approved");
      setQueued(true);
      router.refresh();
    } else {
      const { error } = await resp.json();
      alert(`Failed to trigger draft: ${error}`);
    }

    setLoading(null);
  }

  if (queued) {
    return (
      <span className="text-xs text-gray-400 shrink-0">Generating...</span>
    );
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7"
        disabled={!!loading}
        onClick={handleReject}
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
      <Button
        size="sm"
        className="text-xs h-7 bg-gray-900 hover:bg-gray-700"
        disabled={!!loading}
        onClick={handleDraft}
      >
        {loading === "draft" ? "Queuing..." : "Draft this"}
      </Button>
    </div>
  );
}
