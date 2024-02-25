import { DiscInfo, Vector } from './types/bluray';
import { Info } from './types/interface';

export const convertVectorToArray = <T>(vector: Vector<T>) => 
    [...Array(vector.size()).keys()].map(i => vector.get(i) as T);

export const convertDiscInfo = (info: Info): DiscInfo => {
    return {
        aacsDetected: info.aacsDetected,
        bdjDetected: info.bdjDetected,
        blurayDetected: info.blurayDetected,
        firstPlay: info.firstPlay,
        firstPlaySupported: info.firstPlaySupported,
        noMenuSupport: info.noMenuSupport,
        numBDJTitles: info.numBDJTitles,
        numHDMVTitles: info.numHDMVTitles,
        numTitles: info.numTitles,
        numUnsupportedTitles: info.numUnsupportedTitles,
        titles: convertVectorToArray(info.titles),
        topMenu: info.topMenu,
        topMenuSupported: info.topMenuSupported,
    }
}

export const boolAffirm = (bool: boolean) => bool ? 'Yes' : 'No';