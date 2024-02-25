import './App.scss';
import { Route, Routes } from 'react-router-dom';
import Home from './components/Home';
import Header from './components/Header';
import { useCallback, useEffect, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { selectDom, setLoading } from './store/dom';
import { DiscInfoPayload, Message, MessageType } from './types/message';
import { setDiscInfo } from './store/bluray';
import { CircularProgress, Modal } from '@mui/material';

const App = () => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector(selectDom);
    const workerRef = useRef<Worker | null>(null);

    const handleMessage = useCallback(<T extends MessageType, P>(
        { data: message }: MessageEvent<Message<T, P>>
    ) => {
        switch (message.type) {
            case 'ready':
                dispatch(setLoading(false));
                break;
            case 'discInfo':
                const payload = message.payload as DiscInfoPayload;
                dispatch(setDiscInfo(payload));
                dispatch(setLoading(false));
                break;
            default:
                console.log(message);
        }
    }, [dispatch]);

    useEffect(() => {
        if (!dispatch) return;

        const worker = new Worker(new URL("./worker.ts", import.meta.url));

        worker.addEventListener('message', handleMessage);

        workerRef.current = worker;

        return () => {
            worker.terminate();
            worker.removeEventListener('message', handleMessage);
            workerRef.current = null;
        }
    }, [dispatch, handleMessage]);

    return (
        <div className="app">
            <Header />
            <Modal disableAutoFocus sx={{ 
                display: 'flex', 
                justifyContent: 'center', 
                alignItems: 'center'
            }}  open={loading} onClose={(_, reason) => {
                if (reason === 'backdropClick' || reason === 'escapeKeyDown')
                    return;
            }}>
                <CircularProgress size='5rem' />
            </Modal>
            <main>
                <Routes>
                    <Route path='/' element={<Home worker={workerRef} />} />
                </Routes>
            </main>
        </div>
    );
}
    

export default App;
