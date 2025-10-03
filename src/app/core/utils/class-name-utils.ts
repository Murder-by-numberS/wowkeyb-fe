/**
 * Utility functions for class name formatting between frontend and backend
 * Frontend uses capitalized format (e.g., "Death Knight")
 * Backend uses lowercase format (e.g., "deathknight")
 */

// Mapping of backend class names to frontend display names
const CLASS_NAME_MAPPING: Record<string, string> = {
    'deathknight': 'Death Knight',
    'demonhunter': 'Demon Hunter',
    'druid': 'Druid',
    'evoker': 'Evoker',
    'hunter': 'Hunter',
    'mage': 'Mage',
    'monk': 'Monk',
    'paladin': 'Paladin',
    'priest': 'Priest',
    'rogue': 'Rogue',
    'shaman': 'Shaman',
    'warlock': 'Warlock',
    'warrior': 'Warrior'
};

// Reverse mapping for frontend to backend conversion
const REVERSE_CLASS_NAME_MAPPING: Record<string, string> = Object.fromEntries(
    Object.entries(CLASS_NAME_MAPPING).map(([backend, frontend]) => [frontend, backend])
);

/**
 * Converts a backend class name (lowercase) to frontend display name (capitalized)
 * @param backendClassName - The class name from backend (e.g., "deathknight")
 * @returns The formatted class name for frontend display (e.g., "Death Knight")
 */
export function formatClassNameForFrontend(backendClassName: string): string {
    if (!backendClassName) return backendClassName;

    return CLASS_NAME_MAPPING[backendClassName.toLowerCase()] ||
        backendClassName.charAt(0).toUpperCase() + backendClassName.slice(1);
}

/**
 * Converts a frontend class name (capitalized) to backend format (lowercase)
 * @param frontendClassName - The class name from frontend (e.g., "Death Knight")
 * @returns The formatted class name for backend (e.g., "deathknight")
 */
export function formatClassNameForBackend(frontendClassName: string): string {
    if (!frontendClassName) return frontendClassName;

    return REVERSE_CLASS_NAME_MAPPING[frontendClassName] ||
        frontendClassName.toLowerCase().replace(/\s+/g, '');
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
