
import ytdl from'@distube/ytdl-core';
import fs from'fs';



const videoID = await ytdl.getVideoID(
  "https://www.youtube.com/watch?v=a59gmGkq_pw"
);
let info = await ytdl.getInfo(videoID);
let audioFormats = ytdl.filterFormats(info.formats, "audioonly");
const format = ytdl.chooseFormat(audioFormats, { quality: "highestaudio" });
const fileName = `video.${format.container}`;
await ytdl
  .downloadFromInfo(info, { format })
  .pipe(fs.createWriteStream(fileName));
