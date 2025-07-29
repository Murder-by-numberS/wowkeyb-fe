export interface Ability {
    id: number;
    spellId: string;
    name: string;
    description: string;
    power: number;
    icon: string;  // Path or URL to the icon image,
    keybindings: string[];
    class?: string;  // Class name for the ability
    spec?: string;   // Spec name for the ability
    heroTalent?: string;  // Hero talent name for the ability
    isCore?: boolean;  // Whether this is a core class ability
}
