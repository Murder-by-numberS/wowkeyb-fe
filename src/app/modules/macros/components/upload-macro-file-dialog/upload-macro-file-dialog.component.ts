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
import { MacroFileService } from '../../services/macro-file.service';

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
            <form [formGroup]="uploadForm" class="flex flex-col gap-4">

                <!-- File Upload -->
                <div class="file-upload-area">
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
                <mat-form-field appearance="outline">
                    <mat-label>File Type</mat-label>
                    <mat-select formControlName="file_type">
                        <mat-option value="account">Account-Wide Macros</mat-option>
                        <mat-option value="character">Character-Specific Macros</mat-option>
                    </mat-select>
                    <mat-hint>Account-wide can have any class, character-specific must match the class</mat-hint>
                </mat-form-field>

                <!-- Character Class (shown if character-specific) -->
                <mat-form-field
                    appearance="outline"
                    *ngIf="uploadForm.get('file_type')?.value === 'character'">
                    <mat-label>Character Class</mat-label>
                    <mat-select formControlName="character_class">
                        <mat-option *ngFor="let cls of classes" [value]="cls.value">
                            {{ cls.label }}
                        </mat-option>
                    </mat-select>
                    <mat-hint>Select the class for these macros</mat-hint>
                </mat-form-field>

                <!-- Options -->
                <div class="flex flex-col gap-2">
                    <mat-checkbox formControlName="create_macros">
                        Create macros in database
                    </mat-checkbox>
                    <p class="text-sm text-gray-600 dark:text-gray-400 ml-8">
                        If checked, macros from the file will be added to your account
                    </p>
                </div>

                <!-- Upload Progress -->
                <mat-progress-bar
                    *ngIf="uploading"
                    mode="indeterminate"
                    class="mt-4">
                </mat-progress-bar>

                <!-- Validation Errors -->
                <div *ngIf="validationErrors.length > 0" class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                    <h4 class="font-medium text-red-800 dark:text-red-400 mb-2">Validation Errors:</h4>
                    <ul class="list-disc list-inside text-sm text-red-700 dark:text-red-300">
                        <li *ngFor="let error of validationErrors">{{ error }}</li>
                    </ul>
                </div>

                <!-- Upload Success -->
                <div *ngIf="uploadSuccess" class="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 class="font-medium text-green-800 dark:text-green-400 mb-2">Upload Successful!</h4>
                    <p class="text-sm text-green-700 dark:text-green-300">
                        Parsed {{ uploadResult?.upload?.macros_parsed || 0 }} macros,
                        created {{ uploadResult?.upload?.macros_created || 0 }} in database.
                    </p>
                </div>

            </form>
        </mat-dialog-content>

        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()" [disabled]="uploading">Cancel</button>
            <button
                mat-raised-button
                color="primary"
                (click)="onUpload()"
                [disabled]="!uploadForm.valid || !selectedFile || uploading">
                <mat-icon>upload</mat-icon>
                Upload
            </button>
        </mat-dialog-actions>
    `,
    styles: [`
        mat-dialog-content {
            min-width: 500px;
            max-width: 600px;
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
    uploading = false;
    uploadSuccess = false;
    validationErrors: string[] = [];
    uploadResult: any = null;

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
            character_class: [''],
            create_macros: [true]
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
            this.uploadSuccess = false;
        }
    }

    removeFile(event: Event): void {
        event.stopPropagation();
        this.selectedFile = null;
        this.validationErrors = [];
        this.uploadSuccess = false;
    }

    formatFileSize(bytes: number): string {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
    }

    onUpload(): void {
        if (!this.uploadForm.valid || !this.selectedFile) {
            return;
        }

        this.uploading = true;
        this.validationErrors = [];
        this.uploadSuccess = false;

        const formValue = this.uploadForm.value;

        this.macroFileService.uploadMacroFile({
            file: this.selectedFile,
            file_type: formValue.file_type,
            character_class: formValue.character_class || undefined,
            create_macros: formValue.create_macros
        }).subscribe({
            next: (response) => {
                this.uploading = false;
                this.uploadSuccess = true;
                this.uploadResult = response;

                if (response.validation.warnings.length > 0) {
                    this.snackBar.open(
                        `Upload successful with ${response.validation.warnings.length} warning(s)`,
                        'Close',
                        { duration: 5000 }
                    );
                } else {
                    this.snackBar.open('Macro file uploaded successfully!', 'Close', { duration: 3000 });
                }

                // Close dialog after 2 seconds
                setTimeout(() => {
                    this.dialogRef.close(response);
                }, 2000);
            },
            error: (error) => {
                this.uploading = false;
                console.error('Upload error:', error);

                if (error.error?.errors) {
                    this.validationErrors = error.error.errors.map((e: any) => e.message || e.msg || JSON.stringify(e));
                } else if (error.error?.message) {
                    this.validationErrors = [error.error.message];
                } else {
                    this.validationErrors = ['An error occurred while uploading the file'];
                }

                this.snackBar.open('Failed to upload macro file', 'Close', { duration: 5000 });
            }
        });
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}

