"use server";

import { createClient } from "@/lib/supabase/server";

export async function updateTopicStatus(
  topicId: string,
  status: "approved" | "rejected"
) {
  const supabase = createClient();
  await supabase.from("topics").update({ status }).eq("id", topicId);
}
