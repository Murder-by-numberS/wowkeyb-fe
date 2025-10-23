import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatInputModule } from '@angular/material/input';
import { fullClasses } from 'app/core/data/classes';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';
import { Ability } from 'app/core/types/ability';
import { formatString } from 'app/core/util/util';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

export interface AbilitySelection {
    ability: Ability | null;
    class: string | null;
    spec: string | null;
    heroTalent: string | null;
}

@Component({
    selector: 'app-ability-picker',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatSelectModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatInputModule
    ],
    templateUrl: './ability-picker.component.html'
})
export class AbilityPickerComponent implements OnInit {
    @Input() selectedAbility: AbilitySelection | null = null;
    @Input() placeholder: string = 'Click to configure ability selection...';
    @Output() abilitySelected = new EventEmitter<AbilitySelection>();
    @Output() abilityCleared = new EventEmitter<void>();

    showDialog = false;
    isLoadingAbilities = false;

    // Form properties
    selectedClass = '';
    selectedSpec = '';
    selectedHeroTalent = '';
    searchQuery = '';

    // Selected ability
    selectedAbilityItem: Ability | null = null;

    // Abilities list
    abilities: Ability[] = [];
    filteredAbilities: Ability[] = [];

    // Debounce subject for search
    private searchSubject = new Subject<string>();

    // Dropdown options
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
    latestGameVersion: string = '11.0.7'; // Default fallback

    constructor(
        private abilitiesService: AbilitiesService,
        private versionCompareService: VersionCompareService
    ) {
        // Set up debounced search
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(searchQuery => {
            this.performSearch(searchQuery);
        });
    }

    ngOnInit(): void {
        // Fetch the latest game version
        this.versionCompareService.getLatestVersion().subscribe({
            next: (version) => {
                this.latestGameVersion = version;
                // Load initial abilities for search
                this.loadAllAbilities();
            },
            error: (err) => {
                console.error('Error fetching latest version, using fallback:', err);
                // Still load abilities even if version fetch fails
                this.loadAllAbilities();
            }
        });

        // Initialize form with selected ability if provided
        if (this.selectedAbility) {
            this.selectedClass = this.selectedAbility.class || '';
            this.selectedSpec = this.selectedAbility.spec || '';
            this.selectedHeroTalent = this.selectedAbility.heroTalent || '';
            this.selectedAbilityItem = this.selectedAbility.ability || null;
            this.updateDropdowns();
        }
    }

    openAbilityPicker() {
        this.showDialog = true;
        // If no abilities loaded yet, load all abilities for search
        if (this.abilities.length === 0) {
            this.loadAllAbilities();
        }
    }

    closeDialog() {
        this.showDialog = false;
    }

    onBackdropClick(event: Event) {
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }

