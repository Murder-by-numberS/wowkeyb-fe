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

import { Ability } from 'app/core/types/ability';
import { AbilitiesService, AbilityUpdatePayload } from 'app/core/services/abilities.service';

export interface EditAbilityDialogData {
    ability: Ability;
}

@Component({
    selector: 'edit-ability-dialog',
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
export class EditAbilityDialogComponent implements OnInit {
    abilityForm: FormGroup;
    isLoading = false;
    originalAbility: Ability;

    // Options for ability type dropdown
    abilityTypes = [
        { value: 'class', label: 'Class' },
        { value: 'spec', label: 'Spec' },
        { value: 'hero_talent', label: 'Hero Talent' }
    ];

    // Common resource types
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

    constructor(
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<EditAbilityDialogComponent>,
        private abilitiesService: AbilitiesService,
        private snackBar: MatSnackBar,
        @Inject(MAT_DIALOG_DATA) public data: EditAbilityDialogData
    ) {
        this.originalAbility = data.ability;
    }

    ngOnInit(): void {
        this.initForm();
    }

    private initForm(): void {
        this.abilityForm = this.fb.group({
            name: [this.originalAbility.name, [Validators.required, Validators.maxLength(100)]],
            spellId: [this.originalAbility.spellId],
            description: [this.originalAbility.description, [Validators.required, Validators.maxLength(1000)]],
            icon: [this.originalAbility.icon, [Validators.required]],
            abilityType: [this.originalAbility.abilityType],
            levelRequired: [this.originalAbility.levelRequired || 1, [Validators.min(1), Validators.max(80)]],
            cooldown: [this.originalAbility.cooldown || 0, [Validators.min(0)]],
            range: [this.originalAbility.range || 0, [Validators.min(0)]],
            cost: [this.originalAbility.cost || 'None'],
            costAmount: [this.originalAbility.costAmount || 0, [Validators.min(0)]]
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }

    onSave(): void {
        if (this.abilityForm.invalid) {
            // Mark all fields as touched to show validation errors
            Object.keys(this.abilityForm.controls).forEach(key => {
                this.abilityForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.isLoading = true;

        // Build update payload with only changed fields
        const formValues = this.abilityForm.value;
        const updatePayload: AbilityUpdatePayload = {};

        // Only include fields that have changed
        if (formValues.name !== this.originalAbility.name) {
            updatePayload.name = formValues.name;
        }
        if (formValues.spellId !== this.originalAbility.spellId) {
            updatePayload.spellId = formValues.spellId;
        }
        if (formValues.description !== this.originalAbility.description) {
            updatePayload.description = formValues.description;
        }
        if (formValues.icon !== this.originalAbility.icon) {
            updatePayload.icon = formValues.icon;
        }
        if (formValues.abilityType !== this.originalAbility.abilityType) {
            updatePayload.abilityType = formValues.abilityType;
        }
        if (formValues.levelRequired !== (this.originalAbility.levelRequired || 1)) {
            updatePayload.levelRequired = formValues.levelRequired;
        }
        if (formValues.cooldown !== (this.originalAbility.cooldown || 0)) {
            updatePayload.cooldown = formValues.cooldown;
        }
        if (formValues.range !== (this.originalAbility.range || 0)) {
            updatePayload.range = formValues.range;
        }
        if (formValues.cost !== (this.originalAbility.cost || 'None')) {
            updatePayload.cost = formValues.cost;
        }
        if (formValues.costAmount !== (this.originalAbility.costAmount || 0)) {
            updatePayload.costAmount = formValues.costAmount;
        }

        // If no changes, just close the dialog
        if (Object.keys(updatePayload).length === 0) {
            this.snackBar.open('No changes detected', 'OK', { duration: 3000 });
            this.dialogRef.close();
            return;
        }

        this.abilitiesService.updateAbility(this.originalAbility.id, updatePayload).subscribe({
            next: (updatedAbility) => {
                this.isLoading = false;
                this.snackBar.open('Ability updated successfully!', 'OK', { duration: 3000 });
                this.dialogRef.close(updatedAbility);
            },
            error: (error) => {
                this.isLoading = false;
                console.error('Error updating ability:', error);
                const errorMessage = error.error?.message || 'Failed to update ability. Please try again.';
                this.snackBar.open(errorMessage, 'OK', { duration: 5000 });
            }
        });
    }

    // Helper method to check if a field has an error
    hasError(fieldName: string, errorType: string): boolean {
        const field = this.abilityForm.get(fieldName);
        return field?.hasError(errorType) && field?.touched;
    }
}
