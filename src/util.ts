import { DiscInfo, Metadata, MovieObject, Vector } from './types/bluray';
import { Info, MObjObjects, MetaDiscLibrary, Playlist, Playlists } from './types/interface';

export const convertVectorToArray = <T>(vector: Vector<T>) => 
    [...Array(vector.size()).keys()].map(i => vector.get(i) as T);

export const convertDiscInfo = (info: Info): DiscInfo => {
    return {
        aacsDetected: info.aacsDetected,
        bdjDetected: info.bdjDetected,
        blurayDetected: info.blurayDetected,
        discName: info.discName as string,
        firstPlay: info.firstPlay,
        firstPlaySupported: info.firstPlaySupported,
        noMenuSupport: info.noMenuSupport,
        numBDJTitles: info.numBDJTitles,
        numHDMVTitles: info.numHDMVTitles,
        numTitles: info.numTitles,
        numUnsupportedTitles: info.numUnsupportedTitles,
        titles: convertVectorToArray(info.titles),
        topMenu: info.topMenu,
        topMenuSupported: info.topMenuSupported,
    }
}

export const convertMovieObject = (obj: MObjObjects): MovieObject[] => {
    const objects = convertVectorToArray(obj.objects).map(o => {
        const { numCommands, ...rest } = o;
        const commands = convertVectorToArray(o.commands).map((c, i) => ({
            ...c,
            id: i + 1,
            instructionHex: c.instructionValue.toString(16).padStart(8, '0'),
            destinationHex: c.destination.toString(16).padStart(8, '0'),
            sourceHex: c.source.toString(16).padStart(8, '0'),
        }));
        
        return { ...rest, commands };
    });

    return objects;
}

export const convertPlaylist = ({ id, playItems, subPaths, playMarks }: Playlist) => ({
    id,
    playItems: convertVectorToArray(playItems)
        .map(playItem => ({
            ...playItem,
            video: convertVectorToArray(playItem.video),
            audio: convertVectorToArray(playItem.audio),
            pg: convertVectorToArray(playItem.pg),
            ig: convertVectorToArray(playItem.ig),
            secondaryAudio: convertVectorToArray(playItem.secondaryAudio),
            secondaryVideo: convertVectorToArray(playItem.secondaryVideo),
            dv: convertVectorToArray(playItem.dv),
        })),
    subPaths: convertVectorToArray(subPaths)
        .map(({ type, subPlayItems }) => ({ 
            type, subPlayItems: convertVectorToArray(subPlayItems)
                .map(({ clips, ...subPlayItem }) => ({
                    ...subPlayItem, clips: convertVectorToArray(clips)
                })) 
        })),
    playMarks: convertVectorToArray(playMarks),
});

export const convertPlaylists = (playlists: Playlists) =>
    convertVectorToArray(playlists).map(convertPlaylist);

export const convertMetadata = async (meta: MetaDiscLibrary): Promise<Metadata> => {
    return {
        ...meta,
        tocEntries: convertVectorToArray(meta.tocEntries),
        thumbnails: await Promise.all(
            convertVectorToArray(meta.thumbnails).map(async thumbnail => {
                const base64 = await bufferToBase64(FS.readFile('/mnt/BDMV/META/DL/' + thumbnail.path.slice(1)));
                return { ...thumbnail, base64 };
            })
        )
    }
}

export const boolAffirm = (bool: boolean) => bool ? 'Yes' : 'No';

export async function* getFilesRecursively(parent: FileSystemDirectoryHandle, entry: FileSystemHandle): AsyncGenerator<[string[], File]> {
    if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        if (file !== null) {
            const relativePaths = await parent.resolve(entry);
            if (relativePaths)
                yield [relativePaths, file];
        }
    } else if (entry.kind === 'directory') {
        for await (const handle of (entry as FileSystemDirectoryHandle).values()) {
            yield* getFilesRecursively(parent, handle);
        }
    }
}

export const bufferToBase64 = async (arr: Uint8Array) => new Promise<string>(resolve => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.readAsDataURL(new Blob([arr], { type: 'image/png' }));
});

export const findLargestThumbnail = (metadata: Metadata) =>
    metadata.thumbnails.length ? metadata.thumbnails.reduce(
        (t1, t2) => t1.xres * t1.yres > t2.xres * t2.yres ? t1 : t2
    ) : null;

export const STREAM_MAP = {
      1: 'MPEG-1 video',
      2: 'MPEG-2 video',
      3: 'MPEG-1 audio',
      4: 'MPEG-2 audio',
     27: 'Advanced Video Coding (AVC) / H.264 video',
     36: 'High Efficiency Video Coding (HEVC) / H.265 video',
    128: 'Linear pulse-code modulation (LPCM) audio',
    129: 'Dolby AC-3 audio',
    130: 'DTS Coherent Acoustics (DCA) audio',
    131: 'Dolby TrueHD audio',
    132: 'Dolby Digital Plus (DD+) / Enhanced AC-3 (E-AC-3) audio',
    133: 'DTS-HD High Resolution audio',
    134: 'DTS-HD Master (DTS-HD MA) audio',
    144: 'Presentation Graphics (PG) stream',
    145: 'Interactive Graphics (IG) stream',
    146: 'Text stream',
    161: 'Dolby Digital Plus (DD+) / Enhanced AC-3 (E-AC-3) secondary extension audio',
    162: 'DTS-HD High Resolution secondary extension audio',
    234: 'SMPTE 421 / VC-1 video',
} as const;
export type CodingType = keyof typeof STREAM_MAP;

export const STREAM_TYPES = [
    'video', 'audio', 'ig', 
    'secondaryVideo', 'secondaryAudio', 'pg'
] as const;
export type StreamType = typeof STREAM_TYPES[number];

export const VIDEO_FORMAT_MAP = {
    1: '480i',
    2: '576i',
    3: '480p',
    4: '1080i',
    5: '720p',
    6: '1080p',
    7: '576p',
    8: '2160p',
}
export type VideoFormatType = keyof typeof VIDEO_FORMAT_MAP;

export const AUDIO_FORMAT_MAP = {
     1: 'Mono',
     3: 'Stereo',
     6: 'Multichannel',
    12: 'Combination',
}
export type AudioFormatType = keyof typeof AUDIO_FORMAT_MAP;

export const VIDEO_RATE_MAP = {
    1: '24000/1001 FPS',
    2:         '24 FPS',
    3:         '25 FPS',
    4: '30000/1001 FPS',
    6:         '50 FPS',
    7: '60000/1001 FPS',
}
export type VideoRateType = keyof typeof VIDEO_RATE_MAP;

export const AUDIO_RATE_MAP = {
     1:  '48 kHz',
     4:  '96 kHz',
     5: '192 kHz',
    12: '192 kHz Combination',
    14:  '96 kHz Combination',
}
export type AudioRateType = keyof typeof AUDIO_RATE_MAP;

export const ASPECT_RATIO_MAP = {
    2:  '4:3 standard',
    3:  '16:9 widescreen',
}
export type AspectRatioType = keyof typeof ASPECT_RATIO_MAP;

// Takes in 90kHz value
export const convertToTimestamp = (val: number) => {
    const ms = Math.floor(val / 45 % 1000).toString().padStart(3, '0');
    const s = Math.floor(val / (45 * 1000) % 60).toString().padStart(2, '0');
    const m = Math.floor(val / (45 * 1000 * 60) % 60).toString().padStart(2, '0');
    const h = Math.floor(val / (45 * 1000 * 60 * 60) % 60).toString().padStart(2, '0');

    return `${h}:${m}:${s}.${ms}`;
}