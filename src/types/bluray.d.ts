import { BlurayTitle, PlayItem as IPlayItem, Info, MObjCommand, MObjObject, MetaDiscLibrary, MetaThumbnail, MetaTitle, Stream, SubPathPlayItem as ISubPathPlayItem, Clip, PlayMark } from './interface';

export interface Vector<T> {
    size(): number;
    get(idx: number): T | undefined;
    push_back(idx: T): void;
    resize(idx: number, val: T): void;
    set(idx: number, val: T): boolean;
    delete(): void;
}

export type DiscInfo = Pick<Info,
    'aacsDetected' | 'bdjDetected' | 'blurayDetected' | 'firstPlay' | 
    'firstPlaySupported' | 'noMenuSupport' | 'numBDJTitles' | 'numHDMVTitles' | 'numTitles' | 
    'numUnsupportedTitles' | 'topMenu' | 'topMenuSupported'
> & {
    discName: string;
    titles: BlurayTitle[];
}

export interface Command extends MObjCommand {
    id: number;
    instructionHex: string;
    destinationHex: string;
    sourceHex: string;
}

export type MovieObject = Omit<MObjObject, 'numCommands' | 'commands'> & {
    commands: Command[];
}

export type PlayItem = Pick<IPlayItem, 'inTime' | 'outTime' | 'clip'> & {
    video: Stream[];
    audio: Stream[];
    pg: Stream[];
    ig: Stream[];
    secondaryAudio: Stream[];
    secondaryVideo: Stream[];
    dv: Stream[];
}

export type SubPathPlayItem = Omit<ISubPathPlayItem, 'clips'> & {
    clips: Clip[];
}

export type SubPath = {
    type: number;
    subPlayItems: SubPathPlayItem[];
}

export type Playlist = {
    id: string;
    playItems: PlayItem[];
    subPaths: SubPath[];
    playMarks: PlayMark[];
}

export type Thumbnail = MetaThumbnail & {
    base64: string;
}

export type Metadata = Omit<MetaDiscLibrary, 'tocEntries' | 'thumbnails'> & {
    tocEntries: MetaTitle[];
    thumbnails: Thumbnail[];
}