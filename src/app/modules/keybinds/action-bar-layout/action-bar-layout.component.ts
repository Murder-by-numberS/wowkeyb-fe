import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewEncapsulation,
    ChangeDetectorRef,
    OnChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';

import { Keybinding } from 'app/core/types/keybinding';
import { Keybind } from 'app/core/types/keybind';
import {
    ActionBar,
    ActionBarLayout,
    RESOLUTIONS,
} from 'app/core/types/action-bar-layout';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { KeybindDialogComponent } from '../keyboard/keybind-dialog/keybind-dialog.component';
import { SlotAssignDialogComponent } from './slot-assign-dialog/slot-assign-dialog.component';
import { SlotKeyDialogComponent } from './slot-key-dialog.component';

/** Slot display: key label + keybinds for that key */
interface ActionBarSlot {
    slotIndex: number;
    keyLabel: string;
    keybinds: Keybind[];
}

/** Bar with its slots for display */
interface DisplayBar extends ActionBar {
    displaySlots: ActionBarSlot[];
}

const DEFAULT_BAR_GAP = 16;
const MAX_BLIZZARD_BARS = 5;
const BLIZZARD_BAR_SLOTS = 12;

const DEFAULT_KEYS_BY_BAR_INDEX: string[][] = [
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'],
    ['Shift+1', 'Shift+2', 'Shift+3', 'Shift+4', 'Shift+5', 'Shift+6', 'Shift+7', 'Shift+8', 'Shift+9', 'Shift+10', 'Shift+11', 'Shift+12'],
    ['Ctrl+1', 'Ctrl+2', 'Ctrl+3', 'Ctrl+4', 'Ctrl+5', 'Ctrl+6', 'Ctrl+7', 'Ctrl+8', 'Ctrl+9', 'Ctrl+10', 'Ctrl+11', 'Ctrl+12'],
    ['Alt+1', 'Alt+2', 'Alt+3', 'Alt+4', 'Alt+5', 'Alt+6', 'Alt+7', 'Alt+8', 'Alt+9', 'Alt+10', 'Alt+11', 'Alt+12'],
];
const ASSIGNABLE_KEYS = DEFAULT_KEYS_BY_BAR_INDEX.flat();

@Component({
    selector: 'action-bar-layout',
    templateUrl: './action-bar-layout.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatSelectModule,
    ],
})
export class ActionBarLayoutComponent implements OnChanges {
    @Input() selectedKeybinding: Keybinding | null = null;
    @Input() keybindingSelected = false;
    @Output() refreshKeybindings = new EventEmitter<void>();

    /** Display bars (from layout or default) */
    displayBars: DisplayBar[] = [];

    keybindMode = false;
    layoutDirty = false;
    private layoutTouchesKeybinds = false;
    private cleanLayoutSnapshot: ActionBarLayout | null = null;
    private cleanKeybindsSnapshot: Keybind[] | null = null;
    private activeKeybindingId: string | null = null;
    private lastRenderSignature: string | null = null;

    /** Screen resolution */
    screenWidth = 2560;
    screenHeight = 1440;
    barGap = DEFAULT_BAR_GAP;
    barMode: 'blizzard' | 'custom' = 'blizzard';

    readonly resolutions = RESOLUTIONS;
    readonly slotOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    readonly maxBlizzardBars = MAX_BLIZZARD_BARS;

    constructor(
        private dialog: MatDialog,
        private keybindingService: KeybindingService,
        private cdr: ChangeDetectorRef
    ) {}

    ngOnChanges(): void {
        const currentId = this.selectedKeybinding?.keybindingId || null;
        const renderSignature = this.computeRenderSignature(this.selectedKeybinding);
        if (currentId !== this.activeKeybindingId) {
            this.activeKeybindingId = currentId;
            this.layoutDirty = false;
            this.layoutTouchesKeybinds = false;
            this.cleanLayoutSnapshot = null;
            this.cleanKeybindsSnapshot = null;
            this.lastRenderSignature = null;
        }
        if (this.lastRenderSignature === renderSignature) {
            return;
        }
        this.loadResolution();
        this.buildDisplayBars();
    }

