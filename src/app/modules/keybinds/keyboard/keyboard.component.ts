import { Component, ViewEncapsulation, OnInit, viewChild, Input, signal, SimpleChanges, EventEmitter, Output, ViewChild, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { PanZoomDirective, PanZoomModel } from 'app/shared/directives/pan-zoom.directive';

//Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSidenavModule } from '@angular/material/sidenav';

import { Keybinding } from 'app/core/types/keybinding';
import { KeybindDialogComponent } from './keybind-dialog/keybind-dialog.component';
import { KeybindingService } from 'app/core/services/keybinding.service';

interface Key {
    label: string;
    width: string;
    isHovered?: boolean;
    keybinds?: { key: string, spell?: string }[]
}

@Component({
    selector: 'keyboard',
    templateUrl: './keyboard.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        NgClass,
        MatButtonModule,
        MatIconModule,
        MatSidenavModule,
        MatDialogModule,
        PanZoomDirective
    ],
})
export class KeyboardComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild('panZoom', { read: PanZoomDirective }) panZoom!: PanZoomDirective;
    @Input() scalePerZoomLevel: number = 2.0;
    @Input() mouseWheelFactor: number = 0.005; // Configurable zoom sensitivity

    private _selectedKeybinding: Keybinding;

    @Input()
    set selectedKeybinding(value: Keybinding) {
        this._selectedKeybinding = value;
        // Use setTimeout to ensure the component is ready
        setTimeout(() => {
            this.updateKeyboardBindings();
        }, 0);
    }

    get selectedKeybinding(): Keybinding {
        return this._selectedKeybinding;
    }

    private _keybindingSelected: boolean = false;

    @Input()
    set keybindingSelected(value: boolean) {
        this._keybindingSelected = value;
    }

    @Input() drawerOpened: boolean = true;

    get keybindingSelected(): boolean {
        return this._keybindingSelected;
    }

    @Output() refreshKeybindings = new EventEmitter<void>();

    canZoom: boolean = true;
    readonly panzoomModel = signal<PanZoomModel>(undefined!);

    keyboardLayout: Key[][] = [
        // Define rows and keys with their respective widths
        [
            { label: 'Esc', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F1', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F2', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F3', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F4', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F5', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F6', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F7', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F8', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F9', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F10', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F11', width: 'w-12 sm:w-16', isHovered: false }, { label: 'F12', width: 'w-12 sm:w-16', isHovered: false }
        ],
        [
            { label: '~', width: 'w-12 sm:w-16', isHovered: false }, { label: '1', width: 'w-12 sm:w-16', isHovered: false },
            { label: '2', width: 'w-12 sm:w-16', isHovered: false }, { label: '3', width: 'w-12 sm:w-16', isHovered: false },
            { label: '4', width: 'w-12 sm:w-16', isHovered: false }, { label: '5', width: 'w-12 sm:w-16', isHovered: false },
            { label: '6', width: 'w-12 sm:w-16', isHovered: false }, { label: '7', width: 'w-12 sm:w-16', isHovered: false },
            { label: '8', width: 'w-12 sm:w-16', isHovered: false }, { label: '9', width: 'w-12 sm:w-16', isHovered: false },
            { label: '0', width: 'w-12 sm:w-16', isHovered: false }, { label: '-', width: 'w-12 sm:w-16', isHovered: false },
            { label: '=', width: 'w-12 sm:w-16', isHovered: false }, { label: 'Backspace', width: 'w-24 sm:w-32', isHovered: false }
        ],
        [
            { label: 'Tab', width: 'w-20 sm:w-24', isHovered: false }, { label: 'Q', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'W', width: 'w-12 sm:w-16', isHovered: false }, { label: 'E', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'R', width: 'w-12 sm:w-16', isHovered: false }, { label: 'T', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'Y', width: 'w-12 sm:w-16', isHovered: false }, { label: 'U', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'I', width: 'w-12 sm:w-16', isHovered: false }, { label: 'O', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'P', width: 'w-12 sm:w-16', isHovered: false }, { label: '[', width: 'w-12 sm:w-16', isHovered: false },
            { label: ']', width: 'w-12 sm:w-16', isHovered: false }, { label: '\\', width: 'w-20 sm:w-24', isHovered: false }
        ],
        [
            { label: 'Caps Lock', width: 'w-24 sm:w-28', isHovered: false }, { label: 'A', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'S', width: 'w-12 sm:w-16', isHovered: false }, { label: 'D', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'F', width: 'w-12 sm:w-16', isHovered: false }, { label: 'G', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'H', width: 'w-12 sm:w-16', isHovered: false }, { label: 'J', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'K', width: 'w-12 sm:w-16', isHovered: false }, { label: 'L', width: 'w-12 sm:w-16', isHovered: false },
            { label: ';', width: 'w-12 sm:w-16', isHovered: false }, { label: '\'', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'Enter', width: 'w-28 sm:w-36', isHovered: false }
        ],
        [
            { label: 'Shift', width: 'w-28 sm:w-36', isHovered: false }, { label: 'Z', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'X', width: 'w-12 sm:w-16', isHovered: false }, { label: 'C', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'V', width: 'w-12 sm:w-16', isHovered: false }, { label: 'B', width: 'w-12 sm:w-16', isHovered: false },
            { label: 'N', width: 'w-12 sm:w-16', isHovered: false }, { label: 'M', width: 'w-12 sm:w-16', isHovered: false },
            { label: ',', width: 'w-12 sm:w-16', isHovered: false }, { label: '.', width: 'w-12 sm:w-16', isHovered: false },
            { label: '/', width: 'w-12 sm:w-16', isHovered: false }, { label: 'Shift', width: 'w-36 sm:w-48', isHovered: false }
        ],
        [
            { label: 'Ctrl', width: 'w-16 sm:w-20', isHovered: false }, { label: 'Fn', width: 'w-16 sm:w-20', isHovered: false },
            { label: 'Alt', width: 'w-16 sm:w-20', isHovered: false }, { label: 'Space', width: 'w-60 sm:w-80', isHovered: false },
            { label: 'Alt', width: 'w-16 sm:w-20', isHovered: false }, { label: 'Ctrl', width: 'w-16 sm:w-20', isHovered: false },
            { label: '◄', width: 'w-12 sm:w-16', isHovered: false }, { label: '▲', width: 'w-12 sm:w-16', isHovered: false },
            { label: '▼', width: 'w-12 sm:w-16', isHovered: false }, { label: '►', width: 'w-12 sm:w-16', isHovered: false }
        ]
    ];

    private keyMap: Map<string, Key> = new Map();

    /**
     * Constructor
     */
    constructor(
        private dialog: MatDialog,
        private keybindingService: KeybindingService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.initializeKeyMap();
        this.detectInputDevice();
        // Ensure keyboard is updated if selectedKeybinding is already set
        if (this.selectedKeybinding) {
            this.updateKeyboardBindings();
        }
    }

    private initializeKeyMap(): void {
        this.keyboardLayout.forEach(row => {
            row.forEach(keyItem => {
                this.keyMap.set(keyItem.label.toUpperCase(), keyItem);
            });
        });
    }

    ngAfterViewInit(): void {
        // Ensure panZoom is initialized
        if (this.panZoom) {
            console.log('PanZoom directive initialized');
        } else {
            console.warn('PanZoom directive not initialized');
        }
        // Ensure keyboard is updated after view is initialized
        if (this.selectedKeybinding) {
            this.updateKeyboardBindings();
        }
    }

    resetView(): void {
        if (this.panZoom) {
            this.panZoom.resetView();
        } else {
            console.warn('PanZoom directive not initialized');
        }
    }

    zoomIn(): void {
        if (this.panZoom) {
            this.panZoom.zoomIn('viewCenter');
        }
    }

    zoomOut(): void {
        if (this.panZoom) {
            this.panZoom.zoomOut('viewCenter');
        }
    }

    onPanUp100Clicked(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 0, y: -100 });
        }
    }

    onPanDown100Clicked(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 0, y: 100 });
        }
    }

    onPanLeft100Clicked(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: -100, y: 0 });
        }
    }

    onPanRight100Clicked(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 100, y: 0 });
        }
    }

    private calculateDialogWidth(keybindsCount: number): string {
        // Check if mobile screen
        const isMobile = window.innerWidth < 768;

        if (isMobile) {
            // Mobile: Use full width with small margins
            return '98vw';
        }

        // Desktop: wider dialog for macro controls
        const baseWidth = 560;
        const extraWidth = Math.max(0, keybindsCount - 2) * 70;
        return `${Math.min(baseWidth + extraWidth, 780)}px`;
    }

    collapseKey(key: Key): void {
        key.isHovered = false;
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedKeybinding'] || changes['keybindingSelected']) {
            // Use setTimeout to ensure the component is ready
            setTimeout(() => {
                this.updateKeyboardBindings();
            }, 0);
        }
    }

    public updateKeyboardBindings(): void {
        // First, clear all existing keybindings and hover states
        this.keyboardLayout.forEach(row => {
            row.forEach(keyItem => {
                keyItem.keybinds = [];
                keyItem.isHovered = false;
            });
        });

        // Only process keybinds if a keybinding is selected and has keybinds
        if (this.keybindingSelected && this.selectedKeybinding?.keybinds && Array.isArray(this.selectedKeybinding.keybinds)) {
            this.selectedKeybinding.keybinds.forEach(keybind => {
                if (keybind && keybind.key && keybind.spell) {
                    this.addKeybinding(keybind);
                }
            });
        }
    }

    addKeybinding(keybind) {
        const { key, spell } = keybind;
        const keyParts = key.toLowerCase().split('+');
        const mainKey = keyParts[keyParts.length - 1].toUpperCase();

        // Find the key in the keyboard layout directly
        this.keyboardLayout.forEach(row => {
            row.forEach(keyItem => {
                if (keyItem.label.toUpperCase() === mainKey) {
                    // Initialize keybinds if undefined
                    if (!keyItem.keybinds) {
                        keyItem.keybinds = [];
                    }
                    // Add new keybind
                    keyItem.keybinds.push({ key, spell });
                    // Update the keyMap as well
                    this.keyMap.set(mainKey, keyItem);
                }
            });
        });
    }

    openKeybindDialog(key: any): void {
        console.log('Keyboard - openKeybindDialog - key:', key);
        console.log('Keyboard - openKeybindDialog - key.keybinds:', key.keybinds);
        console.log('Keyboard - openKeybindDialog - key.keybinds details:', key.keybinds?.map(kb => ({
            key: kb.key,
            spellName: kb.spell?.name,
            spellId: kb.spell?.spellId
        })));
        console.log('Keyboard - openKeybindDialog - all keybinds for this key from selectedKeybinding:', this.selectedKeybinding.keybinds.filter(k => k.key.toLowerCase() === key.label.toLowerCase()).map(kb => ({
            key: kb.key,
            spellName: kb.spell?.name,
            spellId: kb.spell?.spellId
        })));
        if (key.keybinds?.length > 0) {
            const dialogWidth = this.calculateDialogWidth(key.keybinds.length);
            const isMobile = window.innerWidth < 768;
            const dialogRef = this.dialog.open(KeybindDialogComponent, {
                data: { key: key },
                width: dialogWidth,
                maxWidth: isMobile ? '98vw' : '92vw',
                maxHeight: isMobile ? '90vh' : '80vh',
                panelClass: isMobile ? 'mobile-dialog' : ''
            });

            dialogRef.afterClosed().subscribe(result => {
                console.log('Keyboard - Dialog closed with result:', result);
                console.log('Keyboard - Result type:', typeof result);
                console.log('Keyboard - Result is array:', Array.isArray(result));
                if (result !== false) { // Allow empty arrays
                    console.log('Keyboard - Dialog result (not false):', result);
                    console.log('Keyboard - Result length:', result.length);

                    // Get all keybinds for this keybinding
                    const allKeybinds = [...this.selectedKeybinding.keybinds];

                    // Helper function to check if a keybind belongs to the current key (handles modifiers)
                    const isKeybindForCurrentKey = (keybind) => {
                        const keybindKey = String(keybind?.key || '').toLowerCase().replace(/\s+/g, '');
                        const currentKeyLabel = String(key?.label || '').toLowerCase().replace(/\s+/g, '');

                        if (!keybindKey || !currentKeyLabel) {
                            return false;
                        }

                        // Direct match
                        if (keybindKey === currentKeyLabel) {
                            return true;
                        }

                        // Multi-modifier safe matching:
                        // "ctrl+shift+5" should still be considered part of key "5".
                        const keyParts = keybindKey.split('+');
                        const mainKey = keyParts[keyParts.length - 1];
                        return mainKey === currentKeyLabel;
                    };

                    // Remove all keybinds for this key (including modifier combinations)
                    const keybindsForOtherKeys = allKeybinds.filter(k => !isKeybindForCurrentKey(k));

                    const dedupeKeybindList = (items: any[]) => {
                        const seen = new Set<string>();
                        return items.filter((item) => {
                            const keySig = String(item?.key || '').toLowerCase().replace(/\s+/g, '');
                            const spellSig = String(item?.spell?.spellId || '').toLowerCase();
                            const actionSig = String(item?.spell?.actionType || '').toLowerCase();
                            const macroSig = String(item?.spell?.macroId || '').toLowerCase();
                            const signature = [keySig, spellSig, actionSig, macroSig].join('|');
                            if (!keySig || !spellSig || seen.has(signature)) {
                                return false;
                            }
                            seen.add(signature);
                            return true;
                        });
                    };

                    // Add the new keybinds for this key and de-duplicate.
                    const updatedKeybinds = dedupeKeybindList([...keybindsForOtherKeys, ...result]);

                    console.log('Keyboard - Updating keybinding with new keybinds:', {
                        originalCount: allKeybinds.length,
                        otherKeysCount: keybindsForOtherKeys.length,
                        newKeybindsCount: result.length,
                        finalCount: updatedKeybinds.length
                    });

                    const originalKeybindsForKey = allKeybinds.filter(k => isKeybindForCurrentKey(k));
                    console.log('Keyboard - Original keybinds for key', key.label, ':', originalKeybindsForKey.map(k => ({ key: k.key, spellName: k.spell?.name })));
                    console.log('Keyboard - New keybinds for key', key.label, ':', result.map(k => ({ key: k.key, spellName: k.spell?.name })));
                    console.log('Keyboard - Final updated keybinds:', updatedKeybinds.map(k => ({ key: k.key, spellName: k.spell?.name })));

                    // Update the keybinding directly with the new keybinds array
                    this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, {
                        keybinds: updatedKeybinds
                    }).subscribe({
                        next: (updatedKeybinding) => {
                            console.log('Keyboard - updateKeybinding success:', updatedKeybinding);
                            console.log('Keyboard - updatedKeybinding.keybinds:', updatedKeybinding.keybinds);
                            // Update the selected keybinding with the server response
                            this.selectedKeybinding = updatedKeybinding;
                            // Update the local key with the filtered result
                            key.keybinds = result;
                            this.updateKeyboardBindings();
                        },
                        error: (error) => {
                            console.error('Keyboard - Error updating keybinding:', error);
                        }
                    });
                }
            });
        }
    }

    /**
     * Public method that can be called by parent components to reset the keyboard
     * Clears all keybindings and hover states
     */
    public resetKeyboard(): void {
        console.log('reseting keyboard');
        this.keyboardLayout.forEach(row => {
            row.forEach(keyItem => {
                keyItem.keybinds = [];
                keyItem.isHovered = false;
            });
        });
    }

    private detectInputDevice(): void {
        // Check if the device supports touch events (likely a laptop with touchpad)
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;

        // Check if it's a mobile device
        const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

        if (isTouchDevice && !isMobile) {
            // Likely a laptop with touchpad - use higher sensitivity
            this.mouseWheelFactor = 0.008;
        } else if (isMobile) {
            // Mobile device - use very high sensitivity for touch gestures
            this.mouseWheelFactor = 0.015;
        } else {
            // Desktop with mouse wheel - use lower sensitivity
            this.mouseWheelFactor = 0.003;
        }
    }

    /**
     * Manually adjust zoom sensitivity
     * @param factor - The zoom factor (0.001 to 0.02 recommended)
     */
    public setZoomSensitivity(factor: number): void {
        this.mouseWheelFactor = Math.max(0.001, Math.min(0.02, factor));
    }

    /**
     * Get current zoom sensitivity
     */
    public getZoomSensitivity(): number {
        return this.mouseWheelFactor;
    }

    /**
     * Public method to manually refresh the keyboard bindings
     * This can be called from parent components if needed
     */
    public refreshKeyboard(): void {
        this.updateKeyboardBindings();
    }

    ngOnDestroy(): void {
        // Clean up any subscriptions or resources if needed
    }

}
