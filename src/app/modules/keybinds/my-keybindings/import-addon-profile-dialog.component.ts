import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface ImportAddonProfileDialogResult {
    json: string;
}

@Component({
    selector: 'app-import-addon-profile-dialog',
    standalone: true,
    imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule, MatFormFieldModule, MatInputModule],
    template: `
        <h2 mat-dialog-title>Import WoWKeyb Addon Profile</h2>
        <mat-dialog-content>
            <p class="text-sm text-gray-600 dark:text-gray-300 mb-3">
                Paste exported addon profile code string (WK1:...).
            </p>
            <mat-form-field appearance="outline" class="w-full">
                <textarea
                    matInput
                    rows="12"
                    [(ngModel)]="jsonText"
                    placeholder='WK1:eyJuYW1lIjoiTXkgUHJvZmlsZSIsImtleWJpbmRzIjpbLi4uXX0='
                ></textarea>
            </mat-form-field>
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-stroked-button (click)="cancel()">Cancel</button>
            <button mat-flat-button color="primary" [disabled]="!jsonText.trim()" (click)="import()">Import</button>
        </mat-dialog-actions>
    `,
})
export class ImportAddonProfileDialogComponent {
    jsonText = '';

    constructor(
        public dialogRef: MatDialogRef<ImportAddonProfileDialogComponent, ImportAddonProfileDialogResult | undefined>,
        @Inject(MAT_DIALOG_DATA) _data: unknown
    ) {}

    cancel(): void {
        this.dialogRef.close(undefined);
    }

    import(): void {
        this.dialogRef.close({ json: this.jsonText.trim() });
    }
}