    private loadResolution(): void {
        const layout = this.selectedKeybinding?.layout;
        if (layout?.screenWidth && layout?.screenHeight) {
            this.screenWidth = layout.screenWidth;
            this.screenHeight = layout.screenHeight;
        }
        this.barGap = layout?.barGap ?? DEFAULT_BAR_GAP;
        this.barMode = 'blizzard';
    }

    get useCustomBarsMode(): boolean {
        return this.barMode === 'custom';
    }

    private buildDisplayBars(): void {
        const layout = this.selectedKeybinding?.layout;
        const hasLayout = layout?.bars?.length;

        if (hasLayout) {
            this.displayBars = layout.bars.slice(0, MAX_BLIZZARD_BARS).map((bar, idx) =>
                this.toDisplayBar(bar, idx)
            );
        } else {
            this.displayBars = [
                this.toDisplayBar(
                    {
                        id: 'main',
                        slots: BLIZZARD_BAR_SLOTS,
                        slotKeys: Array.from({ length: BLIZZARD_BAR_SLOTS }, () => ''),
                        position: {
                            anchor: 'bottom',
                            x: this.screenWidth / 2,
                            y: this.screenHeight - 50,
                        },
                        orientation: 'horizontal',
                        scale: 1,
                    },
                    0
                ),
            ];
        }
        this.lastRenderSignature = this.computeRenderSignature(this.selectedKeybinding);
        this.cdr.markForCheck();
    }

    private toDisplayBar(bar: ActionBar, barIndex: number): DisplayBar {
        const normalizedSlots = BLIZZARD_BAR_SLOTS;
        const configuredKeys = Array.isArray(bar.slotKeys) ? [...bar.slotKeys] : [];
        const keys = Array.from({ length: normalizedSlots }, (_, i) => {
            return configuredKeys[i] !== undefined
                ? configuredKeys[i]
                : '';
        });
        const displaySlots: ActionBarSlot[] = keys.map((keyLabel, slotIndex) => ({
            slotIndex,
            keyLabel,
            keybinds: [],
        }));

        if (
            this.keybindingSelected &&
            this.selectedKeybinding?.keybinds &&
            Array.isArray(this.selectedKeybinding.keybinds)
        ) {
            this.selectedKeybinding.keybinds.forEach((keybind) => {
                if (!keybind?.key || !keybind?.spell) return;
                const slotByIndex =
                    keybind.barId === bar.id &&
                    typeof keybind.slotIndex === 'number' &&
                    keybind.slotIndex >= 0 &&
                    keybind.slotIndex < displaySlots.length
                        ? displaySlots[keybind.slotIndex]
                        : null;
                const slotByKey = displaySlots.find(
                    (s) => keybind.key.toLowerCase() === s.keyLabel.toLowerCase()
                );
                const slot = slotByIndex || slotByKey;
                if (slot) slot.keybinds.push(keybind);
            });
        }

        return { ...bar, slots: normalizedSlots, orientation: 'horizontal', displaySlots };
    }

    onSlotClick(bar: DisplayBar, slot: ActionBarSlot, event: Event): void {
        event.stopPropagation();
        if (!this.selectedKeybinding) return;
        if (this.keybindMode) {
            this.openSlotKeyDialog(bar, slot);
            return;
        }
        if (!slot.keyLabel) {
            this.openSlotKeyDialog(bar, slot);
            return;
        }
        if (slot.keybinds?.length > 0) {
            this.openKeybindDialog(bar, slot);
        } else {
            this.openSlotAssignDialog(bar, slot);
        }
    }

    private openKeybindDialog(bar: DisplayBar, slot: ActionBarSlot): void {
        const keyForDialog = { label: slot.keyLabel, keybinds: [...(slot.keybinds || [])] };
        const isMobile = window.innerWidth < 768;
        const dialogWidth = `${Math.min(300 + Math.max(0, keyForDialog.keybinds.length - 2) * 50, 600)}px`;

        const dialogRef = this.dialog.open(KeybindDialogComponent, {
            data: { key: keyForDialog },
            width: dialogWidth,
            maxWidth: isMobile ? '95vw' : '90vw',
            maxHeight: isMobile ? '90vh' : '80vh',
            panelClass: isMobile ? 'mobile-dialog' : '',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (result === false) return;
            const allKeybinds = [...this.selectedKeybinding.keybinds];
            const isKeybindForSlot = (kb: Keybind) =>
                kb.key.toLowerCase() === slot.keyLabel.toLowerCase();
            const updatedKeybinds = [
                ...allKeybinds.filter((k) => !isKeybindForSlot(k)),
                ...result,
            ];
            this.saveKeybinds(updatedKeybinds);
        });
    }

