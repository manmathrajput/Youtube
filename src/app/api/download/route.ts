import { NextResponse } from "next/server";
import ytdl from "@distube/ytdl-core";
import ffmpeg from "fluent-ffmpeg";
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

    // Create a PassThrough stream to pipe ffmpeg output to the response
    const passthrough = new PassThrough();

    // Get the highest quality audio stream from YouTube
    const audioStream = ytdl(url, { quality: "highestaudio" });

    // Use ffmpeg to convert to mp3
    ffmpeg(audioStream)
      .audioBitrate(128)
      .format("mp3")
      .on("error", (err) => {
        console.error("FFmpeg Error:", err);
      })
      .pipe(passthrough, { end: true });

    // Create a response with the readable stream
    // Next.js NextResponse supports passing a Web ReadableStream
    // We can cast the Node stream to any or create a readable stream from it
    
    // In Node.js 18+, we can convert Node stream to Web stream
    // @ts-ignore
    const webStream = new ReadableStream({
      start(controller) {
        passthrough.on("data", (chunk) => controller.enqueue(chunk));
        passthrough.on("end", () => controller.close());
        passthrough.on("error", (err) => controller.error(err));
      }
    });

    return new NextResponse(webStream, {
      headers: {
        "Content-Disposition": `attachment; filename="${encodeURIComponent(title)}.mp3"`,
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Failed to download audio", { status: 500 });
  }
}
