export interface Ability {
    id: string;
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
    abilityType?: string;  // Type of ability: 'class', 'spec', or 'hero_talent'
    levelRequired?: number;  // Level required to use the ability
    cooldown?: number;  // Cooldown in seconds
    range?: number;  // Range in yards
    cost?: string;  // Resource cost type
    costAmount?: number;  // Amount of resource required
    gameVersion?: string;  // Game version this ability is from
}
