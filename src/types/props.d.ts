import { MutableRefObject } from 'react';
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