import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MacroFileService, MacroDownload } from '../macros/services/macro-file.service';
import { UploadMacroFileDialogComponent } from '../macros/components/upload-macro-file-dialog/upload-macro-file-dialog.component';
import { DownloadHistoryDialogComponent } from '../macros/components/download-history-dialog/download-history-dialog.component';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { FileDetailsDialogComponent } from './components/file-details-dialog/file-details-dialog.component';
import { FileViewerDialogComponent } from './components/file-viewer-dialog/file-viewer-dialog.component';

@Component({
    selector: 'files',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatSelectModule,
        MatFormFieldModule,
        MatTooltipModule
    ],
    template: `
        <div class="flex flex-col h-full">
            <!-- Header -->
            <div class="flex items-center justify-between p-6 border-b">
                <div>
                    <h1 class="text-2xl font-bold">Files</h1>
                    <p class="text-gray-600 dark:text-gray-400 mt-1">
                        Upload macro files and manage your upload/download history
                    </p>
                </div>
                <button mat-raised-button color="primary" (click)="openUploadDialog()">
                    <mat-icon class="mr-2">upload_file</mat-icon>
                    Upload Macro File
                </button>
            </div>

            <!-- Content -->
            <div class="flex-1 overflow-y-auto p-6">
                <!-- Upload History Section -->
                <div class="mb-8">
                    <h2 class="text-xl font-semibold mb-4">Upload History</h2>
                    
                    <!-- Loading State -->
                    <div *ngIf="loadingUploads" class="flex justify-center items-center py-12">
                        <mat-spinner diameter="50"></mat-spinner>
                    </div>

                    <!-- Empty State -->
                    <div *ngIf="!loadingUploads && uploads.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <mat-icon class="text-6xl text-gray-400 mb-4">upload_file</mat-icon>
                        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Uploads Yet</h3>
                        <p class="text-gray-500 dark:text-gray-400 mb-4">
                            Upload your first macro file to get started
                        </p>
                        <button mat-raised-button color="primary" (click)="openUploadDialog()">
                            <mat-icon class="mr-2">upload_file</mat-icon>
                            Upload File
                        </button>
                    </div>

                    <!-- Upload List -->
                    <div *ngIf="!loadingUploads && uploads.length > 0" class="space-y-4">
                        <div
                            *ngFor="let upload of uploads"
                            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <mat-icon class="text-gray-600 dark:text-gray-400">description</mat-icon>
                                        <span class="font-medium">{{ upload.file_name }}</span>
                                    </div>

                                    <div class="flex flex-wrap gap-2 mb-2">
                                        <mat-chip class="h-6 text-xs">
                                            {{ upload.file_type === 'account' ? 'Account-Wide' : 'Character' }}
                                        </mat-chip>

                                        <mat-chip *ngIf="upload.character_class" class="h-6 text-xs" color="primary">
                                            {{ getClassName(upload.character_class) }}
                                        </mat-chip>

                                        <mat-chip class="h-6 text-xs">
                                            {{ upload.item_count }} macro{{ upload.item_count !== 1 ? 's' : '' }}
                                        </mat-chip>

                                        <mat-chip class="h-6 text-xs" color="accent">
                                            {{ upload.macro_ids?.length || 0 }} created
                                        </mat-chip>
                                    </div>

                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        Uploaded {{ formatDate(upload.downloaded_at) }}
                                    </div>
                                </div>

                                <div class="flex gap-2">
                                    <button
                                        mat-icon-button
                                        matTooltip="View Details"
                                        (click)="viewUploadDetails(upload)">
                                        <mat-icon>info</mat-icon>
                                    </button>
                                    <button
                                        mat-icon-button
                                        matTooltip="View File"
                                        (click)="viewFile(upload, true)">
                                        <mat-icon>visibility</mat-icon>
                                    </button>
                                    <button
                                        mat-icon-button
                                        color="warn"
                                        matTooltip="Delete"
                                        (click)="deleteUpload(upload)">
                                        <mat-icon>delete</mat-icon>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Download History Section -->
                <div>
                    <div class="flex items-center justify-between mb-4">
                        <h2 class="text-xl font-semibold">Download History</h2>
                        <button mat-button (click)="openDownloadHistory()">
                            View All
                            <mat-icon class="ml-1">arrow_forward</mat-icon>
                        </button>
                    </div>

                    <!-- Loading State -->
                    <div *ngIf="loadingDownloads" class="flex justify-center items-center py-12">
                        <mat-spinner diameter="50"></mat-spinner>
                    </div>

                    <!-- Empty State -->
                    <div *ngIf="!loadingDownloads && downloads.length === 0" class="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <mat-icon class="text-6xl text-gray-400 mb-4">download</mat-icon>
                        <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300 mb-2">No Downloads Yet</h3>
                        <p class="text-gray-500 dark:text-gray-400">
                            Exported macro files will appear here
                        </p>
                    </div>

                    <!-- Download List -->
                    <div *ngIf="!loadingDownloads && downloads.length > 0" class="space-y-4">
                        <div
                            *ngFor="let download of downloads"
                            class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">
                            
                            <div class="flex items-start justify-between">
                                <div class="flex-1">
                                    <div class="flex items-center gap-2 mb-2">
                                        <mat-icon class="text-gray-600 dark:text-gray-400">description</mat-icon>
                                        <span class="font-medium">{{ download.file_name }}</span>
                                    </div>

                                    <div class="flex flex-wrap gap-2 mb-2">
                                        <mat-chip class="h-6 text-xs">
                                            {{ download.file_type === 'account' ? 'Account-Wide' : 'Character' }}
                                        </mat-chip>

                                        <mat-chip *ngIf="download.character_class" class="h-6 text-xs" color="primary">
                                            {{ getClassName(download.character_class) }}
                                        </mat-chip>

                                        <mat-chip class="h-6 text-xs">
                                            {{ download.macro_count }} macro{{ download.macro_count !== 1 ? 's' : '' }}
                                        </mat-chip>

                                        <mat-chip class="h-6 text-xs">
                                            Downloaded {{ download.download_count }} time{{ download.download_count !== 1 ? 's' : '' }}
                                        </mat-chip>
                                    </div>

                                    <div class="text-sm text-gray-600 dark:text-gray-400">
                                        Last downloaded {{ formatDate(download.last_downloaded_at) }}
                                    </div>
                                </div>

                                <div class="flex gap-2">
                                    <button
                                        mat-icon-button
                                        matTooltip="View Details"
                                        (click)="viewDownloadDetails(download)">
                                        <mat-icon>info</mat-icon>
                                    </button>
                                    <button
                                        mat-icon-button
                                        matTooltip="View File"
                                        (click)="viewFile(download, false)">
                                        <mat-icon>visibility</mat-icon>
                                    </button>
                                    <button
                                        mat-raised-button
                                        color="primary"
                                        (click)="redownloadFile(download)">
                                        <mat-icon class="mr-1">download</mat-icon>
                                        Download
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
    `]
})
export class FilesComponent implements OnInit {
    uploads: any[] = [];
    downloads: MacroDownload[] = [];
    loadingUploads = false;
    loadingDownloads = false;
    deletingUploadId: string | null = null;

