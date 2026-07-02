import { Innertube, UniversalCache, Log } from 'youtubei.js';
import fs from 'fs';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  
  const videoId = "dQw4w9WgXcQ";
  const info = await yt.getBasicInfo(videoId);
  
  console.log("Title:", info.basic_info.title);
  
  const stream = await yt.download(videoId, {
    type: 'audio',
    quality: 'best',
    format: 'mp4'
  });
  
  const dest = fs.createWriteStream("test4.m4a");
  
  for await (const chunk of stream) {
    dest.write(chunk);
  }
  dest.end();
  
  console.log("Download complete!");
}
run();
