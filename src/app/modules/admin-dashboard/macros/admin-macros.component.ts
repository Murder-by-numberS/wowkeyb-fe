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
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatChipsModule } from '@angular/material/chips';

import { AdminService, AdminMacro } from 'app/core/services/admin.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'admin-macros',
    templateUrl: './admin-macros.component.html',
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
        MatSnackBarModule,
        MatTabsModule,
        MatTooltipModule,
        MatChipsModule
    ]
})
export class AdminMacrosComponent implements OnInit {
    macros: AdminMacro[] = [];
    isLoading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalCount = 0;
    perPage = 20;

    // Filters
    searchQuery = '';
    showDeleted = false;
    private searchSubject = new Subject<string>();

    displayedColumns = ['name', 'class', 'user', 'usage', 'status', 'created_at', 'actions'];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadMacros();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery = query;
            this.currentPage = 1;
            this.loadMacros();
        });
    }

    loadMacros(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getMacros({
            page: this.currentPage,
            limit: this.perPage,
            search: this.searchQuery,
            includeDeleted: true,
            onlyDeleted: this.showDeleted
        }).subscribe({
            next: (response) => {
                this.macros = response.macros;
                this.totalPages = response.pagination.total_pages;
                this.totalCount = response.pagination.total_count;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading macros:', err);
                this.error = err.error?.message || 'Failed to load macros';
                this.isLoading = false;
            }
        });
    }

    onSearchInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchSubject.next(query);
    }

    onTabChange(index: number): void {
        this.showDeleted = index === 1;
        this.currentPage = 1;
        this.loadMacros();
    }

    restoreMacro(macro: AdminMacro): void {
        this.adminService.restoreMacro(macro.id).subscribe({
            next: () => {
                macro.is_deleted = false;
                macro.deleted_at = undefined;
                macro.is_active = true;
                this.snackBar.open(`Restored "${macro.name}"`, 'OK', { duration: 3000 });
                this.loadMacros();
            },
            error: (err) => {
                console.error('Error restoring macro:', err);
                this.snackBar.open(err.error?.message || 'Failed to restore', 'OK', { duration: 5000 });
            }
        });
    }

    permanentDelete(macro: AdminMacro): void {
        if (confirm(`Are you sure you want to PERMANENTLY delete "${macro.name}"? This cannot be undone.`)) {
            this.adminService.permanentDeleteMacro(macro.id).subscribe({
                next: () => {
                    this.snackBar.open('Permanently deleted', 'OK', { duration: 3000 });
                    this.loadMacros();
                },
                error: (err) => {
                    console.error('Error deleting macro:', err);
                    this.snackBar.open(err.error?.message || 'Failed to delete', 'OK', { duration: 5000 });
                }
            });
        }
    }

    formatClassName(className: string | null): string {
        if (!className) return 'General';
        if (className === 'deathknight') return 'Death Knight';
        if (className === 'demonhunter') return 'Demon Hunter';
        return className.charAt(0).toUpperCase() + className.slice(1);
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadMacros();
        }
    }
}
