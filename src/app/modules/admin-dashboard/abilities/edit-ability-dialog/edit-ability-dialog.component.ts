import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

import { AdminAbility } from 'app/core/services/admin.service';
import { AbilitiesService, AbilityUpdatePayload } from 'app/core/services/abilities.service';
import { fullClasses } from 'app/core/data/classes';
import { FRONTEND_CLASS_OPTIONS } from 'app/core/utils/class-name-utils';

export interface EditAbilityDialogData {
    ability: AdminAbility;
}

@Component({
    selector: 'admin-edit-ability-dialog',
    templateUrl: './edit-ability-dialog.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatSelectModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        MatSnackBarModule
    ]
})
export class AdminEditAbilityDialogComponent implements OnInit {
    abilityForm: FormGroup;
    isLoading = false;
    ability: AdminAbility;

    classes = FRONTEND_CLASS_OPTIONS;

    abilityTypes = [
        { value: 'class', label: 'Class' },
        { value: 'spec', label: 'Spec' },
        { value: 'hero_talent', label: 'Hero Talent' }
    ];

    resourceTypes = [
        'None',
        'Mana',
        'Rage',
        'Focus',
        'Energy',
        'Combo Points',
        'Runes',
        'Runic Power',
        'Soul Shards',
        'Lunar Power',
        'Holy Power',
        'Maelstrom',
        'Insanity',
        'Chi',
        'Arcane Charges',
        'Fury',
        'Pain',
        'Essence'
    ];

    specs: string[] = [];
    heroTalents: string[] = [];
    fullClasses = fullClasses;

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<AdminEditAbilityDialogComponent>,
        private abilitiesService: AbilitiesService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: EditAbilityDialogData
    ) {
        this.ability = data.ability;
    }

    ngOnInit(): void {
        this.initForm();
        this.updateSpecsAndHeroTalents();
    }

    private initForm(): void {
        this.abilityForm = this.fb.group({
            name: [this.ability.name, [Validators.required, Validators.maxLength(100)]],
            spell_id: [this.ability.spell_id],
            description: [this.ability.description, [Validators.required, Validators.maxLength(1000)]],
            icon: [this.ability.icon, [Validators.required]],
            class: [this.ability.class || ''],
            spec: [this.ability.spec || ''],
            hero_talent: [this.ability.hero_talent || ''],
            ability_type: [this.ability.ability_type || 'class'],
            is_active: [this.ability.is_active ?? true],
            level_required: [this.ability.level_required ?? 1, [Validators.min(1), Validators.max(80)]],
            cooldown: [this.ability.cooldown ?? 0, [Validators.min(0)]],
            range: [this.ability.range ?? 0, [Validators.min(0)]],
            cost: [this.ability.cost || 'None'],
            cost_amount: [this.ability.cost_amount ?? 0, [Validators.min(0)]]
        });

        this.abilityForm.get('class')?.valueChanges.subscribe(() => this.updateSpecsAndHeroTalents(true));
        this.abilityForm.get('spec')?.valueChanges.subscribe(() => this.updateHeroTalents(true));
    }

    updateSpecsAndHeroTalents(clearSpecAndHeroTalent = false): void {
        const wowClass = this.abilityForm.get('class')?.value;
        if (wowClass && this.fullClasses[wowClass]) {
            this.specs = Object.keys(this.fullClasses[wowClass].specs);
            if (clearSpecAndHeroTalent) {
                this.heroTalents = [];
                this.abilityForm.patchValue({ spec: '', hero_talent: '' }, { emitEvent: false });
            } else {
                this.updateHeroTalents(false);
            }
        } else {
            this.specs = [];
            this.heroTalents = [];
            if (clearSpecAndHeroTalent) {
                this.abilityForm.patchValue({ spec: '', hero_talent: '' }, { emitEvent: false });
            }
        }
    }

    updateHeroTalents(clearHeroTalent = false): void {
        const wowClass = this.abilityForm.get('class')?.value;
        const spec = this.abilityForm.get('spec')?.value;
        if (wowClass && spec && this.fullClasses[wowClass]) {
            const specKey = Object.keys(this.fullClasses[wowClass].specs).find(
                s => s.toLowerCase() === spec.toLowerCase()
            );
            this.heroTalents = specKey ? (this.fullClasses[wowClass].specs[specKey] || []) : [];
        } else {
            this.heroTalents = [];
        }
        if (clearHeroTalent) {
            this.abilityForm.patchValue({ hero_talent: '' }, { emitEvent: false });
        }
    }

    get iconPreviewUrl(): string {
        const url = this.abilityForm.get('icon')?.value;
        return url && typeof url === 'string' ? url : this.ability.icon;
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.abilityForm.invalid) {
            Object.keys(this.abilityForm.controls).forEach(key => {
                this.abilityForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.isLoading = true;
        const formValues = this.abilityForm.value;

        const payload: AbilityUpdatePayload = {
            name: formValues.name,
            spellId: formValues.spell_id,
            description: formValues.description,
            icon: formValues.icon,
            class: formValues.class || undefined,
            spec: formValues.spec || undefined,
            heroTalent: formValues.hero_talent || undefined,
            abilityType: formValues.ability_type,
            isActive: formValues.is_active,
            levelRequired: formValues.level_required,
            cooldown: formValues.cooldown,
            range: formValues.range,
            cost: formValues.cost === 'None' ? undefined : formValues.cost,
            costAmount: formValues.cost_amount
        };

        this.abilitiesService.updateAbility(this.ability.id, payload).subscribe({
            next: (updatedAbility) => {
                this.isLoading = false;
                this.snackBar.open('Ability updated successfully', 'OK', { duration: 3000 });
                this.dialogRef.close(updatedAbility);
            },
            error: (error) => {
                this.isLoading = false;
                const message = error.error?.message || 'Failed to update ability. Please try again.';
                this.snackBar.open(message, 'OK', { duration: 5000 });
            }
        });
    }

    hasError(fieldName: string, errorType: string): boolean {
        const field = this.abilityForm.get(fieldName);
        return !!(field?.hasError(errorType) && field?.touched);
    }
}
