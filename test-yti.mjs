import { Innertube, UniversalCache } from 'youtubei.js';
import fs from 'fs';
import { Readable } from 'stream';

async function run() {
  const yt = await Innertube.create({ cache: new UniversalCache(false) });
  const stream = await yt.download('dQw4w9WgXcQ', {
    type: 'audio',
    quality: 'best'
  });
  
  // Convert Web ReadableStream to Node Readable
  const nodeStream = Readable.fromWeb(stream);
  const dest = fs.createWriteStream("test-out.m4a");
  nodeStream.pipe(dest);
  
  dest.on('finish', () => console.log('Downloaded successfully!'));
}
run().catch(console.error);
