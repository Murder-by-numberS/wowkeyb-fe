import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MacroFileService } from '../../services/macro-file.service';
import { Macro } from '../../services/macro.service';

export interface ExportMacroFileDialogData {
    macros: Macro[];
}

interface SelectableMacro extends Macro {
    selected?: boolean;
}

@Component({
    selector: 'export-macro-file-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatRadioModule,
        MatCheckboxModule,
        MatProgressBarModule,
        MatIconModule,
        MatChipsModule
    ],
    template: `
        <h2 mat-dialog-title>Export Macros to File</h2>

        <mat-dialog-content>
            <form [formGroup]="exportForm" class="flex flex-col gap-4">

                <!-- File Type Selection -->
                <mat-form-field appearance="outline">
                    <mat-label>File Type</mat-label>
                    <mat-select formControlName="file_type">
                        <mat-option value="account">Account-Wide Macros</mat-option>
                        <mat-option value="character">Character-Specific Macros</mat-option>
                    </mat-select>
                    <mat-hint>Choose whether this is for all characters or a specific one</mat-hint>
                </mat-form-field>

                <!-- Character Class (shown if character-specific) -->
                <mat-form-field
                    appearance="outline"
                    *ngIf="exportForm.get('file_type')?.value === 'character'">
                    <mat-label>Character Class</mat-label>
                    <mat-select formControlName="character_class">
                        <mat-option *ngFor="let cls of classes" [value]="cls.value">
                            {{ cls.label }}
                        </mat-option>
                    </mat-select>
                    <mat-hint>Only macros for this class (or generic) will be included</mat-hint>
                </mat-form-field>

                <!-- Character Name (optional) -->
                <mat-form-field
                    appearance="outline"
                    *ngIf="exportForm.get('file_type')?.value === 'character'">
                    <mat-label>Character Name (Optional)</mat-label>
                    <input matInput formControlName="character_name" placeholder="Arthas">
                    <mat-hint>Used in the generated filename</mat-hint>
                </mat-form-field>

                <!-- Macro Selection -->
                <div class="macro-selection-section">
                    <div class="flex items-center justify-between mb-2">
                        <h3 class="text-lg font-medium">Select Macros</h3>
                        <div class="flex gap-2">
                            <button
                                mat-button
                                type="button"
                                (click)="selectAll()"
                                class="text-sm">
                                Select All
                            </button>
                            <button
                                mat-button
                                type="button"
                                (click)="deselectAll()"
                                class="text-sm">
                                Deselect All
                            </button>
                        </div>
                    </div>

                    <!-- Filter by class (if file_type is character) -->
                    <div *ngIf="exportForm.get('file_type')?.value === 'character' && exportForm.get('character_class')?.value" class="mb-2">
                        <p class="text-sm text-gray-600 dark:text-gray-400">
                            Showing macros for {{ getClassName(exportForm.get('character_class')?.value) }} or generic macros
                        </p>
                    </div>

                    <!-- Macro List -->
                    <div class="macro-list max-h-96 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                        <div *ngIf="filteredMacros.length === 0" class="p-8 text-center text-gray-500">
                            <mat-icon class="text-4xl mb-2">info</mat-icon>
                            <p>No macros available for the selected class.</p>
                            <p class="text-sm mt-1">Change the character class or select "Account-Wide Macros".</p>
                        </div>

                        <div
                            *ngFor="let macro of filteredMacros"
                            class="macro-item p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                            (click)="toggleMacro(macro)">

                            <div class="flex items-start gap-3">
                                <mat-checkbox
                                    [checked]="macro.selected"
                                    (click)="$event.stopPropagation()"
                                    (change)="toggleMacro(macro)">
                                </mat-checkbox>

                                <div class="flex-1">
                                    <div class="flex items-center gap-2">
                                        <span class="font-medium">{{ macro.name }}</span>
                                        <mat-chip *ngIf="macro.class" class="h-6 text-xs">
                                            {{ getClassName(macro.class) }}
                                        </mat-chip>
                                        <mat-chip *ngIf="!macro.class" class="h-6 text-xs" color="accent">
                                            Generic
                                        </mat-chip>
                                    </div>

                                    <p *ngIf="macro.description" class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                        {{ macro.description }}
                                    </p>

                                    <p class="text-xs text-gray-500 dark:text-gray-500 mt-1 font-mono">
                                        {{ (macro.macro_text || macro.text || macro.macroText || '').substring(0, 60) }}...
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div class="mt-2 text-sm text-gray-600 dark:text-gray-400">
                        Selected: {{ selectedCount }} / {{ filteredMacros.length }} macros
                    </div>
                </div>

                <!-- Options -->
                <div class="flex flex-col gap-2">
                    <mat-checkbox formControlName="save_to_history">
                        Save to download history
                    </mat-checkbox>
                    <p class="text-sm text-gray-600 dark:text-gray-400 ml-8">
                        Keep a record of this export for re-downloading later
                    </p>
                </div>

                <!-- Export Progress -->
                <mat-progress-bar
                    *ngIf="exporting"
                    mode="indeterminate"
                    class="mt-4">
                </mat-progress-bar>

            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()" [disabled]="exporting">Cancel</button>
            <button
                mat-raised-button
                color="primary"
                (click)="onExport()"
                [disabled]="!exportForm.valid || selectedCount === 0 || exporting">
                <mat-icon>download</mat-icon>
                Export ({{ selectedCount }})
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        mat-dialog-content {
            min-width: 600px;
            max-width: 800px;
        }

        .macro-selection-section {
            margin-top: 1rem;
        }

        .macro-list {
            background-color: var(--fuse-bg-card);
        }

        .macro-item:last-child {
            border-bottom: none;
        }

        @media (max-width: 640px) {
            mat-dialog-content {
                min-width: 300px;
            }
        }
    `]
})
export class ExportMacroFileDialogComponent implements OnInit {
    exportForm: FormGroup;
    macros: SelectableMacro[] = [];
    filteredMacros: SelectableMacro[] = [];
    exporting = false;

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

