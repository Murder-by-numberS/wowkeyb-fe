import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatExpansionModule } from '@angular/material/expansion';
import { MacroFileService } from '../../../macros/services/macro-file.service';
import { FRONTEND_CLASS_OPTIONS, formatClassNameForFrontend } from 'app/core/utils/class-name-utils';

export interface FileDetailsData {
    file: any;
    isUpload?: boolean;
}

@Component({
    selector: 'app-file-details-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatExpansionModule
    ],
    template: `
        <div class="p-6">
            <div class="flex items-center justify-between mb-6">
                <h2 mat-dialog-title class="text-2xl font-bold">File Details</h2>
                <button mat-icon-button (click)="close()">
                    <mat-icon>close</mat-icon>
                </button>
            </div>

            <div mat-dialog-content class="min-w-[500px] max-w-3xl">
                <!-- File Info -->
                <div class="mb-6">
                    <div class="flex items-center gap-2 mb-4">
                        <mat-icon class="text-gray-600">description</mat-icon>
                        <span class="text-lg font-semibold">{{ data.file.file_name }}</span>
                    </div>

                    <div class="grid grid-cols-2 gap-4 mb-4">
                        <div>
                            <div class="text-sm text-gray-500 mb-1">File Type</div>
                            <mat-chip class="h-7">
                                {{ data.file.file_type === 'account' ? 'Account-Wide' : 'Character' }}
                            </mat-chip>
                        </div>

                        <div *ngIf="data.file.character_class">
                            <div class="text-sm text-gray-500 mb-1">Class</div>
                            <mat-chip color="primary" class="h-7">
                                {{ getClassName(data.file.character_class) }}
                            </mat-chip>
                        </div>

                        <div>
                            <div class="text-sm text-gray-500 mb-1">Macro Count</div>
                            <div class="font-medium">{{ data.file.macro_count || data.file.item_count || 0 }}</div>
                        </div>

                        <div *ngIf="!data.isUpload">
                            <div class="text-sm text-gray-500 mb-1">Download Count</div>
                            <div class="font-medium">{{ data.file.download_count || 0 }}</div>
                        </div>

                        <div>
                            <div class="text-sm text-gray-500 mb-1">{{ data.isUpload ? 'Uploaded' : 'Downloaded' }}</div>
                            <div class="font-medium">{{ formatDate(data.file.downloaded_at) }}</div>
                        </div>

                        <div *ngIf="!data.isUpload && data.file.last_downloaded_at">
                            <div class="text-sm text-gray-500 mb-1">Last Downloaded</div>
                            <div class="font-medium">{{ formatDate(data.file.last_downloaded_at) }}</div>
                        </div>
                    </div>

                    <!-- Macros List (Collapsible) -->
                    <div *ngIf="data.file.macros && data.file.macros.length > 0" class="mt-4">
                        <mat-expansion-panel>
                            <mat-expansion-panel-header>
                                <mat-panel-title>
                                    Macros in this file
                                </mat-panel-title>
                                <mat-panel-description>
                                    {{ data.file.macros.length }} macro{{ data.file.macros.length !== 1 ? 's' : '' }}
                                </mat-panel-description>
                            </mat-expansion-panel-header>
                            <div class="max-h-48 overflow-y-auto border border-gray-200 rounded p-3 mt-2">
                                <div *ngFor="let macro of data.file.macros" class="py-1 text-sm">
                                    <span class="font-medium">{{ macro.name }}</span>
                                    <span *ngIf="macro.class" class="text-gray-500 ml-2">({{ getClassName(macro.class) }})</span>
                                </div>
                            </div>
                        </mat-expansion-panel>
                    </div>
                </div>

                <!-- Actions -->
                <div class="flex gap-2 justify-end">
                    <button mat-button (click)="viewFile()" [disabled]="loadingFile">
                        <mat-icon>visibility</mat-icon>
                        View File
                    </button>
                    <button mat-raised-button color="primary" (click)="downloadFile()" [disabled]="downloadingFile">
                        <mat-icon>download</mat-icon>
                        <span *ngIf="!downloadingFile">Download</span>
                        <span *ngIf="downloadingFile">Downloading...</span>
                    </button>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: block;
        }
    `]
})
export class FileDetailsDialogComponent implements OnInit {
    loadingFile = false;
    downloadingFile = false;

    classes = FRONTEND_CLASS_OPTIONS;

    constructor(
        public dialogRef: MatDialogRef<FileDetailsDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: FileDetailsData,
        private macroFileService: MacroFileService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {}

    close(): void {
        this.dialogRef.close();
    }

    getClassName(classValue: string): string {
        return formatClassNameForFrontend(classValue);
    }

    formatDate(date: string | Date): string {
        if (!date) return 'Unknown';
        const d = new Date(date);
        return d.toLocaleString();
    }

    viewFile(): void {
        this.loadingFile = true;
        this.macroFileService.viewFile(this.data.file.id).subscribe({
            next: (response) => {
                this.loadingFile = false;
                this.dialogRef.close({ action: 'view', content: response.file.content, fileName: response.file.file_name });
            },
            error: (error) => {
                console.error('Error viewing file:', error);
                this.loadingFile = false;
                this.snackBar.open('Failed to load file content', 'Close', { duration: 3000 });
            }
        });
    }

    downloadFile(): void {
        this.downloadingFile = true;
        this.macroFileService.redownloadFile(this.data.file.id).subscribe({
            next: (response) => {
                this.macroFileService.downloadFileFromUrl(response.file.download_url, response.file.file_name);
                this.downloadingFile = false;
                this.snackBar.open('File download started', 'Close', { duration: 2000 });
            },
            error: (error) => {
                console.error('Error downloading file:', error);
                this.downloadingFile = false;
                this.snackBar.open('Failed to download file', 'Close', { duration: 3000 });
            }
        });
    }
}
