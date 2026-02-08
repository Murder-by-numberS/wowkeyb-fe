import { CommonModule } from '@angular/common';
import {
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    Component,
    OnDestroy,
    OnInit,
    ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { Router, RouterLink } from '@angular/router';
import { FuseCardComponent } from '@fuse/components/card';
import { MacroService } from 'app/modules/macros/services/macro.service';
import { KeybindingService } from 'app/core/services/keybinding.service';
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
    host: {
        class: 'flex flex-col flex-auto w-full h-full overflow-y-auto'
    },
    imports: [
        CommonModule,
        FuseCardComponent,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
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

    // Limits
    readonly macroLimit: number = 200;
    readonly keybindingLimit: number = 10;

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
        private userService: UserService,
        private settingsService: SettingsService,
        private macroFileService: MacroFileService,
        private router: Router,
        private cdr: ChangeDetectorRef,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this.loadData();
        this.loadFileCount();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
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
                // Handle both camelCase (favoriteClass) and snake_case (favorite_class) for backward compatibility
                if (user?.favoriteClass) {
                    this.favoriteClass = user.favoriteClass;
                } else if ((user as any)?.favorite_class) {
                    this.favoriteClass = (user as any).favorite_class;
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
