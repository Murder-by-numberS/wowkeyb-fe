import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MacroFileService, MacroDownload } from '../../services/macro-file.service';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { FRONTEND_CLASS_OPTIONS, formatClassNameForFrontend } from 'app/core/utils/class-name-utils';

@Component({
    selector: 'download-history-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatSelectModule,
        MatFormFieldModule
    ],
    template: `
        <h2 mat-dialog-title>Download History</h2>

        <mat-dialog-content>
            <!-- Filters -->
            <div class="filters flex gap-4 mb-4">
                <mat-form-field appearance="outline" class="flex-1">
                    <mat-label>File Type</mat-label>
                    <mat-select [(value)]="filterFileType" (selectionChange)="applyFilters()">
                        <mat-option [value]="null">All Types</mat-option>
                        <mat-option value="account">Account-Wide</mat-option>
                        <mat-option value="character">Character-Specific</mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="flex-1" *ngIf="filterFileType === 'character'">
                    <mat-label>Character Class</mat-label>
                    <mat-select [(value)]="filterClass" (selectionChange)="applyFilters()">
                        <mat-option [value]="null">All Classes</mat-option>
                        <mat-option *ngFor="let cls of classes" [value]="cls.value">
                            {{ cls.label }}
                        </mat-option>
                    </mat-select>
                </mat-form-field>
            </div>

            <!-- Loading State -->
            <div *ngIf="loading" class="flex justify-center items-center py-12">
                <mat-spinner diameter="50"></mat-spinner>
            </div>

            <!-- Empty State -->
            <div *ngIf="!loading && downloads.length === 0" class="text-center py-12">
                <mat-icon class="text-6xl text-gray-400 mb-4">history</mat-icon>
                <h3 class="text-lg font-medium text-gray-700 dark:text-gray-300">No Download History</h3>
                <p class="text-gray-500 dark:text-gray-400 mt-2">
                    Your exported macro files will appear here
                </p>
            </div>

            <!-- Download List -->
            <div *ngIf="!loading && downloads.length > 0" class="download-list">
                <div
                    *ngFor="let download of downloads"
                    class="download-item p-4 mb-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow">

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

                                <mat-chip *ngIf="download.character_name" class="h-6 text-xs">
                                    {{ download.character_name }}
                                </mat-chip>

                                <mat-chip class="h-6 text-xs">
                                    {{ download.macro_count }} macro{{ download.macro_count !== 1 ? 's' : '' }}
                                </mat-chip>
                            </div>

                            <div class="text-sm text-gray-600 dark:text-gray-400">
                                <p>Downloaded {{ download.download_count }} time{{ download.download_count !== 1 ? 's' : '' }}</p>
                                <p>Last: {{ formatDate(download.last_downloaded_at) }}</p>
                                <p class="text-xs mt-1">Created: {{ formatDate(download.downloaded_at) }}</p>
                            </div>

                            <!-- Macro List (expandable) -->
                            <div *ngIf="download.macros && download.macros.length > 0" class="mt-2">
                                <button
                                    mat-button
                                    class="text-sm"
                                    (click)="download['expanded'] = !download['expanded']">
                                    <mat-icon class="text-sm">
                                        {{ download['expanded'] ? 'expand_less' : 'expand_more' }}
                                    </mat-icon>
                                    {{ download['expanded'] ? 'Hide' : 'Show' }} Macros
                                </button>

                                <div *ngIf="download['expanded']" class="mt-2 ml-4 text-sm">
                                    <div *ngFor="let macro of download.macros" class="py-1">
                                        <span class="font-mono">{{ macro.name }}</span>
                                        <mat-chip *ngIf="macro.class" class="h-5 text-xs ml-2">
                                            {{ getClassName(macro.class) }}
                                        </mat-chip>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <!-- Actions -->
                        <div class="flex flex-col gap-2 ml-4">
                            <button
                                mat-icon-button
                                color="primary"
                                matTooltip="Download Again"
                                (click)="redownload(download)">
                                <mat-icon>download</mat-icon>
                            </button>

                            <button
                                mat-icon-button
                                color="warn"
                                matTooltip="Delete Record"
                                (click)="deleteRecord(download)">
                                <mat-icon>delete</mat-icon>
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Pagination -->
            <mat-paginator
                *ngIf="!loading && totalCount > 0"
                [length]="totalCount"
                [pageSize]="pageSize"
                [pageIndex]="currentPage - 1"
                [pageSizeOptions]="[10, 20, 50]"
                (page)="onPageChange($event)"
                class="mt-4">
            </mat-paginator>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="onClose()">Close</button>
        </mat-dialog-actions>
    `,
    styles: [`
        mat-dialog-content {
            min-width: 700px;
            max-width: 900px;
            min-height: 400px;
            max-height: 80vh;
        }

        .download-list {
            max-height: 60vh;
            overflow-y: auto;
        }

        .download-item {
            background-color: var(--fuse-bg-card);
        }

        @media (max-width: 768px) {
            mat-dialog-content {
                min-width: 90vw;
            }

            .filters {
                flex-direction: column;
            }
        }
    `]
})
export class DownloadHistoryDialogComponent implements OnInit {
    downloads: MacroDownload[] = [];
    loading = false;
    currentPage = 1;
    pageSize = 20;
    totalCount = 0;

