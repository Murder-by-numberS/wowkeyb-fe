import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MacroFileService, PreviewMacroFileResponse } from '../../services/macro-file.service';

interface SelectableMacro {
    index: number;
    name: string;
    macro_text: string;
    icon_fdid?: string;
    show_tooltip?: boolean;
    selected: boolean;
}

@Component({
    selector: 'upload-macro-file-dialog',
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
        MatIconModule
    ],
    template: `
        <h2 mat-dialog-title>Upload WoW Macro File</h2>

        <mat-dialog-content>
            <!-- Step 1: File Selection -->
            <div *ngIf="!previewData" class="flex flex-col gap-4">
                <form [formGroup]="uploadForm">
                    <!-- File Upload -->
                    <div class="file-upload-area mb-4">
                        <input
                            #fileInput
                            type="file"
                            accept=".txt"
                            (change)="onFileSelected($event)"
                            class="hidden">

                        <div
                            class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8 text-center cursor-pointer hover:border-primary-500 transition-colors"
                            (click)="fileInput.click()">

                            <mat-icon class="text-6xl text-gray-400 mb-2">upload_file</mat-icon>

                            <div *ngIf="!selectedFile" class="text-gray-600 dark:text-gray-400">
                                <p class="font-medium">Click to select a macro file</p>
                                <p class="text-sm">or drag and drop</p>
                                <p class="text-xs mt-2">Only .txt files (max 2MB)</p>
                            </div>

                            <div *ngIf="selectedFile" class="text-primary-600 dark:text-primary-400">
                                <p class="font-medium">{{ selectedFile.name }}</p>
                                <p class="text-sm">{{ formatFileSize(selectedFile.size) }}</p>
                                <button
                                    mat-icon-button
                                    type="button"
                                    (click)="removeFile($event)"
                                    class="mt-2">
                                    <mat-icon>close</mat-icon>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- File Type Selection -->
                    <mat-form-field appearance="outline" class="w-full mb-4">
                        <mat-label>File Type</mat-label>
                        <mat-select formControlName="file_type">
                            <mat-option value="account">Account-Wide Macros</mat-option>
                            <mat-option value="character">Character-Specific Macros</mat-option>
                        </mat-select>
                    </mat-form-field>

                    <!-- Character Class (shown if character-specific) -->
                    <mat-form-field
                        appearance="outline"
                        class="w-full"
                        *ngIf="uploadForm.get('file_type')?.value === 'character'">
                        <mat-label>Character Class</mat-label>
                        <mat-select formControlName="character_class">
                            <mat-option *ngFor="let cls of classes" [value]="cls.value">
                                {{ cls.label }}
                            </mat-option>
                        </mat-select>
                    </mat-form-field>
                </form>

                <!-- Parse Progress -->
                <mat-progress-bar
                    *ngIf="parsing"
                    mode="indeterminate"
                    class="mt-4">
                </mat-progress-bar>

                <!-- Validation Errors -->
                <div *ngIf="validationErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 class="font-medium text-red-800 dark:text-red-400 mb-2">Errors:</h4>
                    <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                        <li *ngFor="let error of validationErrors">{{ error }}</li>
                    </ul>
                </div>
            </div>

            <!-- Step 2: Macro Selection -->
            <div *ngIf="previewData" class="flex flex-col gap-4">
                <!-- Limit Warning -->
                <div *ngIf="previewData.would_exceed_limit" class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                    <div class="flex items-start gap-2">
                        <mat-icon class="text-yellow-600">warning</mat-icon>
                        <div>
                            <h4 class="font-medium text-yellow-800 dark:text-yellow-400">Macro Limit Warning</h4>
                            <p class="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
                                You have {{ previewData.user_macro_count }} macros. 
                                Importing all {{ previewData.preview.macros_count }} macros would exceed the limit.
                                You can import up to {{ previewData.available_slots }} more macros.
                                Please select which macros you want to import.
                            </p>
                        </div>
                    </div>
                </div>

                <!-- Info Box -->
                <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <p class="text-sm text-blue-800 dark:text-blue-300">
                        Found <strong>{{ previewData.preview.macros_count }}</strong> macros in <strong>{{ previewData.preview.file_name }}</strong>.
                        Select the macros you want to import.
                    </p>
                </div>

                <!-- Selection Controls -->
                <div class="flex items-center justify-between">
                    <span class="text-sm text-gray-600">
                        Selected: {{ selectedCount }} / {{ selectableMacros.length }}
                        <span *ngIf="previewData.available_slots < selectableMacros.length" class="text-yellow-600">
                            (max {{ previewData.available_slots }})
                        </span>
                    </span>
                    <div class="flex gap-2">
                        <button mat-button type="button" (click)="selectAll()" class="text-sm">
                            Select All
                        </button>
                        <button mat-button type="button" (click)="deselectAll()" class="text-sm">
                            Deselect All
                        </button>
                    </div>
                </div>

                <!-- Macro List -->
                <div class="max-h-80 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded-lg">
                    <div
                        *ngFor="let macro of selectableMacros"
                        class="p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                        [ngClass]="{'bg-blue-50': macro.selected}"
                        (click)="toggleMacro(macro)">
                        <div class="flex items-start gap-3">
                            <mat-checkbox
                                [checked]="macro.selected"
                                [disabled]="!macro.selected && selectedCount >= previewData.available_slots"
                                (click)="$event.stopPropagation()"
                                (change)="toggleMacro(macro)">
                            </mat-checkbox>
                            <div class="flex-1 min-w-0">
                                <p class="font-medium truncate">{{ macro.name }}</p>
                                <p class="text-xs text-gray-500 dark:text-gray-400 font-mono truncate mt-1">
                                    {{ macro.macro_text.substring(0, 80) }}{{ macro.macro_text.length > 80 ? '...' : '' }}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Import Progress -->
                <mat-progress-bar
                    *ngIf="importing"
                    mode="indeterminate"
                    class="mt-4">
                </mat-progress-bar>

                <!-- Import Success -->
                <div *ngIf="importSuccess" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 class="font-medium text-green-800 dark:text-green-400 mb-2">Import Successful!</h4>
                    <p class="text-sm text-green-700 dark:text-green-300">
                        Imported {{ importResult?.imported_count || 0 }} macros.
                    </p>
                </div>
            </div>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()" [disabled]="parsing || importing">Cancel</button>
            
            <!-- Parse Button (Step 1) -->
            <button
                *ngIf="!previewData"
                mat-raised-button
                color="primary"
                (click)="onParse()"
                [disabled]="!uploadForm.valid || !selectedFile || parsing">
                <mat-icon>search</mat-icon>
                Parse File
            </button>

            <!-- Back Button (Step 2) -->
            <button
                *ngIf="previewData && !importSuccess"
                mat-stroked-button
                (click)="onBack()"
                [disabled]="importing">
                <mat-icon>arrow_back</mat-icon>
                Back
            </button>

            <!-- Import Button (Step 2) -->
            <button
                *ngIf="previewData && !importSuccess"
                mat-raised-button
                color="primary"
                (click)="onImport()"
                [disabled]="selectedCount === 0 || importing">
                <mat-icon>download</mat-icon>
                Import ({{ selectedCount }})
            </button>

            <!-- Done Button (After Import) -->
            <button
                *ngIf="importSuccess"
                mat-raised-button
                color="primary"
                (click)="onDone()">
                Done
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        mat-dialog-content {
            min-width: 500px;
            max-width: 700px;
            max-height: 70vh;
        }

        .file-upload-area {
            margin-bottom: 1rem;
        }

        @media (max-width: 640px) {
            mat-dialog-content {
                min-width: 300px;
            }
        }
    `]
})
export class UploadMacroFileDialogComponent implements OnInit {
    uploadForm: FormGroup;
    selectedFile: File | null = null;
    parsing = false;
    importing = false;
    importSuccess = false;
    validationErrors: string[] = [];
    
