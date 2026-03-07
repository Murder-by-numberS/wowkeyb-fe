import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

export type ImportConflictAction = 'update' | 'copy' | 'cancel';

export interface ImportConflictDialogData {
    incomingName: string;
    existingName: string;
}

@Component({
    selector: 'app-import-conflict-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    template: `
        <h2 mat-dialog-title>Name Already Exists</h2>
        <mat-dialog-content>
            <p class="leading-relaxed">
                A keybinding named <strong>{{ data.existingName }}</strong> already exists.
            </p>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Choose what to do with imported profile <strong>{{ data.incomingName }}</strong>.
            </p>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-stroked-button (click)="close('cancel')">Cancel</button>
            <button mat-stroked-button (click)="close('copy')">Copy As New</button>
            <button mat-flat-button color="primary" (click)="close('update')">Update Existing</button>
        </mat-dialog-actions>
    `,
})
export class ImportConflictDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ImportConflictDialogComponent, ImportConflictAction>,
        @Inject(MAT_DIALOG_DATA) public data: ImportConflictDialogData
    ) {}

    close(action: ImportConflictAction): void {
        this.dialogRef.close(action);
    }
}
