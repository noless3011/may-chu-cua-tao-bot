import ytdl from'@distube/ytdl-core';


export function GetAudioStream(link){
    
    const stream = ytdl(link, {
        filter: "audioonly",
        fmt: "opus",
        highWaterMark: 1 << 20,
        liveBuffer: 1 << 64,
        dlChunkSize: 0, //disabling chunking is recommended in discord bot
        quality: 'highestaudio',
        bitrate: 600,
      },{highWaterMark: 1});
    return stream;
}
