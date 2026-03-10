import { Component, Input, Output, EventEmitter, OnChanges, SimpleChanges, ViewChild, AfterViewInit, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Keybinding } from 'app/core/types/keybinding';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Keybind } from 'app/core/types/keybind';
import { PanZoomDirective, PanZoomModel } from 'app/shared/directives/pan-zoom.directive';

interface KeyboardKey {
    label: string;
    width: string;
    isHovered?: boolean;
    keybinds?: {
        key: string,
        spell: {
            key: string,
            description: string,
            icon: string,
            id: number | string,
            keybinding: string,
            name: string,
            spellId: string
        },
        modifiers?: string[]
    }[];
}

@Component({
    selector: 'app-view-keyboard',
    templateUrl: './view-keyboard.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        PanZoomDirective,
        DragDropModule
    ]
})
export class ViewKeyboardComponent implements OnChanges, AfterViewInit, OnInit {
    @Input() keybinding: Keybinding | null = null;
    @Input() zoomEnabled: boolean = true;
    @Input() scalePerZoomLevel: number = 2.0;
    @Input() mouseWheelFactor: number = 0.005; // Configurable zoom sensitivity
    @Output() keyClick = new EventEmitter<{ key: string, keybinds: any[] }>();
    @ViewChild('panZoom', { read: PanZoomDirective }) panZoom!: PanZoomDirective;

    keyboardLayout: KeyboardKey[][] = [
        [
            { label: 'Esc', width: 'w-16' },
            { label: 'F1', width: 'w-16' },
            { label: 'F2', width: 'w-16' },
            { label: 'F3', width: 'w-16' },
            { label: 'F4', width: 'w-16' },
            { label: 'F5', width: 'w-16' },
            { label: 'F6', width: 'w-16' },
            { label: 'F7', width: 'w-16' },
            { label: 'F8', width: 'w-16' },
            { label: 'F9', width: 'w-16' },
            { label: 'F10', width: 'w-16' },
            { label: 'F11', width: 'w-16' },
            { label: 'F12', width: 'w-16' }
        ],
        [
            { label: '`', width: 'w-16' },
            { label: '1', width: 'w-16' },
            { label: '2', width: 'w-16' },
            { label: '3', width: 'w-16' },
            { label: '4', width: 'w-16' },
            { label: '5', width: 'w-16' },
            { label: '6', width: 'w-16' },
            { label: '7', width: 'w-16' },
            { label: '8', width: 'w-16' },
            { label: '9', width: 'w-16' },
            { label: '0', width: 'w-16' },
            { label: '-', width: 'w-16' },
            { label: '=', width: 'w-16' },
            { label: 'Backspace', width: 'w-32' }
        ],
        [
            { label: 'Tab', width: 'w-24' },
            { label: 'Q', width: 'w-16' },
            { label: 'W', width: 'w-16' },
            { label: 'E', width: 'w-16' },
            { label: 'R', width: 'w-16' },
            { label: 'T', width: 'w-16' },
            { label: 'Y', width: 'w-16' },
            { label: 'U', width: 'w-16' },
            { label: 'I', width: 'w-16' },
            { label: 'O', width: 'w-16' },
            { label: 'P', width: 'w-16' },
            { label: '[', width: 'w-16' },
            { label: ']', width: 'w-16' },
            { label: '\\', width: 'w-24' }
        ],
        [
            { label: 'Caps', width: 'w-28' },
            { label: 'A', width: 'w-16' },
            { label: 'S', width: 'w-16' },
            { label: 'D', width: 'w-16' },
            { label: 'F', width: 'w-16' },
            { label: 'G', width: 'w-16' },
            { label: 'H', width: 'w-16' },
            { label: 'J', width: 'w-16' },
            { label: 'K', width: 'w-16' },
            { label: 'L', width: 'w-16' },
            { label: ';', width: 'w-16' },
            { label: "'", width: 'w-16' },
            { label: 'Enter', width: 'w-28' }
        ],
        [
            { label: 'Shift', width: 'w-36' },
            { label: 'Z', width: 'w-16' },
            { label: 'X', width: 'w-16' },
            { label: 'C', width: 'w-16' },
            { label: 'V', width: 'w-16' },
            { label: 'B', width: 'w-16' },
            { label: 'N', width: 'w-16' },
            { label: 'M', width: 'w-16' },
            { label: ',', width: 'w-16' },
            { label: '.', width: 'w-16' },
            { label: '/', width: 'w-16' },
            { label: 'Shift', width: 'w-36' }
        ],
        [
            { label: 'Ctrl', width: 'w-24' },
            { label: 'Win', width: 'w-24' },
            { label: 'Alt', width: 'w-24' },
            { label: 'Space', width: 'w-96' },
            { label: 'Alt', width: 'w-24' },
            { label: 'Win', width: 'w-24' },
            { label: 'Menu', width: 'w-24' },
            { label: 'Ctrl', width: 'w-24' }
        ]
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keybinding']) {
            console.log('Keybinding changed:', this.keybinding);
            this.updateKeyboardBindings();
        }
    }

    ngAfterViewInit(): void {
        // Ensure panZoom is initialized
        if (this.panZoom) {
            console.log('PanZoom directive initialized');
        }
    }

    ngOnInit(): void {
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

    private updateKeyboardBindings(): void {
        // Clear existing keybindings
        this.keyboardLayout.forEach(row => {
            row.forEach(key => {
                key.keybinds = [];
                key.isHovered = false;
            });
        });

        if (!this.keybinding?.keybinds) return;

        console.log('Updating keybinds:', this.keybinding.keybinds);
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

    private findKey(keyLabel: string): KeyboardKey | undefined {
        for (const row of this.keyboardLayout) {
            const key = row.find(k => k.label.toLowerCase() === keyLabel.toLowerCase());
            if (key) return key;
        }
        return undefined;
    }

    onKeyClick(key: string, keybinds?: any[]): void {
        if (keybinds && keybinds.length > 0) {
            this.keyClick.emit({ key, keybinds });
        }
    }

    public reset(): void {
        if (this.panZoom) {
            this.panZoom.resetView();
        } else {
            console.warn('PanZoom directive not initialized');
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
}