    private openSlotAssignDialog(bar: DisplayBar, slot: ActionBarSlot): void {
        const dialogRef = this.dialog.open(SlotAssignDialogComponent, {
            data: { slotKey: slot.keyLabel, keybinding: this.selectedKeybinding },
            width: 'min(90vw, 500px)',
            maxHeight: '90vh',
        });

        dialogRef.afterClosed().subscribe((result) => {
            if (!result) return;
            const newKeybind: Keybind = {
                key: result.key,
                spell: result.spell,
                barId: bar.id,
                slotIndex: slot.slotIndex,
            };
            const updatedKeybinds = [...(this.selectedKeybinding.keybinds || []), newKeybind];
            this.saveKeybinds(updatedKeybinds);
        });
    }

    private openSlotKeyDialog(bar: DisplayBar, slot: ActionBarSlot): void {
        const dialogRef = this.dialog.open(SlotKeyDialogComponent, {
            data: {
                currentKey: slot.keyLabel,
                options: ASSIGNABLE_KEYS,
            },
            width: 'min(90vw, 420px)',
        });

        dialogRef.afterClosed().subscribe((newKey: string | undefined) => {
            if (!newKey || newKey === slot.keyLabel) return;
            this.updateSlotKey(bar, slot, newKey);
        });
    }

    private updateSlotKey(bar: DisplayBar, slot: ActionBarSlot, newKey: string): void {
        if (!this.selectedKeybinding) return;

        const layout = this.getLayoutToSave();
        const targetBar = layout.bars.find((b) => b.id === bar.id);
        if (!targetBar) return;

        const slotKeys = Array.isArray(targetBar.slotKeys) ? [...targetBar.slotKeys] : [];
        while (slotKeys.length < targetBar.slots) {
            slotKeys.push('');
        }

        // Prevent duplicate assignment across layout slots
        const used = new Set<string>();
        for (const b of this.displayBars) {
            for (const s of b.displaySlots) {
                if (b.id === bar.id && s.slotIndex === slot.slotIndex) continue;
                used.add(s.keyLabel.toLowerCase());
            }
        }
        if (used.has(newKey.toLowerCase())) return;

        slotKeys[slot.slotIndex] = newKey;
        targetBar.slotKeys = slotKeys;

        const keybinds = (this.selectedKeybinding.keybinds || []).map((kb) => {
            if (kb.barId === bar.id && kb.slotIndex === slot.slotIndex) {
                return { ...kb, key: newKey };
            }
            return kb;
        });
        this.markLayoutDirty();
        this.layoutTouchesKeybinds = true;
        this.selectedKeybinding = {
            ...this.selectedKeybinding,
            layout: this.cloneLayout(layout),
            keybinds,
        };
        this.buildDisplayBars();
    }

