import { DiscInfo, Metadata, MovieObject, Title } from './bluray';

export type MessageType = 'ready'  | 'upload' | 'ready'  | 'discInfo' | 'movieObject' | 'playlists' | 'metadata';

export interface Message<T extends MessageType, P extends any> {
    type: T;
    payload: P;
}

export type UploadPayload = [string[], File][];
export type UploadMessage = Message<'upload', UploadPayload>;

export type DiscInfoPayload = DiscInfo;
export type DiscInfoMessage = Message<'discInfo', DiscInfoPayload>;

export type MovieObjectPayload = MovieObject[];
export type MovieObjectMessage = Message<'movieObject', MovieObjectPayload>;

export type PlaylistsPayload = Title[];
export type PlaylistsMessage = Message<'playlists', PlaylistsPayload>;

export type MetadataPayload = Metadata;
export type MetadataMessage = Message<'metadata', MetadataPayload>;