    get selectedCount(): number {
        return this.filteredMacros.filter(m => m.selected).length;
    }

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: ExportMacroFileDialogData,
        private fb: FormBuilder,
        private dialogRef: MatDialogRef<ExportMacroFileDialogComponent>,
        private macroFileService: MacroFileService,
        private snackBar: MatSnackBar
    ) {
        this.exportForm = this.fb.group({
            file_type: ['account', Validators.required],
            character_class: [''],
            character_name: [''],
            save_to_history: [true]
        });

        // Initialize macros with selection state
        this.macros = (data.macros || []).map(m => ({ ...m, selected: false }));
        this.filteredMacros = [...this.macros];
    }

    ngOnInit(): void {
        // Watch file_type and character_class changes
        this.exportForm.get('file_type')?.valueChanges.subscribe(() => {
            this.updateFilteredMacros();
            this.updateCharacterClassValidation();
        });

        this.exportForm.get('character_class')?.valueChanges.subscribe(() => {
            this.updateFilteredMacros();
        });
    }

    updateCharacterClassValidation(): void {
        const fileType = this.exportForm.get('file_type')?.value;
        const characterClassControl = this.exportForm.get('character_class');

        if (fileType === 'character') {
            characterClassControl?.setValidators([Validators.required]);
        } else {
            characterClassControl?.clearValidators();
        }
        characterClassControl?.updateValueAndValidity();
    }

    updateFilteredMacros(): void {
        const fileType = this.exportForm.get('file_type')?.value;
        const characterClass = this.exportForm.get('character_class')?.value;

        if (fileType === 'character' && characterClass) {
            // Show only macros for this class or generic macros (no class specified)
            this.filteredMacros = this.macros.filter(m =>
                !m.class || m.class === characterClass
            );
        } else {
            // Show all macros
            this.filteredMacros = [...this.macros];
        }
    }

    toggleMacro(macro: SelectableMacro): void {
        macro.selected = !macro.selected;
    }

    selectAll(): void {
        this.filteredMacros.forEach(m => m.selected = true);
    }

    deselectAll(): void {
        this.filteredMacros.forEach(m => m.selected = false);
    }

    getClassName(classValue: string | undefined): string {
        if (!classValue) return 'Generic';
        const cls = this.classes.find(c => c.value === classValue);
        return cls ? cls.label : classValue;
    }

    onExport(): void {
        if (!this.exportForm.valid || this.selectedCount === 0) {
            return;
        }

        this.exporting = true;

        const selectedMacroIds = this.filteredMacros
            .filter(m => m.selected)
            .map(m => m.id)
            .filter(id => id !== undefined) as string[];

        const formValue = this.exportForm.value;

        this.macroFileService.generateMacroFile({
            macro_ids: selectedMacroIds,
            file_type: formValue.file_type,
            character_class: formValue.character_class || undefined,
            character_name: formValue.character_name || undefined,
            // save_to_history removed - files are always persisted
        }).subscribe({
            next: (response) => {
                this.exporting = false;

                // Download the file
                this.macroFileService.downloadFileFromUrl(
                    response.file.download_url,
                    response.file.file_name
                );

                this.snackBar.open(
                    `Exported ${response.file.macro_count} macro(s) successfully!`,
                    'Close',
                    { duration: 3000 }
                );

                this.dialogRef.close(response);
            },
            error: (error) => {
                this.exporting = false;
                console.error('Export error:', error);

                let errorMessage = 'Failed to export macros';
                if (error.error?.message) {
                    errorMessage = error.error.message;
                }

                this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

