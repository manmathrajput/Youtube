import { NextResponse } from "next/server";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "suggestions", 120, 60_000);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q || q.length > 200) return NextResponse.json([]);

  try {
    const res = await fetch(
      `http://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(
        q
      )}`
    );
    const data = await res.json();
    return NextResponse.json(data[1] || []);
  } catch (error) {
    return NextResponse.json([]);
  }
}