    classes = [
        { value: 'deathknight', label: 'Death Knight' },
        { value: 'demonhunter', label: 'Demon Hunter' },
        { value: 'druid', label: 'Druid' },
        { value: 'evoker', label: 'Evoker' },
        { value: 'hunter', label: 'Hunter' },
        { value: 'mage', label: 'Mage' },
        { value: 'monk', label: 'Monk' },
        { value: 'paladin', label: 'Paladin' },
        { value: 'priest', label: 'Priest' },
        { value: 'rogue', label: 'Rogue' },
        { value: 'shaman', label: 'Shaman' },
        { value: 'warlock', label: 'Warlock' },
        { value: 'warrior', label: 'Warrior' }
    ];

    constructor(
        private macroFileService: MacroFileService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadUploads();
        this.loadDownloads();
    }

    loadUploads(): void {
        this.loadingUploads = true;
        // Get upload history (source: 'upload')
        this.macroFileService.getDownloadHistory(undefined, undefined, 50, 1).subscribe({
            next: (response) => {
                // Filter to only show uploads (source: 'upload')
                const allFiles = response.downloads || [];
                this.uploads = allFiles.filter((d: any) => d.source === 'upload');
                console.log('Loaded uploads:', {
                    totalFiles: allFiles.length,
                    uploadFiles: this.uploads.length,
                    files: allFiles.map((f: any) => ({ name: f.file_name, source: f.source }))
                });
                this.loadingUploads = false;
            },
            error: (error) => {
                console.error('Error loading uploads:', error);
                this.loadingUploads = false;
                this.snackBar.open('Failed to load upload history', 'Close', { duration: 3000 });
            }
        });
    }

