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
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

import { AdminService, AdminKeybinding } from 'app/core/services/admin.service';
import { DeleteVersionsDialogComponent, DeleteVersionsDialogResult } from './delete-versions-dialog.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'admin-keybindings',
    templateUrl: './admin-keybindings.component.html',
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
        MatDialogModule
    ]
})
export class AdminKeybindingsComponent implements OnInit {
    keybindings: AdminKeybinding[] = [];
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

    displayedColumns = ['name', 'class', 'version', 'user', 'keybind_count', 'status', 'created_at', 'actions'];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private router: Router
    ) { }

    ngOnInit(): void {
        this.loadKeybindings();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery = query;
            this.currentPage = 1;
            this.loadKeybindings();
        });
    }

    loadKeybindings(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getKeybindings({
            page: this.currentPage,
            limit: this.perPage,
            search: this.searchQuery,
            includeDeleted: true,
            onlyDeleted: this.showDeleted
        }).subscribe({
            next: (response) => {
                this.keybindings = response.keybindings;
                this.totalPages = response.pagination.total_pages;
                this.totalCount = response.pagination.total_count;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading keybindings:', err);
                this.error = err.error?.message || 'Failed to load keybindings';
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
        this.loadKeybindings();
    }

    restoreKeybinding(keybinding: AdminKeybinding, replace: boolean = false): void {
        this.adminService.restoreKeybinding(keybinding.id, replace).subscribe({
            next: () => {
                keybinding.is_deleted = false;
                keybinding.deleted_at = undefined;
                this.snackBar.open(`Restored "${keybinding.name}"`, 'OK', { duration: 3000 });
                this.loadKeybindings();
            },
            error: (err) => {
                console.error('Error restoring keybinding:', err);
                // Handle 409 conflict - version collision
                if (err.status === 409 && err.error?.conflict) {
                    const conflict = err.error.conflict;
                    const confirmReplace = confirm(
                        `A keybinding for version ${conflict.version} already exists:\n\n` +
                        `Existing: "${conflict.existingKeybindingName}"\n` +
                        `Restoring: "${conflict.restoringKeybindingName}"\n\n` +
                        `Do you want to replace the existing keybinding?`
                    );
                    if (confirmReplace) {
                        this.restoreKeybinding(keybinding, true);
                    }
                } else {
                    this.snackBar.open(err.error?.message || 'Failed to restore', 'OK', { duration: 5000 });
                }
            }
        });
    }

    permanentDelete(keybinding: AdminKeybinding): void {
        const dialogRef = this.dialog.open(DeleteVersionsDialogComponent, {
            data: {
                keybindingId: keybinding.id,
                keybindingName: keybinding.name
            },
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result: DeleteVersionsDialogResult | undefined) => {
            if (result?.confirmed) {
                const deletedCount = result.selectedVersionIds?.length || 0;
                this.snackBar.open(
                    `Successfully deleted ${deletedCount} version(s)`,
                    'OK',
                    { duration: 3000 }
                );
                this.loadKeybindings();
            }
        });
    }

    formatClassName(className: string): string {
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
            this.loadKeybindings();
        }
    }

    viewKeybinding(keybinding: AdminKeybinding): void {
        this.router.navigate(['/keybinds', keybinding.id]);
    }
}
