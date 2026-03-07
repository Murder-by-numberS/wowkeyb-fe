import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
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
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

import { AdminService, AdminMacro } from 'app/core/services/admin.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { formatClassNameForFrontend } from 'app/core/utils/class-name-utils';

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
        MatChipsModule,
        MatDatepickerModule,
        MatNativeDateModule
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
    selectedDateRange = '';
    customStartDate: Date | null = null;
    customEndDate: Date | null = null;
    private searchSubject = new Subject<string>();

    dateRangeOptions = [
        { value: '', label: 'All time' },
        { value: '7', label: 'Last 7 days' },
        { value: '30', label: 'Last 30 days' },
        { value: '90', label: 'Last 90 days' },
        { value: '180', label: 'Last 6 months' },
        { value: '365', label: 'Last year' },
        { value: 'custom', label: 'Custom range' }
    ];

    displayedColumns = ['name', 'class', 'user', 'usage', 'status', 'created_at', 'actions'];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar,
        private router: Router
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

        const dateRange = this.getDateRange();
        
        this.adminService.getMacros({
            page: this.currentPage,
            limit: this.perPage,
            search: this.searchQuery,
            includeDeleted: true,
            onlyDeleted: this.showDeleted,
            startDate: dateRange.startDate,
            endDate: dateRange.endDate
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
        return formatClassNameForFrontend(className);
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

    viewMacro(macro: AdminMacro): void {
        this.router.navigate(['/macros', macro.id]);
    }

    onDateRangeChange(): void {
        this.currentPage = 1;
        // Only reload if not custom (custom waits for date selection)
        if (this.selectedDateRange !== 'custom') {
            this.customStartDate = null;
            this.customEndDate = null;
            this.loadMacros();
        }
    }

    onCustomDateChange(): void {
        // Only reload if both dates are selected
        if (this.customStartDate && this.customEndDate) {
            this.currentPage = 1;
            this.loadMacros();
        }
    }

    private getDateRange(): { startDate?: string; endDate?: string } {
        if (!this.selectedDateRange) {
            return {};
        }

        if (this.selectedDateRange === 'custom') {
            if (this.customStartDate && this.customEndDate) {
                return {
                    startDate: this.customStartDate.toISOString().split('T')[0],
                    endDate: this.customEndDate.toISOString().split('T')[0]
                };
            }
            return {};
        }

        const days = parseInt(this.selectedDateRange);
        const endDate = new Date();
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        return {
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0]
        };
    }

    isCustomRange(): boolean {
        return this.selectedDateRange === 'custom';
    }
}
