import { DiscInfo, Vector } from './types/bluray';
import { Info, MObjObjects } from './types/interface';

export const convertVectorToArray = <T>(vector: Vector<T>) => 
    [...Array(vector.size()).keys()].map(i => vector.get(i) as T);

export const convertDiscInfo = (info: Info): DiscInfo => {
    return {
        aacsDetected: info.aacsDetected,
        bdjDetected: info.bdjDetected,
        blurayDetected: info.blurayDetected,
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

export const convertMovieObject = (obj: MObjObjects) => {
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