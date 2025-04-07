import { Keybind } from "./keybind";

export interface Keybinding {
    keybinding_id: string,
    name: string;
    class: string; //TODO: ENUM
    spec?: string; //TODO: ENUM
    heroTalent?: string;  //TODO: ENUM
    keybinds: Keybind[];
    is_public?: boolean;
}
