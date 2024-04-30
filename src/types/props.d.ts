import { Dispatch, MutableRefObject, SetStateAction } from 'react';
import { StreamType } from '../util';
import { Stream } from './interface';

export interface WorkerProps {
    worker: MutableRefObject<Worker | null>;
}

export interface StreamProps {
    stream: Stream;
    idx: number;
    streamType: StreamType;
}

export interface MenuViewProps {
    backgroundId: string;
    clipId: string;
    page: number;
    setMenuPageCount: Dispatch<SetStateAction<number>>;
}