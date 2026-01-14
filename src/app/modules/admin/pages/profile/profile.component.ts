import { TextFieldModule } from '@angular/cdk/text-field';
import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatDialog } from '@angular/material/dialog';
import { Router, RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { MacroService } from 'app/modules/macros/services/macro.service';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { SettingsService } from 'app/core/services/user/settings.service';
import { User } from 'app/core/user/user.types';
import { Settings } from 'app/core/settings/settings.types';
import { classes } from 'app/core/data/classes';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { MacroFileService } from 'app/modules/macros/services/macro-file.service';

@Component({
    selector: 'profile',
    templateUrl: './profile.component.html',
    encapsulation: ViewEncapsulation.None,
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FuseCardComponent,
        MatIconModule,
        MatButtonModule,
        MatMenuModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        TextFieldModule,
        MatDividerModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        RouterLink,
    ],
})
export class ProfileComponent implements OnInit, OnDestroy {
    user: User | null = null;
    macroCount: number = 0;
    keybindingCount: number = 0;
    fileCount: number = 0;
    isLoading: boolean = true;

    passwordForm: FormGroup;
    isChangingPassword: boolean = false;
    showPasswordForm: boolean = false;

    usernameForm: FormGroup;
    isChangingUsername: boolean = false;
    showUsernameForm: boolean = false;

    classes = classes;
    favoriteClass: string | null = null;
    isSavingClass: boolean = false;

    private destroy$ = new Subject<void>();

    /**
     * Constructor
     */
    constructor(
        private macroService: MacroService,
        private keybindingService: KeybindingService,
        private authService: AuthService,
        private userService: UserService,
        private settingsService: SettingsService,
        private macroFileService: MacroFileService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private fb: FormBuilder,
        private snackBar: MatSnackBar
    ) {
        this.passwordForm = this.fb.group({
            currentPassword: ['', Validators.required],
            newPassword: ['', [Validators.required, Validators.minLength(8)]],
            confirmPassword: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });

        this.usernameForm = this.fb.group({
            newUsername: ['', [Validators.required, Validators.minLength(3)]],
        });
    }

    ngOnInit(): void {
        this.loadData();
        this.loadFileCount();
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

    loadData(): void {
        console.log('Profile - loadData called');
        this.isLoading = true;
        this.cdr.markForCheck();

        // Get user data immediately from the service
        this.userService.user$.pipe(takeUntil(this.destroy$)).subscribe({
            next: (user) => {
                console.log('Profile - user data:', user);
                this.user = user;
                // Load favorite class from user object first, then fallback to localStorage
                if (user?.favoriteClass) {
                    this.favoriteClass = user.favoriteClass;
                }
                this.cdr.markForCheck();
            },
            error: (error) => {
                console.error('Profile - Error loading user:', error);
                this.cdr.markForCheck();
            }
        });

        // Load user settings to get favorite class (fallback if not in user object)
        try {
            const settings = localStorage.getItem('settings');
            if (settings) {
                const parsedSettings = JSON.parse(settings);
                if (!this.favoriteClass && parsedSettings.favoriteClass) {
                    this.favoriteClass = parsedSettings.favoriteClass;
                }
            }
        } catch (error) {
            console.error('Profile - Error loading settings:', error);
        }

        // Load counts (non-blocking)
        forkJoin({
            macros: this.macroService.getMyMacros(),
            keybindings: this.keybindingService.getKeybindings()
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (result) => {
                    console.log('Profile - loaded counts:', result);
                    this.macroCount = result.macros.macros?.length || 0;
                    this.keybindingCount = result.keybindings.length || 0;
                    this.isLoading = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Profile - Error loading counts:', error);
                    this.macroCount = 0;
                    this.keybindingCount = 0;
                    this.isLoading = false;
                    this.cdr.markForCheck();
                }
            });
    }

    goToMyMacros(): void {
        this.router.navigate(['/macros/my-macros']);
    }

    goToMyKeybindings(): void {
        this.router.navigate(['/keybinds/my-keybindings']);
    }

    togglePasswordForm(): void {
        this.showPasswordForm = !this.showPasswordForm;
        if (!this.showPasswordForm) {
            this.passwordForm.reset();
        }
        this.cdr.markForCheck();
    }

    changePassword(): void {
        if (this.passwordForm.invalid) {
            this.snackBar.open('Please fill in all fields correctly', 'Close', { duration: 3000 });
            return;
        }

        this.isChangingPassword = true;
        const formValue = this.passwordForm.value;

        this.authService.changePassword({
            currentPassword: formValue.currentPassword,
            newPassword: formValue.newPassword
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.snackBar.open('Password changed successfully', 'Close', { duration: 3000 });
                    this.passwordForm.reset();
                    this.showPasswordForm = false;
                    this.isChangingPassword = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error changing password:', error);
                    this.snackBar.open(
                        error.error?.message || 'Failed to change password. Please check your current password.',
                        'Close',
                        { duration: 5000 }
                    );
                    this.isChangingPassword = false;
                    this.cdr.markForCheck();
                }
            });
    }

