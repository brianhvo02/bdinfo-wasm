import { DiscInfo, Metadata, MovieObject, Playlist } from './bluray';

export type MessageType = 'ready' | 'upload' | 'discInfo' | 'movieObject' | 'playlists' | 'metadata' | 'menus' | 'menuBackgrounds';

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

export type PlaylistsPayload = Playlist[];
export type PlaylistsMessage = Message<'playlists', PlaylistsPayload>;

export type MetadataPayload = Metadata;
export type MetadataMessage = Message<'metadata', MetadataPayload>;

export type MenusPayload = Record<string, Menu>;
export type MenusMessage = Message<'menus', MenusPayload>;

export type MenuBackgroundsPayload = Record<string, string>;
export type MenuBackgroundsMessage = Message<'menuBackgrounds', MenuBackgroundsPayload>;