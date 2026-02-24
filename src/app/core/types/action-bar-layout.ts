/**
 * Action bar layout types for Edit Mode.
 * Used to design action bar positions and spell placement in the web app.
 */

export type BarAnchor = 'bottom' | 'top' | 'left' | 'right' | 'center';

export interface BarPosition {
    anchor: BarAnchor;
    x: number;
    y: number;
}

export interface ActionBar {
    id: string;
    slots: number;
    position: BarPosition;
    orientation: 'horizontal' | 'vertical';
    scale?: number;
}

export interface ActionBarLayout {
    bars: ActionBar[];
    /** Screen resolution for layout preview (design pixels) */
    screenWidth?: number;
    screenHeight?: number;
    /** Vertical snap gap between stacked bars (design pixels) */
    barGap?: number;
}

/** Common resolutions */
export const RESOLUTIONS = [
    { label: '1080p', width: 1920, height: 1080 },
    { label: '1440p', width: 2560, height: 1440 },
    { label: '4K', width: 3840, height: 2160 },
] as const;

/** Slot assignment: which spell + key is on a bar slot */
export interface SlotAssignment {
    barId: string;
    slotIndex: number;
    key: string;
    spellId: string;
}
