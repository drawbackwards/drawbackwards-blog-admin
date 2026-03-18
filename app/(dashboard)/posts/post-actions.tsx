"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { updatePostStatus } from "./actions";

export default function PostActions({
  postId,
  status,
}: {
  postId: string;
  status: string;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function handleApprove() {
    setLoading(true);
    await updatePostStatus(postId, "approved");
    router.refresh();
    setLoading(false);
  }

  if (status === "approved" || status === "published") return null;

  return (
    <div className="flex gap-2">
      <Button
        size="sm"
        variant="outline"
        className="text-xs h-7"
        onClick={() => router.push(`/posts/${postId}/edit`)}
      >
        Edit
      </Button>
      <Button
        size="sm"
        className="text-xs h-7 bg-gray-900 hover:bg-gray-700 text-white"
        disabled={loading}
        onClick={handleApprove}
      >
        {loading ? "…" : "Mark Approved"}
      </Button>
    </div>
  );
}
