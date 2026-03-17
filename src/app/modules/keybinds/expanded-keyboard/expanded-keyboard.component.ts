import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, AfterViewInit, ViewChildren, QueryList, ElementRef, NgZone, ChangeDetectorRef, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { Keybinding } from 'app/core/types/keybinding';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Keybind } from 'app/core/types/keybind';
import { PanZoomDirective, PanZoomModel } from 'app/shared/directives/pan-zoom.directive';

interface KeyboardKey {
    label: string;
    width: string;
    isHovered?: boolean;
    keybinds?: { key: string, spell?: any, modifiers?: string[] }[];
}

@Component({
    selector: 'app-expanded-keyboard',
    templateUrl: './expanded-keyboard.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        PanZoomDirective,
        DragDropModule
    ]
})
export class ExpandedKeyboardComponent implements OnChanges, AfterViewInit, OnInit {
    @Input() keybinding: Keybinding | null = null;
    @Input() zoomEnabled: boolean = true;
    @Input() scalePerZoomLevel: number = 2.0;
    @Input() mouseWheelFactor: number = 0.005; // Configurable zoom sensitivity
    @Output() collapse = new EventEmitter<void>();
    @ViewChild('panZoom', { read: PanZoomDirective }) panZoom!: PanZoomDirective;
    @ViewChildren('keyElem') keyElems!: QueryList<ElementRef>;
    @ViewChildren('boxElem') boxElems!: QueryList<ElementRef>;
    @ViewChild('toolbarElem') toolbarElem!: ElementRef;
    @ViewChild('keyboardContainer') keyboardContainer!: ElementRef;

    keyboardLayout: KeyboardKey[][] = [
        [
            { label: 'Esc', width: 'w-48' },
            { label: 'F1', width: 'w-48' },
            { label: 'F2', width: 'w-48' },
            { label: 'F3', width: 'w-48' },
            { label: 'F4', width: 'w-48' },
            { label: 'F5', width: 'w-48' },
            { label: 'F6', width: 'w-48' },
            { label: 'F7', width: 'w-48' },
            { label: 'F8', width: 'w-48' },
            { label: 'F9', width: 'w-48' },
            { label: 'F10', width: 'w-48' },
            { label: 'F11', width: 'w-48' },
            { label: 'F12', width: 'w-48' }
        ],
        [
            { label: '`', width: 'w-48' },
            { label: '1', width: 'w-48' },
            { label: '2', width: 'w-48' },
            { label: '3', width: 'w-48' },
            { label: '4', width: 'w-48' },
            { label: '5', width: 'w-48' },
            { label: '6', width: 'w-48' },
            { label: '7', width: 'w-48' },
            { label: '8', width: 'w-48' },
            { label: '9', width: 'w-48' },
            { label: '0', width: 'w-48' },
            { label: '-', width: 'w-48' },
            { label: '=', width: 'w-48' },
            { label: 'Backspace', width: 'w-96' }
        ],
        [
            { label: 'Tab', width: 'w-72' },
            { label: 'Q', width: 'w-48' },
            { label: 'W', width: 'w-48' },
            { label: 'E', width: 'w-48' },
            { label: 'R', width: 'w-48' },
            { label: 'T', width: 'w-48' },
            { label: 'Y', width: 'w-48' },
            { label: 'U', width: 'w-48' },
            { label: 'I', width: 'w-48' },
            { label: 'O', width: 'w-48' },
            { label: 'P', width: 'w-48' },
            { label: '[', width: 'w-48' },
            { label: ']', width: 'w-48' },
            { label: '\\', width: 'w-72' }
        ],
        [
            { label: 'Caps', width: 'w-84' },
            { label: 'A', width: 'w-48' },
            { label: 'S', width: 'w-48' },
            { label: 'D', width: 'w-48' },
            { label: 'F', width: 'w-48' },
            { label: 'G', width: 'w-48' },
            { label: 'H', width: 'w-48' },
            { label: 'J', width: 'w-48' },
            { label: 'K', width: 'w-48' },
            { label: 'L', width: 'w-48' },
            { label: ';', width: 'w-48' },
            { label: "'", width: 'w-48' },
            { label: 'Enter', width: 'w-84' }
        ],
        [
            { label: 'Shift', width: 'w-108' },
            { label: 'Z', width: 'w-48' },
            { label: 'X', width: 'w-48' },
            { label: 'C', width: 'w-48' },
            { label: 'V', width: 'w-48' },
            { label: 'B', width: 'w-48' },
            { label: 'N', width: 'w-48' },
            { label: 'M', width: 'w-48' },
            { label: ',', width: 'w-48' },
            { label: '.', width: 'w-48' },
            { label: '/', width: 'w-48' },
            { label: 'Shift', width: 'w-108' }
        ],
        [
            { label: 'Ctrl', width: 'w-72' },
            { label: 'Win', width: 'w-72' },
            { label: 'Alt', width: 'w-72' },
            { label: 'Space', width: 'w-288' },
            { label: 'Alt', width: 'w-72' },
            { label: 'Win', width: 'w-72' },
            { label: 'Menu', width: 'w-72' },
            { label: 'Ctrl', width: 'w-72' }
        ]
    ];

