import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import PostActions from "./post-actions";

export const dynamic = "force-dynamic";

const GITHUB_TOKEN = process.env.GITHUB_ACTIONS_TOKEN ?? "";

async function fetchFirstSentence(branch: string, slug: string): Promise<string> {
  try {
    const resp = await fetch(
      `https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/contents/content/blog/${slug}.md?ref=${branch}`,
      {
        headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, Accept: "application/vnd.github+json" },
        cache: "no-store",
      }
    );
    if (!resp.ok) return "";
    const data = await resp.json();
    const text = Buffer.from(data.content, "base64").toString("utf-8");
    // Strip frontmatter, find first real paragraph sentence
    const body = text.replace(/^---[\s\S]*?---\n/, "");
    const lines = body.split("\n").map((l: string) => l.trim()).filter((l: string) => l && !l.startsWith("#"));
    const first = lines[0] ?? "";
    // Strip markdown syntax and truncate
    const clean = first.replace(/[*_`\[\]]/g, "").replace(/\(https?:\/\/[^)]+\)/g, "");
    return clean.length > 160 ? clean.slice(0, 157) + "…" : clean;
  } catch {
    return "";
  }
}

const statusBadge: Record<string, { label: string; className: string }> = {
  drafting: { label: "First Draft", className: "bg-gray-100 text-gray-500" },
  review:   { label: "Editing",     className: "bg-yellow-50 text-yellow-700" },
  approved: { label: "Approved",    className: "bg-green-50 text-green-700" },
  scheduled:{ label: "Scheduled",   className: "bg-blue-50 text-blue-700" },
  published:{ label: "Published",   className: "bg-purple-50 text-purple-700" },
};

const tabs = ["pending", "approved"] as const;
type Tab = (typeof tabs)[number];

export default async function PostsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  noStore();
  const supabase = createClient();

  const activeTab: Tab = searchParams.tab === "approved" ? "approved" : "pending";

  const { data: posts, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) console.error("posts fetch error:", error);

  const pending  = posts?.filter((p) => p.status !== "approved" && p.status !== "published") ?? [];
  const approved = posts?.filter((p) => p.status === "approved" || p.status === "published") ?? [];
  const visible  = activeTab === "approved" ? approved : pending;

  // Fetch first sentences in parallel
  const excerpts = await Promise.all(
    visible.map((p) => fetchFirstSentence(p.branch_name, p.slug))
  );

  return (
    <div className="space-y-5">
      {/* Header */}
      <h1 className="text-xl font-semibold text-gray-900">Blog Drafts</h1>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map((tab) => {
          const count = tab === "approved" ? approved.length : pending.length;
          return (
            <Link
              key={tab}
              href={`/posts?tab=${tab}`}
              className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
                activeTab === tab
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"
              }`}
            >
              {tab}
              {count > 0 && (
                <span className="ml-1.5 text-xs text-gray-400">{count}</span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          {activeTab === "pending"
            ? "No drafts yet. Approve a topic to generate one."
            : "No approved drafts yet."}
        </p>
      )}

      {/* Post cards */}
      <div className="space-y-2">
        {visible.map((post, i) => {
          const badge = statusBadge[post.status] ?? statusBadge.drafting;
          return (
            <div
              key={post.id}
              className="bg-white border border-gray-100 rounded-lg p-4 flex items-start gap-4"
            >
              {/* Title + excerpt */}
              <div className="flex-1 min-w-0 space-y-1">
                <p className="font-bold text-gray-900 text-base">{post.title}</p>
                {excerpts[i] && (
                  <p className="text-sm text-gray-500 leading-snug">{excerpts[i]}</p>
                )}
                {post.pr_number && (
                  <a
                    href={`https://github.com/drawbackwards/drawbackwards-blog-content/pull/${post.pr_number}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
                  >
                    PR #{post.pr_number}
                  </a>
                )}
              </div>

              {/* Status badge — center column */}
              <div className="w-28 shrink-0 flex items-center pt-0.5">
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${badge.className}`}>
                  {badge.label}
                </span>
              </div>

              {/* Actions */}
              <div className="shrink-0">
                <PostActions postId={post.id} status={post.status} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
