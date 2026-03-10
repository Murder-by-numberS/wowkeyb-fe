import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface KeybindDetailsDialogData {
    key: string;
    keybinds: {
        key: string;
        modifiers?: string[];
        spell: {
            key: string,
            description: string,
            icon: string,
            id: number | string,
            keybinding: string,
            name: string,
            spellId: string
        };
    }[];
}

@Component({
    selector: 'app-keybind-details-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule
    ],
    template: `
        <h2 mat-dialog-title class="dark:text-gray-100">Keybind Details</h2>
        <mat-dialog-content>
            <div class="py-4">
                <div *ngFor="let keybind of data.keybinds" class="mb-6">
                    <div class="flex items-center gap-3 mb-2">
                        <img [src]="keybind.spell.icon" class="w-8 h-8" [alt]="keybind.spell.name">
                        <div class="flex-grow">
                            <div class="font-semibold text-lg dark:text-gray-100">{{ keybind.spell.name }}</div>
                        </div>
                    </div>
                    <div class="mt-2 flex items-center gap-3">
                        <div class="text-gray-600 dark:text-gray-400">Bound to:</div>
                        <div class="px-3 py-1.5 bg-gray-200 dark:bg-gray-600 text-gray-900 dark:text-gray-100 rounded-md font-mono text-sm">
                            <span *ngIf="keybind.modifiers?.length">{{ keybind.modifiers.join('+') }}+</span>{{ data.key }}
                        </div>
                    </div>
                    <div *ngIf="keybind.spell.description" class="mt-2 text-gray-600 dark:text-gray-400">{{ keybind.spell.description }}</div>
                </div>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-stroked-button (click)="close()">Close</button>
        </mat-dialog-actions>
    `
})
export class KeybindDetailsDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<KeybindDetailsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: KeybindDetailsDialogData
    ) { }

    close(): void {
        this.dialogRef.close();
    }
}
