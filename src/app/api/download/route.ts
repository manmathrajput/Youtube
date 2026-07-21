import { NextResponse } from "next/server";
// @ts-ignore
import yt from "@vreden/youtube_scraper";
import { enforceRateLimit, isValidVideoId } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

// Each download proxies a few MB of audio, so keep this tighter than search.
const DOWNLOAD_LIMIT = 20; // requests
const DOWNLOAD_WINDOW = 60_000; // per minute, per IP

// Highest audio bitrate the scraper/savetube exposes.
const QUALITY = 320;

function sanitizeFilename(name: string): string {
  return (
    name
      .replace(/[\\/:*?"<>|]+/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 180) || "audio"
  );
}

export async function GET(request: Request) {
  const limited = enforceRateLimit(
    request,
    "download",
    DOWNLOAD_LIMIT,
    DOWNLOAD_WINDOW
  );
  if (limited) return limited;

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  // Reject anything that isn't a real YouTube id so the proxy can't be pointed
  // at arbitrary values.
  if (!isValidVideoId(id)) {
    return new NextResponse("Invalid video ID", { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const result = await yt.ytmp3(url, QUALITY);

    if (!result?.status || !result?.download?.url) {
      return new NextResponse("Failed to resolve audio URL", { status: 502 });
    }

    const fileUrl: string = result.download.url;
    let filename = sanitizeFilename(result.download.filename || `${id}.mp3`);
    if (!filename.toLowerCase().endsWith(".mp3")) filename += ".mp3";

    // Freshly-generated savetube links can 404 for a moment while the file is
    // still being prepared, so retry a few times before giving up.
    let upstream: Response | null = null;
    for (let attempt = 0; attempt < 4; attempt++) {
      upstream = await fetch(fileUrl, {
        headers: { "User-Agent": "Mozilla/5.0" },
      });
      if (upstream.ok && upstream.body) break;
      await new Promise((r) => setTimeout(r, 1500));
    }

    if (!upstream || !upstream.ok || !upstream.body) {
      return new NextResponse("Audio file is not ready, please try again", {
        status: 504,
      });
    }

    // Stream the bytes back to the client as a real file download so the
    // browser saves it directly instead of navigating away.
    const headers = new Headers();
    headers.set("Content-Type", "audio/mpeg");
    headers.set(
      "Content-Disposition",
      `attachment; filename="${filename}"; filename*=UTF-8''${encodeURIComponent(
        filename
      )}`
    );
    const contentLength = upstream.headers.get("content-length");
    if (contentLength) headers.set("Content-Length", contentLength);
    headers.set("Cache-Control", "no-store");

    return new NextResponse(upstream.body, { status: 200, headers });
  } catch (error: any) {
    console.error("Download Error:", error);
    return new NextResponse(
      `Failed to download audio: ${error?.message || String(error)}`,
      { status: 500 }
    );
  }
}
