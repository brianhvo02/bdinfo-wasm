// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
  __Z7versionv(_0: number): void;
  __Z9open_discNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(_0: number): number;
  __Z13get_disc_infov(_0: number): void;
  __Z9read_mobjNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(_0: number, _1: number): void;
  __Z12get_metadatav(_0: number): void;
  __Z17get_playlist_infoNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(_0: number, _1: number): void;
  __Z17get_all_playlistsv(_0: number): void;
}

export interface BlurayTitles {
  size(): number;
  get(_0: number): BlurayTitle | undefined;
  push_back(_0: BlurayTitle): void;
  resize(_0: number, _1: BlurayTitle): void;
  set(_0: number, _1: BlurayTitle): boolean;
  delete(): void;
}

export interface MObjCommands {
  push_back(_0: MObjCommand): void;
  resize(_0: number, _1: MObjCommand): void;
  size(): number;
  get(_0: number): MObjCommand | undefined;
  set(_0: number, _1: MObjCommand): boolean;
  delete(): void;
}

export interface MObjObjectsVector {
  push_back(_0: MObjObject): void;
  resize(_0: number, _1: MObjObject): void;
  size(): number;
  get(_0: number): MObjObject | undefined;
  set(_0: number, _1: MObjObject): boolean;
  delete(): void;
}

export interface Streams {
  size(): number;
  get(_0: number): Stream | undefined;
  push_back(_0: Stream): void;
  resize(_0: number, _1: Stream): void;
  set(_0: number, _1: Stream): boolean;
  delete(): void;
}

export interface Clips {
  size(): number;
  get(_0: number): Clip | undefined;
  push_back(_0: Clip): void;
  resize(_0: number, _1: Clip): void;
  set(_0: number, _1: Clip): boolean;
  delete(): void;
}

export interface SubPathPlayItems {
  push_back(_0: SubPathPlayItem): void;
  resize(_0: number, _1: SubPathPlayItem): void;
  size(): number;
  get(_0: number): SubPathPlayItem | undefined;
  set(_0: number, _1: SubPathPlayItem): boolean;
  delete(): void;
}

export interface PlayItems {
  size(): number;
  get(_0: number): PlayItem | undefined;
  push_back(_0: PlayItem): void;
  resize(_0: number, _1: PlayItem): void;
  set(_0: number, _1: PlayItem): boolean;
  delete(): void;
}

export interface SubPaths {
  push_back(_0: SubPath): void;
  resize(_0: number, _1: SubPath): void;
  size(): number;
  get(_0: number): SubPath | undefined;
  set(_0: number, _1: SubPath): boolean;
  delete(): void;
}

export interface PlayMarks {
  push_back(_0: PlayMark): void;
  resize(_0: number, _1: PlayMark): void;
  size(): number;
  get(_0: number): PlayMark | undefined;
  set(_0: number, _1: PlayMark): boolean;
  delete(): void;
}

export interface Playlists {
  size(): number;
  get(_0: number): Playlist | undefined;
  push_back(_0: Playlist): void;
  resize(_0: number, _1: Playlist): void;
  set(_0: number, _1: Playlist): boolean;
  delete(): void;
}

export interface MetaTitleVector {
  size(): number;
  get(_0: number): MetaTitle | undefined;
  push_back(_0: MetaTitle): void;
  resize(_0: number, _1: MetaTitle): void;
  set(_0: number, _1: MetaTitle): boolean;
  delete(): void;
}

export interface MetaThumbnailVector {
  size(): number;
  get(_0: number): MetaThumbnail | undefined;
  push_back(_0: MetaThumbnail): void;
  resize(_0: number, _1: MetaThumbnail): void;
  set(_0: number, _1: MetaThumbnail): boolean;
  delete(): void;
}

export type SubPath = {
  type: number,
  subPlayItems: SubPathPlayItems
};

export type MObjObject = {
  resumeIntentionFlag: boolean,
  menuCallMask: boolean,
  titleSearchMask: boolean,
  numCommands: number,
  commands: MObjCommands
};

