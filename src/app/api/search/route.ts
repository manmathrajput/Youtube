import { NextResponse } from "next/server";
import { google } from "googleapis";
import { enforceRateLimit } from "@/lib/rateLimit";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

// Search hits the quota-limited YouTube Data API, so cap junk traffic that
// could burn the daily quota.
const SEARCH_LIMIT = 40; // per minute, per IP
const SEARCH_WINDOW = 60_000;

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "search", SEARCH_LIMIT, SEARCH_WINDOW);
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({ items: [] });

  // Bound the query length — no legitimate search needs to be huge.
  if (q.length > 200) {
    return NextResponse.json({ items: [], error: "Query too long" }, { status: 400 });
  }

  try {
    const response = await youtube.search.list({
      part: ["snippet"],
      q,
      maxResults: 12,
      type: ["video"],
    });

    const items = response.data.items?.map((item) => ({
      id: item.id?.videoId,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("YouTube API Error:", error);
    return NextResponse.json({ items: [], error: "Failed to fetch videos" }, { status: 500 });
  }
}
