import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import { PassThrough } from "stream";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");
  const title = searchParams.get("title") || "youtube_audio";

  if (!id) {
    return new NextResponse("Missing video ID", { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const isValid = ytdl.validateURL(url);
    if (!isValid) {
      return new NextResponse("Invalid YouTube URL", { status: 400 });
    }

    // Get the highest quality audio stream from YouTube directly
    const audioStream = ytdl(url, { quality: "highestaudio" });

    // Create a response with the readable stream
    // @ts-ignore
    const webStream = new ReadableStream({
      start(controller) {
        audioStream.on("data", (chunk) => controller.enqueue(chunk));
        audioStream.on("end", () => controller.close());
        audioStream.on("error", (err) => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.m4a"`,
        "Content-Type": "audio/mp4",
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Failed to download audio", { status: 500 });
  }
}
