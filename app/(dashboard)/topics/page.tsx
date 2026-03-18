import { unstable_noStore as noStore } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { Badge } from "@/components/ui/badge";
import TopicActions from "./topic-actions";
import RunScraperButton from "./run-scraper-button";

export const dynamic = "force-dynamic";

const audienceColors: Record<string, string> = {
  PM: "bg-blue-50 text-blue-700",
  "UX Leader": "bg-purple-50 text-purple-700",
  CEO: "bg-amber-50 text-amber-700",
  All: "bg-gray-100 text-gray-600",
};

export default async function TopicsPage() {
  noStore();
  const supabase = createClient();

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("scraped_at", { ascending: false });

  const pending = topics?.filter((t) => t.status === "pending") ?? [];
  const approved = topics?.filter((t) => t.status === "approved") ?? [];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-gray-900">Topics</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            {pending.length} pending{approved.length > 0 ? ` · ${approved.length} queued` : ""}
          </p>
        </div>
        <RunScraperButton />
      </div>

      {pending.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          No pending topics. Run the scraper to find new ones.
        </p>
      )}

      <div className="space-y-2">
        {pending.map((topic) => (
          <div
            key={topic.id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-medium text-gray-900 text-sm">
                  {topic.title}
                </span>
                {topic.audience && (
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      audienceColors[topic.audience] ?? audienceColors.All
                    }`}
                  >
                    {topic.audience}
                  </span>
                )}
                {topic.theme && (
                  <Badge variant="outline" className="text-xs capitalize">
                    {topic.theme}
                  </Badge>
                )}
              </div>

              {topic.summary && (
                <p className="text-sm text-gray-500 leading-snug line-clamp-2">
                  {topic.summary}
                </p>
              )}

              {topic.source_urls?.length > 0 && (
                <div className="flex gap-2 flex-wrap">
                  {topic.source_urls.slice(0, 3).map((url: string) => {
                    const domain = url.replace(/https?:\/\/(www\.)?/, "").split("/")[0];
                    return (
                      <a
                        key={url}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-gray-400 hover:text-gray-700 underline underline-offset-2"
                      >
                        {domain}
                      </a>
                    );
                  })}
                </div>
              )}
            </div>

            <TopicActions topicId={topic.id} />
          </div>
        ))}
      </div>

      {approved.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">Queued for drafting</p>
          {approved.map((topic) => (
            <div
              key={topic.id}
              className="bg-white border border-gray-100 rounded-lg p-3 flex items-center justify-between gap-4 opacity-60"
            >
              <span className="text-sm text-gray-700">{topic.title}</span>
              <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full shrink-0">
                queued
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