export type HDMVInstruction = {
  group: number,
  subGroup: number,
  operandCount: number,
  setOption: number,
  compareOption: number,
  branchOption: number,
  iFlagOperand1: number,
  iFlagOperand2: number,
  reserved1: number,
  reserved2: number,
  reserved3: number
};

export type MObjCommand = {
  instruction: HDMVInstruction,
  instructionValue: number,
  destination: number,
  source: number
};

export type MObjObjects = {
  version: number,
  numObjects: number,
  objects: MObjObjectsVector
};

export type SubPathPlayItem = {
  inTime: number,
  outTime: number,
  syncPlayItemId: number,
  syncPts: number,
  clips: Clips
};

export type PlayMark = {
  markType: number,
  playItemRef: number,
  time: number,
  entryEsPid: number,
  duration: number
};

export type BlurayTitle = {
  accessible: boolean,
  bdj: boolean,
  hidden: boolean,
  idRef: number,
  interactive: boolean,
  name: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type Clip = {
  clipId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  codecId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type PlayItem = {
  inTime: number,
  outTime: number,
  clip: Clip,
  video: Streams,
  audio: Streams,
  pg: Streams,
  ig: Streams,
  secondaryAudio: Streams,
  secondaryVideo: Streams,
  dv: Streams
};

export type Stream = {
  streamType: number,
  codingType: number,
  pid: number,
  subpathId: number,
  subclipId: number,
  format: number,
  rate: number,
  dynamicRangeType: number,
  colorSpace: number,
  crFlag: number,
  hdrPlusFlag: number,
  charCode: number,
  lang: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type Playlist = {
  id: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  playItems: PlayItems,
  subPaths: SubPaths,
  playMarks: PlayMarks
};

export type MetaThumbnail = {
  path: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  xres: number,
  yres: number
};

export type MetaTitle = {
  titleNumber: number,
  titleName: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type MetaDiscLibrary = {
  languageCode: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  filename: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  diName: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  diAlternative: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  diNumSets: number,
  diSetNumber: number,
  tocCount: number,
  tocEntries: MetaTitleVector,
  thumbCount: number,
  thumbnails: MetaThumbnailVector
};

export type Info = {
  aacsDetected: boolean,
  aacsErrorCode: number,
  aacsHandled: boolean,
  aacsMkbv: number,
  bdjDetected: boolean,
  bdjDiscId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  bdjHandled: boolean,
  bdjOrgId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  bdjSupported: boolean,
  blurayDetected: boolean,
  contentExist3D: boolean,
  discId: any,
  discName: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  firstPlay: BlurayTitle,
  firstPlaySupported: boolean,
  frameRate: number,
  initialDynamicRangeType: number,
  initialOutputModePreference: number,
  libaacsDetected: boolean,
  libbdplusDetected: boolean,
  libjvmDetected: boolean,
  noMenuSupport: boolean,
  numBDJTitles: number,
  numHDMVTitles: number,
  numTitles: number,
  numUnsupportedTitles: number,
  providerData: any,
  topMenu: BlurayTitle,
  topMenuSupported: boolean,
  udfVolumeId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  videoFormat: number,
  titles: BlurayTitles
};

interface EmbindModule {
  BlurayTitles: {new(): BlurayTitles};
  MObjCommands: {new(): MObjCommands};
  MObjObjectsVector: {new(): MObjObjectsVector};
  Streams: {new(): Streams};
  Clips: {new(): Clips};
  SubPathPlayItems: {new(): SubPathPlayItems};
  PlayItems: {new(): PlayItems};
  SubPaths: {new(): SubPaths};
  PlayMarks: {new(): PlayMarks};
  Playlists: {new(): Playlists};
  MetaTitleVector: {new(): MetaTitleVector};
  MetaThumbnailVector: {new(): MetaThumbnailVector};
  getAllPlaylists(): Playlists;
  getMetadata(): MetaDiscLibrary;
  version(): string;
  openDisc(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): number;
  readMobj(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): MObjObjects;
  getPlaylistInfo(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): Playlist;
  getDiscInfo(): Info;
}
export type MainModule = WasmModule & EmbindModule;
