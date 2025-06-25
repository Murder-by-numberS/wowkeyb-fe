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
    version?: {
        _id: string;
        game_version: string;
        createdAt: string;
        updatedAt: string;
        __v: number;
    };
    versionDetails?: {
        versionId: string;
        gameVersion: string;
    };
}

export interface HomeKeybindingsResponse {
    [className: string]: {
        recent: Keybinding[];
        popular: Keybinding[];
    }
}