    filterFileType: 'account' | 'character' | null = null;
    filterClass: string | null = null;

    classes = FRONTEND_CLASS_OPTIONS;

    constructor(
        private dialogRef: MatDialogRef<DownloadHistoryDialogComponent>,
        private macroFileService: MacroFileService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadDownloads();
    }

    loadDownloads(): void {
        this.loading = true;

        this.macroFileService.getDownloadHistory(
            this.filterFileType || undefined,
            this.filterClass || undefined,
            this.pageSize,
            this.currentPage
        ).subscribe({
            next: (response) => {
                this.downloads = response.downloads;
                this.totalCount = response.pagination.totalCount;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading downloads:', error);
                this.snackBar.open('Failed to load download history', 'Close', { duration: 3000 });
                this.loading = false;
            }
        });
    }

    applyFilters(): void {
        this.currentPage = 1;
        this.loadDownloads();
    }

    onPageChange(event: PageEvent): void {
        this.currentPage = event.pageIndex + 1;
        this.pageSize = event.pageSize;
        this.loadDownloads();
    }

    redownload(download: MacroDownload): void {
        this.macroFileService.redownloadFile(download.id).subscribe({
            next: (response) => {
                // Download the file
                this.macroFileService.downloadFileFromUrl(
                    response.file.download_url,
                    response.file.file_name
                );

                this.snackBar.open('Download started!', 'Close', { duration: 2000 });

                // Reload the list to update download count
                this.loadDownloads();
            },
            error: (error) => {
                console.error('Redownload error:', error);
                this.snackBar.open('Failed to generate download link', 'Close', { duration: 3000 });
            }
        });
    }

    deleteRecord(download: MacroDownload): void {
        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Download Record',
                message: `Are you sure you want to delete the record for "${download.file_name}"? This will not delete your macros, only the download history record.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed) {
                this.macroFileService.deleteDownloadRecord(download.id).subscribe({
                    next: () => {
                        this.snackBar.open('Download record deleted', 'Close', { duration: 2000 });
                        this.loadDownloads();
                    },
                    error: (error) => {
                        console.error('Delete error:', error);
                        this.snackBar.open('Failed to delete record', 'Close', { duration: 3000 });
                    }
                });
            }
        });
    }

    getClassName(classValue: string): string {
        return formatClassNameForFrontend(classValue);
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

        return date.toLocaleDateString();
    }

    onClose(): void {
        this.dialogRef.close();
    }
}

