import { unstable_noStore as noStore } from "next/cache";
import { marked } from "marked";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export const dynamic = "force-dynamic";

async function fetchMarkdown(branch: string, slug: string): Promise<string | null> {
  const token = process.env.GITHUB_ACTIONS_TOKEN;
  const path = `content/blog/${slug}.md`;
  const url = `https://api.github.com/repos/drawbackwards/drawbackwards-blog-content/contents/${path}?ref=${branch}`;

  const resp = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: "application/vnd.github+json",
    },
    cache: "no-store",
  });

  if (!resp.ok) return null;
  const data = await resp.json();
  return Buffer.from(data.content, "base64").toString("utf-8");
}

export default async function PreviewPage({ params }: { params: { id: string } }) {
  noStore();
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) {
    return <p className="p-8 text-sm text-gray-400">Post not found.</p>;
  }

  const raw = await fetchMarkdown(post.branch_name, post.slug);

  if (!raw) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-400">Could not load draft from GitHub.</p>
        <p className="text-xs text-gray-300 mt-1">Branch: {post.branch_name}</p>
      </div>
    );
  }

  // Strip frontmatter before rendering
  const body = raw.replace(/^---[\s\S]*?---\n/, "");
  const html = await marked(body);

  return (
    <div className="max-w-3xl mx-auto py-10 px-6">
      <div className="mb-6 flex items-center justify-between">
        <Link
          href="/posts"
          className="text-sm text-gray-400 hover:text-gray-700"
        >
          ← Back to posts
        </Link>
        <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
          {post.branch_name}
        </span>
      </div>

      <article
        className="prose prose-gray max-w-none"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}
