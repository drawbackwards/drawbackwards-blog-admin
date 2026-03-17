"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function TopicActions({ topicId }: { topicId: string }) {
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const router = useRouter();
  const supabase = createClient();

  async function handleAction(action: "approved" | "rejected") {
    setLoading(action === "approved" ? "approve" : "reject");
    await supabase
      .from("topics")
      .update({ status: action })
      .eq("id", topicId);
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="flex gap-2 shrink-0">
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7"
        disabled={!!loading}
        onClick={() => handleAction("rejected")}
      >
        {loading === "reject" ? "..." : "Reject"}
      </Button>
      <Button
        size="sm"
        className="text-xs h-7 bg-gray-900 hover:bg-gray-700"
        disabled={!!loading}
        onClick={() => handleAction("approved")}
      >
        {loading === "approve" ? "..." : "Draft this"}
      </Button>
    </div>
  );
}
