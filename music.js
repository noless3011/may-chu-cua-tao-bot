import ytdl from'@distube/ytdl-core';


export function GetAudioStream(link){
    
    const stream = ytdl(link, {
        filter: "audioonly",
        fmt: "opus",
        highWaterMark: 1 << 62,
        liveBuffer: 1 << 62,
        dlChunkSize: 0, //disabling chunking is recommended in discord bot
        bitrate: 128,
      });
    return stream;
}
