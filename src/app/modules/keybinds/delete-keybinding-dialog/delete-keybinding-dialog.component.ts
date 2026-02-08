import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';

import { KeybindingService } from 'app/core/services/keybinding.service';
import { Keybinding } from 'app/core/types/keybinding';

export interface DeleteKeybindingDialogData {
    keybinding: Keybinding;
}

export interface VersionInfo {
    keybindingId: string;
    versionId: string;
    gameVersion: string;
    isCurrent: boolean;
}

export interface DeleteKeybindingDialogResult {
    confirmed: boolean;
    deletedVersionIds?: string[];
}

@Component({
    selector: 'delete-keybinding-dialog',
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
                    <mat-icon class="text-red-600">delete</mat-icon>
                </div>
                <h2 class="text-xl font-semibold text-gray-800">Delete Keybinding</h2>
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
                <div class="flex justify-end">
                    <button type="button" mat-stroked-button (click)="onCancel()">Close</button>
                </div>
            } @else {
                @if (versions.length > 1) {
                    <!-- Multiple versions - show selection -->
                    <div class="mb-4">
                        <p class="text-gray-600 mb-2">
                            <strong class="text-gray-800">"{{ data.keybinding.name }}"</strong> has multiple versions.
                            Select which versions you want to delete:
                        </p>
                    </div>

                    <!-- Version List -->
                    <div class="border rounded-lg divide-y max-h-64 overflow-y-auto mb-4">
                        @for (version of versions; track version.keybindingId) {
                            <div class="p-3 hover:bg-gray-50 flex items-center gap-3">
                                <mat-checkbox
                                    [(ngModel)]="selectedVersions[version.keybindingId]"
                                    (change)="onVersionToggle()">
                                </mat-checkbox>
                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">Version {{ version.gameVersion }}</span>
                                        @if (version.isCurrent) {
                                            <span class="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">Current</span>
                                        }
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
                                        You are about to delete {{ selectedCount }} version(s):
                                    </p>
                                    <ul class="text-sm text-amber-700 list-disc list-inside">
                                        @for (version of getSelectedVersions(); track version.keybindingId) {
                                            <li>Version {{ version.gameVersion }}</li>
                                        }
                                    </ul>
                                </div>
                            </div>
                        </div>
                    }
                } @else {
                    <!-- Single version - simple confirmation -->
                    <div class="mb-4">
                        <p class="text-gray-600">
                            Are you sure you want to delete <strong class="text-gray-800">"{{ data.keybinding.name }}"</strong>?
                        </p>
                        @if (versions.length === 1) {
                            <p class="text-sm text-gray-500 mt-2">
                                Version: {{ versions[0].gameVersion }}
                            </p>
                        }
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
                                support ticket.
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
                    @if (versions.length > 1) {
                        <button type="button" mat-flat-button color="warn"
                                [disabled]="selectedCount === 0 || isDeleting"
                                (click)="onConfirmMultiple()">
                            @if (isDeleting) {
                                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                            }
                            Delete {{ selectedCount }} Version(s)
                        </button>
                    } @else {
                        <button type="button" mat-flat-button color="warn"
                                [disabled]="isDeleting"
                                (click)="onConfirmSingle()">
                            @if (isDeleting) {
                                <mat-spinner diameter="20" class="mr-2"></mat-spinner>
                            }
                            Delete
                        </button>
                    }
                </div>
            }
        </div>
    `
})
export class DeleteKeybindingDialogComponent implements OnInit {
    isLoading = true;
    isDeleting = false;
    error: string | null = null;

    versions: VersionInfo[] = [];
    selectedVersions: { [key: string]: boolean } = {};
    selectedCount = 0;

    constructor(
        public dialogRef: MatDialogRef<DeleteKeybindingDialogComponent, DeleteKeybindingDialogResult>,
        @Inject(MAT_DIALOG_DATA) public data: DeleteKeybindingDialogData,
        private keybindingService: KeybindingService
    ) { }

    ngOnInit(): void {
        this.loadVersions();
    }

    loadVersions(): void {
        this.isLoading = true;
        this.error = null;

        this.keybindingService.getKeybindingVersions(this.data.keybinding.keybindingId).subscribe({
            next: (response) => {
                this.versions = response.versions;

                // Pre-select the current version
                this.selectedVersions = {};
                for (const version of this.versions) {
                    if (version.isCurrent) {
                        this.selectedVersions[version.keybindingId] = true;
                    } else {
                        this.selectedVersions[version.keybindingId] = false;
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

    getSelectedVersions(): VersionInfo[] {
        return this.versions.filter(v => this.selectedVersions[v.keybindingId]);
    }

    getSelectedVersionIds(): string[] {
        return Object.entries(this.selectedVersions)
            .filter(([_, selected]) => selected)
            .map(([id]) => id);
    }

    onCancel(): void {
        this.dialogRef.close({ confirmed: false });
    }

    onConfirmSingle(): void {
        // For single version, just delete the keybinding
        this.isDeleting = true;

        this.keybindingService.removeKeybinding(this.data.keybinding.keybindingId).subscribe({
            next: () => {
                this.dialogRef.close({
                    confirmed: true,
                    deletedVersionIds: [this.data.keybinding.keybindingId]
                });
            },
            error: (err) => {
                console.error('Error deleting keybinding:', err);
                this.error = err.error?.message || 'Failed to delete keybinding';
                this.isDeleting = false;
            }
        });
    }

    onConfirmMultiple(): void {
        const selectedIds = this.getSelectedVersionIds();
        if (selectedIds.length === 0) return;

        this.isDeleting = true;

        // Delete selected versions one by one
        let deletedCount = 0;
        let errorOccurred = false;

        const deleteNext = (index: number) => {
            if (index >= selectedIds.length || errorOccurred) {
                if (!errorOccurred) {
                    this.dialogRef.close({
                        confirmed: true,
                        deletedVersionIds: selectedIds
                    });
                }
                return;
            }

            this.keybindingService.removeKeybinding(selectedIds[index]).subscribe({
                next: () => {
                    deletedCount++;
                    deleteNext(index + 1);
                },
                error: (err) => {
                    console.error('Error deleting keybinding:', err);
                    errorOccurred = true;
                    this.error = `Deleted ${deletedCount} version(s), but failed on version ${index + 1}: ${err.error?.message || 'Unknown error'}`;
                    this.isDeleting = false;
                }
            });
        };

        deleteNext(0);
    }
}
