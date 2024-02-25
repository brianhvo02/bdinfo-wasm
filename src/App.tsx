import './App.scss';
import { Route, Routes } from 'react-router-dom';
import MovieObjects from './components/MovieObjects';
import Header from './components/Header';
import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from './store/hooks';
import { selectDom, setLoading } from './store/dom';
import { DiscInfoPayload, Message, MessageType, MetadataPayload, MovieObjectPayload, PlaylistsPayload } from './types/message';
import { selectBluray, setDirname, setDiscInfo, setMetadata, setMovieObjects, setPlaylists } from './store/bluray';
import { Button, CircularProgress, Modal } from '@mui/material';
import { boolAffirm, findLargestThumbnail, getFilesRecursively } from './util';

const App = () => {
    const dispatch = useAppDispatch();
    const { loading } = useAppSelector(selectDom);
    const { dirname, discInfo, metadata } = useAppSelector(selectBluray);
    const workerRef = useRef<Worker | null>(null);

    const thumbnail = useMemo(() => metadata && findLargestThumbnail(metadata), [metadata]);

    const handleMessage = useCallback(<T extends MessageType, P>(
        { data: message }: MessageEvent<Message<T, P>>
    ) => {
        switch (message.type) {
            case 'ready':
                dispatch(setLoading(false));
                break;
            case 'discInfo': {
                const payload = message.payload as DiscInfoPayload;
                dispatch(setDiscInfo(payload));
                dispatch(setLoading(false));
                break;
            }
            case 'movieObject': {
                const payload = message.payload as MovieObjectPayload;
                dispatch(setMovieObjects(payload));
                break;
            }
            case 'playlists': {
                const payload = message.payload as PlaylistsPayload;
                dispatch(setPlaylists(payload));
                break;
            }
            case 'metadata': {
                const payload = message.payload as MetadataPayload;
                dispatch(setMetadata(payload));
                break;
            }
            default:
                console.log(message);
        }
    }, [dispatch]);

    const handleSelect = async () => {
        if (!window.Worker || !workerRef.current)
            return;

        dispatch(setLoading(true));

        const dirHandle = await window.showDirectoryPicker()
            .catch(e => {
                dispatch(setLoading(false));
            });

        if (!dirHandle) return;
        
        dispatch(setDirname(dirHandle.name));

        const files: [string[], File][] = [];
        for await (const file of getFilesRecursively(dirHandle, dirHandle)) {
            files.push(file);
        }

        workerRef.current.postMessage({ type: 'upload', payload: files });
    }

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
                <div className='disc-info'>
                    <Button variant="contained" onClick={handleSelect}>
                        Select BD-ROM folder
                    </Button>
                    { discInfo && <>
                    <h1>{dirname}</h1>
                    { discInfo.blurayDetected ? <>
                    { discInfo.discName.length ? 
                    <div className='attr-group'>
                        <h2>Disc Name</h2>
                        <p>{discInfo.discName}</p>
                    </div>
                    : null}
                    <div className='attr-group'>
                        <h2>AACS Detected</h2>
                        <p>{boolAffirm(discInfo.aacsDetected)}</p>
                    </div>
                    <div className='attr-group'>
                        <h2>BDJO Detected</h2>
                        <p>{boolAffirm(discInfo.bdjDetected)}</p>
                    </div>
                    { discInfo.bdjDetected ? 
                    <div className='attr-group'>
                        <h2>BDJO Title Count</h2>
                        <p>{discInfo.numBDJTitles}</p>
                    </div>
                    : null}
                    <div className='attr-group'>
                        <h2>HDMV Title Count</h2>
                        <p>{ discInfo.numHDMVTitles}</p>
                    </div>
                    { discInfo.bdjDetected ?
                    <div className='attr-group'>
                        <h2>Total Title Count</h2>
                        <p>{discInfo.numTitles}</p>
                    </div>
                    : null}
                    { discInfo.numUnsupportedTitles > 0 ?
                    <div className='attr-group'>
                        <h2>Unsupported Title Count</h2>
                        <p>{discInfo.numUnsupportedTitles}</p>
                    </div>
                    : null}
                    <div className='attr-group'>
                        <h2>First Play Supported</h2>
                        <p>{boolAffirm(discInfo.firstPlaySupported)}</p>
                    </div>
                    <div className='attr-group'>
                        <h2>Top Menu Supported</h2>
                        <p>{boolAffirm(discInfo.topMenuSupported)}</p>
                    </div>
                    </> : <p>No Bluray detected!</p> }
                    </> }
                    { thumbnail &&
                    <img src={thumbnail.base64} alt='' width={thumbnail.xres} height={thumbnail.yres} />
                    }
                </div>
                <Routes>
                    <Route path='/' Component={MovieObjects} />
                    {/* <Route path='/playlists' element={<Home worker={workerRef} />} /> */}
                </Routes>
            </main>
        </div>
    );
}
    

export default App;
