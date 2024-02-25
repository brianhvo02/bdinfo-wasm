import { MutableRefObject } from 'react';

export interface WorkerProps {
    worker: MutableRefObject<Worker | null>;
}