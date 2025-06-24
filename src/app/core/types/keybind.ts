export interface Keybind {
    key: string;
    spell: {
        key: string,
        description: string,
        icon: string,
        id: number,
        keybinding: string,
        name: string,
        spellId: string
    };
    modifiers?: string[];
}
