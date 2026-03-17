import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data, error } = await supabase.from("topics").select("id, title, status").limit(5);
  return NextResponse.json({ count: data?.length, data, error });
}
