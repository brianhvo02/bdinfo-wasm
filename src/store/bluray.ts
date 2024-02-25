import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { DiscInfo, Metadata, MovieObject, Title } from '../types/bluray';

interface BlurayState {
    dirname: string;
    discInfo: DiscInfo | null;
    movieObjects: MovieObject[];
    playlists: Title[];
    metadata: Metadata | null;
}

const initialState: BlurayState = {
    dirname: '',
    discInfo: null,
    movieObjects: [],
    playlists: [],
    metadata: null,
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
        setPlaylists: (state, action: PayloadAction<Title[]>) => {
            state.playlists = action.payload;
        },
        setMetadata: (state, action: PayloadAction<Metadata>) => {
            state.metadata = action.payload;
        },
        reset: state => {
            state.discInfo = null;
        }
    }
});

export const { setDirname, setDiscInfo, setMovieObjects, setPlaylists, setMetadata } = bluraySlice.actions;

export const selectBluray = (state: RootState) => state.bluray;

export default bluraySlice;