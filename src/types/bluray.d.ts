import { BlurayTitle, ClipInfo, Info, MObjCommand, MObjObject, MetaDiscLibrary, MetaThumbnail, MetaTitle, StreamInfo, TitleChapter, TitleInfo, TitleMark } from './interface';

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

export type Clip = Omit<ClipInfo, 
    'audioStreams' | 'videoStreams' | 
    'igStreams' | 'pgStreams' | 
    'secondaryAudioStreams' | 'secondaryVideoStreams'
> & {
    audioStreams: Stream[];
    videoStreams: Stream[];
    igStreams: Stream[];
    pgStreams: Stream[];
    secondaryAudioStreams: Stream[];
    secondaryVideoStreams: Stream[];
}

export type Title = Pick<TitleInfo, 'playlist' | 'duration' | 'chapterCount' | 'markCount' | 'clipCount'> & {
    chapters: TitleChapter[];
    marks: TitleMark[];
    clips: Clip[];
}

export type Thumbnail = MetaThumbnail & {
    base64: string;
}

export type Metadata = Omit<MetaDiscLibrary, 'tocEntries' | 'thumbnails'> & {
    tocEntries: MetaTitle[];
    thumbnails: Thumbnail[];
}