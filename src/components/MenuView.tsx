import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import './MenuView.scss'
import { useAppSelector } from '../store/hooks';
import { selectBluray } from '../store/bluray';
import { MenuViewProps } from '../types/props';
import _ from 'lodash';

const keys = {
    'ArrowLeft': 'left',
    'ArrowRight': 'right',
    'ArrowDown': 'down',
    'ArrowUp': 'up'
} as const;

interface Gallery {
    clipId: string;
    pictures: Record<string, Record<string, HTMLImageElement>>;
}

const initialMemory = {
    '80000004': '00000001',
    '80000005': '00000000',
    '8000000a': '00000000',
    '80000025': '00000000',
    '80000001': '00000001',
    '80000002': '00000000',
};

const MenuView = ({ clipId, page, setMenuPageCount }: MenuViewProps) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const { menus } = useAppSelector(selectBluray);
    const [selected, setSelected] = useState(0);
    const [focused, setFocused] = useState(false);
    const [gallery, setGallery] = useState<Gallery>();

    const memoryRef = useRef<Record<string, string>>(initialMemory);

    const runCommand = (command: [number, number, number]) => {
        const [, dstInt, srcInt] = command;
        const [ins, dstHex, srcHex] = command.map(val => val.toString(16));
        // console.log('title', program.titleIdx, program.idx, opc, dst, src);

        // switch (ins) {
        //     case '12c10000':
        //         return console.log(
        //             'Playing playlist', `${dstInt}`.padStart(5, '0'), 
        //             'and stream', srcInt
        //         );
        //     case '12810000':
        //         return console.log(
        //             'Playing playlist', `${dstInt}`.padStart(5, '0'), 
        //             'and stream', parseInt(memoryRef.current[srcHex] ?? '00', 16)
        //         );
        //     case '0a800000':
        //         return console.log(
        //             'Playing playlist', `${dstInt}`.padStart(5, '0')
        //         );
        //     case '12820000':
        //         memoryRef.current['80000005'] = memoryRef.current[srcHex] ?? '00000000';
        //         memoryRef.current['80000025'] = memoryRef.current[srcHex] ?? '00000000';
        //         return console.log(
        //             'Playing playlist', `${dstInt}`.padStart(5, '0'), 
        //             'at play mark', parseInt(memoryRef.current[srcHex] ?? '00', 16)
        //         );
        //     case '09810000':
        //         memoryRef.current['80000004'] = dstHex;
        //         return console.log('Playing title', dstInt);
        //     case '90400001':
        //         memoryRef.current[dstHex] = srcHex;
        //         return console.log('Setting memory', dstHex, 'with value', srcInt);
        //     case '90000001':
        //         memoryRef.current[dstHex] = memoryRef.current[srcHex];
        //         return console.log('Setting memory', dstHex, 'with memory', srcHex);
        //     case '50400200':
        //         return console.log('IF memory', dstHex, 'EQUALS value', srcInt);
        //     case '50400600':
        //         return console.log('IF memory', dstHex, 'GREATER THAN value', srcInt);
        //     case '50400400':
        //         return console.log('IF memory', dstHex, 'LESS THAN value', srcInt);
        //     case '08810000':
        //         return console.log('Go to index', dstInt, 'of program');
        //     case '91c00001':
        //         if (skipFirstPlay && program.titleIdx === -1)
        //             return setProgram(prev => prev && { ...prev, idx: prev.idx + 1 });

        //         const audioStream = parseInt(dst.slice(2, 4), 16);
        //         audioStream && setAudioStream(audioStream);
        //         setSubtitleStream(dst.slice(4, 6) === 'c0' ? parseInt(dst.slice(6, 8), 16) : 0);
        //         return setProgram(prev => prev && { ...prev, idx: prev.idx + 1 });
        //     case '12020000': {
        //         const list = playlists[`${parseInt(memoryRef.current[dst], 16)}`.padStart(5, '0')];
        //         const idx = parseInt(memoryRef.current[src] ?? '00', 16);
        //         const chapterIdx = list.chapters.findIndex(chapter => chapter.playItem === list.streams[idx]);
        //         setSeekToChapter(chapterIdx);
        //         return setPlaylist({ list, idx });
        //     }
        //     default:
        //         setProgram(prev => prev && { ...prev, idx: prev.idx + 1 });
        // }
    }

    const menu = useMemo(() => menus[clipId], [menus, clipId]);
    const menuPage = useMemo(() => menu.pages[page - 1], [menu, page]);
    const navigation = useMemo(() => {
        const nav: Navigation[] = [];
        menu.pages[page - 1].bogs.forEach(bog => {
            bog.buttons.forEach(button => nav.push(button.navigation));
        });
        return nav;
    }, [menu, page]);
    useEffect(() => setMenuPageCount(menu ? Object.keys(menu.pages).length : 0), [menu, setMenuPageCount]);

    useEffect(() => {
        memoryRef.current['8000000a'] = selected.toString(16).padStart(8, '0');
    }, [selected]);
    
    useEffect(() => {
        if (!canvasRef.current) return;
        canvasRef.current.width = menu.width;
        canvasRef.current.height = menu.height;

        const pictures: Gallery['pictures'] = {};
        Object.entries(menu.pictures).forEach(([buttonId, picture]) => {
            Object.entries(picture.decoded_pictures).forEach(([palette, decoded]) => {
                const img = new Image();
                img.onload = () => _.set(pictures, `${buttonId}.${palette}`, img);
                img.src = 'data:image/png;base64,' + decoded;
            });
        });

        setGallery({ clipId, pictures });
    }, [menu, clipId]);

    useEffect(() => setSelected(menuPage.def_button), [menuPage]);

    useEffect(() => {
        const ctx = canvasRef.current?.getContext('2d');
        if (!menuPage || !ctx || !gallery) return;

        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        menuPage.bogs.forEach(bog => {
            const defaultButton = bog.buttons.find(button => button.id === bog.def_button);
            if (!defaultButton) return;

            const picture = gallery.pictures[defaultButton.states[
                defaultButton.id === selected ? 'selected' : 'normal'
            ].start];
            if (!picture) return;

            const image = picture[menuPage.palette];
            if (!image) return;

            ctx.drawImage(image, defaultButton.x, defaultButton.y);
        });
    }, [gallery, menuPage, page, selected]);

    const keyboardListener = useCallback((e: KeyboardEvent) => {
        if (!focused || !Object.keys(keys).includes(e.code)) return;
        e.preventDefault();
        const code = e.code as keyof typeof keys;

        const newSelected = navigation[selected][keys[code]];
            if (newSelected !== 65535)
                setSelected(newSelected);
    }, [focused, navigation, selected]);

    useEffect(() => {
        document.addEventListener('keydown', keyboardListener);

        return () => {
            document.removeEventListener('keydown', keyboardListener);
        }
    }, [keyboardListener]);

    if (!menu) return null;

    return (
        <div className='menu-view'>
            <p>{focused && 'Focused'}</p>
            <canvas  tabIndex={0}
                onFocus={() => setFocused(true)} 
                onBlur={() => setFocused(false)} 
                ref={canvasRef} 
            />
        </div>
    );
}

export default MenuView;