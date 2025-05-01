import { Component, Input, ViewChild, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { NgxPanZoomModule, PanZoomComponent } from 'ngx-panzoom';
import { Keybinding } from 'app/core/types/keybinding';
import { DragDropModule } from '@angular/cdk/drag-drop';
import { Keybind } from 'app/core/types/keybind';

interface Key {
    label: string;
    width: string;
    isHovered?: boolean;
    keybinds?: Keybind[];
}

@Component({
    selector: 'view-keyboard',
    templateUrl: './view-keyboard.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        NgxPanZoomModule,
        DragDropModule
    ]
})
export class ViewKeyboardComponent implements OnChanges {
    @Input() keybinding: Keybinding | null = null;
    @ViewChild('panZoom') panZoom: PanZoomComponent | undefined;

    canZoom: boolean = true;

    keyboardLayout: Key[][] = [
        // Define rows and keys with their respective widths
        [
            { label: 'Esc', width: 'w-12', isHovered: false },
            { label: 'F1', width: 'w-12', isHovered: false }, { label: 'F2', width: 'w-12', isHovered: false },
            { label: 'F3', width: 'w-12', isHovered: false }, { label: 'F4', width: 'w-12', isHovered: false },
            { label: 'F5', width: 'w-12', isHovered: false }, { label: 'F6', width: 'w-12', isHovered: false },
            { label: 'F7', width: 'w-12', isHovered: false }, { label: 'F8', width: 'w-12', isHovered: false },
            { label: 'F9', width: 'w-12', isHovered: false }, { label: 'F10', width: 'w-12', isHovered: false },
            { label: 'F11', width: 'w-12', isHovered: false }, { label: 'F12', width: 'w-12', isHovered: false }
        ],
        [
            { label: '~', width: 'w-12', isHovered: false }, { label: '1', width: 'w-12', isHovered: false },
            { label: '2', width: 'w-12', isHovered: false }, { label: '3', width: 'w-12', isHovered: false },
            { label: '4', width: 'w-12', isHovered: false }, { label: '5', width: 'w-12', isHovered: false },
            { label: '6', width: 'w-12', isHovered: false }, { label: '7', width: 'w-12', isHovered: false },
            { label: '8', width: 'w-12', isHovered: false }, { label: '9', width: 'w-12', isHovered: false },
            { label: '0', width: 'w-12', isHovered: false }, { label: '-', width: 'w-12', isHovered: false },
            { label: '=', width: 'w-12', isHovered: false }, { label: 'Backspace', width: 'w-24', isHovered: false }
        ],
        [
            { label: 'Tab', width: 'w-16', isHovered: false }, { label: 'Q', width: 'w-12', isHovered: false },
            { label: 'W', width: 'w-12', isHovered: false }, { label: 'E', width: 'w-12', isHovered: false },
            { label: 'R', width: 'w-12', isHovered: false }, { label: 'T', width: 'w-12', isHovered: false },
            { label: 'Y', width: 'w-12', isHovered: false }, { label: 'U', width: 'w-12', isHovered: false },
            { label: 'I', width: 'w-12', isHovered: false }, { label: 'O', width: 'w-12', isHovered: false },
            { label: 'P', width: 'w-12', isHovered: false }, { label: '[', width: 'w-12', isHovered: false },
            { label: ']', width: 'w-12', isHovered: false }, { label: '\\', width: 'w-16', isHovered: false }
        ],
        [
            { label: 'Caps Lock', width: 'w-20', isHovered: false }, { label: 'A', width: 'w-12', isHovered: false },
            { label: 'S', width: 'w-12', isHovered: false }, { label: 'D', width: 'w-12', isHovered: false },
            { label: 'F', width: 'w-12', isHovered: false }, { label: 'G', width: 'w-12', isHovered: false },
            { label: 'H', width: 'w-12', isHovered: false }, { label: 'J', width: 'w-12', isHovered: false },
            { label: 'K', width: 'w-12', isHovered: false }, { label: 'L', width: 'w-12', isHovered: false },
            { label: ';', width: 'w-12', isHovered: false }, { label: '\'', width: 'w-12', isHovered: false },
            { label: 'Enter', width: 'w-24', isHovered: false }
        ],
        [
            { label: 'Shift', width: 'w-24', isHovered: false }, { label: 'Z', width: 'w-12', isHovered: false },
            { label: 'X', width: 'w-12', isHovered: false }, { label: 'C', width: 'w-12', isHovered: false },
            { label: 'V', width: 'w-12', isHovered: false }, { label: 'B', width: 'w-12', isHovered: false },
            { label: 'N', width: 'w-12', isHovered: false }, { label: 'M', width: 'w-12', isHovered: false },
            { label: ',', width: 'w-12', isHovered: false }, { label: '.', width: 'w-12', isHovered: false },
            { label: '/', width: 'w-12', isHovered: false }, { label: 'Shift', width: 'w-32', isHovered: false }
        ],
        [
            { label: 'Ctrl', width: 'w-16', isHovered: false, }, { label: 'Fn', width: 'w-16', isHovered: false },
            { label: 'Alt', width: 'w-16', isHovered: false }, { label: 'Space', width: 'w-64', isHovered: false },
            { label: 'Alt', width: 'w-16', isHovered: false }, { label: 'Ctrl', width: 'w-16', isHovered: false },
            { label: '◄', width: 'w-16', isHovered: false }, { label: '▲', width: 'w-16', isHovered: false },
            { label: '▼', width: 'w-16', isHovered: false }, { label: '►', width: 'w-16', isHovered: false }
        ]
    ];

    scalePerZoomLevel(): number {
        return 2.0;
    }

    neutralZoomLevel(): number {
        return 2;
    }

    zoomEnabled(): boolean {
        return this.canZoom;
    }

    zoomIn(): void {
        this.panZoom?.zoomIn('viewCenter');
    }

    zoomOut(): void {
        this.panZoom?.zoomOut('viewCenter');
    }

    reset(): void {
        this.panZoom?.resetView();
    }

    onPanDown100Clicked(): void {
        this.panZoom?.panDelta({ x: 0, y: 100 });
    }

    onPanUp100Clicked(): void {
        this.panZoom?.panDelta({ x: 0, y: -100 });
    }

    onPanRight100Clicked(): void {
        this.panZoom?.panDelta({ x: 100, y: 0 });
    }

    onPanLeft100Clicked(): void {
        this.panZoom?.panDelta({ x: -100, y: 0 });
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['keybinding']) {
            this.updateKeyboardBindings();
        }
    }

    private updateKeyboardBindings(): void {
        // First, clear all existing keybindings and hover states
        this.keyboardLayout.forEach(row => {
            row.forEach(keyItem => {
                keyItem.keybinds = [];
                keyItem.isHovered = false;
            });
        });

        if (this.keybinding?.keybinds) {
            this.keybinding.keybinds.forEach(keybind => {
                this.addKeybinding(keybind);
            });
        }
    }

    private addKeybinding(keybind: Keybind): void {
        const keyParts = keybind.key.toLowerCase().split('+');
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
                    keyItem.keybinds.push(keybind);
                }
            });
        });
    }
}
