import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

export interface VersionCopyDialogData {
    targetVersion: string;
    changes: {
        removedAbilities: Array<{
            key: string;
            spell: {
                name: string;
                icon: string;
                spell_id: string;
            };
        }>;
        originalCount: number;
        newCount: number;
    };
    keybindingId: string;
}

@Component({
    selector: 'app-version-copy-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
    ],
    template: `
        <h2 mat-dialog-title class="!text-lg !font-semibold">
            Copied to Version {{ data.targetVersion }}
        </h2>
        
        <mat-dialog-content class="!py-4">
            @if (data.changes.removedAbilities.length > 0) {
                <div class="mb-4 p-3 bg-yellow-50 dark:bg-yellow-950/40 border border-yellow-200 dark:border-yellow-800 rounded-lg">
                    <div class="flex items-center gap-2 text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                        <mat-icon class="text-yellow-600 dark:text-yellow-400">warning</mat-icon>
                        <span>{{ data.changes.removedAbilities.length }} ability/abilities removed</span>
                    </div>
                    <p class="text-sm text-yellow-700 dark:text-yellow-300 mb-3">
                        The following abilities don't exist in version {{ data.targetVersion }} and were removed from the keybinding:
                    </p>
                    <div class="space-y-2 max-h-64 overflow-y-auto">
                        @for (removed of data.changes.removedAbilities; track removed.key) {
                            <div class="flex items-center gap-3 p-2 bg-white dark:bg-gray-900 rounded border border-yellow-100 dark:border-yellow-900">
                                <div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-800 flex items-center justify-center overflow-hidden">
                                    @if (removed.spell.icon) {
                                        <img [src]="'https://wow.zamimg.com/images/wow/icons/medium/' + removed.spell.icon + '.jpg'" 
                                             [alt]="removed.spell.name"
                                             class="w-full h-full object-cover"
                                             onerror="this.style.display='none'">
                                    }
                                </div>
                                <div class="flex-1 min-w-0">
                                    <div class="font-medium text-sm truncate text-gray-900 dark:text-gray-100">{{ removed.spell.name }}</div>
                                    <div class="text-xs text-gray-500 dark:text-gray-400">Key: {{ removed.key }}</div>
                                </div>
                            </div>
                        }
                    </div>
                </div>
            } @else {
                <div class="p-3 bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 rounded-lg">
                    <div class="flex items-center gap-2 text-green-800 dark:text-green-200">
                        <mat-icon class="text-green-600 dark:text-green-400">check_circle</mat-icon>
                        <span>All abilities transferred successfully!</span>
                    </div>
                </div>
            }
            
            <div class="mt-4 text-sm text-gray-600 dark:text-gray-300">
                <span class="font-medium">Summary:</span>
                {{ data.changes.newCount }} of {{ data.changes.originalCount }} keybinds copied
            </div>
        </mat-dialog-content>
        
        <mat-dialog-actions class="!justify-end !gap-2">
            <button mat-stroked-button (click)="onClose()">Close</button>
            <button mat-flat-button color="primary" (click)="onView()">
                View Keybinding
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        :host {
            display: block;
            min-width: 400px;
            max-width: 500px;
        }
    `]
})
export class VersionCopyDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<VersionCopyDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: VersionCopyDialogData
    ) { }

    onClose(): void {
        this.dialogRef.close({ action: 'close' });
    }

    onView(): void {
        this.dialogRef.close({ action: 'view', keybindingId: this.data.keybindingId });
    }
}
