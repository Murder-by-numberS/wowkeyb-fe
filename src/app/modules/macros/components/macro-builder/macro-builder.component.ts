import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MacroService, MacroTemplate, GenerateMacroResponse } from '../../services/macro.service';
import { AbilityPickerComponent, AbilitySelection } from '../ability-picker/ability-picker.component';
import { fullClasses } from 'app/core/data/classes';
import { FRONTEND_CLASS_OPTIONS } from 'app/core/utils/class-name-utils';

@Component({
    selector: 'app-macro-builder',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatChipsModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatTooltipModule,
        AbilityPickerComponent
    ],
    templateUrl: './macro-builder.component.html'
})
export class MacroBuilderComponent implements OnInit {
    builderForm: FormGroup;
    templates: MacroTemplate[] = [];
    selectedTemplate: MacroTemplate | null = null;
    generatedMacro: GenerateMacroResponse | null = null;
    selectedAbility: AbilitySelection | null = null;
    loading = false;
    error: string | null = null;
    availableSpecs: string[] = [];
    availableHeroTalents: string[] = [];
    macroTitle: string = '';

    classes = FRONTEND_CLASS_OPTIONS;

    constructor(
        private fb: FormBuilder,
        private macroService: MacroService,
        public dialogRef: MatDialogRef<MacroBuilderComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) {
        this.builderForm = this.fb.group({
            spellName: ['', Validators.required],
            templateType: ['', Validators.required],
            wowClass: [''],
            spec: [''],
            heroTalent: [''],
            abilityId: [''],
            includeTooltip: [true],
            fallbackToPlayer: [false],
            modifierKey: ['']
        });
    }

    ngOnInit(): void {
        this.loadTemplates();

        // Pre-fill if data provided
        if (this.data?.spellName) {
            this.builderForm.patchValue({ spellName: this.data.spellName });
        }
        if (this.data?.class) {
            this.builderForm.patchValue({ wowClass: this.data.class });
        }
        if (this.data?.abilityId) {
            this.builderForm.patchValue({ abilityId: this.data.abilityId });
        }
        if (this.data?.selectedAbility) {
            this.selectedAbility = this.data.selectedAbility;
            if (this.selectedAbility?.ability?.name) {
                this.builderForm.patchValue({ spellName: this.selectedAbility.ability.name });
            }
        }
    }

    loadTemplates(): void {
        this.loading = true;
        this.macroService.getTemplates().subscribe({
            next: (response) => {
                this.templates = response.templates;
                this.loading = false;
            },
            error: (error) => {
                console.error('Error loading templates:', error);
                this.error = 'Failed to load templates';
                this.loading = false;
            }
        });
    }

    selectTemplate(template: MacroTemplate): void {
        this.selectedTemplate = template;
        this.builderForm.patchValue({ templateType: template.type });
        this.error = null;
    }

    generateMacro(): void {
        if (this.builderForm.invalid) {
            return;
        }

        this.loading = true;
        this.error = null;

        const formValue = this.builderForm.value;
        const customOptions: any = {
            includeTooltip: formValue.includeTooltip
        };

        if (formValue.fallbackToPlayer) {
            customOptions.fallbackToPlayer = true;
        }

        if (formValue.modifierKey) {
            customOptions.modifierKey = formValue.modifierKey;
        }

        const request = {
            spell_name: formValue.spellName,
            template_type: formValue.templateType,
            wow_class: formValue.wowClass || undefined,
            spec: formValue.spec || undefined,
            hero_talent: formValue.heroTalent || undefined,
            ability_id: formValue.abilityId || undefined,
            custom_options: customOptions
        };

        this.macroService.generateMacro(request).subscribe({
            next: (response) => {
                this.generatedMacro = response;
                // Generate a title based on the spell name and template type
                this.macroTitle = this.generateMacroTitle(formValue.spellName, formValue.templateType, formValue.wowClass, formValue.spec);
                this.loading = false;
            },
            error: (error) => {
                console.error('Error generating macro:', error);
                this.error = error.error?.message || 'Failed to generate macro';
                this.loading = false;
            }
        });
    }

    useMacro(): void {
        if (this.generatedMacro && this.macroTitle?.trim()) {
            this.dialogRef.close({
                title: this.macroTitle.trim(),
                macroText: this.generatedMacro.macro_text,
                tags: this.generatedMacro.suggested_tags,
                explanation: this.generatedMacro.explanation
            });
        }
    }

    reset(): void {
        this.generatedMacro = null;
        this.selectedTemplate = null;
        this.macroTitle = '';
        this.builderForm.reset({
            includeTooltip: true,
            fallbackToPlayer: false
        });
        this.availableSpecs = [];
        this.availableHeroTalents = [];
        this.error = null;
    }

