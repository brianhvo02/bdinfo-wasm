export type MessageType = 'upload' | 'discInfo' | 'ready';

export interface Message<T extends MessageType, P extends any> {
    type: T;
    payload: P;
}

export type UploadPayload = [string[], File][];
export type UploadMessage = Message<'upload', UploadPayload>;

export type DiscInfoPayload = DiscInfo;
export type DiscInfoMessage = Message<'discInfo', DiscInfoPayload>;