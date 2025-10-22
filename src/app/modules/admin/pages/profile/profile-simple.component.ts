import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FuseCardComponent } from '@fuse/components/card';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { User } from 'app/core/user/user.types';
import { HttpClient } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
    selector: 'profile-simple',
    template: `
        <div class="flex flex-col w-full max-w-4xl mx-auto p-6 sm:p-8">
            <div class="mb-8">
                <h1 class="text-3xl font-bold tracking-tight">Profile</h1>
                <p class="text-secondary mt-2">Manage your account settings and preferences</p>
            </div>

            <div class="flex flex-col gap-6">
                <!-- Profile Information -->
                <fuse-card class="flex flex-col">
                    <div class="px-6 py-4 border-b">
                        <h2 class="text-xl font-semibold">Profile Information</h2>
                    </div>
                    <div class="p-6">
                        <form [formGroup]="profileForm" (ngSubmit)="updateProfile()">
                            <div class="flex flex-col gap-4">
                                <!-- Email (Read-only) -->
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Email</mat-label>
                                    <input matInput [value]="user?.email" readonly disabled>
                                    <mat-hint>Email cannot be changed</mat-hint>
                                </mat-form-field>


                                <!-- Username -->
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Username</mat-label>
                                    <input matInput formControlName="username" placeholder="Enter your username">
                                    <mat-error *ngIf="profileForm.get('username')?.hasError('required')">
                                        Username is required
                                    </mat-error>
                                    <mat-error *ngIf="profileForm.get('username')?.hasError('minlength')">
                                        Username must be at least 3 characters
                                    </mat-error>
                                    <mat-error *ngIf="profileForm.get('username')?.hasError('maxlength')">
                                        Username must be no more than 30 characters
                                    </mat-error>
                                    <mat-error *ngIf="profileForm.get('username')?.hasError('pattern')">
                                        Username can only contain letters, numbers, and underscores
                                    </mat-error>
                                </mat-form-field>

                                <!-- Description -->
                                <mat-form-field appearance="outline" class="w-full">
                                    <mat-label>Description</mat-label>
                                    <textarea
                                        matInput
                                        formControlName="description"
                                        placeholder="Tell us about yourself..."
                                        rows="4"
                                        maxlength="500">
                                    </textarea>
                                    <mat-hint align="end">{{ profileForm.get('description')?.value?.length || 0 }}/500</mat-hint>
                                </mat-form-field>

                                <!-- Update Button -->
                                <div class="flex justify-end">
                                    <button
                                        mat-flat-button
                                        color="primary"
                                        type="submit"
                                        [disabled]="profileForm.invalid || isUpdatingProfile">
                                        <mat-icon *ngIf="isUpdatingProfile" [svgIcon]="'heroicons_outline:arrow-path'" class="animate-spin"></mat-icon>
                                        <span>{{ isUpdatingProfile ? 'Updating...' : 'Update Profile' }}</span>
                                    </button>
                                </div>
                            </div>
                        </form>
                    </div>
                </fuse-card>

                <!-- Change Password -->
                <fuse-card class="flex flex-col">
                    <div class="px-6 py-4 border-b">
                        <div class="flex items-center justify-between">
                            <h2 class="text-xl font-semibold">Change Password</h2>
                            <span *ngIf="passwordChangedAt" class="text-sm text-secondary">
                                Last changed: {{ passwordChangedAt | date:'medium' }}
                            </span>
                        </div>
                    </div>
                    <div class="p-6">
                        <button
                            *ngIf="!showPasswordForm"
                            mat-stroked-button
                            (click)="togglePasswordForm()">
                            <mat-icon [svgIcon]="'heroicons_outline:lock-closed'"></mat-icon>
                            <span class="ml-2">Change Password</span>
                        </button>

                        <div *ngIf="showPasswordForm">
                            <form [formGroup]="passwordForm" (ngSubmit)="changePassword()">
                                <div class="flex flex-col gap-4">
                                    <!-- Current Password -->
                                    <mat-form-field class="w-full">
                                        <mat-label>Current Password</mat-label>
                                        <input
                                            matInput
                                            type="password"
                                            formControlName="currentPassword"
                                            required>
                                        <mat-icon
                                            matPrefix
                                            class="icon-size-5"
                                            [svgIcon]="'heroicons_solid:lock-closed'">
                                        </mat-icon>
                                        <mat-error *ngIf="passwordForm.get('currentPassword')?.hasError('required')">
                                            Current password is required
                                        </mat-error>
                                    </mat-form-field>

                                    <!-- New Password -->
                                    <mat-form-field class="w-full">
                                        <mat-label>New Password</mat-label>
                                        <input
                                            matInput
                                            type="password"
                                            formControlName="newPassword"
                                            required>
                                        <mat-icon
                                            matPrefix
                                            class="icon-size-5"
                                            [svgIcon]="'heroicons_solid:lock-closed'">
                                        </mat-icon>
                                        <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('required')">
                                            New password is required
                                        </mat-error>
                                        <mat-error *ngIf="passwordForm.get('newPassword')?.hasError('minlength')">
                                            Password must be at least 8 characters
                                        </mat-error>
                                    </mat-form-field>

                                    <!-- Confirm Password -->
                                    <mat-form-field class="w-full">
                                        <mat-label>Confirm New Password</mat-label>
                                        <input
                                            matInput
                                            type="password"
                                            formControlName="confirmPassword"
                                            required>
                                        <mat-icon
                                            matPrefix
                                            class="icon-size-5"
                                            [svgIcon]="'heroicons_solid:lock-closed'">
                                        </mat-icon>
                                        <mat-error *ngIf="passwordForm.get('confirmPassword')?.hasError('required')">
                                            Please confirm your new password
                                        </mat-error>
                                        <mat-error *ngIf="passwordForm.hasError('passwordMismatch') && !passwordForm.get('confirmPassword')?.hasError('required')">
                                            Passwords do not match
                                        </mat-error>
                                    </mat-form-field>

                                    <!-- Buttons -->
                                    <div class="flex items-center gap-2">
                                        <button
                                            mat-flat-button
                                            color="primary"
                                            type="submit"
                                            [disabled]="passwordForm.invalid || isChangingPassword">
                                            <mat-spinner
                                                *ngIf="isChangingPassword"
                                                [diameter]="20"
                                                class="mr-2">
                                            </mat-spinner>
                                            <span>{{ isChangingPassword ? 'Changing...' : 'Change Password' }}</span>
                                        </button>
                                        <button
                                            mat-button
                                            type="button"
                                            (click)="togglePasswordForm()">
                                            Cancel
                                        </button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </fuse-card>
            </div>
        </div>
    `,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FuseCardComponent,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
    ]
})
export class ProfileSimpleComponent implements OnInit, OnDestroy {
    passwordForm: FormGroup;
    profileForm: FormGroup;
    isChangingPassword: boolean = false;
    isUpdatingProfile: boolean = false;
    showPasswordForm: boolean = false;
    user: User | null = null;
    passwordChangedAt: Date | null = null;
    private destroy$ = new Subject<void>();

