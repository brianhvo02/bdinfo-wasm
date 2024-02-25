// TypeScript bindings for emscripten-generated code.  Automatically generated at compile time.
interface WasmModule {
  __Z7versionv(_0: number): void;
  __Z9open_discNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(_0: number): number;
  __Z13get_disc_infov(_0: number): void;
  __Z9read_mobjNSt3__212basic_stringIcNS_11char_traitsIcEENS_9allocatorIcEEEE(_0: number, _1: number): void;
  __Z17get_playlist_infoj(_0: number, _1: number): void;
  __Z21get_all_playlist_infov(_0: number): void;
  __Z12get_metadatav(_0: number): void;
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
  get(_0: number): StreamInfo | undefined;
  push_back(_0: StreamInfo): void;
  resize(_0: number, _1: StreamInfo): void;
  set(_0: number, _1: StreamInfo): boolean;
  delete(): void;
}

export interface Clips {
  size(): number;
  get(_0: number): ClipInfo | undefined;
  push_back(_0: ClipInfo): void;
  resize(_0: number, _1: ClipInfo): void;
  set(_0: number, _1: ClipInfo): boolean;
  delete(): void;
}

export interface Chapters {
  size(): number;
  get(_0: number): TitleChapter | undefined;
  push_back(_0: TitleChapter): void;
  resize(_0: number, _1: TitleChapter): void;
  set(_0: number, _1: TitleChapter): boolean;
  delete(): void;
}

export interface Marks {
  size(): number;
  get(_0: number): TitleMark | undefined;
  push_back(_0: TitleMark): void;
  resize(_0: number, _1: TitleMark): void;
  set(_0: number, _1: TitleMark): boolean;
  delete(): void;
}

export interface TitleInfoVector {
  size(): number;
  get(_0: number): TitleInfo | undefined;
  push_back(_0: TitleInfo): void;
  resize(_0: number, _1: TitleInfo): void;
  set(_0: number, _1: TitleInfo): boolean;
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

export type BlurayTitle = {
  accessible: boolean,
  bdj: boolean,
  hidden: boolean,
  idRef: number,
  interactive: boolean,
  name: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type TitleMark = {
  idx: number,
  type: number,
  start: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  duration: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  offset: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  clipRef: number
};

export type TitleChapter = {
  idx: number,
  start: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  duration: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  offset: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  clipRef: number
};

export type StreamInfo = {
  aspect: number,
  charCode: number,
  codingType: number,
  format: number,
  lang: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  pid: number,
  rate: number,
  subpathId: number
};

export type ClipInfo = {
  pktCount: number,
  stillMode: number,
  stillTime: number,
  videoStreamCount: number,
  audioStreamCount: number,
  PGStreamCount: number,
  IGStreamCount: number,
  secondaryVideoStreamCount: number,
  secondaryAudioStreamCount: number,
  audioStreams: Streams,
  videoStreams: Streams,
  pgStreams: Streams,
  igStreams: Streams,
  secondaryAudioStreams: Streams,
  secondaryVideoStreams: Streams,
  startTime: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  inTime: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  outTime: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  clipId: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string
};

export type TitleInfo = {
  idx: number,
  playlist: number,
  duration: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string,
  clipCount: number,
  angleCount: number,
  chapterCount: number,
  markCount: number,
  clips: Clips,
  chapters: Chapters,
  marks: Marks,
  MVCBaseViewRFlag: number
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
  Chapters: {new(): Chapters};
  Marks: {new(): Marks};
  TitleInfoVector: {new(): TitleInfoVector};
  MetaTitleVector: {new(): MetaTitleVector};
  MetaThumbnailVector: {new(): MetaThumbnailVector};
  getAllPlaylistInfo(): TitleInfoVector;
  getPlaylistInfo(_0: number): TitleInfo;
  getMetadata(): MetaDiscLibrary;
  version(): string;
  openDisc(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): number;
  readMobj(_0: ArrayBuffer|Uint8Array|Uint8ClampedArray|Int8Array|string): MObjObjects;
  getDiscInfo(): Info;
}
export type MainModule = WasmModule & EmbindModule;
