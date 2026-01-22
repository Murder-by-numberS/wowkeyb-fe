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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, AdminUser } from 'app/core/services/admin.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'admin-users',
    templateUrl: './admin-users.component.html',
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
        MatDialogModule,
        MatChipsModule,
        MatTooltipModule
    ]
})
export class AdminUsersComponent implements OnInit {
    users: AdminUser[] = [];
    isLoading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalCount = 0;
    perPage = 20;

    // Search
    searchQuery = '';
    private searchSubject = new Subject<string>();

    // Display columns
    displayedColumns = ['username', 'email', 'access_level', 'confirmed', 'created_at', 'actions'];

    // Access level options
    accessLevels = [
        { value: 1, label: 'User' },
        { value: 5, label: 'Moderator' },
        { value: 9, label: 'Admin' }
    ];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog
    ) {}

    ngOnInit(): void {
        this.loadUsers();

        // Setup search debounce
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery = query;
            this.currentPage = 1;
            this.loadUsers();
        });
    }

    loadUsers(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getUsers({
            page: this.currentPage,
            limit: this.perPage,
            search: this.searchQuery
        }).subscribe({
            next: (response) => {
                this.users = response.users;
                this.totalPages = response.pagination.total_pages;
                this.totalCount = response.pagination.total_count;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.error = err.error?.message || 'Failed to load users';
                this.isLoading = false;
            }
        });
    }

    onSearchInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchSubject.next(query);
    }

    updateAccessLevel(user: AdminUser, newLevel: number): void {
        this.adminService.updateUserAccessLevel(user.id, newLevel).subscribe({
            next: (response) => {
                user.access_level = newLevel;
                this.snackBar.open(`Updated ${user.username}'s access level`, 'OK', { duration: 3000 });
            },
            error: (err) => {
                console.error('Error updating access level:', err);
                this.snackBar.open(err.error?.message || 'Failed to update access level', 'OK', { duration: 5000 });
            }
        });
    }

    getAccessLevelLabel(level: number): string {
        if (level >= 9) return 'Admin';
        if (level >= 5) return 'Moderator';
        return 'User';
    }

    getAccessLevelColor(level: number): string {
        if (level >= 9) return 'bg-red-100 text-red-800';
        if (level >= 5) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadUsers();
        }
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }
}