    loadDownloads(): void {
        this.loadingDownloads = true;
        this.macroFileService.getDownloadHistory(undefined, undefined, 10, 1).subscribe({
            next: (response) => {
                // Filter to only show generated files (source: 'generated')
                this.downloads = response.downloads.filter((d: any) => d.source === 'generated' || !d.source);
                this.loadingDownloads = false;
            },
            error: (error) => {
                console.error('Error loading downloads:', error);
                this.loadingDownloads = false;
                this.snackBar.open('Failed to load download history', 'Close', { duration: 3000 });
            }
        });
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(UploadMacroFileDialogComponent, {
            width: '600px',
            disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.snackBar.open(
                    `Imported ${result.upload.macros_created} macro(s) successfully!`,
                    'Close',
                    { duration: 3000 }
                );
                this.loadUploads();
            }
        });
    }

    openDownloadHistory(): void {
        this.dialog.open(DownloadHistoryDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh'
        });
    }

    viewUploadDetails(upload: any): void {
        const dialogRef = this.dialog.open(FileDetailsDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            data: {
                file: upload,
                isUpload: true
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'view') {
                this.openFileViewer(result.content, result.fileName);
            }
        });
    }

    viewDownloadDetails(download: MacroDownload): void {
        const dialogRef = this.dialog.open(FileDetailsDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            data: {
                file: download,
                isUpload: false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'view') {
                this.openFileViewer(result.content, result.fileName);
            }
        });
    }

    viewFile(file: any, isUpload: boolean): void {
        this.macroFileService.viewFile(file.id).subscribe({
            next: (response) => {
                this.openFileViewer(response.file.content, response.file.file_name);
            },
            error: (error) => {
                console.error('Error viewing file:', error);
                this.snackBar.open('Failed to load file content', 'Close', { duration: 3000 });
            }
        });
    }

    openFileViewer(content: string, fileName: string): void {
        this.dialog.open(FileViewerDialogComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: {
                content,
                fileName
            }
        });
    }

    deleteUpload(upload: any): void {
        const uploadId = upload.id || upload._id;
        if (!uploadId) {
            console.error('Upload object missing id:', upload);
            this.snackBar.open('Error: Upload ID not found', 'Close', { duration: 3000 });
            return;
        }

        if (this.deletingUploadId === uploadId) {
            console.log('Delete already in progress for this upload');
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Delete Upload',
                message: `Are you sure you want to delete "${upload.file_name}"? This will not delete the macros created from this file.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed === true) {
                this.deletingUploadId = uploadId;
                console.log('Deleting upload:', { id: uploadId, fileName: upload.file_name });

                this.macroFileService.deleteDownloadRecord(uploadId).subscribe({
                    next: (response) => {
                        console.log('Upload deleted successfully:', response);
                        this.deletingUploadId = null;
                        this.snackBar.open('Upload deleted successfully', 'Close', { duration: 3000 });
                        this.loadUploads();
                    },
                    error: (error) => {
                        console.error('Error deleting upload:', error);
                        this.deletingUploadId = null;
                        
                        // Self-heal: If record not found (404), just remove it from the list
                        if (error.status === 404 || error.error?.message?.includes('not found')) {
                            console.log('Upload record not found, removing from list (self-healing)');
                            this.uploads = this.uploads.filter(u => (u.id || u._id) !== uploadId);
                            this.snackBar.open('Upload removed', 'Close', { duration: 2000 });
                        } else {
                            const errorMessage = error.error?.message || error.message || 'Failed to delete upload';
                            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                        }
                    }
                });
            } else {
                console.log('Delete cancelled by user, confirmed value:', confirmed);
            }
        });
    }

    redownloadFile(download: MacroDownload): void {
        this.macroFileService.redownloadFile(download.id).subscribe({
            next: (response) => {
                this.macroFileService.downloadFileFromUrl(response.file.download_url, response.file.file_name);
                this.snackBar.open('File download started', 'Close', { duration: 2000 });
                this.loadDownloads();
            },
            error: (error) => {
                console.error('Error re-downloading file:', error);
                this.snackBar.open('Failed to download file', 'Close', { duration: 3000 });
            }
        });
    }

    getClassName(classValue: string): string {
        const cls = this.classes.find(c => c.value === classValue);
        return cls ? cls.label : classValue;
    }

    formatDate(date: string | Date): string {
        if (!date) return 'Unknown';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return d.toLocaleDateString();
    }
}

