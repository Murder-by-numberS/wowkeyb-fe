import {
    Component,
    Input,
    Output,
    EventEmitter,
    ViewEncapsulation,
    ChangeDetectorRef,
    OnChanges,
    ElementRef,
    ViewChild,
    AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { DragDropModule, CdkDragEnd, CdkDragMove } from '@angular/cdk/drag-drop';

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

/** Grid size in design pixels for snapping */
const GRID_SIZE = 32;
const BAR_ALIGN_SNAP_THRESHOLD = 28;
const DEFAULT_BAR_GAP = 16;

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
        DragDropModule,
    ],
})
export class ActionBarLayoutComponent implements OnChanges, AfterViewInit {
    @Input() selectedKeybinding: Keybinding | null = null;
    @Input() keybindingSelected = false;
    @Output() refreshKeybindings = new EventEmitter<void>();

    @ViewChild('screenCanvas') screenCanvasRef!: ElementRef<HTMLDivElement>;

    /** Display bars (from layout or default) */
    displayBars: DisplayBar[] = [];

    /** Currently selected bar (for delete, etc.) */
    selectedBarId: string | null = null;
    guideLineX: number | null = null;
    guideLineY: number | null = null;
    keybindMode = false;
    positionInputX: number | null = null;
    positionInputY: number | null = null;
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
    barMode: 'blizzard' | 'custom' = 'custom';

    readonly resolutions = RESOLUTIONS;
    readonly slotOptions = Array.from({ length: 12 }, (_, i) => i + 1);
    readonly axisPercents = [0, 25, 50, 75, 100];

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

    ngAfterViewInit(): void {
        this.cdr.detectChanges();
    }

    private loadResolution(): void {
        const layout = this.selectedKeybinding?.layout;
        if (layout?.screenWidth && layout?.screenHeight) {
            this.screenWidth = layout.screenWidth;
            this.screenHeight = layout.screenHeight;
        }
        this.barGap = layout?.barGap ?? DEFAULT_BAR_GAP;
        this.barMode = layout?.barMode ?? 'custom';
    }

    get useCustomBarsMode(): boolean {
        return this.barMode === 'custom';
    }