    constructor(
        private fb: FormBuilder,
        private authService: AuthService,
        private userService: UserService,
        private http: HttpClient,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef
    ) {
        console.log('ProfileSimpleComponent constructor');
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });

        this.profileForm = this.fb.group({
            description: ['', [Validators.maxLength(500)]],
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(30), Validators.pattern(/^[a-zA-Z0-9_]+$/)]]
        });
    }

    ngOnInit(): void {
        console.log('ProfileSimpleComponent ngOnInit');

        // Get user data
        this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (user) => {
                this.user = user;
                if (user?.passwordChangedAt) {
                    this.passwordChangedAt = new Date(user.passwordChangedAt);
                }

                // Update profile form with user data
                if (user) {
                    this.profileForm.patchValue({
                        description: user.description || '',
                        username: user.username || ''
                    });
                }

                this.cdr.markForCheck();
            }
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    passwordMatchValidator(form: FormGroup) {
        const newPassword = form.get('newPassword')?.value;
        const confirmPassword = form.get('confirmPassword')?.value;
        return newPassword === confirmPassword ? null : { passwordMismatch: true };
    }

    togglePasswordForm(): void {
        this.showPasswordForm = !this.showPasswordForm;
        if (!this.showPasswordForm) {
            this.passwordForm.reset();
        }
    }

    changePassword(): void {
        if (this.passwordForm.invalid) {
            this.snackBar.open('Please fill in all fields correctly', 'Close', { duration: 3000 });
            return;
        }

        this.isChangingPassword = true;
        const formValue = this.passwordForm.value;

        // Backend expects 'op' (old password) and 'np' (new password)
        this.authService.changePassword({
            op: formValue.currentPassword,
            np: formValue.newPassword
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.snackBar.open('Password changed successfully! A confirmation email has been sent.', 'Close', { duration: 5000 });
                    this.passwordForm.reset();
                    this.showPasswordForm = false;
                    this.isChangingPassword = false;

                    // Update the password changed date
                    if (response?.passwordChangedAt) {
                        this.passwordChangedAt = new Date(response.passwordChangedAt);
                    }

                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error changing password:', error);
                    const errorMessage = error.error?.message || 'Failed to change password. Please check your current password.';
                    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                    this.isChangingPassword = false;
                    this.cdr.markForCheck();
                }
            });
    }


    updateProfile(): void {
        if (this.profileForm.invalid) {
            this.snackBar.open('Please check the form for errors', 'Close', { duration: 3000 });
            return;
        }

        this.isUpdatingProfile = true;
        const formValue = this.profileForm.value;

        this.http.post('/api/user/update-profile', formValue)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response: any) => {
                    this.snackBar.open('Profile updated successfully!', 'Close', { duration: 3000 });
                    this.isUpdatingProfile = false;

                    // Update user data in the service
                    if (response?.user) {
                        this.userService.user = response.user;
                    }

                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error updating profile:', error);
                    const errorMessage = error.error?.message || 'Failed to update profile.';
                    this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                    this.isUpdatingProfile = false;
                    this.cdr.markForCheck();
                }
            });
    }
}