    close(): void {
        this.dialogRef.close();
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            // Optional: Show a snackbar or toast notification
            console.log('Macro copied to clipboard');
        }).catch(err => {
            console.error('Failed to copy macro:', err);
        });
    }

    onAbilitySelected(selection: AbilitySelection): void {
        this.selectedAbility = selection;

        // Auto-fill spell name from ability
        if (selection.ability?.name) {
            this.builderForm.patchValue({
                spellName: selection.ability.name,
                abilityId: selection.ability.id
            });
        }

        // Auto-set class if ability has class info
        if (selection.class && !this.builderForm.get('wowClass')?.value) {
            this.builderForm.patchValue({
                wowClass: selection.class
            });
            // Trigger class change to populate specs
            this.onClassChange();
        }

        // Auto-set spec if ability has spec info
        if (selection.spec) {
            this.builderForm.patchValue({
                spec: selection.spec
            });
            // Filter specs to only show the ability's spec
            this.availableSpecs = [selection.spec];
            // Trigger spec change to populate hero talents
            this.onSpecChange();
        }

        // Auto-set hero talent if ability has hero talent info
        if (selection.heroTalent) {
            this.builderForm.patchValue({
                heroTalent: selection.heroTalent
            });
        }
    }

    onAbilityCleared(): void {
        this.selectedAbility = null;
        this.builderForm.patchValue({
            abilityId: ''
        });
        // Reset available specs to show all specs for the selected class
        const selectedClass = this.builderForm.get('wowClass')?.value;
        if (selectedClass) {
            const classData = fullClasses[selectedClass];
            if (classData && classData.specs) {
                this.availableSpecs = Object.keys(classData.specs);
            }
        }
        // Don't clear spell name in case user wants to keep it
    }

    onClassChange(): void {
        const selectedClass = this.builderForm.get('wowClass')?.value;

        // Clear spec and hero talent when class changes
        this.builderForm.patchValue({
            spec: '',
            heroTalent: ''
        });

        if (selectedClass) {
            const classData = fullClasses[selectedClass];
            if (classData && classData.specs) {
                // If an ability is selected and it has a specific spec, only show that spec
                if (this.selectedAbility?.spec) {
                    this.availableSpecs = [this.selectedAbility.spec];
                } else {
                    // Otherwise show all specs for the class
                    this.availableSpecs = Object.keys(classData.specs);
                }
            } else {
                this.availableSpecs = [];
            }
        } else {
            this.availableSpecs = [];
        }
        this.availableHeroTalents = [];
    }

    onSpecChange(): void {
        const selectedClass = this.builderForm.get('wowClass')?.value;
        const selectedSpec = this.builderForm.get('spec')?.value;

        // Clear hero talent when spec changes
        this.builderForm.patchValue({
            heroTalent: ''
        });

        if (selectedClass && selectedSpec) {
            const classData = fullClasses[selectedClass];
            if (classData && classData.specs && classData.specs[selectedSpec]) {
                this.availableHeroTalents = classData.specs[selectedSpec];
            } else {
                this.availableHeroTalents = [];
            }
        } else {
            this.availableHeroTalents = [];
        }
    }

    private generateMacroTitle(spellName: string, templateType: string, wowClass?: string, spec?: string): string {
        // Start with the spell name
        let title = spellName;

        // Add template type context
        const templateContext = this.getTemplateContext(templateType);
        if (templateContext) {
            title += ` ${templateContext}`;
        }

        // Add class/spec context if available
        if (spec && wowClass) {
            const classLabel = this.classes.find(c => c.value === wowClass)?.label || wowClass;
            title += ` (${classLabel} - ${spec})`;
        } else if (wowClass) {
            const classLabel = this.classes.find(c => c.value === wowClass)?.label || wowClass;
            title += ` (${classLabel})`;
        }

        return title;
    }

    private getTemplateContext(templateType: string): string {
        const templateContexts: { [key: string]: string } = {
            'mouseover': 'Mouseover',
            'focus': 'Focus',
            'target': 'Target',
            'self': 'Self',
            'party': 'Party',
            'raid': 'Raid',
            'arena': 'Arena',
            'pvp': 'PvP',
            'pve': 'PvE',
            'dps': 'DPS',
            'heal': 'Heal',
            'tank': 'Tank',
            'utility': 'Utility',
            'interrupt': 'Interrupt',
            'cc': 'CC',
            'buff': 'Buff',
            'debuff': 'Debuff'
        };

        return templateContexts[templateType] || '';
    }
}

