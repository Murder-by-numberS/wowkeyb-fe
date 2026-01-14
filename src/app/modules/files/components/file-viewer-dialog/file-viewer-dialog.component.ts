import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

export interface FileViewerData {
    content: string;
    fileName: string;
}

@Component({
    selector: 'app-file-viewer-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ],
    template: `
        <div class="p-6">
            <div class="flex items-center justify-between mb-4">
                <h2 mat-dialog-title class="text-xl font-bold">{{ data.fileName }}</h2>
                <button mat-icon-button (click)="close()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div mat-dialog-content class="min-w-[600px] max-w-4xl max-h-[70vh]">
                <div class="border border-gray-300 rounded bg-gray-50 p-4 overflow-auto" style="max-height: 60vh;">
                    <pre class="text-sm font-mono whitespace-pre-wrap break-words">{{ data.content }}</pre>
                </div>
            </div>

            <div mat-dialog-actions class="flex justify-end gap-2 pt-4">
                <button mat-button (click)="copyToClipboard()">
                    <mat-icon>content_copy</mat-icon>
                    Copy
                </button>
                <button mat-raised-button color="primary" (click)="close()">Close</button>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
        pre {
            margin: 0;
            line-height: 1.5;
        }
    `]
})
export class FileViewerDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<FileViewerDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: FileViewerData,
        private snackBar: MatSnackBar
    ) {}

    close(): void {
        this.dialogRef.close();
    }

    copyToClipboard(): void {
        navigator.clipboard.writeText(this.data.content).then(() => {
            this.snackBar.open('File content copied to clipboard', 'Close', { duration: 2000 });
        }).catch(err => {
            console.error('Failed to copy to clipboard:', err);
            this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 3000 });
        });
    }
}
