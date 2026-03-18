import { NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@/lib/supabase/server";

const SIGNING_SECRET = process.env.SLACK_SIGNING_SECRET ?? "";
const GITHUB_ACTIONS_TOKEN = process.env.GITHUB_ACTIONS_TOKEN ?? "";
const WORKFLOW_URL =
  "https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/actions/workflows/generate-draft.yml/dispatches";

// ─── Slack signature verification ─────────────────────────────────────────────

function verifySlackSignature(
  timestamp: string,
  rawBody: string,
  signature: string
): boolean {
  // Reject stale requests (> 5 minutes old)
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - parseInt(timestamp, 10)) > 300) return false;

  const sigBase = `v0:${timestamp}:${rawBody}`;
  const expected =
    "v0=" +
    crypto
      .createHmac("sha256", SIGNING_SECRET)
      .update(sigBase)
      .digest("hex");

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expected, "utf8"),
      Buffer.from(signature, "utf8")
    );
  } catch {
    return false;
  }
}

// ─── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  const rawBody = await request.text();
  const timestamp = request.headers.get("x-slack-request-timestamp") ?? "";
  const signature = request.headers.get("x-slack-signature") ?? "";

  // Verify signature when secret is configured
  if (SIGNING_SECRET) {
    if (!verifySlackSignature(timestamp, rawBody, signature)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  }

  // Slack sends payload as form-encoded JSON string
  const params = new URLSearchParams(rawBody);
  let payload: Record<string, unknown>;
  try {
    payload = JSON.parse(params.get("payload") ?? "{}");
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const actions = payload.actions as Array<Record<string, unknown>> | undefined;
  const action = actions?.[0];

  if (!action || action.action_id !== "draft_topic") {
    // Unknown action — ack and ignore
    return new Response("", { status: 200 });
  }

  const topicId = action.value as string;
  const responseUrl = payload.response_url as string | undefined;

  if (!topicId) {
    return new Response("", { status: 200 });
  }

  // ── Look up topic title from Supabase ──────────────────────────────────────
  const supabase = createClient();
  const { data: topic } = await supabase
    .from("topics")
    .select("title")
    .eq("id", topicId)
    .single();

  const topicTitle = (topic as { title?: string } | null)?.title ?? "topic";

  // ── Mark topic as approved in Supabase ────────────────────────────────────
  await supabase
    .from("topics")
    .update({ status: "approved" })
    .eq("id", topicId);

  // ── Trigger GitHub Actions workflow ───────────────────────────────────────
  let workflowOk = false;
  if (GITHUB_ACTIONS_TOKEN) {
    const resp = await fetch(WORKFLOW_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GITHUB_ACTIONS_TOKEN}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main", inputs: { topic_id: topicId } }),
    });
    workflowOk = resp.ok || resp.status === 204;
  }

  // ── Update the Slack message in-place ─────────────────────────────────────
  if (responseUrl) {
    const statusText = workflowOk
      ? `✅ *${topicTitle}* is queued for drafting. You'll get a link in Slack when the PR is ready.`
      : `⚠️ *${topicTitle}* was approved but the workflow trigger failed. Check GitHub Actions or use the dashboard.`;

    await fetch(responseUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        replace_original: false,
        response_type: "in_channel",
        text: statusText,
      }),
    });
  }

  // Slack requires a 200 within 3 seconds
  return new Response("", { status: 200 });
}
