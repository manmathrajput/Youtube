import { NextResponse } from "next/server";
// @ts-ignore
import yt from "@vreden/youtube_scraper";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing video ID", { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const result = await yt.ytmp3(url);
    
    if (!result || !result.status || !result.download || !result.download.url) {
      return new NextResponse("Failed to get download URL", { status: 500 });
    }

    return NextResponse.redirect(result.download.url);
  } catch (error: any) {
    console.error("Download Error:", error);
    return new NextResponse(`Failed to download audio: ${error?.message || String(error)}`, { status: 500 });
  }
}