    onClassChange() {
        // Clear spec and hero talent when class changes
        this.selectedSpec = '';
        this.selectedHeroTalent = '';
        this.selectedAbilityItem = null;

        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                this.specs = Object.keys(classData.specs);
            } else {
                console.warn(`No specs found for class: ${this.selectedClass}`);
                this.specs = [];
            }
            // Fetch abilities for the selected class
            this.fetchAbilities();
        } else {
            this.specs = [];
            this.abilities = [];
            this.filteredAbilities = [];
        }
        this.heroTalents = [];
    }

    onSpecChange() {
        // Clear hero talent when spec changes
        this.selectedHeroTalent = '';
        this.selectedAbilityItem = null;

        if (this.selectedClass && this.selectedSpec) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs && classData.specs[this.selectedSpec]) {
                this.heroTalents = classData.specs[this.selectedSpec];
            } else {
                console.warn(`No hero talents found for class: ${this.selectedClass}, spec: ${this.selectedSpec}`);
                this.heroTalents = [];
            }
            // Fetch abilities for the selected class and spec
            this.fetchAbilities();
        } else {
            this.heroTalents = [];
        }
    }

    onHeroTalentChange() {
        this.selectedAbilityItem = null;
        // Fetch abilities for the selected class, spec, and hero talent
        if (this.selectedClass) {
            this.fetchAbilities();
        }
    }

    onSearchChange() {
        // Trigger debounced search
        this.searchSubject.next(this.searchQuery);
    }

    fetchAbilities() {
        if (!this.selectedClass) {
            this.abilities = [];
            this.filteredAbilities = [];
            return;
        }

        this.isLoadingAbilities = true;

        const filters: any = {
            class: this.selectedClass,
            gameVersion: this.latestGameVersion,
            filterMode: 'inclusion',
            limit: 100 // Backend maximum limit
        };

        if (this.selectedSpec) {
            filters.spec = this.selectedSpec.toLowerCase();
        }

        if (this.selectedHeroTalent) {
            // Convert from frontend format to backend format
            filters.heroTalent = this.convertHeroTalentToBackendFormat(this.selectedHeroTalent);
        }

        // Add search query if present (only for single class searches)
        if (this.searchQuery && this.searchQuery.length >= 2) {
            filters.columnName = this.searchQuery; // Search by ability name
            filters.filterMode = 'inclusion';
        }

        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                let abilities = data;
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    abilities = data.abilities || data.data || [];
                }
                this.abilities = abilities;
                this.filterAbilities();
                this.isLoadingAbilities = false;
            },
            error: (err) => {
                console.error('Error loading abilities:', err);
                this.abilities = [];
                this.filteredAbilities = [];
                this.isLoadingAbilities = false;
            }
        });
    }

    filterAbilities() {
        if (!this.searchQuery) {
            this.filteredAbilities = this.abilities;
        } else {
            const query = this.searchQuery.toLowerCase();
            this.filteredAbilities = this.abilities.filter(ability =>
                ability.name.toLowerCase().includes(query) ||
                ability.description?.toLowerCase().includes(query)
            );
        }
    }

    loadAllAbilities() {
        // Don't load all abilities initially - wait for user to select a class or search
        // This prevents the 400 error from the backend which requires at least a class parameter
        this.abilities = [];
        this.filteredAbilities = [];
        this.isLoadingAbilities = false;
    }

    performSearch(searchQuery: string) {
        if (searchQuery && searchQuery.length >= 2) {
            // If user has selected a class, search within that class with filters
            if (this.selectedClass) {
                this.fetchAbilities();
            } else {
                // If no class selected, try to search across all classes
                this.searchAllAbilities();
            }
        } else {
            // Clear search results if query is too short
            this.filterAbilities();
        }
    }

    searchAllAbilities() {
        this.isLoadingAbilities = true;
        this.abilities = [];
        this.filteredAbilities = [];

        // Search across all classes with just gameVersion and columnName filter
        const filters: any = {
            gameVersion: this.latestGameVersion,
            columnName: this.searchQuery,
            filterMode: 'inclusion',
            limit: 100
        };

        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                let abilities = data;
                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    abilities = data.abilities || data.data || [];
                }
                this.abilities = abilities;
                this.filterAbilities();
                this.isLoadingAbilities = false;
            },
            error: (err) => {
                console.error('Error searching all abilities:', err);
                this.abilities = [];
                this.filteredAbilities = [];
                this.isLoadingAbilities = false;
            }
        });
    }

    selectAbility(ability: Ability) {
        console.log('selectAbility called with:', ability);
        this.selectedAbilityItem = ability;

        // Auto-populate dropdowns based on the selected ability's actual categorization
        if (ability.class) {
            this.selectedClass = ability.class.toLowerCase();
        }

        // Handle different ability types:
        // - Class abilities: only set class, clear spec and hero talent
        // - Spec abilities: set class and spec, clear hero talent
        // - Hero talent abilities: set class and hero talent (NOT spec, since hero talents can belong to multiple specs)

        if (ability.abilityType === 'spec' && ability.spec) {
            // Spec abilities: populate spec and clear hero talent
            this.selectedSpec = this.capitalizeSpec(ability.spec);
            this.selectedHeroTalent = '';
        } else if (ability.abilityType === 'hero_talent' && ability.heroTalent) {
            // Hero talent abilities: populate hero talent but NOT spec
            // Hero talents can belong to multiple specs, so don't auto-select one
            // Clear spec so the dropdown will show filtered specs
            this.selectedSpec = '';
            // Convert backend format to frontend format for the dropdown
            this.selectedHeroTalent = this.convertHeroTalentFormat(ability.heroTalent);
            console.log('Set hero talent to:', this.selectedHeroTalent);
        } else {
            // For class abilities, clear both spec and hero talent
            this.selectedSpec = '';
            this.selectedHeroTalent = '';
        }

        // Update dropdowns after setting all values
        console.log('Before updateDropdowns - class:', this.selectedClass, 'spec:', this.selectedSpec, 'heroTalent:', this.selectedHeroTalent);
        this.updateDropdowns();
        console.log('After updateDropdowns - specs:', this.specs, 'heroTalents:', this.heroTalents);
    }

    isAbilitySelected(ability: Ability): boolean {
        return this.selectedAbilityItem?.spellId === ability.spellId;
    }

    confirmSelection() {
        if (!this.selectedAbilityItem) {
            return;
        }

        const abilitySelection: AbilitySelection = {
            ability: this.selectedAbilityItem,
            class: this.selectedClass || null,
            spec: this.selectedSpec || null,
            heroTalent: this.selectedHeroTalent || null
        };

        this.abilitySelected.emit(abilitySelection);
        this.closeDialog();
    }

    clearSelection() {
        this.selectedClass = '';
        this.selectedSpec = '';
        this.selectedHeroTalent = '';
        this.selectedAbilityItem = null;
        this.specs = [];
        this.heroTalents = [];
        this.abilities = [];
        this.filteredAbilities = [];
        this.searchQuery = '';
        this.abilityCleared.emit();
    }

    cancelSelection() {
        // Reset to original values
        if (this.selectedAbility) {
            this.selectedClass = this.selectedAbility.class || '';
            this.selectedSpec = this.selectedAbility.spec || '';
            this.selectedHeroTalent = this.selectedAbility.heroTalent || '';
            this.selectedAbilityItem = this.selectedAbility.ability || null;
            this.updateDropdowns();
        } else {
            this.selectedClass = '';
            this.selectedSpec = '';
            this.selectedHeroTalent = '';
            this.selectedAbilityItem = null;
            this.specs = [];
            this.heroTalents = [];
            this.abilities = [];
            this.filteredAbilities = [];
            this.searchQuery = '';
        }
        this.closeDialog();
    }

    private convertHeroTalentFormat(heroTalent: string): string {
        // Convert from backend format "herald-of-the-sun" to frontend format "Herald of the Sun"
        // Handle title case properly (capitalize first letter of each word, but keep "of", "the", etc. lowercase)
        const titleCaseWords = ['of', 'the', 'and', 'or', 'in', 'on', 'at', 'to', 'for', 'with', 'by'];

        return heroTalent
            .split('-')
            .map((word, index) => {
                const lowerWord = word.toLowerCase();
                // Always capitalize first word, otherwise use title case rules
                if (index === 0 || !titleCaseWords.includes(lowerWord)) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                } else {
                    return lowerWord;
                }
            })
            .join(' ');
    }

    private convertHeroTalentToBackendFormat(heroTalent: string): string {
        // Convert from frontend format "Herald of the Sun" to backend format "herald-of-the-sun"
        return heroTalent.toLowerCase().replace(/\s+/g, '-');
    }

    private capitalizeSpec(spec: string): string {
        // Convert from backend format "holy" to frontend format "Holy"
        return spec.charAt(0).toUpperCase() + spec.slice(1);
    }

    private updateDropdowns() {
        console.log('updateDropdowns called with:', {
            selectedClass: this.selectedClass,
            selectedSpec: this.selectedSpec,
            selectedHeroTalent: this.selectedHeroTalent
        });

        // Update specs based on selected class
        if (this.selectedClass) {
            console.log('Looking for class:', this.selectedClass);
            console.log('Available classes:', Object.keys(fullClasses));
            const classData = fullClasses[this.selectedClass];
            console.log('Class data for', this.selectedClass, ':', classData);

            if (classData && classData.specs) {
                let allSpecs = Object.keys(classData.specs);
                console.log('All specs for class:', allSpecs);

                // If a spec ability is selected, only show that spec
                if (this.selectedAbilityItem && this.selectedAbilityItem.abilityType === 'spec' && this.selectedAbilityItem.spec) {
                    this.specs = [this.capitalizeSpec(this.selectedAbilityItem.spec)];
                    console.log('Filtered specs to selected ability spec:', this.specs);
                }
                // If a hero talent is selected but no spec, filter specs to only show those that have the hero talent
                else if (this.selectedHeroTalent && !this.selectedSpec) {
                    // Hero talent is already in frontend format, no conversion needed
                    console.log('Using hero talent directly:', this.selectedHeroTalent);

                    this.specs = allSpecs.filter(specName => {
                        const heroTalentsForSpec = classData.specs[specName];
                        const hasHeroTalent = Array.isArray(heroTalentsForSpec) && heroTalentsForSpec.includes(this.selectedHeroTalent);
                        console.log('Spec', specName, 'has hero talents:', heroTalentsForSpec, 'includes', this.selectedHeroTalent, '?', hasHeroTalent);
                        return hasHeroTalent;
                    });
                    console.log('Filtered specs:', this.specs);
                } else {
                    // Otherwise show all specs
                    this.specs = allSpecs;
                    console.log('Showing all specs:', this.specs);
                }
            } else {
                this.specs = [];
                console.log('No class data or specs found');
            }
        } else {
            this.specs = [];
            console.log('No class selected');
        }

        // Update hero talents based on selected spec OR if hero talent is already selected
        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];

            if (this.selectedSpec && classData?.specs?.[this.selectedSpec]) {
                // If spec is selected, show hero talents for that spec
                this.heroTalents = classData.specs[this.selectedSpec];
                console.log('Hero talents for spec', this.selectedSpec, ':', this.heroTalents);
            } else if (this.selectedHeroTalent && classData?.specs) {
                // If hero talent is selected but no spec, show only that hero talent
                // This ensures the hero talent dropdown shows the selected value
                // Hero talent is already in frontend format, no conversion needed
                console.log('Using hero talent directly for dropdown:', this.selectedHeroTalent);

                // Show only the selected hero talent in the dropdown
                this.heroTalents = [this.selectedHeroTalent];
                console.log('Hero talents list set to selected value:', this.heroTalents);
            } else {
                this.heroTalents = [];
                console.log('No hero talent selected or no class data');
            }
        } else {
            this.heroTalents = [];
            console.log('No class selected for hero talents');
        }

        console.log('Final state - specs:', this.specs, 'heroTalents:', this.heroTalents);
    }

    getDisplayText(): string {
        if (!this.selectedAbility || !this.selectedAbility.ability) {
            return 'No ability selected';
        }

        return this.selectedAbility.ability.name;
    }

    hasSelection(): boolean {
        return !!(this.selectedAbility?.ability);
    }

    isSpecDisabled(): boolean {
        // Disable spec dropdown if:
        // 1. No class is selected, OR
        // 2. An ability is selected and it's a hero talent (hero talents span multiple specs)
        if (!this.selectedClass) {
            return true;
        }
        if (this.selectedAbilityItem && this.selectedAbilityItem.abilityType === 'hero_talent') {
            return true;
        }
        return false;
    }

    isHeroTalentDisabled(): boolean {
        // Disable hero talent dropdown if:
        // 1. No class is selected, OR
        // 2. An ability is selected and it's NOT a hero talent ability
        if (!this.selectedClass) {
            return true;
        }
        if (this.selectedAbilityItem && this.selectedAbilityItem.abilityType !== 'hero_talent') {
            return true;
        }
        return false;
    }
}
