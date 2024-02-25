/* eslint-disable no-restricted-globals */
import type { PyodideInterface } from 'pyodide';
import { MainModule } from './types/interface';
import { Message, MessageType, UploadPayload } from './types/message';
import { convertDiscInfo } from './util';

importScripts('./libbluray_web.js', 'https://cdn.jsdelivr.net/pyodide/v0.25.0/full/pyodide.js');

// @ts-ignore
// const pyodide: PyodideInterface = await loadPyodide({
//     // packages: []
// });

// const mountDir = '/mnt';
// pyodide.FS.mkdir(mountDir);

// @ts-ignore
const pyodideLoader = loadPyodide({ packages: ['/static/py/pypng.whl', '/static/py/igstools.whl'] })
    .then(async (pyodide: PyodideInterface) => {
        const script = await fetch('/static/py/menu_to_json.py')
            .then(res => res.text());
        await pyodide.runPythonAsync(script);
        console.log('Initialized menu reader');
        
        return async (menuIdx: number) => {
            const res = await pyodide.runPythonAsync(
                `extract_json_menu("/mnt/BDMV/STREAM/${`${
                    menuIdx
                }.m2ts`.padStart(10, '0')}")`
            );
            return JSON.parse(res.toString());
        }
    });

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

    onmessage = <T extends MessageType, P>({ data: message }: MessageEvent<Message<T, P>>) => {
        switch (message.type) {
            case 'upload':
                const payload = message.payload as UploadPayload;
                const { maxLen, files } = payload.reduce((
                    obj: { maxLen: number, files: File[] }, [paths, file]
                ) => {
                    obj.files.push(file);
                    if (obj.maxLen < paths.length)
                        obj.maxLen = paths.length;

                    return obj;
                }, { maxLen: 0, files: [] });

                FS.mkdir('/files');
                // @ts-ignore
                FS.mount(WORKERFS, { files }, '/files');

                FS.mkdir('/mnt');
                for (let i = 0; i <= maxLen; i++) {
                    payload.forEach(([paths, file]) => {
                        if (paths.length <= i) return;
                        if (paths.length - 1 === i) {
                            const path = '/mnt/' + paths.join('/');
                            // console.log('Creating symlink to:', path);
                            FS.symlink('/files/' + file.name, path);
                            return;
                        }

                        const path = '/mnt/' + paths.slice(0, i + 1).join('/');
                        // console.log('Creating directory:', path);
                        try {
                            FS.mkdir(path);
                        } catch (e) {
                            if ((e as any).errno !== 20) throw e;

                            // console.log('Directory exists!');
                        }
                    });
                }

                const titleCount = libbluray.openDisc('/mnt');
                console.log('Found', titleCount, 'titles');

                const info = libbluray.getDiscInfo();
                postMessage({
                    type: 'discInfo',
                    payload: convertDiscInfo(info)
                });
                break;
            default:
                console.log(message);
        }
    }
});