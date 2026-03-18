import { createClient } from "@/lib/supabase/server";
import PostActions from "./post-actions";

export const dynamic = "force-dynamic";

const statusColors: Record<string, string> = {
  drafting:  "bg-gray-100 text-gray-600",
  review:    "bg-yellow-50 text-yellow-700",
  approved:  "bg-green-50 text-green-700",
  scheduled: "bg-blue-50 text-blue-700",
  published: "bg-purple-50 text-purple-700",
};

export default async function PostsPage() {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from("posts")
    .select("*, topics(title)")
    .order("created_at", { ascending: false });

  const active = posts?.filter((p) => p.status !== "published") ?? [];
  const published = posts?.filter((p) => p.status === "published") ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-gray-900">Posts</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {active.length} in progress · {published.length} published
        </p>
      </div>

      {active.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          No posts yet. Approve a topic to generate a draft.
        </p>
      )}

      <div className="space-y-2">
        {active.map((post) => (
          <div
            key={post.id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">
                  {post.title}
                </span>
                <span
                  className={`text-xs px-2 py-0.5 rounded-full font-medium capitalize ${
                    statusColors[post.status] ?? statusColors.drafting
                  }`}
                >
                  {post.status}
                </span>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
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
                {post.preview_url && (
                  <a
                    href={post.preview_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
                  >
                    Preview
                  </a>
                )}
                {post.status === "scheduled" && post.publish_date && (
                  <span className="text-xs text-gray-400">
                    Publishes {new Date(post.publish_date).toLocaleDateString("en-US", {
                      month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit"
                    })}
                  </span>
                )}
              </div>
            </div>

            <PostActions postId={post.id} status={post.status} />
          </div>
        ))}
      </div>

      {published.length > 0 && (
        <details>
          <summary className="text-sm text-gray-400 cursor-pointer hover:text-gray-600 select-none">
            Published ({published.length})
          </summary>
          <div className="mt-2 space-y-2">
            {published.map((post) => (
              <div
                key={post.id}
                className="bg-white border border-gray-100 rounded-lg p-4 flex items-center justify-between gap-4 opacity-60"
              >
                <span className="text-sm text-gray-700">{post.title}</span>
                <span className="text-xs px-2 py-0.5 rounded-full font-medium capitalize bg-purple-50 text-purple-700">
                  published
                </span>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}
