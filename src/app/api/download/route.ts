import { NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import "sadaslk-dlcore"; // Dummy import to ensure Next.js standalone bundle includes this dependency

const execAsync = promisify(exec);

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return new NextResponse("Missing video ID", { status: 400 });
  }

  const url = `https://www.youtube.com/watch?v=${id}`;

  try {
    const { stdout } = await execAsync(`node -e "require('sadaslk-dlcore').ytmp3('${url}').then(res => console.log(JSON.stringify(res))).catch(err => { console.error(err); process.exit(1); })"`);
    const result = JSON.parse(stdout.trim());
    
    if (!result || !result.url) {
      return new NextResponse("Failed to get download URL", { status: 500 });
    }

    return NextResponse.redirect(result.url);
  } catch (error: any) {
    console.error("Download Error:", error);
    return new NextResponse(`Failed to download audio: ${error?.message || String(error)}`, { status: 500 });
  }
}
