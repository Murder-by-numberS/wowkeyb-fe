import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

interface KeybindDetailsDialogData {
    key: string;
    spell: {
        name: string;
        icon: string;
        description?: string;
    };
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
        <h2 mat-dialog-title>Keybind Details</h2>
        <mat-dialog-content>
            <div class="py-4">
                <div class="mb-4">
                    <div class="flex items-center gap-3 mb-2">
                        <img [src]="data.spell.icon" class="w-8 h-8" [alt]="data.spell.name">
                        <div class="flex-grow">
                            <div class="font-semibold text-lg">{{ data.spell.name }}</div>
                        </div>
                    </div>
                    <div class="mt-4 flex items-center gap-3">
                        <div class="text-gray-600">Bound to:</div>
                        <div class="px-3 py-1.5 bg-gray-700 text-white rounded-md font-mono text-sm">
                            {{ data.key }}
                        </div>
                    </div>
                    @if (data.spell.description) {
                        <div class="mt-4 text-gray-600">{{ data.spell.description }}</div>
                    }
                </div>
            </div>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="close()">Close</button>
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