    onFavoriteClassChange(className: string): void {
        this.isSavingClass = true;

        const settings: Settings = {
            favoriteClass: className
        };

        this.settingsService.saveSettings(settings)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => {
                    this.favoriteClass = className;
                    
                    // Update user object if it exists
                    if (this.user) {
                        this.user = { ...this.user, favoriteClass: className };
                        this.userService.user = this.user;
                    }
                    
                    // Update localStorage
                    const currentSettings = JSON.parse(localStorage.getItem('settings') || '{}');
                    currentSettings.favoriteClass = className;
                    localStorage.setItem('settings', JSON.stringify(currentSettings));

                    this.snackBar.open(`Favorite class set to ${className}`, 'Close', { duration: 3000 });
                    this.isSavingClass = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error saving favorite class:', error);
                    this.snackBar.open('Failed to save favorite class', 'Close', { duration: 3000 });
                    this.isSavingClass = false;
                    this.cdr.markForCheck();
                }
            });
    }

    toggleUsernameForm(): void {
        this.showUsernameForm = !this.showUsernameForm;
        if (!this.showUsernameForm) {
            this.usernameForm.reset();
        }
        this.cdr.markForCheck();
    }

    changeUsername(): void {
        if (this.usernameForm.invalid) {
            this.snackBar.open('Please enter a valid username', 'Close', { duration: 3000 });
            return;
        }

        this.isChangingUsername = true;
        const newUsername = this.usernameForm.get('newUsername')?.value;

        this.authService.updateProfile({ username: newUsername })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.snackBar.open('Username changed successfully', 'Close', { duration: 3000 });

                    // Update the user object with new username
                    if (this.user && response.user) {
                        this.user = { ...this.user, ...response.user };

                        // Update the user in the service and localStorage
                        this.userService.user = this.user;
                        const currentUser = localStorage.getItem('currentUser');
                        if (currentUser) {
                            const userData = JSON.parse(currentUser);
                            userData.username = response.user.username;
                            localStorage.setItem('currentUser', JSON.stringify(userData));
                        }
                    }

                    this.usernameForm.reset();
                    this.showUsernameForm = false;
                    this.isChangingUsername = false;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error changing username:', error);
                    this.snackBar.open(
                        error.error?.message || 'Failed to change username. It may already be taken.',
                        'Close',
                        { duration: 5000 }
                    );
                    this.isChangingUsername = false;
                    this.cdr.markForCheck();
                }
            });
    }

    loadFileCount(): void {
        // Get a large number of files to count all uploads (limit of 1000 should be sufficient for most users)
        this.macroFileService.getDownloadHistory(undefined, undefined, 1000, 1)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    // Count only uploaded files (source: 'upload')
                    this.fileCount = response.downloads.filter((d: any) => d.source === 'upload').length;
                    this.cdr.markForCheck();
                },
                error: (error) => {
                    console.error('Error loading file count:', error);
                    this.fileCount = 0;
                    this.cdr.markForCheck();
                }
            });
    }
}
