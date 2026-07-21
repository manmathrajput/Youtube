import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { google } from "googleapis";
import { enforceRateLimit } from "@/lib/rateLimit";

export async function GET(request: Request) {
  const limited = enforceRateLimit(request, "liked", 30, 60_000);
  if (limited) return limited;

  const session = await getServerSession(authOptions);

  if (!session || !(session as any).accessToken) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // The refresh token is gone or was revoked — the user has to reconnect.
  if ((session as any).error === "RefreshAccessTokenError") {
    return NextResponse.json(
      { error: "reauth_required", message: "Please reconnect your YouTube account" },
      { status: 401 }
    );
  }

  try {
    const oauth2Client = new google.auth.OAuth2();
    oauth2Client.setCredentials({ access_token: (session as any).accessToken });

    const youtube = google.youtube({
      version: "v3",
      auth: oauth2Client,
    });

    const response = await youtube.videos.list({
      part: ["snippet"],
      myRating: "like",
      maxResults: 12,
    });

    const items = response.data.items?.map((item) => ({
      id: item.id,
      title: item.snippet?.title,
      thumbnail: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.default?.url,
      channelTitle: item.snippet?.channelTitle,
      publishedAt: item.snippet?.publishedAt,
    })) || [];

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Liked Videos Error:", error);
    return new NextResponse("Failed to fetch liked videos", { status: 500 });
  }
}
