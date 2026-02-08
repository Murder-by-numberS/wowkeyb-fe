import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdminService, AdminVersion } from 'app/core/services/admin.service';

@Component({
    selector: 'admin-versions',
    templateUrl: './admin-versions.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatTableModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        MatDialogModule,
        MatSnackBarModule
    ]
})
export class AdminVersionsComponent implements OnInit {
    versions: AdminVersion[] = [];
    isLoading = true;
    error: string | null = null;

    // New version form
    newVersion = '';
    isCreating = false;

    // Copy abilities
    selectedSourceVersion: AdminVersion | null = null;
    selectedTargetVersion: AdminVersion | null = null;
    isCopying = false;

    displayedColumns = ['version', 'abilities', 'created', 'actions'];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadVersions();
    }

    loadVersions(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getVersions().subscribe({
            next: (response) => {
                this.versions = response.versions;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading versions:', err);
                this.error = err.error?.message || 'Failed to load versions';
                this.isLoading = false;
            }
        });
    }

    createVersion(): void {
        if (!this.newVersion.trim()) {
            this.snackBar.open('Please enter a version number', 'OK', { duration: 3000 });
            return;
        }

        this.isCreating = true;

        this.adminService.createVersion(this.newVersion.trim()).subscribe({
            next: (response) => {
                this.snackBar.open(response.message, 'OK', { duration: 3000 });
                this.newVersion = '';
                this.isCreating = false;
                this.loadVersions();
            },
            error: (err) => {
                console.error('Error creating version:', err);
                this.snackBar.open(err.error?.message || 'Failed to create version', 'OK', { duration: 5000 });
                this.isCreating = false;
            }
        });
    }

    copyAbilities(): void {
        if (!this.selectedSourceVersion || !this.selectedTargetVersion) {
            this.snackBar.open('Please select both source and target versions', 'OK', { duration: 3000 });
            return;
        }

        if (this.selectedSourceVersion.id === this.selectedTargetVersion.id) {
            this.snackBar.open('Source and target versions must be different', 'OK', { duration: 3000 });
            return;
        }

        this.isCopying = true;

        this.adminService.copyAbilitiesFromVersion(
            this.selectedSourceVersion.id,
            this.selectedTargetVersion.id
        ).subscribe({
            next: (response) => {
                this.snackBar.open(
                    `Copied ${response.copied_count} abilities from ${response.source_version} to ${response.target_version}`,
                    'OK',
                    { duration: 5000 }
                );
                this.selectedSourceVersion = null;
                this.selectedTargetVersion = null;
                this.isCopying = false;
                this.loadVersions();
            },
            error: (err) => {
                console.error('Error copying abilities:', err);
                this.snackBar.open(err.error?.message || 'Failed to copy abilities', 'OK', { duration: 5000 });
                this.isCopying = false;
            }
        });
    }

    deleteVersion(version: AdminVersion): void {
        if (version.ability_count > 0) {
            this.snackBar.open(
                `Cannot delete version with ${version.ability_count} abilities`,
                'OK',
                { duration: 3000 }
            );
            return;
        }

        if (!confirm(`Are you sure you want to delete version ${version.game_version}?`)) {
            return;
        }

        this.adminService.deleteVersion(version.id).subscribe({
            next: (response) => {
                this.snackBar.open(response.message, 'OK', { duration: 3000 });
                this.loadVersions();
            },
            error: (err) => {
                console.error('Error deleting version:', err);
                this.snackBar.open(err.error?.message || 'Failed to delete version', 'OK', { duration: 5000 });
            }
        });
    }

    getVersionsWithAbilities(): AdminVersion[] {
        return this.versions.filter(v => v.ability_count > 0);
    }

    getVersionsWithoutAbilities(): AdminVersion[] {
        return this.versions.filter(v => v.ability_count === 0);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
