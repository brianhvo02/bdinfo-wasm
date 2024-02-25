import { Button } from '@mui/material';
import './Home.scss';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { setLoading } from '../store/dom';
import { WorkerProps } from '../types/props';
import { selectBluray, setDirname } from '../store/bluray';
import { boolAffirm } from '../util';

async function* getFilesRecursively(parent: FileSystemDirectoryHandle, entry: FileSystemHandle): AsyncGenerator<[string[], File]> {
    if (entry.kind === 'file') {
        const file = await (entry as FileSystemFileHandle).getFile();
        if (file !== null) {
            const relativePaths = await parent.resolve(entry);
            if (relativePaths)
                yield [relativePaths, file];
        }
    } else if (entry.kind === 'directory') {
        for await (const handle of (entry as FileSystemDirectoryHandle).values()) {
            yield* getFilesRecursively(parent, handle);
        }
    }
}

const Home = ({ worker }: WorkerProps) => {
    const dispatch = useAppDispatch();
    const { dirname, discInfo } = useAppSelector(selectBluray);

    const handleSelect = async () => {
        if (!window.Worker || !worker.current)
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

        worker.current.postMessage({ type: 'upload', payload: files });
    }

    return (
        <div className='home'>
            <Button variant="contained" onClick={handleSelect}>
                Select BD-ROM folder
            </Button>
            {
                discInfo &&
                <div className='disc-info'>
                    <h1>{dirname}</h1>
                        {discInfo.blurayDetected ? <>
                    <h2>AACS Detected</h2>
                    <p>{boolAffirm(discInfo.aacsDetected)}</p>
                    <h2>BDJO Detected</h2>
                    <p>{boolAffirm(discInfo.bdjDetected)}</p>
                        {discInfo.bdjDetected ? <>
                    <h2>BDJO Title Count</h2>
                    <p>{discInfo.numBDJTitles}</p>
                        </> : null}
                    <h2>HDMV Title Count</h2>
                    <p>{discInfo.numHDMVTitles}</p>
                        {discInfo.bdjDetected ? <>
                    <h2>Total Title Count</h2>
                    <p>{discInfo.numTitles}</p>
                        </> : null}
                        {discInfo.numUnsupportedTitles > 0 ? <>
                    <h2>Unsupported Title Count</h2>
                    <p>{discInfo.numUnsupportedTitles}</p>
                        </> : null}
                    <h2>First Play Supported</h2>
                    <p>{boolAffirm(discInfo.firstPlaySupported)}</p>
                    <h2>Top Menu Supported</h2>
                    <p>{boolAffirm(discInfo.topMenuSupported)}</p>
                        </> : <p>No Bluray detected!</p>}
                    
                </div>
            }
        </div>
    );
}

export default Home;