"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { updatePostStatus, schedulePost } from "./actions";

type PostStatus = "drafting" | "review" | "approved" | "scheduled" | "published";

export default function PostActions({
  postId,
  status,
}: {
  postId: string;
  status: PostStatus;
}) {
  const [loading, setLoading] = useState(false);
  const [scheduling, setScheduling] = useState(false);
  const [date, setDate] = useState("");

  async function handle(action: () => Promise<void>) {
    setLoading(true);
    await action();
    setLoading(false);
  }

  if (status === "published") return null;

  return (
    <div className="flex items-center gap-2 shrink-0">
      {status === "drafting" && (
        <Button
          size="sm"
          variant="outline"
          className="text-xs h-7"
          disabled={loading}
          onClick={() => handle(() => updatePostStatus(postId, "review"))}
        >
          {loading ? "..." : "Mark ready"}
        </Button>
      )}

      {status === "review" && (
        <Button
          size="sm"
          className="text-xs h-7 bg-gray-900 hover:bg-gray-700"
          disabled={loading}
          onClick={() => handle(() => updatePostStatus(postId, "approved"))}
        >
          {loading ? "..." : "Approve"}
        </Button>
      )}

      {status === "approved" && !scheduling && (
        <>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            disabled={loading}
            onClick={() => setScheduling(true)}
          >
            Schedule
          </Button>
          <Button
            size="sm"
            className="text-xs h-7 bg-gray-900 hover:bg-gray-700"
            disabled={loading}
            onClick={() => handle(() => updatePostStatus(postId, "published"))}
          >
            {loading ? "..." : "Publish now"}
          </Button>
        </>
      )}

      {scheduling && (
        <div className="flex items-center gap-2">
          <input
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="text-xs border border-gray-200 rounded px-2 py-1 h-7"
          />
          <Button
            size="sm"
            className="text-xs h-7 bg-gray-900 hover:bg-gray-700"
            disabled={!date || loading}
            onClick={() => handle(() => schedulePost(postId, date))}
          >
            {loading ? "..." : "Confirm"}
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="text-xs h-7"
            onClick={() => setScheduling(false)}
          >
            Cancel
          </Button>
        </div>
      )}
    </div>
  );
}
