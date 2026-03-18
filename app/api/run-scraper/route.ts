import { NextResponse } from "next/server";

const WORKFLOW_URL =
  "https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/actions/workflows/scrape-topics.yml/dispatches";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const count = String(body.count ?? 7);

  const token = process.env.GITHUB_ACTIONS_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "GITHUB_ACTIONS_TOKEN not set" },
      { status: 500 }
    );
  }

  const resp = await fetch(WORKFLOW_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
      "X-GitHub-Api-Version": "2022-11-28",
    },
    body: JSON.stringify({
      ref: "main",
      inputs: { count },
    }),
  });

  if (!resp.ok && resp.status !== 204) {
    const text = await resp.text();
    return NextResponse.json({ error: text }, { status: resp.status });
  }

  return NextResponse.json({ ok: true });
}
