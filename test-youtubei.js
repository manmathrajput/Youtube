import { Innertube, UniversalCache } from 'youtubei.js';
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
  
  const reader = stream.getReader();
  const dest = fs.createWriteStream("test4.m4a");
  
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    dest.write(value);
  }
  dest.end();
  console.log("Download complete!");
}
run();
