/**
 * Utility functions for class name formatting between frontend and backend
 * Frontend uses display labels (e.g., "Death Knight")
 * Backend uses canonical values (e.g., "deathknight")
 */

export interface CatalogOption {
    value: string;
    label: string;
    specId?: number;
}

export interface ClassCatalogEntry {
    value: string;
    label: string;
    specs: CatalogOption[];
    heroTalents: CatalogOption[];
}

export const CLASS_SPEC_HERO_CATALOG: ClassCatalogEntry[] = [
    {
        value: 'deathknight',
        label: 'Death Knight',
        specs: [
            { value: 'blood', label: 'Blood', specId: 250 },
            { value: 'frost', label: 'Frost', specId: 251 },
            { value: 'unholy', label: 'Unholy', specId: 252 },
        ],
        heroTalents: [
            { value: 'deathbringer', label: 'Deathbringer' },
            { value: 'san-layn', label: "San'layn" },
            { value: 'rider-of-the-apocalypse', label: 'Rider of the Apocalypse' },
        ],
    },
    {
        value: 'demonhunter',
        label: 'Demon Hunter',
        specs: [
            { value: 'havoc', label: 'Havoc', specId: 577 },
            { value: 'vengeance', label: 'Vengeance', specId: 581 },
        ],
        heroTalents: [
            { value: 'aldrachi-reaver', label: 'Aldrachi Reaver' },
            { value: 'fel-scarred', label: 'Fel-Scarred' },
        ],
    },
    {
        value: 'druid',
        label: 'Druid',
        specs: [
            { value: 'balance', label: 'Balance', specId: 102 },
            { value: 'feral', label: 'Feral', specId: 103 },
            { value: 'guardian', label: 'Guardian', specId: 104 },
            { value: 'restoration', label: 'Restoration', specId: 105 },
        ],
        heroTalents: [
            { value: 'elunes-chosen', label: "Elune's Chosen" },
            { value: 'keeper-of-the-grove', label: 'Keeper of the Grove' },
            { value: 'druid-of-the-claw', label: 'Druid of the Claw' },
            { value: 'wildstalker', label: 'Wildstalker' },
        ],
    },
    {
        value: 'evoker',
        label: 'Evoker',
        specs: [
            { value: 'devastation', label: 'Devastation', specId: 1467 },
            { value: 'preservation', label: 'Preservation', specId: 1468 },
            { value: 'augmentation', label: 'Augmentation', specId: 1473 },
        ],
        heroTalents: [
            { value: 'flameshaper', label: 'Flameshaper' },
            { value: 'scalecommander', label: 'Scalecommander' },
            { value: 'chronowarden', label: 'Chronowarden' },
        ],
    },
    {
        value: 'hunter',
        label: 'Hunter',
        specs: [
            { value: 'beast-mastery', label: 'Beast Mastery', specId: 253 },
            { value: 'marksmanship', label: 'Marksmanship', specId: 254 },
            { value: 'survival', label: 'Survival', specId: 255 },
        ],
        heroTalents: [
            { value: 'dark-ranger', label: 'Dark Ranger' },
            { value: 'pack-leader', label: 'Pack Leader' },
            { value: 'sentinel', label: 'Sentinel' },
        ],
    },
    {
        value: 'mage',
        label: 'Mage',
        specs: [
            { value: 'arcane', label: 'Arcane', specId: 62 },
            { value: 'fire', label: 'Fire', specId: 63 },
            { value: 'frost', label: 'Frost', specId: 64 },
        ],
        heroTalents: [
            { value: 'spellslinger', label: 'Spellslinger' },
            { value: 'sunfury', label: 'Sunfury' },
            { value: 'frostfire', label: 'Frostfire' },
        ],
    },
    {
        value: 'monk',
        label: 'Monk',
        specs: [
            { value: 'brewmaster', label: 'Brewmaster', specId: 268 },
            { value: 'mistweaver', label: 'Mistweaver', specId: 270 },
            { value: 'windwalker', label: 'Windwalker', specId: 269 },
        ],
        heroTalents: [
            { value: 'master-of-harmony', label: 'Master of Harmony' },
            { value: 'shado-pan', label: 'Shado-Pan' },
            { value: 'conduit-of-the-celestials', label: 'Conduit of the Celestials' },
        ],
    },
    {
        value: 'paladin',
        label: 'Paladin',
        specs: [
            { value: 'holy', label: 'Holy', specId: 65 },
            { value: 'protection', label: 'Protection', specId: 66 },
            { value: 'retribution', label: 'Retribution', specId: 70 },
        ],
        heroTalents: [
            { value: 'herald-of-the-sun', label: 'Herald of the Sun' },
            { value: 'lightsmith', label: 'Lightsmith' },
            { value: 'templar', label: 'Templar' },
        ],
    },
    {
        value: 'priest',
        label: 'Priest',
        specs: [
            { value: 'discipline', label: 'Discipline', specId: 256 },
            { value: 'holy', label: 'Holy', specId: 257 },
            { value: 'shadow', label: 'Shadow', specId: 258 },
        ],
        heroTalents: [
            { value: 'archon', label: 'Archon' },
            { value: 'oracle', label: 'Oracle' },
            { value: 'voidweaver', label: 'Voidweaver' },
        ],
    },
    {
        value: 'rogue',
        label: 'Rogue',
        specs: [
            { value: 'assassination', label: 'Assassination', specId: 259 },
            { value: 'outlaw', label: 'Outlaw', specId: 260 },
            { value: 'subtlety', label: 'Subtlety', specId: 261 },
        ],
        heroTalents: [
            { value: 'deathstalker', label: 'Deathstalker' },
            { value: 'fatebound', label: 'Fatebound' },
            { value: 'trickster', label: 'Trickster' },
        ],
    },
    {
        value: 'shaman',
        label: 'Shaman',
        specs: [
            { value: 'elemental', label: 'Elemental', specId: 262 },
            { value: 'enhancement', label: 'Enhancement', specId: 263 },
            { value: 'restoration', label: 'Restoration', specId: 264 },
        ],
        heroTalents: [
            { value: 'farseer', label: 'Farseer' },
            { value: 'stormbringer', label: 'Stormbringer' },
            { value: 'totemic', label: 'Totemic' },
        ],
    },
    {
        value: 'warlock',
        label: 'Warlock',
        specs: [
            { value: 'affliction', label: 'Affliction', specId: 265 },
            { value: 'demonology', label: 'Demonology', specId: 266 },
            { value: 'destruction', label: 'Destruction', specId: 267 },
        ],
        heroTalents: [
            { value: 'hellcaller', label: 'Hellcaller' },
            { value: 'soul-harvester', label: 'Soul Harvester' },
            { value: 'diabolist', label: 'Diabolist' },
        ],
    },
    {
        value: 'warrior',
        label: 'Warrior',
        specs: [
            { value: 'arms', label: 'Arms', specId: 71 },
            { value: 'fury', label: 'Fury', specId: 72 },
            { value: 'protection', label: 'Protection', specId: 73 },
        ],
        heroTalents: [
            { value: 'colossus', label: 'Colossus' },
            { value: 'slayer', label: 'Slayer' },
            { value: 'mountain-thane', label: 'Mountain Thane' },
        ],
    },
];

