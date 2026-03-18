import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const GITHUB_TOKEN = process.env.GITHUB_ACTIONS_TOKEN ?? "";
const REPO = "drawbackwards/drawbackwards-blog-content";

export async function POST(request: Request) {
  const { postId, body, sha, branch, slug, frontmatter } = await request.json();

  if (!body || !sha || !branch || !slug) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const path = `content/blog/${slug}.md`;
  const fullContent = frontmatter + body;
  const encoded = Buffer.from(fullContent).toString("base64");

  const resp = await fetch(
    `https://api.github.com/repos/${REPO}/contents/${path}`,
    {
      method: "PUT",
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        message: `Edit draft: ${slug}`,
        content: encoded,
        sha,
        branch,
      }),
    }
  );

  if (!resp.ok) {
    const err = await resp.json();
    return NextResponse.json({ error: err.message ?? "GitHub error" }, { status: resp.status });
  }

  // Mark post as "Editing" (review) if it was still on first draft
  if (postId) {
    const supabase = createClient();
    await supabase
      .from("posts")
      .update({ status: "review" })
      .eq("id", postId)
      .eq("status", "drafting");
  }

  return NextResponse.json({ ok: true });
}
