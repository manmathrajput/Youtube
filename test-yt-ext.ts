import { extract } from "youtube-ext";
async function run() {
  const url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ";
  const info = await extract(url);
  console.log("Formats:", info.formats.length);
  const audio = info.formats.find(f => f.hasAudio && !f.hasVideo);
  console.log("Audio URL:", audio ? audio.url : "Not found");
}
run();
