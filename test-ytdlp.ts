import { spawn } from "child_process";
import fs from "fs";

async function run() {
  console.log("Starting test...");
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; 
  
  const ytdlp = spawn("/Users/manmath.rajput/Library/Python/3.9/bin/yt-dlp", ["-f", "bestaudio", "-o", "-", url]);
  
  const dest = fs.createWriteStream("test3.m4a");
  ytdlp.stdout.pipe(dest);
  
  ytdlp.stderr.on('data', (data) => {
    console.log(`stderr: ${data}`);
  });
  
  ytdlp.on('close', (code) => {
    console.log(`yt-dlp process exited with code ${code}`);
  });
}
run();
