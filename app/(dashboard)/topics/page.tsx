import { unstable_noStore as noStore } from "next/cache";
import Link from "next/link";
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

function nextMondayAt9UTC(): string {
  const now = new Date();
  const day = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const daysUntilMonday = day === 1 && now.getUTCHours() < 9 ? 0 : (8 - day) % 7 || 7;
  const next = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilMonday,
    9, 0, 0
  ));
  return next.toLocaleString("en-US", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  });
}

const tabs = ["pending", "approved", "rejected"] as const;
type Tab = (typeof tabs)[number];

export default async function TopicsPage({
  searchParams,
}: {
  searchParams: { tab?: string };
}) {
  noStore();
  const supabase = createClient();

  const activeTab: Tab = (tabs as readonly string[]).includes(searchParams.tab ?? "")
    ? (searchParams.tab as Tab)
    : "pending";

  const { data: topics } = await supabase
    .from("topics")
    .select("*")
    .order("scraped_at", { ascending: false });

  const counts = {
    pending: topics?.filter((t) => t.status === "pending").length ?? 0,
    approved: topics?.filter((t) => t.status === "approved").length ?? 0,
    rejected: topics?.filter((t) => t.status === "rejected").length ?? 0,
  };

  const visible = topics?.filter((t) => t.status === activeTab) ?? [];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-gray-900">Topics</h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            Next Scrape: {nextMondayAt9UTC()}
          </span>
          <RunScraperButton />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-gray-100">
        {tabs.map((tab) => (
          <Link
            key={tab}
            href={`/topics?tab=${tab}`}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 -mb-px transition-colors ${
              activeTab === tab
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            {tab}
            {counts[tab] > 0 && (
              <span className="ml-1.5 text-xs text-gray-400">
                {counts[tab]}
              </span>
            )}
          </Link>
        ))}
      </div>

      {/* Empty state */}
      {visible.length === 0 && (
        <p className="text-sm text-gray-400 py-8 text-center">
          {activeTab === "pending"
            ? "No pending topics. Run the scraper to find new ones."
            : `No ${activeTab} topics.`}
        </p>
      )}

      {/* Topic list */}
      <div className="space-y-2">
        {visible.map((topic) => (
          <div
            key={topic.id}
            className="bg-white border border-gray-100 rounded-lg p-4 flex items-start justify-between gap-4"
          >
            <div className="space-y-1.5 min-w-0">
              <span className="font-bold text-gray-900 text-base">
                {topic.title}
              </span>

              {topic.summary && (
                <p className="text-sm text-gray-500 leading-snug line-clamp-2">
                  {topic.summary}
                </p>
              )}

              <div className="flex items-center gap-2 flex-wrap">
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
                {topic.source_urls?.length > 0 && (
                  <>
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
                  </>
                )}
                {topic.scraped_at && (
                  <span className="text-xs text-gray-300">
                    {new Date(topic.scraped_at).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </span>
                )}
              </div>
            </div>

            {activeTab === "pending" && <TopicActions topicId={topic.id} />}
          </div>
        ))}
      </div>
    </div>
  );
}
