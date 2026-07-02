import { NextResponse } from "next/server";
import { google } from "googleapis";

const youtube = google.youtube({
  version: "v3",
  auth: process.env.YOUTUBE_API_KEY,
});

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q");

  if (!q) return NextResponse.json({ items: [] });

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
