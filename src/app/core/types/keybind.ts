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
    /** Optional: which action bar (for layout mode) */
    barId?: string;
    /** Optional: which slot on the bar (0-based) */
    slotIndex?: number;
}
