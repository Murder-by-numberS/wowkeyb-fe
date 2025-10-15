import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
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

@Component({
    selector: 'app-macro-builder',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MatChipsModule,
        MatTabsModule,
        MatProgressSpinnerModule,
        MatTooltipModule
    ],
    templateUrl: './macro-builder.component.html'
})
export class MacroBuilderComponent implements OnInit {
    builderForm: FormGroup;
    templates: MacroTemplate[] = [];
    selectedTemplate: MacroTemplate | null = null;
    generatedMacro: GenerateMacroResponse | null = null;
    loading = false;
    error: string | null = null;

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
            ability_id: formValue.abilityId || undefined,
            custom_options: customOptions
        };

        this.macroService.generateMacro(request).subscribe({
            next: (response) => {
                this.generatedMacro = response;
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
        if (this.generatedMacro) {
            this.dialogRef.close({
                macroText: this.generatedMacro.macro_text,
                tags: this.generatedMacro.suggested_tags,
                explanation: this.generatedMacro.explanation
            });
        }
    }

    reset(): void {
        this.generatedMacro = null;
        this.selectedTemplate = null;
        this.builderForm.reset({
            includeTooltip: true,
            fallbackToPlayer: false
        });
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
}