    previewData: PreviewMacroFileResponse | null = null;
    selectableMacros: SelectableMacro[] = [];
    importResult: any = null;

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
        private dialogRef: MatDialogRef<UploadMacroFileDialogComponent>,
        private macroFileService: MacroFileService,
        private snackBar: MatSnackBar
    ) {
        this.uploadForm = this.fb.group({
            file_type: ['account', Validators.required],
            character_class: ['']
        });
    }

    ngOnInit(): void {
        // Watch file_type changes to set character_class validation
        this.uploadForm.get('file_type')?.valueChanges.subscribe(fileType => {
            const characterClassControl = this.uploadForm.get('character_class');
            if (fileType === 'character') {
                characterClassControl?.setValidators([Validators.required]);
            } else {
                characterClassControl?.clearValidators();
            }
            characterClassControl?.updateValueAndValidity();
        });
    }

    get selectedCount(): number {
        return this.selectableMacros.filter(m => m.selected).length;
    }

    onFileSelected(event: Event): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];

            // Validate file type
            if (!file.name.endsWith('.txt')) {
                this.snackBar.open('Please select a .txt file', 'Close', { duration: 3000 });
                return;
            }

            // Validate file size (2MB max)
            if (file.size > 2 * 1024 * 1024) {
                this.snackBar.open('File size must be less than 2MB', 'Close', { duration: 3000 });
                return;
            }

            this.selectedFile = file;
            this.validationErrors = [];
        }
    }

    removeFile(event: Event): void {
        event.stopPropagation();
        this.selectedFile = null;
        this.validationErrors = [];
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    onParse(): void {
        if (!this.uploadForm.valid || !this.selectedFile) {
            return;
        }

        this.parsing = true;
        this.validationErrors = [];

        const formValue = this.uploadForm.value;

        this.macroFileService.previewMacroFile(
            this.selectedFile,
            formValue.file_type,
            formValue.character_class || undefined
        ).subscribe({
            next: (response) => {
                this.parsing = false;
                this.previewData = response;
                
                // Initialize selectable macros
                this.selectableMacros = response.preview.macros.map(m => ({
                    ...m,
                    selected: true // Select all by default
                }));

                // If would exceed limit, only select up to available slots
                if (response.would_exceed_limit) {
                    this.selectableMacros.forEach((m, i) => {
                        m.selected = i < response.available_slots;
                    });
                }
            },
            error: (error) => {
                this.parsing = false;
                console.error('Parse error:', error);

                if (error.error?.message) {
                    this.validationErrors = [error.error.message];
                } else {
                    this.validationErrors = ['An error occurred while parsing the file'];
                }

                this.snackBar.open('Failed to parse macro file', 'Close', { duration: 5000 });
            }
        });
    }

    onBack(): void {
        this.previewData = null;
        this.selectableMacros = [];
        this.importSuccess = false;
        this.importResult = null;
    }

    toggleMacro(macro: SelectableMacro): void {
        if (macro.selected) {
            macro.selected = false;
        } else if (this.previewData && this.selectedCount < this.previewData.available_slots) {
            macro.selected = true;
        }
    }

    selectAll(): void {
        if (!this.previewData) return;
        
        let count = 0;
        this.selectableMacros.forEach(m => {
            if (count < this.previewData!.available_slots) {
                m.selected = true;
                count++;
            } else {
                m.selected = false;
            }
        });
    }

    deselectAll(): void {
        this.selectableMacros.forEach(m => m.selected = false);
    }

    onImport(): void {
        if (!this.previewData || this.selectedCount === 0) {
            return;
        }

        this.importing = true;

        const formValue = this.uploadForm.value;
        const selectedMacros = this.selectableMacros
            .filter(m => m.selected)
            .map(m => ({
                name: m.name,
                macro_text: m.macro_text,
                icon_fdid: m.icon_fdid,
                show_tooltip: m.show_tooltip
            }));

        this.macroFileService.importSelectedMacros({
            macros: selectedMacros,
            file_type: formValue.file_type,
            character_class: formValue.character_class || undefined
        }).subscribe({
            next: (response) => {
                this.importing = false;
                this.importSuccess = true;
                this.importResult = response;

                this.snackBar.open(
                    `Successfully imported ${response.imported_count} macros!`,
                    'Close',
                    { duration: 3000 }
                );
            },
            error: (error) => {
                this.importing = false;
                console.error('Import error:', error);

                this.snackBar.open(
                    error.error?.message || 'Failed to import macros',
                    'Close',
                    { duration: 5000 }
                );
            }
        });
    }

    onDone(): void {
        // Return the import result to refresh the macro list
        this.dialogRef.close({
            upload: {
                macros_created: this.importResult?.imported_count || 0,
                macros_parsed: this.previewData?.preview.macros_count || 0
            },
            created_macros: this.importResult?.created_macros || []
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
