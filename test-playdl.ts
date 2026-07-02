import play from "play-dl";
import fs from "fs";

async function run() {
  console.log("Starting test...");
  try {
    const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"; 
    
    // Get stream
    const stream = await play.stream(url, { discordPlayerCompatibility: true, quality: 2 });
    
    console.log("Got stream info!", stream.type);
    
    // Test piping to file
    const dest = fs.createWriteStream("test2.m4a");
    stream.stream.pipe(dest);
    
    dest.on('finish', () => {
      console.log('Download complete!');
    });
  } catch(e) {
    console.error("Test failed:", e);
  }
}
run();
