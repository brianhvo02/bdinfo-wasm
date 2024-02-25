import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';
import { DiscInfo } from '../types/bluray';

interface BlurayState {
    dirname: string;
    discInfo: DiscInfo | null;
}

const initialState: BlurayState = {
    dirname: '',
    discInfo: null,
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
        reset: state => {
            state.discInfo = null;
        }
    }
});

export const { setDirname, setDiscInfo } = bluraySlice.actions;

export const selectBluray = (state: RootState) => state.bluray;

export default bluraySlice;