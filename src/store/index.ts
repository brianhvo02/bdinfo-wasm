import { configureStore } from '@reduxjs/toolkit';
import domSlice from './dom';
import bluraySlice from './bluray';

const store = configureStore({
    reducer: {
        [domSlice.reducerPath]: domSlice.reducer,
        [bluraySlice.reducerPath]: bluraySlice.reducer
    }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;