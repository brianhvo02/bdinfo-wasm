import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { DiscInfo, Metadata, MovieObject, Playlist } from '../types/bluray';
import { MenusPayload } from '../types/message';

interface BlurayState {
    dirname: string;
    discInfo: DiscInfo | null;
    movieObjects: MovieObject[];
    playlists: Playlist[];
    metadata: Metadata | null;
    menus: MenusPayload;
}

const initialState: BlurayState = {
    dirname: '',
    discInfo: null,
    movieObjects: [],
    playlists: [],
    metadata: null,
    menus: {},
}

export const bluraySlice = createSlice({
    name: 'bluray',
    initialState,
    reducers: {
        setDirname: (state, action: PayloadAction<string>) => {
            state.dirname = action.payload;
        },
        setDiscInfo: (state, action: PayloadAction<DiscInfo>) => {
            state.discInfo = action.payload;
        },
        setMovieObjects: (state, action: PayloadAction<MovieObject[]>) => {
            state.movieObjects = action.payload;
        },
        setPlaylists: (state, action: PayloadAction<Playlist[]>) => {
            state.playlists = action.payload;
        },
        setMetadata: (state, action: PayloadAction<Metadata>) => {
            state.metadata = action.payload;
        },
        setMenus: (state, action: PayloadAction<MenusPayload>) => {
            state.menus = action.payload;
        },
        reset: state => {
            state.discInfo = null;
        }
    }
});

export const { setDirname, setDiscInfo, setMovieObjects, setPlaylists, setMetadata, setMenus } = bluraySlice.actions;

export const selectBluray = (state: RootState) => state.bluray;

export default bluraySlice;