import { NextResponse } from "next/server";

const WORKFLOW_URL =
  "https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/actions/workflows/generate-draft.yml/dispatches";

export async function POST(request: Request) {
  const { topicId } = await request.json();

  if (!topicId) {
    return NextResponse.json({ error: "topicId required" }, { status: 400 });
  }

  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) {
    return NextResponse.json({ error: "GITHUB_ACTIONS_TOKEN not set" }, { status: 500 });
  }

  const resp = await fetch(WORKFLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: { topic_id: topicId },
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    return NextResponse.json({ error: text }, { status: resp.status });
  }

  // GitHub returns 204 No Content on success
  return NextResponse.json({ ok: true });
}
