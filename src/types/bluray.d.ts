import { BlurayTitle } from './interface';

export interface Vector<T> {
    size(): number;
    get(idx: number): T | undefined;
    push_back(idx: T): void;
    resize(idx: number, val: T): void;
    set(idx: number, val: T): boolean;
    delete(): void;
}

export type DiscInfo = Pick<Info,
    'aacsDetected' | 'bdjDetected' | 'blurayDetected' | 'firstPlay' | 'firstPlaySupported' |
    'noMenuSupport' | 'numBDJTitles' | 'numHDMVTitles' | 'numTitles' | 'numUnsupportedTitles' |
    'titles' | 'topMenu' | 'topMenuSupported'
> & {
    titles: BlurayTitle[];
}