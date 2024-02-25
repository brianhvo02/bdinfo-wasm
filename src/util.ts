import { Clip, DiscInfo, Metadata, MovieObject, Title, Vector } from './types/bluray';
import { ClipInfo, Info, MObjObjects, MetaDiscLibrary, TitleInfo } from './types/interface';

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

export const convertClipInfo = (clip: ClipInfo): Clip => {
    return {
        ...clip,
        audioStreams: convertVectorToArray(clip.audioStreams),
        videoStreams: convertVectorToArray(clip.videoStreams),
        igStreams: convertVectorToArray(clip.igStreams),
        pgStreams: convertVectorToArray(clip.pgStreams),
        secondaryAudioStreams: convertVectorToArray(clip.secondaryAudioStreams),
        secondaryVideoStreams: convertVectorToArray(clip.secondaryVideoStreams)
    }
}

export const convertTitleInfo = (title: TitleInfo): Title => {
    return {
        playlist: title.playlist,
        duration: title.duration,
        chapters: convertVectorToArray(title.chapters),
        chapterCount: title.chapterCount,
        marks: convertVectorToArray(title.marks),
        markCount: title.markCount,
        clips: convertVectorToArray(title.clips).map(convertClipInfo),
        clipCount: title.clipCount
    }
}

export const convertTitleInfoMulti = (info: Vector<TitleInfo>) => 
    convertVectorToArray(info).map(convertTitleInfo);

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