    private buildDisplayBars(): void {
        const layout = this.selectedKeybinding?.layout;
        const hasLayout = layout?.bars?.length;

        if (hasLayout) {
            this.displayBars = layout.bars.map((bar, idx) =>
                this.toDisplayBar(bar, idx)
            );
        } else {
            this.displayBars = [
                this.toDisplayBar(
                    {
                        id: 'main',
                        slots: 12,
                        slotKeys: Array.from({ length: 12 }, () => ''),
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
        this.syncPositionInputsFromSelectedBar();
        this.lastRenderSignature = this.computeRenderSignature(this.selectedKeybinding);
        this.cdr.markForCheck();
    }

    private toDisplayBar(bar: ActionBar, barIndex: number): DisplayBar {
        const configuredKeys = Array.isArray(bar.slotKeys) ? [...bar.slotKeys] : [];
        const keys = Array.from({ length: bar.slots }, (_, i) => {
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

        return { ...bar, displaySlots };
    }

    /** Grid overlay style for the canvas */
    get gridBackgroundStyle(): { [key: string]: string } {
        const cols = Math.floor(this.screenWidth / GRID_SIZE);
        const rows = Math.floor(this.screenHeight / GRID_SIZE);
        const cellW = (100 / cols).toFixed(2);
        const cellH = (100 / rows).toFixed(2);
        return {
            backgroundImage:
                'linear-gradient(to right, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.08) 1px, transparent 1px)',
            backgroundSize: `${cellW}% ${cellH}%`,
        };
    }

    /** Get bar position as CSS left/top percentage (center of bar) */
    getBarStyle(bar: DisplayBar): { left: string; top: string } {
        const { x, y } = this.getNormalizedBarPosition(bar);
        return {
            left: `${(x / this.screenWidth) * 100}%`,
            top: `${(y / this.screenHeight) * 100}%`,
        };
    }

    private getNormalizedBarPosition(bar: DisplayBar): { x: number; y: number } {
        let x = bar.position?.x ?? this.screenWidth / 2;
        let y = bar.position?.y ?? this.screenHeight - 50;
        // Migrate old format: anchor bottom + (0,0) -> center bottom
        if (bar.position?.anchor === 'bottom' && x === 0 && y === 0) {
            x = this.screenWidth / 2;
            y = this.screenHeight - 50;
        }
        return { x, y };
    }

    getAxisXValue(percent: number): number {
        return Math.round((this.screenWidth * percent) / 100);
    }

    getAxisYValue(percent: number): number {
        return Math.round((this.screenHeight * percent) / 100);
    }

    get selectedBar(): DisplayBar | null {
        if (!this.selectedBarId) return null;
        return this.displayBars.find((b) => b.id === this.selectedBarId) || null;
    }

    get selectedBarCoordinates(): { x: number; y: number } | null {
        if (!this.selectedBar) return null;
        const { x, y } = this.getNormalizedBarPosition(this.selectedBar);
        return { x: Math.round(x), y: Math.round(y) };
    }

    private syncPositionInputsFromSelectedBar(): void {
        const bar = this.selectedBar;
        if (!bar) {
            this.positionInputX = null;
            this.positionInputY = null;
            return;
        }
        const { x, y } = this.getNormalizedBarPosition(bar);
        this.positionInputX = Math.round(x);
        this.positionInputY = Math.round(y);
    }

    onResolutionSelect(value: string): void {
        const [w, h] = value.split('x').map(Number);
        this.screenWidth = w;
        this.screenHeight = h;
        this.onResolutionChange();
    }

    onResolutionChange(): void {
        if (!this.selectedKeybinding) return;
        const layout = this.getLayoutToSave();
        layout.screenWidth = this.screenWidth;
        layout.screenHeight = this.screenHeight;
        this.markLayoutDirty();
        this.setDraftLayout(layout);
        this.buildDisplayBars();
    }

    onBarModeChange(mode: 'blizzard' | 'custom'): void {
        if (!this.selectedKeybinding) return;
        if (mode !== 'blizzard' && mode !== 'custom') return;
        if (mode === this.barMode) return;
        this.barMode = mode;
        const layout = this.getLayoutToSave();
        layout.barMode = mode;
        this.markLayoutDirty();
        this.setDraftLayout(layout);
        this.buildDisplayBars();
    }

    onBarGapChange(value: number): void {
        if (!this.selectedKeybinding) return;
        const parsed = Number(value);
        if (!Number.isFinite(parsed)) return;
        const nextGap = Math.max(0, Math.min(80, Math.round(parsed)));
        if (nextGap === this.barGap) return;
        this.barGap = nextGap;
        const layout = this.getLayoutToSave();
        layout.barGap = nextGap;
        this.markLayoutDirty();
        this.setDraftLayout(layout);
        this.buildDisplayBars();
    }

    onBarDragEnded(bar: DisplayBar, event: CdkDragEnd): void {
        if (!this.selectedKeybinding || !this.screenCanvasRef) return;

        const canvas = this.screenCanvasRef.nativeElement;
        const canvasRect = canvas.getBoundingClientRect();
        const scaleX = this.screenWidth / canvasRect.width;
        const scaleY = this.screenHeight / canvasRect.height;
        const delta = event.source.getFreeDragPosition();
        const current = this.getNormalizedBarPosition(bar);
        const barRect = event.source.element.nativeElement.getBoundingClientRect();
        const dragHalfW = (barRect.width * scaleX) / 2;
        const dragHalfH = (barRect.height * scaleY) / 2;
        const snapped = this.getSnappedPosition(
            current.x + delta.x * scaleX,
            current.y + delta.y * scaleY,
            bar.id,
            dragHalfW,
            dragHalfH,
            canvasRect,
            scaleX,
            scaleY
        );
        let designX = snapped.x;
        let designY = snapped.y;

        // Keep coordinates within the design canvas, but avoid aggressive
        // clamping that makes bars appear to "drift" after drop.
        designX = Math.max(0, Math.min(this.screenWidth, designX));
        designY = Math.max(0, Math.min(this.screenHeight, designY));

        const layout = this.getLayoutToSave();
        const target = layout.bars.find((b) => b.id === bar.id);
        if (!target) return;

        const displayTarget = this.displayBars.find((b) => b.id === bar.id);
        const previousDisplayPosition = displayTarget ? { ...displayTarget.position } : null;

        target.position = {
            anchor: 'center',
            x: designX,
            y: designY,
        };

        // Optimistically update visible state first to avoid full-canvas flash.
        if (displayTarget) {
            displayTarget.position = { ...target.position };
        }
        // Clear CDK transform so the persisted position becomes the source of truth.
        event.source.reset();
        this.guideLineX = null;
        this.guideLineY = null;
        this.syncPositionInputsFromSelectedBar();
        this.cdr.markForCheck();
        this.markLayoutDirty();
        this.setDraftLayout(layout);

        // Keep old revert behavior unnecessary in draft mode, but keep state consistent.
        if (!displayTarget && previousDisplayPosition) {
            this.cdr.markForCheck();
        }
    }

    onBarDragMoved(bar: DisplayBar, event: CdkDragMove): void {
        if (!this.screenCanvasRef) return;

        const canvasRect = this.screenCanvasRef.nativeElement.getBoundingClientRect();
        const scaleX = this.screenWidth / canvasRect.width;
        const scaleY = this.screenHeight / canvasRect.height;
        const delta = event.source.getFreeDragPosition();
        const current = this.getNormalizedBarPosition(bar);
        const barRect = event.source.element.nativeElement.getBoundingClientRect();
        const dragHalfW = (barRect.width * scaleX) / 2;
        const dragHalfH = (barRect.height * scaleY) / 2;
        const snapped = this.getSnappedPosition(
            current.x + delta.x * scaleX,
            current.y + delta.y * scaleY,
            bar.id,
            dragHalfW,
            dragHalfH,
            canvasRect,
            scaleX,
            scaleY
        );

        this.guideLineX = snapped.guideX;
        this.guideLineY = snapped.guideY;
        if (this.selectedBarId === bar.id) {
            this.positionInputX = Math.round(snapped.x);
            this.positionInputY = Math.round(snapped.y);
        }
    }

    onSelectedBarSlotsChange(slots: number): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        const parsed = Number(slots);
        if (!Number.isFinite(parsed)) return;
        const nextSlots = Math.max(1, Math.min(12, Math.round(parsed)));
        if (nextSlots === bar.slots) return;
        this.updateBarLayout(bar.id, { slots: nextSlots });
    }

    onSelectedBarScaleChange(scale: number): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        const parsed = Number(scale);
        if (!Number.isFinite(parsed)) return;
        const nextScale = Math.max(0.7, Math.min(1.5, parsed));
        if (Math.abs(nextScale - (bar.scale ?? 1)) < 0.001) return;
        this.updateBarLayout(bar.id, { scale: nextScale });
    }

    onSelectedBarOrientationChange(orientation: 'horizontal' | 'vertical'): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        if (orientation !== 'horizontal' && orientation !== 'vertical') return;
        if (bar.orientation === orientation) return;
        this.updateBarLayout(bar.id, { orientation });
    }

    applySelectedBarPosition(): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        if (!Number.isFinite(this.positionInputX) || !Number.isFinite(this.positionInputY)) return;

        const x = Math.max(0, Math.min(this.screenWidth, Number(this.positionInputX)));
        const y = Math.max(0, Math.min(this.screenHeight, Number(this.positionInputY)));

        this.positionInputX = Math.round(x);
        this.positionInputY = Math.round(y);

        this.updateBarLayout(bar.id, {
            position: {
                anchor: 'center',
                x,
                y,
            },
        });
    }

    centerSelectedBar(): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        const current = this.getNormalizedBarPosition(bar);
        const x = this.screenWidth / 2;
        const y = Math.max(0, Math.min(this.screenHeight, current.y));

        this.positionInputX = Math.round(x);
        this.positionInputY = Math.round(y);

        this.updateBarLayout(bar.id, {
            position: {
                anchor: 'center',
                x,
                y,
            },
        });
    }

    resetSelectedBar(): void {
        const bar = this.selectedBar;
        if (!bar || !this.selectedKeybinding) return;
        this.updateBarLayout(bar.id, {
            slots: 12,
            scale: 1,
            orientation: 'horizontal',
            slotKeys: Array.from({ length: 12 }, () => ''),
        });
    }

    private updateBarLayout(barId: string, patch: Partial<ActionBar>): void {
        if (!this.selectedKeybinding) return;
        const layout = this.getLayoutToSave();
        const target = layout.bars.find((b) => b.id === barId);
        if (!target) return;

        if (typeof patch.slots === 'number') target.slots = patch.slots;
        if (typeof patch.scale === 'number') target.scale = patch.scale;
        if (patch.orientation) target.orientation = patch.orientation;
        if (patch.position) target.position = { ...patch.position };
        if (Array.isArray(patch.slotKeys)) target.slotKeys = [...patch.slotKeys];
        if (!Array.isArray(target.slotKeys)) {
            target.slotKeys = Array.from({ length: target.slots }, () => '');
        } else {
            target.slotKeys = target.slotKeys.slice(0, target.slots);
            while (target.slotKeys.length < target.slots) {
                target.slotKeys.push('');
            }
        }
        this.markLayoutDirty();
        this.setDraftLayout(layout);
        this.buildDisplayBars();
        this.syncPositionInputsFromSelectedBar();
    }

    private getSnappedPosition(
        proposedX: number,
        proposedY: number,
        barId: string,
        dragHalfW: number,
        dragHalfH: number,
        canvasRect: DOMRect,
        scaleX: number,
        scaleY: number
    ): { x: number; y: number; guideX: number | null; guideY: number | null } {
        const others = this.displayBars.filter((b) => b.id !== barId);
        if (!others.length) {
            return { x: proposedX, y: proposedY, guideX: null, guideY: null };
        }

        const xCandidates: Array<{ target: number; guide: number }> = [];
        const yCandidates: Array<{ target: number; guide: number }> = [];
        for (const other of others) {
            const metrics = this.getBarMetrics(other, canvasRect, scaleX, scaleY);
            const otherLeft = metrics.x - metrics.halfW;
            const otherRight = metrics.x + metrics.halfW;
            const otherStackOffset = metrics.halfH + dragHalfH + this.barGap;

            // X-axis: center align, left edge align, right edge align
            xCandidates.push({ target: metrics.x, guide: metrics.x });
            xCandidates.push({ target: otherLeft + dragHalfW, guide: otherLeft });
            xCandidates.push({ target: otherRight - dragHalfW, guide: otherRight });

            // Y-axis: stack above / below to avoid overlap
            yCandidates.push({ target: metrics.y - otherStackOffset, guide: metrics.y });
            yCandidates.push({ target: metrics.y + otherStackOffset, guide: metrics.y });
        }

        const snappedX = this.getNearestCandidate(proposedX, xCandidates, BAR_ALIGN_SNAP_THRESHOLD);
        const snappedY = this.getNearestCandidate(proposedY, yCandidates, BAR_ALIGN_SNAP_THRESHOLD);

        return {
            x: snappedX?.target ?? proposedX,
            y: snappedY?.target ?? proposedY,
            guideX: snappedX?.guide ?? null,
            guideY: snappedY?.guide ?? null,
        };
    }

    private getBarMetrics(
        bar: DisplayBar,
        canvasRect: DOMRect,
        scaleX: number,
        scaleY: number
    ): { x: number; y: number; halfW: number; halfH: number } {
        const pos = this.getNormalizedBarPosition(bar);
        const fallbackHalfW = 200;
        const fallbackHalfH = 40;
        const canvas = this.screenCanvasRef?.nativeElement;
        if (!canvas) {
            return { x: pos.x, y: pos.y, halfW: fallbackHalfW, halfH: fallbackHalfH };
        }

        const el = canvas.querySelector(`[data-bar-id="${bar.id}"]`) as HTMLElement | null;
        if (!el) {
            return { x: pos.x, y: pos.y, halfW: fallbackHalfW, halfH: fallbackHalfH };
        }

        const rect = el.getBoundingClientRect();
        return {
            x: pos.x,
            y: pos.y,
            halfW: (rect.width * scaleX) / 2,
            halfH: (rect.height * scaleY) / 2,
        };
    }

    private getNearestCandidate(
        value: number,
        candidates: Array<{ target: number; guide: number }>,
        threshold: number
    ): { target: number; guide: number } | null {
        if (!candidates.length) return null;
        let closest = candidates[0];
        let distance = Math.abs(value - closest.target);
        for (let i = 1; i < candidates.length; i++) {
            const d = Math.abs(value - candidates[i].target);
            if (d < distance) {
                distance = d;
                closest = candidates[i];
            }
        }
        return distance <= threshold ? closest : null;
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

        const newId = `bar-${Date.now()}`;
        const barIndex = this.displayBars.length;
        const newBar: ActionBar = {
            id: newId,
            slots: 12,
            slotKeys: Array.from({ length: 12 }, () => ''),
            position: {
                anchor: 'center',
                x: this.screenWidth / 2,
                y: this.screenHeight - 50 - barIndex * 70,
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
        this.selectedBarId = newId;
        this.syncPositionInputsFromSelectedBar();
    }

    removeBar(bar: DisplayBar, event: Event): void {
        event.stopPropagation();
        if (!this.selectedKeybinding || this.displayBars.length <= 1) return;

        const layout = this.getLayoutToSave();
        layout.bars = layout.bars.filter((b) => b.id !== bar.id);
        const keybinds = (this.selectedKeybinding.keybinds || []).filter((kb) => kb.barId !== bar.id);
        this.markLayoutDirty();
        this.layoutTouchesKeybinds = true;
        this.selectedKeybinding = {
            ...this.selectedKeybinding,
            layout,
            keybinds,
        };
        this.selectedBarId = this.selectedBarId === bar.id ? null : this.selectedBarId;
        this.buildDisplayBars();
        this.syncPositionInputsFromSelectedBar();
    }

    selectBar(bar: DisplayBar, event?: MouseEvent): void {
        event?.stopPropagation();
        this.selectedBarId = bar.id;
        this.syncPositionInputsFromSelectedBar();
    }

    clearSelection(): void {
        this.selectedBarId = null;
        this.syncPositionInputsFromSelectedBar();
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
                    this.syncPositionInputsFromSelectedBar();
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
        this.syncPositionInputsFromSelectedBar();
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
                barMode: existing.barMode ?? this.barMode,
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
            barMode: this.barMode,
            screenWidth: this.screenWidth,
            screenHeight: this.screenHeight,
            barGap: this.barGap,
        };
    }
}
