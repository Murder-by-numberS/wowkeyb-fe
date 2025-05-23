import { Keybind } from "./keybind";

export interface Keybinding {
    keybindingId: string;
    name: string;
    userId: string;
    class: string;
    spec?: string;
    heroTalent?: string;
    isPublic: boolean;
    createdAt: string;
    keybinds: Keybind[];
    views?: number;
}

export interface HomeKeybindingsResponse {
    [className: string]: {
        recent: Keybinding[];
        popular: Keybinding[];
    }
}
