import ytdl from "@distube/ytdl-core";
import fs from "fs";

async function run() {
  console.log("Starting test...");
  try {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; // Rick astley
    const info = await ytdl.getInfo(url);
    console.log("Title:", info.videoDetails.title);
    
    const audio = ytdl(url, { quality: 'highestaudio' });
    audio.on('info', (info, format) => {
      console.log('Got stream info!', format.mimeType);
    });
    audio.on('error', (err) => {
      console.error('Stream Error:', err);
    });
    
    // Test piping to file
    const dest = fs.createWriteStream("test.m4a");
    audio.pipe(dest);
    
    dest.on('finish', () => {
      console.log('Download complete!');
    });
  } catch(e) {
    console.error("Test failed:", e);
  }
}
run();
