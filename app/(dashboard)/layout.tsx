import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="border-b bg-white px-6 py-3 flex items-center gap-6">
        <span className="font-semibold text-gray-900">Drawbackwards</span>
        <div className="flex gap-4 text-sm">
          <Link href="/topics" className="text-gray-600 hover:text-gray-900 transition-colors">
            Topics
          </Link>
          <Link href="/posts" className="text-gray-600 hover:text-gray-900 transition-colors">
            Posts
          </Link>
        </div>
      </nav>
      <main className="max-w-5xl mx-auto px-6 py-8">
        {children}
      </main>
    </div>
  );
}
