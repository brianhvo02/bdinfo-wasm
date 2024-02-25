/* eslint-disable no-restricted-globals */
import type { PyodideInterface } from 'pyodide';
import { MainModule } from './types/interface';
import { Message, MessageType, UploadPayload } from './types/message';
import { convertDiscInfo, convertMetadata, convertMovieObject, convertTitleInfoMulti } from './util';

importScripts('./libbluray_web.js', 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

// @ts-ignore
// const pyodide: PyodideInterface = await loadPyodide({
//     // packages: []
// });

// const mountDir = '/mnt';
// pyodide.FS.mkdir(mountDir);

// @ts-ignore
const pyodideLoader = (loadPyodide({ packages: ['/static/py/pypng.whl', '/static/py/igstools.whl'] }) as Promise<PyodideInterface>)
    .then(async pyodide => {
        const script = await fetch('/static/py/menu_to_json.py')
            .then(res => res.text());
        await pyodide.runPythonAsync(script);
        pyodide.FS.mkdir('/mnt');
        console.log('Initialized menu reader');
        
        return async (files: File[], menuIdx: number): Promise<Menu> => {
            pyodide.FS.mount(pyodide.FS.filesystems.WORKERFS, { files }, '/mnt');
            const res = await pyodide.runPythonAsync(
                `extract_json_menu("/mnt/${`${
                    menuIdx
                }.m2ts`.padStart(10, '0')}")`
            );
            pyodide.FS.unmount('/mnt');
            return JSON.parse(res.toString());
        }
    });

const recursiveUnlink = (path: string) => {
    const paths: string[] = FS.readdir(path).slice(2);
    paths.forEach(p => {
        const newPath = path + '/' + p;
        if (FS.isDir(FS.lstat(newPath).mode)) {
            recursiveUnlink(newPath);
            FS.rmdir(newPath);
        } else {
            FS.unlink(newPath);
        }
    });
}

const mountFileSystem = (streams: File[], payload: UploadPayload) => {
    const { maxLen, files } = payload.reduce((
        obj: { maxLen: number, files: File[] }, [paths, file]
    ) => {
        obj.files.push(file);
        if (obj.maxLen < paths.length)
            obj.maxLen = paths.length;

        return obj;
    }, { maxLen: 0, files: [] });

    try {
        FS.mkdir('/files');
        FS.mkdir('/mnt');
    } catch (e) {
        FS.unmount('/files');
        recursiveUnlink('/mnt');
    }

    // @ts-ignore
    FS.mount(WORKERFS, { files }, '/files');

    
    for (let i = 0; i <= maxLen; i++) {
        payload.forEach(([paths, file]) => {
            if (paths.length <= i) return;
            if (paths.length - 1 === i) {
                const path = '/mnt/' + paths.join('/');
                if (file.name.includes('m2ts'))
                    streams.push(file);
                FS.symlink('/files/' + file.name, path);
                return;
            }

            const path = '/mnt/' + paths.slice(0, i + 1).join('/');
            try {
                FS.mkdir(path);
            } catch (e) {
                if ((e as any).errno !== 20) throw e;
            }
        });
    }
}

new Promise<MainModule>(resolve => {
    // @ts-ignore
    self.Module = {
        onRuntimeInitialized: function() {
            // @ts-ignore
            resolve(self.Module);
        }
    };
}).then((libbluray) => {
    const version = libbluray.version();
    console.log('Using libbluray', version);
    self.postMessage({ type: 'ready', payload: version });

    const streams: File[] = [];

    onmessage = <T extends MessageType, P>({ data: message }: MessageEvent<Message<T, P>>) => {
        switch (message.type) {
            case 'upload':
                const payload = message.payload as UploadPayload;
                mountFileSystem(streams, payload);

                const titleCount = libbluray.openDisc('/mnt');
                console.log('Found', titleCount, 'titles');

                const info = libbluray.getDiscInfo();
                postMessage({
                    type: 'discInfo',
                    payload: convertDiscInfo(info)
                });

                const movieObjects = libbluray.readMobj('/files/MovieObject.bdmv');
                postMessage({
                    type: 'movieObject',
                    payload: convertMovieObject(movieObjects)
                });

                const playlists = libbluray.getAllPlaylistInfo();
                postMessage({
                    type: 'playlists',
                    payload: convertTitleInfoMulti(playlists)
                });

                const metadata = libbluray.getMetadata();

                convertMetadata(metadata)
                    .then(payload => postMessage({ type: 'metadata', payload }));
                

                break;
            default:
                console.log(message);
        }
    }
});