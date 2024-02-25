import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { DiscInfo, MovieObject } from '../types/bluray';

interface BlurayState {
    dirname: string;
    discInfo: DiscInfo | null;
    movieObjects: MovieObject[];
}

const initialState: BlurayState = {
    dirname: '',
    discInfo: null,
    movieObjects: [],
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
        reset: state => {
            state.discInfo = null;
        }
    }
});

export const { setDirname, setDiscInfo, setMovieObjects } = bluraySlice.actions;

export const selectBluray = (state: RootState) => state.bluray;

export default bluraySlice;