export const FRONTEND_CLASS_OPTIONS: Array<{ value: string; label: string }> = CLASS_SPEC_HERO_CATALOG.map((entry) => ({
    value: entry.value,
    label: entry.label,
}));

const CLASS_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    CLASS_SPEC_HERO_CATALOG.map((entry) => [entry.value, entry.label])
);
const SPEC_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    CLASS_SPEC_HERO_CATALOG.flatMap((entry) => entry.specs.map((spec) => [spec.value, spec.label]))
);
const HERO_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    CLASS_SPEC_HERO_CATALOG.flatMap((entry) => entry.heroTalents.map((hero) => [hero.value, hero.label]))
);
const REVERSE_CLASS_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    Object.entries(CLASS_NAME_MAPPING).map(([backend, frontend]) => [frontend, backend])
);
const REVERSE_SPEC_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    Object.entries(SPEC_NAME_MAPPING).map(([backend, frontend]) => [frontend, backend])
);
const REVERSE_HERO_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    Object.entries(HERO_NAME_MAPPING).map(([backend, frontend]) => [frontend, backend])
);

function slugifyForMatch(value: string, compact = false): string {
    let normalized = value
        .trim()
        .toLowerCase()
        .replace(/['`]/g, '')
        .replace(/[_\s]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    if (compact) {
        normalized = normalized.replace(/-/g, '');
    }
    return normalized;
}

function titleCaseFallback(value: string): string {
    return value
        .split('-')
        .filter(Boolean)
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
}

/**
 * Converts a backend class name (lowercase) to frontend display name (capitalized)
 * @param backendClassName - The class name from backend (e.g., "deathknight")
 * @returns The formatted class name for frontend display (e.g., "Death Knight")
 */
export function formatClassNameForFrontend(backendClassName: string): string {
    if (!backendClassName) return backendClassName;

    const normalized = slugifyForMatch(backendClassName, true);
    return CLASS_NAME_MAPPING[normalized] || titleCaseFallback(backendClassName);
}

/**
 * Converts a frontend class name (capitalized) to backend format (lowercase)
 * @param frontendClassName - The class name from frontend (e.g., "Death Knight")
 * @returns The formatted class name for backend (e.g., "deathknight")
 */
export function formatClassNameForBackend(frontendClassName: string): string {
    if (!frontendClassName) return frontendClassName;

    const direct = REVERSE_CLASS_NAME_MAPPING[frontendClassName];
    if (direct) return direct;

    const compact = slugifyForMatch(frontendClassName, true);
    if (CLASS_NAME_MAPPING[compact]) return compact;
    if (compact === 'dk') return 'deathknight';
    if (compact === 'dh') return 'demonhunter';
    return compact;
}

export function formatSpecNameForFrontend(backendSpecName: string): string {
    if (!backendSpecName) return backendSpecName;
    const normalized = slugifyForMatch(backendSpecName);
    return SPEC_NAME_MAPPING[normalized] || titleCaseFallback(normalized);
}

export function formatSpecNameForBackend(frontendSpecName: string): string {
    if (!frontendSpecName) return frontendSpecName;

    const direct = REVERSE_SPEC_NAME_MAPPING[frontendSpecName];
    if (direct) return direct;

    const normalized = slugifyForMatch(frontendSpecName);
    if (normalized === 'beastmastery') return 'beast-mastery';
    return normalized;
}

export function formatHeroTalentNameForFrontend(backendHeroName: string): string {
    if (!backendHeroName) return backendHeroName;
    const normalized = slugifyForMatch(backendHeroName);
    return HERO_NAME_MAPPING[normalized] || titleCaseFallback(normalized);
}

export function formatHeroTalentNameForBackend(frontendHeroName: string): string {
    if (!frontendHeroName) return frontendHeroName;

    const direct = REVERSE_HERO_NAME_MAPPING[frontendHeroName];
    if (direct) return direct;

    const normalized = slugifyForMatch(frontendHeroName);
    const compact = normalized.replace(/-/g, '');
    const aliases: Record<string, string> = {
        sanlayn: 'san-layn',
        rideroftheapocalypse: 'rider-of-the-apocalypse',
        eluneschosen: 'elunes-chosen',
        masterofharmony: 'master-of-harmony',
        shadopan: 'shado-pan',
        conduitofthecelestials: 'conduit-of-the-celestials',
        heraldofthesun: 'herald-of-the-sun',
        keeperofthegrove: 'keeper-of-the-grove',
        druidoftheclaw: 'druid-of-the-claw',
        darkranger: 'dark-ranger',
        packleader: 'pack-leader',
        soulharvester: 'soul-harvester',
        mountainthane: 'mountain-thane',
        aldrachireaver: 'aldrachi-reaver',
        felscarred: 'fel-scarred',
    };
    return aliases[compact] || normalized;
}

/**
 * Gets all available class names in frontend format
 * @returns Array of class names in capitalized format
 */
export function getFrontendClassNames(): string[] {
    return Object.values(CLASS_NAME_MAPPING);
}

/**
 * Gets all available class names in backend format
 * @returns Array of class names in lowercase format
 */
export function getBackendClassNames(): string[] {
    return Object.keys(CLASS_NAME_MAPPING);
}
