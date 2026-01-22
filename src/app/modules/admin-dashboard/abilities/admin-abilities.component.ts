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
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, AdminAbility } from 'app/core/services/admin.service';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
    selector: 'admin-abilities',
    templateUrl: './admin-abilities.component.html',
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
        MatSlideToggleModule,
        MatTooltipModule
    ]
})
export class AdminAbilitiesComponent implements OnInit {
    abilities: AdminAbility[] = [];
    isLoading = true;
    error: string | null = null;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalCount = 0;
    perPage = 50;

    // Filters
    searchQuery = '';
    selectedClass = '';
    private searchSubject = new Subject<string>();

    classes = [
        'deathknight', 'demonhunter', 'druid', 'evoker', 'hunter',
        'mage', 'monk', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'
    ];

    displayedColumns = ['icon', 'name', 'class', 'spec', 'ability_type', 'is_active', 'actions'];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadAbilities();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery = query;
            this.currentPage = 1;
            this.loadAbilities();
        });
    }

    loadAbilities(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getAbilities({
            page: this.currentPage,
            limit: this.perPage,
            search: this.searchQuery,
            class: this.selectedClass,
            includeInactive: true
        }).subscribe({
            next: (response) => {
                this.abilities = response.abilities;
                this.totalPages = response.pagination.total_pages;
                this.totalCount = response.pagination.total_count;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading abilities:', err);
                this.error = err.error?.message || 'Failed to load abilities';
                this.isLoading = false;
            }
        });
    }

    onSearchInput(event: Event): void {
        const query = (event.target as HTMLInputElement).value;
        this.searchSubject.next(query);
    }

    onClassChange(classValue: string): void {
        this.selectedClass = classValue;
        this.currentPage = 1;
        this.loadAbilities();
    }

    toggleActive(ability: AdminAbility): void {
        this.adminService.toggleAbilityActive(ability.id).subscribe({
            next: (response) => {
                ability.is_active = !ability.is_active;
                this.snackBar.open(
                    `${ability.name} ${ability.is_active ? 'activated' : 'deactivated'}`,
                    'OK',
                    { duration: 3000 }
                );
            },
            error: (err) => {
                console.error('Error toggling ability:', err);
                this.snackBar.open(err.error?.message || 'Failed to update ability', 'OK', { duration: 5000 });
            }
        });
    }

    formatClassName(className: string): string {
        if (className === 'deathknight') return 'Death Knight';
        if (className === 'demonhunter') return 'Demon Hunter';
        return className.charAt(0).toUpperCase() + className.slice(1);
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAbilities();
        }
    }
}
