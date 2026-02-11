import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { AdminService, KeybindingVersionInfo, KeybindingVersionsResponse } from 'app/core/services/admin.service';

export interface DeleteVersionsDialogData {
    keybindingId: string;
    keybindingName: string;
}

export interface DeleteVersionsDialogResult {
    confirmed: boolean;
    selectedVersionIds?: string[];
}

@Component({
    selector: 'delete-versions-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatCheckboxModule,
        MatIconModule,
        MatProgressSpinnerModule,
        MatDividerModule
    ],
    template: `
        <div class="p-6 max-w-lg">
            <div class="flex items-center gap-3 mb-4">
                <div class="p-2 bg-red-100 rounded-full">
                    <mat-icon class="text-red-600">delete_forever</mat-icon>
                </div>
                <h2 class="text-xl font-semibold text-gray-800">Delete Keybinding Versions</h2>
            </div>

            @if (isLoading) {
                <div class="flex items-center justify-center py-8">
                    <mat-spinner diameter="40"></mat-spinner>
                </div>
            } @else if (error) {
                <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                    <div class="flex items-center gap-2 text-red-600">
                        <mat-icon>error</mat-icon>
                        <span>{{ error }}</span>
                    </div>
                </div>
            } @else {
                <div class="mb-4">
                    <p class="text-gray-600 dark:text-gray-400 mb-2">
                        Select which versions of <strong>"{{ keybindingInfo?.name }}"</strong> you want to permanently delete:
                    </p>
                </div>

                <!-- Version List -->
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg divide-y divide-gray-200 dark:divide-gray-700 max-h-64 overflow-y-auto mb-4">
                    @for (version of versions; track version.keybinding_id) {
                        <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-3"
                             [ngClass]="{'bg-red-50 dark:bg-red-900/20': version.is_deleted}">
                            <mat-checkbox
                                [(ngModel)]="selectedVersions[version.keybinding_id]"
                                (change)="onVersionToggle()">
                            </mat-checkbox>
                            <div class="flex-1">
                                <div class="flex items-center gap-2">
                                    <span class="font-medium">Version {{ version.game_version }}</span>
                                    @if (version.is_current) {
                                        <span class="px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 text-xs rounded-full">Current</span>
                                    }
                                    @if (version.is_deleted) {
                                        <span class="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400 text-xs rounded-full">Deleted</span>
                                    }
                                </div>
                                <div class="text-sm text-gray-500 dark:text-gray-400">
                                    {{ version.keybind_count }} keybinds
                                </div>
                            </div>
                        </div>
                    }
                </div>

                <!-- Selection Summary -->
                @if (selectedCount > 0) {
                    <div class="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
                        <div class="flex items-start gap-3">
                            <mat-icon class="text-amber-600 mt-0.5">warning</mat-icon>
                            <div>
                                <p class="font-medium text-amber-800 mb-1">
                                    You are about to permanently delete {{ selectedCount }} version(s):
                                </p>
                                <ul class="text-sm text-amber-700 list-disc list-inside">
                                    @for (version of getSelectedVersions(); track version.keybinding_id) {
                                        <li>Version {{ version.game_version }} ({{ version.keybind_count }} keybinds)</li>
                                    }
                                </ul>
                            </div>
                        </div>
                    </div>
                }

                <!-- Restoration Notice -->
                <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div class="flex items-start gap-3">
                        <mat-icon class="text-blue-600 mt-0.5">info</mat-icon>
                        <div class="text-sm text-blue-800">
                            <p class="font-medium mb-1">Made a mistake?</p>
                            <p>
                                If you accidentally delete something, you can request restoration by submitting a
                                support ticket. Please include the keybinding name and version(s) you need restored.
                            </p>
                        </div>
                    </div>
                </div>

                <mat-divider class="my-4"></mat-divider>

                <!-- Actions -->
                <div class="flex justify-end gap-3">
                    <button type="button" mat-stroked-button (click)="onCancel()">
                        Cancel
                    </button>
                    <button type="button" mat-flat-button color="warn"
                            [disabled]="selectedCount === 0 || isDeleting"
                            (click)="onConfirm()">
                        @if (isDeleting) {
                            <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                        }
                        Delete {{ selectedCount }} Version(s)
                    </button>
                </div>
            }
        </div>
    `
})
export class DeleteVersionsDialogComponent implements OnInit {
    isLoading = true;
    isDeleting = false;
    error: string | null = null;

    keybindingInfo: KeybindingVersionsResponse['keybinding'] | null = null;
    versions: KeybindingVersionInfo[] = [];
    selectedVersions: { [key: string]: boolean } = {};
    selectedCount = 0;

    constructor(
        public dialogRef: MatDialogRef<DeleteVersionsDialogComponent, DeleteVersionsDialogResult>,
        @Inject(MAT_DIALOG_DATA) public data: DeleteVersionsDialogData,
        private adminService: AdminService
    ) { }

    ngOnInit(): void {
        this.loadVersions();
    }

    loadVersions(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getKeybindingVersions(this.data.keybindingId).subscribe({
            next: (response) => {
                this.keybindingInfo = response.keybinding;
                this.versions = response.versions;

                // Pre-select the current version
                this.selectedVersions = {};
                for (const version of this.versions) {
                    if (version.is_current) {
                        this.selectedVersions[version.keybinding_id] = true;
                    } else {
                        this.selectedVersions[version.keybinding_id] = false;
                    }
                }
                this.updateSelectedCount();
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading keybinding versions:', err);
                this.error = err.error?.message || 'Failed to load keybinding versions';
                this.isLoading = false;
            }
        });
    }

    onVersionToggle(): void {
        this.updateSelectedCount();
    }

    updateSelectedCount(): void {
        this.selectedCount = Object.values(this.selectedVersions).filter(v => v).length;
    }

    getSelectedVersions(): KeybindingVersionInfo[] {
        return this.versions.filter(v => this.selectedVersions[v.keybinding_id]);
    }

    getSelectedVersionIds(): string[] {
        return Object.entries(this.selectedVersions)
            .filter(([_, selected]) => selected)
            .map(([id]) => id);
    }

    onCancel(): void {
        this.dialogRef.close({ confirmed: false });
    }

    onConfirm(): void {
        const selectedIds = this.getSelectedVersionIds();
        if (selectedIds.length === 0) return;

        this.isDeleting = true;

        this.adminService.batchDeleteKeybindings(selectedIds).subscribe({
            next: () => {
                this.dialogRef.close({
                    confirmed: true,
                    selectedVersionIds: selectedIds
                });
            },
            error: (err) => {
                console.error('Error deleting keybindings:', err);
                this.error = err.error?.message || 'Failed to delete keybindings';
                this.isDeleting = false;
            }
        });
    }
}
