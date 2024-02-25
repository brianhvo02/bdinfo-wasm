import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from '.';

interface DomState {
    loading: boolean;
}

const initialState: DomState = {
    loading: true,
}

export const domSlice = createSlice({
    name: 'dom',
    initialState,
    reducers: {
        setLoading: (state, action: PayloadAction<boolean>) => {
            state.loading = action.payload;
        }
    }
});

export const { setLoading } = domSlice.actions;

export const selectDom = (state: RootState) => state.dom;

export default domSlice;