import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import DraftEditor from "./draft-editor";

export const dynamic = "force-dynamic";

async function fetchMarkdown(branch: string, slug: string) {
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
  return {
    content: Buffer.from(data.content, "base64").toString("utf-8"),
    sha: data.sha as string,
  };
}

export default async function EditPage({ params }: { params: { id: string } }) {
  noStore();
  const supabase = createClient();

  const { data: post } = await supabase
    .from("posts")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!post) return <p className="p-8 text-sm text-gray-400">Post not found.</p>;

  const file = await fetchMarkdown(post.branch_name, post.slug);

  if (!file) {
    return (
      <div className="p-8">
        <p className="text-sm text-gray-400">Could not load draft from GitHub.</p>
        <p className="text-xs text-gray-300 mt-1">Branch: {post.branch_name}</p>
      </div>
    );
  }

  // Separate frontmatter from body
  const frontmatterMatch = file.content.match(/^(---[\s\S]*?---\n)/);
  const frontmatter = frontmatterMatch?.[1] ?? "";
  const body = frontmatterMatch ? file.content.slice(frontmatter.length) : file.content;

  return (
    <DraftEditor
      postId={params.id}
      title={post.title}
      branch={post.branch_name}
      slug={post.slug}
      sha={file.sha}
      frontmatter={frontmatter}
      initialBody={body}
    />
  );
}
