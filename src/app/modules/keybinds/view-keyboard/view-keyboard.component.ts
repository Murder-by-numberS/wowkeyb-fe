import { Component, Input, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
    keybinds?: Keybind[];
}

@Component({
    selector: 'app-view-keyboard',
    templateUrl: './view-keyboard.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        PanZoomDirective,
        DragDropModule
    ]
})
export class ViewKeyboardComponent implements OnChanges {
    @ViewChild(PanZoomDirective) panZoom!: PanZoomDirective;
    @Input() keybinding: Keybinding | null = null;
    @Input() zoomEnabled: () => boolean = () => true;
    @Input() scalePerZoomLevel: () => number = () => 2.0;
    @Input() neutralZoomLevel: () => number = () => 2;

    canZoom: boolean = true;
    panzoomModel: PanZoomModel = { zoomLevel: 2, pan: { x: 0, y: 0 } };

    keyboardLayout: KeyboardKey[][] = [
        [
            { label: 'ESC', width: 'w-16' },
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
            { label: '\'', width: 'w-16' },
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
            { label: 'Ctrl', width: 'w-20' },
            { label: 'Win', width: 'w-20' },
            { label: 'Alt', width: 'w-20' },
            { label: 'Space', width: 'w-64' },
            { label: 'Alt', width: 'w-20' },
            { label: 'Win', width: 'w-20' },
            { label: 'Menu', width: 'w-20' },
            { label: 'Ctrl', width: 'w-20' },
            { label: '◄', width: 'w-16' },
            { label: '▲', width: 'w-16' },
            { label: '▼', width: 'w-16' },
            { label: '►', width: 'w-16' }
        ]
    ];

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keybinding']) {
            console.log('ViewKeyboard - keybinding changed:', this.keybinding);
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
            console.log('ViewKeyboard - updating keybinds:', this.keybinding.keybinds);
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

    public reset(): void {
        this.panZoom.resetView();
    }

    public zoomIn(): void {
        this.panZoom.zoomIn('viewCenter');
    }

    public zoomOut(): void {
        this.panZoom.zoomOut('viewCenter');
    }

    public panUp(): void {
        this.panZoom.panDelta({ x: 0, y: -100 });
    }

    public panDown(): void {
        this.panZoom.panDelta({ x: 0, y: 100 });
    }

    public panLeft(): void {
        this.panZoom.panDelta({ x: -100, y: 0 });
    }

    public panRight(): void {
        this.panZoom.panDelta({ x: 100, y: 0 });
    }
}
