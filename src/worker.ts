/* eslint-disable no-restricted-globals */
import type { PyodideInterface } from 'pyodide';
import { MainModule } from './types/interface';
import { Message, MessageType, UploadPayload } from './types/message';
import { convertDiscInfo, convertMetadata, convertMovieObject, convertPlaylists } from './util';
import _ from 'lodash';

importScripts('./libbluray_web.js', 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

// @ts-ignore
const pyodideLoader = (loadPyodide({ packages: ['/static/py/pypng.whl', '/static/py/igstools.whl'] }) as Promise<PyodideInterface>)
    .then(async pyodide => {
        const script = await fetch('/static/py/menu_to_json.py')
            .then(res => res.text());
        await pyodide.runPythonAsync(script);
        pyodide.FS.mkdir('/mnt');
        console.log('Initialized menu reader');
        
        return async (files: File[], menuIndices: string[]) => {
            pyodide.FS.mount(pyodide.FS.filesystems.WORKERFS, { files }, '/mnt');
            const menus: Menu[] = await Promise.all(
                menuIndices.map(i => pyodide.runPythonAsync(
                    `extract_json_menu("/mnt/${`${i}.m2ts`}")`
                ).then(res => JSON.parse(res.toString())))
            );
            pyodide.FS.unmount('/mnt');
            return _.zipObject(menuIndices, menus);
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
        FS.mkdir('/output');
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

                const playlistsRaw = libbluray.getAllPlaylists();
                const playlists = convertPlaylists(playlistsRaw);
                postMessage({
                    type: 'playlists',
                    payload: playlists
                });

                const menus = new Set<string>();

                playlists.forEach(playlist => {
                    playlist.subPaths.forEach(subPath => {
                        subPath.subPlayItems.forEach(item => {
                            item.clips.forEach(clip => {
                                menus.add(clip.clipId as string);
                            });
                        });
                    });
                });

                pyodideLoader.then(extractMenu => extractMenu(streams, [...menus]))
                    .then(payload => postMessage({ type: 'menus', payload }));

                const metadata = libbluray.getMetadata();
                convertMetadata(metadata)
                    .then(payload => postMessage({ type: 'metadata', payload }));

                console.log('Extracting audio');
                libbluray.extractAudio('00001', 4352);

                // console.log('Loading audio');
                // postMessage({
                //     type: 'audio',
                //     payload: FS.readFile('/output/00001_4352.wav')
                // });

                break;
            default:
                console.log(message);
        }
    }
});