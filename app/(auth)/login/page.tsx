import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default function LoginPage({
  searchParams,
}: {
  searchParams: { message?: string };
}) {
  async function sendMagicLink(formData: FormData) {
    "use server";

    const email = formData.get("email") as string;
    const supabase = createClient();

    // Check whitelist
    const { data: allowed } = await supabase
      .from("allowed_emails")
      .select("email")
      .eq("email", email)
      .single();

    if (!allowed) {
      return redirect("/login?message=This+email+is+not+authorized.");
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
      },
    });

    if (error) {
      return redirect("/login?message=Could+not+send+magic+link.");
    }

    return redirect("/login?message=Check+your+email+for+a+login+link.");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Drawbackwards</h1>
          <p className="text-sm text-gray-500">Blog editorial dashboard</p>
        </div>

        <form action={sendMagicLink} className="space-y-3">
          <input
            name="email"
            type="email"
            placeholder="your@email.com"
            required
            className="w-full px-3 py-2 border border-gray-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
          <button
            type="submit"
            className="w-full px-3 py-2 bg-gray-900 text-white text-sm rounded-md hover:bg-gray-700 transition-colors"
          >
            Send magic link
          </button>
        </form>

        {searchParams.message && (
          <p className="text-sm text-center text-gray-600">
            {searchParams.message}
          </p>
        )}
      </div>
    </div>
  );
}