    private saveKeybinds(keybinds: Keybind[]): void {
        if (!this.selectedKeybinding) return;
        const payload: Partial<Keybinding> = { keybinds };
        if (this.displayBars.length > 1 || this.selectedKeybinding.layout) {
            payload.layout = this.getLayoutToSave();
        }
        this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, payload).subscribe({
            next: (updated) => {
                this.selectedKeybinding = updated;
                this.buildDisplayBars();
                this.refreshKeybindings.emit();
            },
            error: (err) => console.error('Error updating keybinding:', err),
        });
    }

    addBar(): void {
        if (!this.selectedKeybinding) return;
        if (this.displayBars.length >= MAX_BLIZZARD_BARS) return;

        const barIndex = this.displayBars.length;
        const newBar: ActionBar = {
            id: `bar-${this.displayBars.length + 1}`,
            slots: BLIZZARD_BAR_SLOTS,
            slotKeys: Array.from({ length: BLIZZARD_BAR_SLOTS }, () => ''),
            position: {
                anchor: 'center',
                x: this.screenWidth / 2,
                y: this.screenHeight - 50 - barIndex * 64,
            },
            orientation: 'horizontal',
            scale: 1,
        };

        const layout = this.getLayoutToSave();
        layout.bars.push(newBar);
        layout.screenWidth = this.screenWidth;
        layout.screenHeight = this.screenHeight;
        this.markLayoutDirty();
        this.setDraftLayout(layout);
        this.buildDisplayBars();
    }

    saveLayoutChanges(): void {
        if (!this.selectedKeybinding || !this.layoutDirty) return;
        const layout = this.getLayoutToSave();
        const payload: Partial<Keybinding> = { layout };
        if (this.layoutTouchesKeybinds) {
            payload.keybinds = [...(this.selectedKeybinding.keybinds || [])];
        }

        this.keybindingService
            .updateKeybinding(this.selectedKeybinding.keybindingId, payload)
            .subscribe({
                next: (updated) => {
                    this.selectedKeybinding = updated;
                    this.layoutDirty = false;
                    this.layoutTouchesKeybinds = false;
                    this.cleanLayoutSnapshot = null;
                    this.cleanKeybindsSnapshot = null;
                    this.lastRenderSignature = this.computeRenderSignature(this.selectedKeybinding);
                    this.refreshKeybindings.emit();
                },
                error: (err) => console.error('Error saving layout changes:', err),
            });
    }

    resetLayoutChanges(): void {
        if (!this.selectedKeybinding || !this.layoutDirty) return;
        const layout = this.cleanLayoutSnapshot ? this.cloneLayout(this.cleanLayoutSnapshot) : null;
        const keybinds = this.cleanKeybindsSnapshot ? [...this.cleanKeybindsSnapshot] : [...(this.selectedKeybinding.keybinds || [])];
        this.selectedKeybinding = {
            ...this.selectedKeybinding,
            layout,
            keybinds,
        };
        this.layoutDirty = false;
        this.layoutTouchesKeybinds = false;
        this.cleanLayoutSnapshot = null;
        this.cleanKeybindsSnapshot = null;
        this.buildDisplayBars();
        this.loadResolution();
    }

    private markLayoutDirty(): void {
        if (this.layoutDirty || !this.selectedKeybinding) return;
        this.cleanLayoutSnapshot = this.selectedKeybinding.layout
            ? this.cloneLayout(this.selectedKeybinding.layout)
            : null;
        this.cleanKeybindsSnapshot = [...(this.selectedKeybinding.keybinds || [])];
        this.layoutDirty = true;
    }

    private setDraftLayout(layout: ActionBarLayout): void {
        if (!this.selectedKeybinding) return;
        this.selectedKeybinding = {
            ...this.selectedKeybinding,
            layout: this.cloneLayout(layout),
        };
    }

    private cloneLayout(layout: ActionBarLayout): ActionBarLayout {
        return JSON.parse(JSON.stringify(layout));
    }

    private computeRenderSignature(keybinding: Keybinding | null): string {
        if (!keybinding) return 'no-keybinding';
        const layoutSig = keybinding.layout ? JSON.stringify(keybinding.layout) : 'no-layout';
        const keybindsSig = (keybinding.keybinds || [])
            .map((kb) =>
                [
                    kb.barId || '',
                    typeof kb.slotIndex === 'number' ? String(kb.slotIndex) : '',
                    kb.key || '',
                    kb.spell?.spellId || kb.spell?.name || '',
                ].join('|')
            )
            .sort()
            .join(';');
        return `${keybinding.keybindingId || ''}::${layoutSig}::${keybindsSig}`;
    }

    private getLayoutToSave(): ActionBarLayout {
        const existing = this.selectedKeybinding?.layout;
        if (existing?.bars?.length) {
            return {
                bars: existing.bars.map((b) => ({
                    ...b,
                    position: { ...b.position },
                })),
                barMode: 'blizzard',
                screenWidth: this.screenWidth,
                screenHeight: this.screenHeight,
                barGap: existing.barGap ?? this.barGap,
            };
        }
        return {
            bars: this.displayBars.map((b) => ({
                id: b.id,
                slots: b.slots,
                slotKeys: Array.isArray(b.slotKeys) ? [...b.slotKeys].slice(0, b.slots) : undefined,
                position: { ...b.position },
                orientation: b.orientation,
                scale: b.scale ?? 1,
            })),
            barMode: 'blizzard',
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            barGap: this.barGap,
        };
    }
}
