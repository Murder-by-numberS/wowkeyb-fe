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
    selectedSpec = '';
    selectedAbilityType = '';
    selectedVersion = '';
    filtersExpanded = false;
    private searchSubject = new Subject<string>();

    // Filter options
    classes = [
        'deathknight', 'demonhunter', 'druid', 'evoker', 'hunter',
        'mage', 'monk', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior'
    ];

    abilityTypes = ['class', 'spec', 'hero_talent'];

    versions: string[] = [];

    displayedColumns = ['icon', 'name', 'class', 'spec', 'ability_type', 'version', 'actions'];

    constructor(private adminService: AdminService) {}

    ngOnInit(): void {
        this.loadVersions();
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

    loadVersions(): void {
        this.adminService.getVersions().subscribe({
            next: (response) => {
                this.versions = response.versions.map(v => v.game_version);
            },
            error: (err) => {
                console.error('Error loading versions:', err);
            }
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
            spec: this.selectedSpec,
            ability_type: this.selectedAbilityType,
            version: this.selectedVersion,
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

    onSpecChange(specValue: string): void {
        this.selectedSpec = specValue;
        this.currentPage = 1;
        this.loadAbilities();
    }

    onAbilityTypeChange(typeValue: string): void {
        this.selectedAbilityType = typeValue;
        this.currentPage = 1;
        this.loadAbilities();
    }

    onVersionChange(versionValue: string): void {
        this.selectedVersion = versionValue;
        this.currentPage = 1;
        this.loadAbilities();
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedClass || this.selectedSpec || this.selectedAbilityType || this.selectedVersion || this.searchQuery);
    }

    clearAllFilters(): void {
        this.selectedClass = '';
        this.selectedSpec = '';
        this.selectedAbilityType = '';
        this.selectedVersion = '';
        this.searchQuery = '';
        this.currentPage = 1;
        this.loadAbilities();
    }

    formatClassName(className: string): string {
        if (!className) return '-';
        if (className === 'deathknight') return 'Death Knight';
        if (className === 'demonhunter') return 'Demon Hunter';
        return className.charAt(0).toUpperCase() + className.slice(1);
    }

    formatAbilityType(type: string): string {
        if (!type) return '-';
        return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadAbilities();
        }
    }
}
