import { loadPyodide } from 'pyodide';
import { MainModule } from './types/interface';
import { Message, MessageType, UploadPayload } from './types/message';
import { convertDiscInfo, convertMetadata, convertMovieObject, convertPlaylists } from './util';
import _ from 'lodash';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import libblurayLoader from './libbluray.js';

interface ILibbluray extends MainModule {
    FS: typeof FS;
}

type IMenuExtractor = (files: File[], menuIndices: string[]) => Promise<Record<string, Menu>>;

const menuExtractorLoader = async () => {
    const pyodide = await loadPyodide();
    await pyodide.loadPackage(['/static/py/pypng-0.0.1-py3-none-any.whl', '/static/py/igstools-0.0.1-py3-none-any.whl']);
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
};

const ffmpegLoader = async () => {
    const ffmpeg = new FFmpeg();
    await ffmpeg.load({
        coreURL: '/static/js/ffmpeg-core.js'
    });

    console.log('Loaded ffmpeg.wasm');

    return ffmpeg;
};

const [ 
    libbluray,          menuExtractor,          ffmpeg 
]: [
    ILibbluray,         IMenuExtractor,         FFmpeg
] = await Promise.all([
    libblurayLoader(),  menuExtractorLoader(),  ffmpegLoader()
]);

const recursiveUnlink = (path: string) => {
    const paths: string[] = libbluray.FS.readdir(path).slice(2);
    paths.forEach(p => {
        const newPath = path + '/' + p;
        if (libbluray.FS.isDir(libbluray.FS.lstat(newPath).mode)) {
            recursiveUnlink(newPath);
            libbluray.FS.rmdir(newPath);
        } else {
            libbluray.FS.unlink(newPath);
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
        libbluray.FS.mkdir('/files');
        libbluray.FS.mkdir('/mnt');
        libbluray.FS.mkdir('/output');
    } catch (e) {
        libbluray.FS.unmount('/files');
        recursiveUnlink('/mnt');
    }

    // @ts-ignore
    libbluray.FS.mount(libbluray.FS.filesystems.WORKERFS, { files }, '/files');
    
    for (let i = 0; i <= maxLen; i++) {
        payload.forEach(([paths, file]) => {
            if (paths.length <= i) return;
            if (paths.length - 1 === i) {
                const path = '/mnt/' + paths.join('/');
                if (file.name.includes('m2ts'))
                    streams.push(file);
                libbluray.FS.symlink('/files/' + file.name, path);
                return;
            }

            const path = '/mnt/' + paths.slice(0, i + 1).join('/');
            try {
                libbluray.FS.mkdir(path);
            } catch (e) {
                if ((e as any).errno !== 20) throw e;
            }
        });
    }
}

const version = libbluray.version();
console.log('Using libbluray', version);
postMessage({ type: 'ready', payload: version });

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

            const metadata = libbluray.getMetadata();
            convertMetadata(libbluray.FS, metadata)
                .then(payload => postMessage({ type: 'metadata', payload }));

            menuExtractor(streams, [...menus])
                .then((payload: Record<string, Menu>) => {
                    console.log(Object.keys(payload).length + ' titles extracted');
                    postMessage({ type: 'menus', payload });
                });

            break;
        default:
            console.log(message);
    }
}