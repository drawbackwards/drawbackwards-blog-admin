import { NextResponse } from "next/server";

const GITHUB_TOKEN = process.env.GITHUB_ACTIONS_TOKEN ?? "";

export async function GET() {
  const resp = await fetch(
    "https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/actions/workflows/scrape-topics.yml/runs?per_page=1",
    {
      headers: {
        Authorization: `Bearer ${GITHUB_TOKEN}`,
        Accept: "application/vnd.github+json",
      },
      cache: "no-store",
    }
  );

  if (!resp.ok) return NextResponse.json({ status: "unknown" });

  const data = await resp.json();
  const run = data.workflow_runs?.[0];
  if (!run) return NextResponse.json({ status: "unknown" });

  return NextResponse.json({
    status: run.status,        // queued | in_progress | completed
    conclusion: run.conclusion, // success | failure | null
    runId: run.id,
  });
}
