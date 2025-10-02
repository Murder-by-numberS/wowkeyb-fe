import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { IconPickerComponent } from '../../icons/components/icon-picker/icon-picker.component';
import { Icon } from '../../icons/services/icon.service';
import { fullClasses } from 'app/core/data/classes';
import { MacroService, CreateMacroRequest } from '../services/macro.service';

@Component({
    selector: 'app-create-macro',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule,
        IconPickerComponent
    ],
    templateUrl: './create-macro.component.html',
    styleUrls: ['./create-macro.component.scss']
})
export class CreateMacroComponent implements OnInit {
    // Form properties
    selectedIcon: Icon | null = null;
    macroName = '';
    macroDescription = '';
    macroText = '';
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

    constructor(
        private router: Router,
        private macroService: MacroService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        // Initialize with all classes to populate the first dropdown
        this.specs = [];
        this.heroTalents = [];
    }

    onIconSelected(icon: Icon) {
        this.selectedIcon = icon;
    }

    onIconCleared() {
        this.selectedIcon = null;
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

    saveMacro() {
        if (!this.macroName || !this.macroText || !this.selectedClass) {
            this.snackBar.open('Macro name, text, and class are required', 'Close', {
                duration: 3000,
                panelClass: ['error-snackbar']
            });
            return;
        }

        // Validate class/spec combination
        if (this.selectedClass && this.selectedSpec) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                const validSpecs = Object.keys(classData.specs);
                if (!validSpecs.includes(this.selectedSpec)) {
                    this.snackBar.open(`Invalid specialization for ${this.selectedClass}. Please select a valid spec.`, 'Close', {
                        duration: 3000,
                        panelClass: ['error-snackbar']
                    });
                    return;
                }
            } else {
                console.warn(`No specs found for class: ${this.selectedClass}`);
            }
        }

        // Validate spec/hero talent combination
        if (this.selectedClass && this.selectedSpec && this.selectedHeroTalent) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs && classData.specs[this.selectedSpec]) {
                const validHeroTalents = classData.specs[this.selectedSpec];
                if (!validHeroTalents.includes(this.selectedHeroTalent)) {
                    this.snackBar.open(`Invalid hero talent for ${this.selectedClass} ${this.selectedSpec}. Please select a valid hero talent.`, 'Close', {
                        duration: 3000,
                        panelClass: ['error-snackbar']
                    });
                    return;
                }
            } else {
                console.warn(`No hero talents found for class: ${this.selectedClass}, spec: ${this.selectedSpec}`);
            }
        }

        // Create macro data - backend will auto-set to latest game version
        const macroData: CreateMacroRequest = {
            name: this.macroName,
            description: this.macroDescription,
            macro_text: this.macroText,
            class: this.selectedClass,
            spec: this.selectedSpec || undefined,
            hero_talent: this.selectedHeroTalent || undefined,
            // game_version omitted - backend will auto-set to latest
            icon: this.selectedIcon ? this.selectedIcon.id : undefined,
            is_public: false // Default to private for now
        };

        this.macroService.createMacro(macroData).subscribe({
            next: (createdMacro) => {
                console.log('Macro created successfully:', createdMacro);
                this.snackBar.open('Macro created successfully!', 'Close', {
                    duration: 3000,
                    panelClass: ['success-snackbar']
                });
                // Reset form
                this.resetForm();
                // Navigate back to my macros
                this.router.navigate(['/macros/my-macros']);
            },
            error: (error) => {
                console.error('Error creating macro:', error);
                let errorMessage = 'Failed to create macro. Please try again.';

                if (error.error && error.error.message) {
                    errorMessage = error.error.message;
                } else if (error.message) {
                    errorMessage = error.message;
                }

                this.snackBar.open(errorMessage, 'Close', {
                    duration: 5000,
                    panelClass: ['error-snackbar']
                });
            }
        });
    }

    private resetForm() {
        this.macroName = '';
        this.macroDescription = '';
        this.macroText = '';
        this.selectedClass = '';
        this.selectedSpec = '';
        this.selectedHeroTalent = '';
        this.selectedIcon = null;
        this.specs = [];
        this.heroTalents = [];
    }

    cancel() {
        this.router.navigate(['/macros/my-macros']);
    }
}
