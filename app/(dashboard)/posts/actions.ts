"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updatePostStatus(
  postId: string,
  status: "review" | "approved" | "scheduled" | "published"
) {
  const supabase = createClient();
  await supabase.from("posts").update({ status }).eq("id", postId);
  revalidatePath("/posts");
}

export async function schedulePost(postId: string, publishDate: string) {
  const supabase = createClient();
  await supabase
    .from("posts")
    .update({ status: "scheduled", publish_date: publishDate })
    .eq("id", postId);
  revalidatePath("/posts");
}
