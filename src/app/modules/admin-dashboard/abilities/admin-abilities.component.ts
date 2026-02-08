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
import { MatSortModule, Sort } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

import { AdminService, AdminAbility } from 'app/core/services/admin.service';
import { AdminEditAbilityDialogComponent } from './edit-ability-dialog/edit-ability-dialog.component';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { fullClasses } from 'app/core/data/classes';

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
        MatTooltipModule,
        MatSortModule,
        MatDialogModule
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
    selectedHeroTalent = '';
    selectedAbilityType = '';
    selectedVersion = '';
    filtersExpanded = false;
    private searchSubject = new Subject<string>();

    // Sorting
    sortField = 'name';
    sortDirection: 'asc' | 'desc' = 'asc';

    // Filter options
    classes = [
        { value: 'deathknight', label: 'Death Knight' },
        { value: 'demonhunter', label: 'Demon Hunter' },
        { value: 'druid', label: 'Druid' },
        { value: 'evoker', label: 'Evoker' },
        { value: 'hunter', label: 'Hunter' },
        { value: 'mage', label: 'Mage' },
        { value: 'monk', label: 'Monk' },
        { value: 'paladin', label: 'Paladin' },
        { value: 'priest', label: 'Priest' },
        { value: 'rogue', label: 'Rogue' },
        { value: 'shaman', label: 'Shaman' },
        { value: 'warlock', label: 'Warlock' },
        { value: 'warrior', label: 'Warrior' }
    ];

    specs: string[] = [];
    heroTalents: string[] = [];
    abilityTypes = ['class', 'spec', 'hero_talent'];

    versions: string[] = [];

    // Class data for spec/hero talent lookups
    fullClasses = fullClasses;

    displayedColumns = ['icon', 'name', 'class', 'spec', 'ability_type', 'version', 'actions'];

    constructor(
        private adminService: AdminService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.loadVersionsThenAbilities();

        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(query => {
            this.searchQuery = query;
            this.currentPage = 1;
            this.loadAbilities();
        });
    }

    loadVersionsThenAbilities(): void {
        this.adminService.getVersions().subscribe({
            next: (response) => {
                this.versions = response.versions.map(v => v.game_version);
                // Default to the latest (first) version
                if (this.versions.length > 0 && !this.selectedVersion) {
                    this.selectedVersion = this.versions[0];
                }
                this.loadAbilities();
            },
            error: (err) => {
                console.error('Error loading versions:', err);
                this.loadAbilities();
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
            hero_talent: this.selectedHeroTalent,
            ability_type: this.selectedAbilityType,
            version: this.selectedVersion,
            sort: this.sortField,
            order: this.sortDirection,
            includeInactive: true,
            filterMode: this.selectedClass ? 'inclusion' : 'exact'
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
        this.selectedSpec = '';
        this.selectedHeroTalent = '';
        this.updateSpecsAndHeroTalents();
        this.currentPage = 1;
        this.loadAbilities();
    }

    onSpecChange(specValue: string): void {
        this.selectedSpec = specValue;
        this.selectedHeroTalent = '';
        this.updateHeroTalents();
        this.currentPage = 1;
        this.loadAbilities();
    }

    onHeroTalentChange(heroTalentValue: string): void {
        this.selectedHeroTalent = heroTalentValue;
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

    onSortChange(sort: Sort): void {
        this.sortField = sort.active || 'name';
        this.sortDirection = (sort.direction as 'asc' | 'desc') || 'asc';
        this.currentPage = 1;
        this.loadAbilities();
    }

    updateSpecsAndHeroTalents(): void {
        if (this.selectedClass && this.fullClasses[this.selectedClass]) {
            const classData = this.fullClasses[this.selectedClass];
            this.specs = Object.keys(classData.specs);
            this.heroTalents = [];
        } else {
            this.specs = [];
            this.heroTalents = [];
        }
    }

    updateHeroTalents(): void {
        if (this.selectedClass && this.selectedSpec && this.fullClasses[this.selectedClass]) {
            const classData = this.fullClasses[this.selectedClass];
            // Find the spec (case-insensitive match)
            const specKey = Object.keys(classData.specs).find(
                s => s.toLowerCase() === this.selectedSpec.toLowerCase()
            );
            if (specKey) {
                this.heroTalents = classData.specs[specKey] || [];
            } else {
                this.heroTalents = [];
            }
        } else {
            this.heroTalents = [];
        }
    }

    toggleFilters(): void {
        this.filtersExpanded = !this.filtersExpanded;
    }

    hasActiveFilters(): boolean {
        return !!(this.selectedClass || this.selectedSpec || this.selectedHeroTalent || this.selectedAbilityType || this.selectedVersion || this.searchQuery);
    }

    clearAllFilters(): void {
        this.selectedClass = '';
        this.selectedSpec = '';
        this.selectedHeroTalent = '';
        this.selectedAbilityType = '';
        this.selectedVersion = '';
        this.searchQuery = '';
        this.specs = [];
        this.heroTalents = [];
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

    openEditDialog(ability: AdminAbility): void {
        const dialogRef = this.dialog.open(AdminEditAbilityDialogComponent, {
            width: 'min(640px, 95vw)',
            maxHeight: '90vh',
            data: { ability },
            autoFocus: false
        });
        dialogRef.afterClosed().subscribe((result) => {
            if (result) {
                this.loadAbilities();
            }
        });
    }
}
