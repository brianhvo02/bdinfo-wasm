import { Box, MenuItem, Pagination, Select, Tab, Tabs } from '@mui/material';
import './Playlists.scss';
import { useAppSelector } from '../store/hooks';
import { selectBluray } from '../store/bluray';
import { useMemo, useState } from 'react';
import { AUDIO_FORMAT_MAP, AUDIO_RATE_MAP, AudioFormatType, AudioRateType, CodingType, STREAM_MAP, STREAM_TYPES, VIDEO_FORMAT_MAP, VIDEO_RATE_MAP, VideoFormatType, VideoRateType, convertToTimestamp } from '../util';
import { StreamProps } from '../types/props';
import MenuView from './MenuView';

const Stream = ({ 
    stream: { codingType, pid, format, rate, lang },
    idx, streamType
}: StreamProps) => {
    return (
        <div className='stream'>
            <h1>{streamType}Stream #{idx + 1} ({pid})</h1>
            <div>
                <h2>Coding Type</h2>
                <p>{STREAM_MAP[codingType as CodingType]}</p>
            </div>
            { (streamType === 'video' || streamType === 'audio') &&
            <>
            <div>
                <h2>Format</h2>
                <p>{ streamType === 'video' ?
                    VIDEO_FORMAT_MAP[format as VideoFormatType] :
                    AUDIO_FORMAT_MAP[format as AudioFormatType]
                }</p>
            </div>
            <div>
                <h2>Frame Rate</h2>
                <p>{ streamType === 'video' ?
                    VIDEO_RATE_MAP[rate as VideoRateType] :
                    AUDIO_RATE_MAP[rate as AudioRateType]
                }</p>
            </div>
            </>
            }
            { (lang as string).length ?
            <div>
                <h2>Language</h2>
                <p>{lang as string}</p>
            </div>
            : null }
        </div>
    );
}

const tabs = ['playItems', 'playMarks', 'subPaths'] as const;

const Playlists = () => {
    const { playlists, menus } = useAppSelector(selectBluray);

    const [page, setPage] = useState(1);
    const [playlistIdx, setPlaylistIdx] = useState(0);
    const [tabIdx, setTabIdx] = useState(0);
    const [menuPageCount, setMenuPageCount] = useState(0);

    const menuClipId = useMemo(() => 
        playlists.length &&
        playlists[playlistIdx].subPaths[0]?.subPlayItems[0]?.clips[0]?.clipId as string, 
        [playlistIdx, playlists]
    );

    if (!playlists.length) return null;

    return (
        <Box sx={{ flex: 1 }} className='playlists'>
            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                <Tabs value={tabIdx} onChange={(_, val) => setTabIdx(val)}>
                    <Tab label='Play Items' />
                    <Tab label='Play Marks' />
                    <Tab label='Sub Paths' />
                </Tabs>
            </Box>
            <Box sx={{ m: 3, display: 'flex', gap: 3, alignItems: 'flex-end' }}>
                <Select value={playlistIdx} onChange={e => {
                    setPlaylistIdx(e.target.value as number);
                    setPage(1);
                }}>
                    { playlists.map((list, i) => {
                        const file = `${list.id}.mpls`;
                        return <MenuItem key={file} value={i}>{file}</MenuItem>;
                    }) }
                </Select>
                { (tabIdx === 0 || (tabIdx === 2 && menuClipId && menuPageCount > 0)) &&
                <Pagination
                    sx={{ mt: 3 }}
                    color='primary'
                    count={ tabIdx === 0 ?
                        playlists[playlistIdx][tabs[tabIdx]].length :
                        menuPageCount
                    } 
                    page={page} 
                    onChange={(_, p) => setPage(p)}
                />
                }
            </Box>
            <Box sx={{ p: 3, overflow: 'auto' }}>
            { tabIdx === 0 && <>
                <h1>{`${playlists[playlistIdx].playItems[page - 1].clip.clipId}.clpi`}</h1>
                <div className='streams'>
                    { STREAM_TYPES.flatMap(type => playlists[playlistIdx].playItems[page - 1][type].map(
                        (stream, i) => <Stream key={stream.pid} stream={stream} idx={i} streamType={type} />
                    )) }
                </div>
            </> }
            <div className='chapters'>
            { tabIdx === 1 && playlists[playlistIdx].playMarks.map((playMark, i) => {
                const firstPlayItem = playlists[playlistIdx].playItems[0];
                const playItem = playlists[playlistIdx].playItems[playMark.playItemRef];

                const playItemElapsedTime = playMark.time - playItem.inTime;
                const totalElapsedTime = playMark.time - firstPlayItem.inTime;

                return (
                    <div key={`chapter_${i}`} className='chapter'>
                        <h1>Chapter {i + 1}</h1>
                        <div className='chapter-item'>
                            <h2>PlayItem</h2>
                            <p>{`${playItem.clip.clipId}.m2ts`}</p>
                        </div>
                        <div className='chapter-item'>
                            <h2>Elapsed Time (PlayItem)</h2>
                            <p>{convertToTimestamp(playItemElapsedTime)}</p>
                        </div>
                        <div className='chapter-item'>
                            <h2>Elapsed Time (Playlist)</h2>
                            <p>{convertToTimestamp(totalElapsedTime)}</p>
                        </div>
                    </div>
                );
            }) }
            </div>
            { tabIdx === 2 && (
                menuClipId ? (
                    menus[menuClipId] ? <>
                        <MenuView 
                            backgroundId={playlists[playlistIdx].playItems[0].clip.clipId as string}
                            clipId={menuClipId} 
                            page={page}
                            setMenuPageCount={setMenuPageCount}
                        />
                    </> : <h1>Menu not yet loaded.</h1>
                ) : <h1>No sub paths for this playlist.</h1>
            ) }
            </Box>
        </Box>
    );
}

export default Playlists;