import { NextResponse } from "next/server";
// @ts-ignore
import { ytmp3 } from "sadaslk-dlcore";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing video ID", { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const result = await ytmp3(url);
    if (!result || !result.url) {
      return new NextResponse("Failed to get download URL", { status: 500 });
    }

    return NextResponse.redirect(result.url);
  } catch (error) {
    console.error("Download Error:", error);
    return new NextResponse("Failed to download audio", { status: 500 });
  }
}
