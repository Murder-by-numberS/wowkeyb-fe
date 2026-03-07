import { Keybind } from "./keybind";
import { ActionBarLayout } from "./action-bar-layout";

export interface Keybinding {
    keybindingId: string;
    name: string;
    userId: string;
    creatorUsername?: string;
    class: string;
    spec?: string;
    heroTalent?: string;
    isPublic: boolean;
    createdAt: string;
    keybinds: Keybind[];
    /** Optional action bar layout for Edit Mode */
    layout?: ActionBarLayout;
    views?: number;
    deleted_at?: string; // For soft-deleted keybindings
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
    randomClassDetails?: {
        class: string;
        spec: string;
        heroTalent: string;
    };
}

export interface HomeKeybindingsResponse {
    [className: string]: {
        recent: Keybinding[];
        popular: Keybinding[];
    }
}