    abilityCallouts: any[] = [];
    toolbarHeight: number = 60;
    visibleAbilityCallouts: any[] = [];
    isInitializing: boolean = true; // Track if we're still setting up the initial view

    // Set a more zoomed out neutral level
    private initialZoomLevel: number = -6; // Start at minimum zoom level to show entire keyboard

    constructor(private ngZone: NgZone, private cdr: ChangeDetectorRef) { }

    ngOnInit(): void {
        // Start in initializing state immediately
        this.isInitializing = true;
        this.cdr.detectChanges();
        // Detect input device and adjust zoom sensitivity
        this.detectInputDevice();
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

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keybinding']) {
            this.updateKeyboardBindings();
            this.updateAbilityCallouts();
        }
    }

    ngAfterViewInit(): void {
        // Initial setup
        setTimeout(() => {
            if (this.toolbarElem && this.toolbarElem.nativeElement) {
                this.toolbarHeight = this.toolbarElem.nativeElement.getBoundingClientRect().height;
                this.cdr.detectChanges();
            }
            this.updateVisibleAbilityCallouts();

            // Set up initial view if we're initializing
            if (this.isInitializing) {
                this.reset();
            }
        }, 50);

        // Recalculate lines and visible callouts after view init and on zoom/pan
        this.ngZone.runOutsideAngular(() => {
            if (this.panZoom) {
                this.panZoom.modelChange.subscribe(() => {
                    this.updateCalloutLines();
                    this.updateVisibleAbilityCallouts();
                });
            }
        });
    }

    private updateKeyboardBindings(): void {
        this.keyboardLayout.forEach(row => {
            row.forEach(key => {
                key.keybinds = [];
                key.isHovered = false;
            });
        });

        if (!this.keybinding?.keybinds) return;

        this.keybinding.keybinds.forEach(keybind => {
            this.addKeybinding(keybind);
        });
    }

    private addKeybinding(keybind: Keybind): void {
        // Parse modifiers and base key
        let modifiers: string[] = [];
        let baseKey = keybind.key;
        if (keybind.key.includes('+')) {
            const parts = keybind.key.split('+');
            modifiers = parts.slice(0, -1);
            baseKey = parts[parts.length - 1];
        }
        const key = this.findKey(baseKey);
        if (key) {
            if (!key.keybinds) {
                key.keybinds = [];
            }
            key.keybinds.push({
                key: baseKey,
                spell: keybind.spell,
                modifiers: modifiers
            });
        }
    }

    private updateAbilityCallouts(): void {
        // Create a callout for every key with a keybind, left to right, top to bottom
        const callouts: any[] = [];
        this.keyboardLayout.forEach((row, rowIndex) => {
            row.forEach((key, colIndex) => {
                if (key.keybinds && key.keybinds.length) {
                    key.keybinds.forEach((keybind, i) => {
                        callouts.push({
                            icon: keybind.spell?.icon,
                            name: keybind.spell?.name,
                            description: keybind.spell?.description,
                            modifiers: keybind.modifiers,
                            keyLabel: key.label,
                            rowIdx: rowIndex,
                            colIdx: colIndex,
                            keyId: key.label + '-' + rowIndex + '-' + colIndex
                        });
                    });
                }
            });
        });
        this.abilityCallouts = callouts;
        this.updateVisibleAbilityCallouts();
    }

    private findKey(keyLabel: string): KeyboardKey | undefined {
        for (const row of this.keyboardLayout) {
            const key = row.find(k => k.label.toLowerCase() === keyLabel.toLowerCase());
            if (key) return key;
        }
        return undefined;
    }

    onCollapse(): void {
        this.collapse.emit();
    }

    public reset(): void {
        if (this.panZoom) {
            // Reset to neutral zoom level first
            this.panZoom.resetView();
            // Then zoom out twice to show the whole keyboard comfortably
            setTimeout(() => {
                this.panZoom.zoomOut('viewCenter');
                setTimeout(() => {
                    this.panZoom.zoomOut('viewCenter');
                    // Show the keyboard after zoom is complete
                    setTimeout(() => {
                        this.isInitializing = false;
                        this.cdr.detectChanges();
                    }, 100); // Small delay to ensure zoom is complete
                }, 100); // Slightly longer delay between zoom operations
            }, 100); // Slightly longer delay for first zoom
        }
    }

    public zoomIn(): void {
        if (this.panZoom) {
            this.panZoom.zoomIn('viewCenter');
        }
    }

    public zoomOut(): void {
        if (this.panZoom) {
            this.panZoom.zoomOut('viewCenter');
        }
    }

    public panUp(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 0, y: -100 });
        }
    }

    public panDown(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 0, y: 100 });
        }
    }

    public panLeft(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: -100, y: 0 });
        }
    }

    public panRight(): void {
        if (this.panZoom) {
            this.panZoom.panDelta({ x: 100, y: 0 });
        }
    }

    getSortedKeybinds(keybinds: any[]): any[] {
        if (!keybinds) return [];

        return keybinds.sort((a, b) => {
            const aModifiers = a.modifiers || [];
            const bModifiers = b.modifiers || [];

            // No modifiers come first
            if (aModifiers.length === 0 && bModifiers.length > 0) return -1;
            if (aModifiers.length > 0 && bModifiers.length === 0) return 1;

            // Then Ctrl
            if (aModifiers.includes('Ctrl') && !bModifiers.includes('Ctrl')) return -1;
            if (!aModifiers.includes('Ctrl') && bModifiers.includes('Ctrl')) return 1;

            // Then Shift
            if (aModifiers.includes('Shift') && !bModifiers.includes('Shift')) return -1;
            if (!aModifiers.includes('Shift') && bModifiers.includes('Shift')) return 1;

            // Then Alt
            if (aModifiers.includes('Alt') && !bModifiers.includes('Alt')) return -1;
            if (!aModifiers.includes('Alt') && bModifiers.includes('Alt')) return 1;

            return 0;
        });
    }

    private updateCalloutLines(): void {
        // Map key positions by data-key-id
        const keyRects: Record<string, DOMRect> = {};
        this.keyElems.forEach((el: ElementRef) => {
            const dom = el.nativeElement as HTMLElement;
            const id = dom.getAttribute('data-key-id');
            if (id) keyRects[id] = dom.getBoundingClientRect();
        });
        // Map box positions by data-box-id
        const boxRects: Record<string, DOMRect> = {};
        this.boxElems.forEach((el: ElementRef, i: number) => {
            const dom = el.nativeElement as HTMLElement;
            const id = 'box-' + i;
            boxRects[id] = dom.getBoundingClientRect();
        });
        // Mutate visibleAbilityCallouts in place
        this.visibleAbilityCallouts.forEach((callout, i) => {
            const keyId = callout.keyId;
            const boxId = 'box-' + i;
            const keyRect = keyRects[keyId];
            const boxRect = boxRects[boxId];
            if (keyRect && boxRect) {
                // Key center
                callout.keyCenterX = keyRect.left + keyRect.width / 2;
                callout.keyCenterY = keyRect.top + keyRect.height / 2;
                // Box bottom center (since boxes are above the keyboard)
                callout.boxAnchorX = boxRect.left + boxRect.width / 2;
                callout.boxAnchorY = boxRect.bottom;
            } else {
                callout.keyCenterX = undefined;
                callout.keyCenterY = undefined;
                callout.boxAnchorX = undefined;
                callout.boxAnchorY = undefined;
            }
        });
        this.cdr.detectChanges();
    }

    private updateVisibleAbilityCallouts() {
        if (!this.keyElems || !this.keyElems.length) {
            this.visibleAbilityCallouts = [];
            return;
        }
        const visible: any[] = [];
        this.abilityCallouts.forEach((callout, i) => {
            const keyId = callout.keyId;
            const keyElem = this.keyElems.find(el => el.nativeElement.getAttribute('data-key-id') === keyId);
            if (keyElem) {
                const rect = keyElem.nativeElement.getBoundingClientRect();
                if (
                    rect.right > 0 &&
                    rect.left < window.innerWidth &&
                    rect.bottom > 0 &&
                    rect.top < window.innerHeight
                ) {
                    visible.push(callout);
                }
            }
        });
        this.visibleAbilityCallouts = visible;
        this.cdr.detectChanges();
        // Always update callout lines after visibleAbilityCallouts is set
        setTimeout(() => this.updateCalloutLines(), 0);
    }

    // Returns the margin (px) to use for ability boxes based on zoom level
    get abilityBoxSpacing(): number {
        // Default zoom level is 2 (neutralZoomLevel)
        let zoom = 2;
        if (this.panZoom && typeof (this.panZoom as any).currentZoomLevel === 'number') {
            zoom = (this.panZoom as any).currentZoomLevel;
        }
        // At zoom 1 or below, overlap (negative margin)
        // At zoom 2, small margin
        // At zoom 5+, large margin
        if (zoom <= 1) return -80;
        if (zoom < 2) return -40;
        if (zoom < 3) return 0;
        if (zoom < 4) return 24;
        if (zoom < 6) return 48;
        return 72;
    }

    /**
     * Centers the keyboard in the viewport and ensures it's fully visible
     */
    private centerKeyboard(): void {
        if (!this.keyboardContainer || !this.panZoom) return;

        // Wait for next frame to ensure dimensions are accurate
        requestAnimationFrame(() => {
            const container = this.keyboardContainer.nativeElement;
            const viewport = (this.panZoom as any).el.nativeElement as HTMLElement;

            // Wait for layout to be ready
            setTimeout(() => {
                const containerRect = container.getBoundingClientRect();
                const viewportRect = viewport.getBoundingClientRect();

                // Calculate the scale at current zoom level
                const scale = Math.pow(this.scalePerZoomLevel, (this.panZoom as any).currentZoomLevel - (this.panZoom as any).neutralZoomLevel);

                // Calculate the center position
                const targetPanX = (viewportRect.width / 2) - (containerRect.width * scale / 2);
                const targetPanY = (viewportRect.height / 2) - (containerRect.height * scale / 2);

                // Set the pan position
                (this.panZoom as any).currentPan = { x: targetPanX, y: targetPanY };
                (this.panZoom as any).updateTransform();
            }, 50); // Small delay to ensure layout is ready
        });
    }

    /**
     * Public method to center the keyboard (maintains backwards compatibility)
     */
    public centerOnMiddleKey(): void {
        this.centerKeyboard();
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

    getRenderableIcon(spell: any): string {
        const rawIcon = this.extractRawIcon(spell);
        if (!rawIcon) {
            return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
        }
        if (
            rawIcon.startsWith('http://')
            || rawIcon.startsWith('https://')
            || rawIcon.startsWith('assets/')
            || rawIcon.startsWith('/')
            || rawIcon.startsWith('data:')
        ) {
            return rawIcon;
        }
        if (/^\d+$/.test(rawIcon)) {
            return `https://render.worldofwarcraft.com/us/icons/56/${rawIcon}.jpg`;
        }

        const normalized = rawIcon
            .replace(/^interface[\\/]+icons[\\/]+/i, '')
            .replace(/\.blp$/i, '')
            .replace(/\\/g, '/');
        const iconName = normalized.split('/').pop() || '';
        if (iconName) {
            return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}.jpg`;
        }
        return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
    }

    private extractRawIcon(spell: any): string {
        const icon = spell?.icon;
        if (typeof icon === 'string') return icon.trim();
        if (icon && typeof icon === 'object') {
            const cloudfront = String(icon.cloudfrontUrl || icon.url || '').trim();
            if (cloudfront) return cloudfront;
            const nested = String(icon.icon || '').trim();
            if (nested) return nested;
        }
        return '';
    }
}
