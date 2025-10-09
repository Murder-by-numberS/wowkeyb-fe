import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { fullClasses } from 'app/core/data/classes';

export interface AbilitySelection {
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
        MatTooltipModule
    ],
    templateUrl: './ability-picker.component.html'
})
export class AbilityPickerComponent implements OnInit {
    @Input() selectedAbility: AbilitySelection | null = null;
    @Input() placeholder: string = 'Click to configure ability selection...';
    @Output() abilitySelected = new EventEmitter<AbilitySelection>();
    @Output() abilityCleared = new EventEmitter<void>();

    showDialog = false;

    // Form properties
    selectedClass = '';
    selectedSpec = '';
    selectedHeroTalent = '';

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

    ngOnInit(): void {
        // Initialize form with selected ability if provided
        if (this.selectedAbility) {
            this.selectedClass = this.selectedAbility.class || '';
            this.selectedSpec = this.selectedAbility.spec || '';
            this.selectedHeroTalent = this.selectedAbility.heroTalent || '';
            this.updateDropdowns();
        }
    }

    openAbilityPicker() {
        this.showDialog = true;
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

        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                this.specs = Object.keys(classData.specs);
            } else {
                console.warn(`No specs found for class: ${this.selectedClass}`);
                this.specs = [];
            }
        } else {
            this.specs = [];
        }
        this.heroTalents = [];
    }

    onSpecChange() {
        // Clear hero talent when spec changes
        this.selectedHeroTalent = '';

        if (this.selectedClass && this.selectedSpec) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs && classData.specs[this.selectedSpec]) {
                this.heroTalents = classData.specs[this.selectedSpec];
            } else {
                console.warn(`No hero talents found for class: ${this.selectedClass}, spec: ${this.selectedSpec}`);
                this.heroTalents = [];
            }
        } else {
            this.heroTalents = [];
        }
    }

    confirmSelection() {
        const abilitySelection: AbilitySelection = {
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
        this.specs = [];
        this.heroTalents = [];
        this.abilityCleared.emit();
    }

    cancelSelection() {
        // Reset to original values
        if (this.selectedAbility) {
            this.selectedClass = this.selectedAbility.class || '';
            this.selectedSpec = this.selectedAbility.spec || '';
            this.selectedHeroTalent = this.selectedAbility.heroTalent || '';
            this.updateDropdowns();
        } else {
            this.clearSelection();
        }
        this.closeDialog();
    }

    private updateDropdowns() {
        // Update specs based on selected class
        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                this.specs = Object.keys(classData.specs);
            } else {
                this.specs = [];
            }
        } else {
            this.specs = [];
        }

        // Update hero talents based on selected spec
        if (this.selectedClass && this.selectedSpec) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs && classData.specs[this.selectedSpec]) {
                this.heroTalents = classData.specs[this.selectedSpec];
            } else {
                this.heroTalents = [];
            }
        } else {
            this.heroTalents = [];
        }
    }

    getDisplayText(): string {
        if (!this.selectedAbility) {
            return 'No ability selected';
        }

        const parts: string[] = [];

        if (this.selectedAbility.class) {
            const classLabel = this.classes.find(c => c.value === this.selectedAbility?.class)?.label || this.selectedAbility.class;
            parts.push(classLabel);
        }

        if (this.selectedAbility.spec) {
            parts.push(this.selectedAbility.spec);
        }

        if (this.selectedAbility.heroTalent) {
            parts.push(this.selectedAbility.heroTalent);
        }

        return parts.length > 0 ? parts.join(' - ') : 'No ability selected';
    }

    hasSelection(): boolean {
        return !!(this.selectedAbility?.class || this.selectedAbility?.spec || this.selectedAbility?.heroTalent);
    }
}
