export interface Ability {
    id: number;
    spellId: string;
    name: string;
    description: string;
    power: number;
    icon: string;  // Path or URL to the icon image,
    keybindings: string[];
}
