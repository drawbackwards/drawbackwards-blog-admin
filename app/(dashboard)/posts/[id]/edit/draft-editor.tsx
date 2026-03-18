"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import Link from "next/link";
import "@uiw/react-md-editor/markdown-editor.css";
import "@uiw/react-markdown-preview/markdown.css";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

interface Props {
  postId: string;
  title: string;
  branch: string;
  slug: string;
  sha: string;
  frontmatter: string;
  initialBody: string;
}

export default function DraftEditor({
  postId,
  title,
  branch,
  slug,
  sha,
  frontmatter,
  initialBody,
}: Props) {
  const [body, setBody] = useState(initialBody);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setError(null);
    setSaved(false);

    const res = await fetch(`/api/save-draft/${postId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, sha, branch, slug, frontmatter }),
    });

    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Save failed");
    } else {
      setSaved(true);
    }
    setSaving(false);
  }

  return (
    <div className="flex flex-col h-screen">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3 min-w-0">
          <Link href="/posts" className="text-sm text-gray-400 hover:text-gray-700 shrink-0">
            ← Posts
          </Link>
          <span className="text-sm font-medium text-gray-900 truncate">{title}</span>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          {saved && <span className="text-xs text-green-600">Saved</span>}
          {error && <span className="text-xs text-red-500">{error}</span>}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-1.5 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-1 overflow-hidden" data-color-mode="light">
        <MDEditor
          value={body}
          onChange={(v) => setBody(v ?? "")}
          height="100%"
          preview="live"
          visibleDragbar={false}
        />
      </div>
    </div>
  );
}
