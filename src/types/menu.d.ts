interface MenuWithBackground extends Menu {
    background: string;
}

interface Menu {
    version: number;
    pictures: Record<string, Picture>;
    pages: Record<string, Page>;
    width: number;
    height: number;
}

interface Picture {
    width: number;
    height: number;
    decoded_pictures: Record<string, string>;
}

type MenuImage = Record<string, HTMLImageElement>;

interface Page {
    id: number;
    uo: number;
    in_effects: EffectWrapper;
    out_effects: EffectWrapper;
    framerate_divider: number;
    def_button: number;
    def_activated: number;
    palette: number;
    bogs: Bog[];
}

interface EffectWrapper {
    windows: Record<string, MenuWindow>;
    effects: Effect[];
}

interface Effect {
    duration: number;
    palette: number;
    objects: EffectObject[];
}

interface EffectObject {
    id: number;
    window: MenuWindow;
    x: number;
    y: number;
}

interface MenuWindow {
    id: number;
    x: number;
    y: number;
    width: number;
    height: number;
}

interface Effect {
    duration: number;
    palette: number;
    objects: EffectObject[];
}

interface EffectObject {
    id: number;
    window: MenuWindow;
    x: number;
    y: number;
}

interface Bog {
    def_button: number;
    buttons: BogButton[];
}

interface BogWithButtonMap {
    def_button: number;
    buttons: Record<string, BogButton>;
}

interface BogButton {
    id: number;
    v: number;
    f: number;
    auto_action: boolean;
    x: number;
    y: number;
    navigation: Navigation;
    states: {
        normal: State;
        selected: State;
        activated: State;
    }
    commands: [number, number, number][];
}

interface Navigation {
    up: number;
    down: number;
    left: number;
    right: number;
}

interface State {
    start: number;
    stop: number;
    flags: number;
}