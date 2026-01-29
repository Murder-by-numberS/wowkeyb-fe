//Angular
import { Component, ViewEncapsulation, OnInit, ViewChild, EventEmitter, Output, Input, SimpleChanges, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgClass, CommonModule } from '@angular/common';

import { Subject, takeUntil } from 'rxjs';

//Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';

//Components
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { AbilitiesComponent } from '../abilities/abilities.component';
import { KeybindsDrawerComponent } from '../keybinds-drawer/keybinds-drawer.component';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { ShareDialogComponent } from '../share-dialog/share-dialog.component';
import { VersionCopyDialogComponent, VersionCopyDialogData } from '../version-copy-dialog/version-copy-dialog.component';
import { DeleteKeybindingDialogComponent, DeleteKeybindingDialogResult } from '../delete-keybinding-dialog/delete-keybinding-dialog.component';

//Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';

//Types
import { Keybinding } from 'app/core/types/keybinding';

@Component({
    selector: 'my-keybindings',
    templateUrl: './my-keybindings.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    host: {
        class: 'flex flex-col flex-auto w-full h-full'
    },
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatDialogModule,

        KeyboardComponent,
        AbilitiesComponent,
        KeybindsDrawerComponent
    ],
})
export class MyKeybindingsComponent implements OnInit {
    @ViewChild(KeybindsDrawerComponent) keybindsDrawerComponent: KeybindsDrawerComponent;
    @ViewChild(AbilitiesComponent) abilitiesComponent: AbilitiesComponent;
    @ViewChild(KeyboardComponent) keyboard: KeyboardComponent;

    isAuthenticated: boolean;
    isMobile: boolean = false;

    nameForm: FormGroup;

    opened: boolean = true; // Show drawer by default for my-keybindings
    drawerOpen: boolean = true; // Drawer is open by default (matches my-macros)

    selectedKeybinding: any = null;
    selectedKeybindingName: string;
    keybindingSelected: boolean;
    selectedKeybindingClass: string;
    selectedKeybindingSpec: string;
    selectedKeybindingHeroTalent: string;

    refresh: boolean = false;

    editingName: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    currentUserId: string | null = null;
    keybindings: any[] = [];  // Initialize as empty array
    MAX_SIZE = 10;

    // Version switching
    keybindingVersions: Array<{ keybindingId: string; versionId: string; gameVersion: string; isCurrent: boolean }> = [];
    availableVersions: Array<{ id: string; gameVersion: string }> = [];
    versionsWithoutKeybinding: Array<{ id: string; gameVersion: string }> = [];
    isCopyingToVersion = false;

    constructor(
        private keybindingService: KeybindingService,
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _userService: UserService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar,
        private cdr: ChangeDetectorRef) {

        this.keybindingSelected = false;
    }

    ngOnInit(): void {
        // Check if device is mobile
        this.checkMobile();
        window.addEventListener('resize', () => this.checkMobile());

        this._authService.check()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((authenticated) => {
                this.isAuthenticated = authenticated;

                // If user is not authenticated, redirect to home
                if (!authenticated) {
                    this.router.navigate(['/keybinds']);
                    return;
                }

                // Force refresh keybindings on page load to ensure we have the latest data
                this.keybindingService.forceRefreshKeybindings().subscribe({
                    next: (keybindings) => {
                        console.log('Keybindings refreshed on page load:', keybindings.length);

                        if (this.keybindsDrawerComponent) {
                            this.keybindsDrawerComponent.loadKeybindings();
                        }
                    },
                    error: (error) => {
                        console.error('Error refreshing keybindings on page load:', error);
                        // Fallback to regular getKeybindings if force refresh fails
                        this.getKeybindings(authenticated);
                    }
                });
            });

        // Subscribe to user service to get current user ID
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                this.currentUserId = user?._id || null;
            });

        this.nameForm = this._formBuilder.group({
            name: ['', [Validators.required, Validators.maxLength(32)]]
        });

        // Subscribe to keybindings to keep track of count
        this.keybindingService.currentKeybindings
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(keybindings => {
                this.keybindings = keybindings;
                console.log('Current keybindings count:', this.keybindings.length);
            });

        // Subscribe to route parameters and query parameters
        this.route.params
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                if (params['id']) {
                    const id = params['id'];
                    this.keybindingService.getKeybinding(id).subscribe({
                        next: (keybinding) => {
                            this.onKeybindingSelected(keybinding);
                        },
                        error: (error) => {
                            console.error('Error loading keybinding:', error);
                        }
                    });
                }
            });

        // Check for query parameters
        this.route.queryParams
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(params => {
                if (params['keybindingId']) {
                    const keybindingId = params['keybindingId'];
                    const shouldDuplicate = params['duplicate'] === 'true';

                    // Load the keybinding
                    this.keybindingService.getKeybinding(keybindingId).subscribe({
                        next: (keybinding) => {
                            if (shouldDuplicate) {
                                // Duplicate the keybinding
                                this.duplicateKeybinding(keybinding);
                            } else {
                                // Just select the keybinding
                                this.onKeybindingSelected(keybinding);
                                // Update drawer selection after a short delay
                                setTimeout(() => {
                                    if (this.keybindsDrawerComponent) {
                                        this.keybindsDrawerComponent.setSelectedKeybinding(keybinding);
                                    }
                                }, 0);
                            }
                            // Remove the query parameters
                            this.router.navigate(['/keybinds/my-keybindings'], { replaceUrl: true });
                        },
                        error: (error) => {
                            console.error('Error loading keybinding:', error);
                            // Remove the query parameters even if there's an error
                            this.router.navigate(['/keybinds/my-keybindings'], { replaceUrl: true });
                        }
                    });
                }
            });

        // Subscribe to keybindings to select the last one
        this.keybindingService.currentKeybindings
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(keybindings => {
                if (keybindings.length > 0 && !this.selectedKeybinding && !this.route.snapshot.queryParams['id']) {
                    const lastKeybinding = keybindings[keybindings.length - 1];
                    this.onKeybindingSelected(lastKeybinding);
                }
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    getKeybindings(authenticated: boolean = false) {
        if (authenticated) {
            // If authenticated, fetch fresh data from backend
            this.keybindingService.getKeybindings().subscribe({
                next: (keybindings) => {
                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }
                },
                error: (error) => {
                    console.error('Failed to fetch keybindings from backend:', error);
                    // Show empty state if backend fails
                    this.keybindingService.clearKeybindings();
                }
            });
        } else {
            // If not authenticated, show empty state
            this.keybindingService.clearKeybindings();
        }
    }

    onKeybindingSelected(keybinding: any) {
        if (keybinding) {
            // Get the latest version of the keybinding from the service's current keybindings
            this.keybindingService.currentKeybindings
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(keybindings => {
                    const updatedKeybinding = keybindings.find(kb => kb.keybindingId === keybinding.keybindingId);
                    if (updatedKeybinding) {
                        // Update the selected keybinding with the latest data
                        this.selectedKeybinding = updatedKeybinding;
                        this.selectedKeybindingName = this.selectedKeybinding.name;
                        this.keybindingSelected = true;
                        this.nameForm.get('name')?.setValue(this.selectedKeybindingName);

                        // Update the class, spec, and heroTalent selections
                        this.selectedKeybindingClass = updatedKeybinding.class;
                        this.selectedKeybindingSpec = updatedKeybinding.spec;
                        this.selectedKeybindingHeroTalent = updatedKeybinding.heroTalent;

                        // If this is a new keybinding with random class details, use them to fetch abilities
                        if (updatedKeybinding.randomClassDetails) {
                            console.log('New keybinding with random class details:', updatedKeybinding.randomClassDetails);

                            // The abilities component will pick up the randomClassDetails from the selectedKeybinding
                            // and use them in ngOnChanges to populate the abilities
                            console.log('Selected keybinding with randomClassDetails:', this.selectedKeybinding);

                            // Force change detection by creating a new object reference
                            // This ensures ngOnChanges is triggered in the abilities component
                            this.selectedKeybinding = { ...this.selectedKeybinding };
                        }

                        // Update the drawer's selection
                        if (this.keybindsDrawerComponent) {
                            this.keybindsDrawerComponent.setSelectedKeybinding(updatedKeybinding);
                        }

                        // Trigger the change events to update the abilities component
                        this.onSelectionClassChanged(updatedKeybinding.class);

                        // Force change detection to ensure UI updates
                        this.cdr.detectChanges();

                        // Additional trigger for keyboard component
                        setTimeout(() => {
                            this.cdr.detectChanges();
                        }, 0);

                        // Close drawer on mobile after selecting a keybinding
                        if (this.isMobile) {
                            this.opened = false;
                            this.drawerOpen = false;
                        }

                        // Load versions for version switching
                        this.loadVersions(updatedKeybinding.keybindingId);
                    }
                });
        }
        else {
            this.selectedKeybinding = null;
            this.selectedKeybindingName = null;
            this.keybindingSelected = false;
            this.keybindingVersions = [];
            this.versionsWithoutKeybinding = [];
            this.nameForm.get('name')?.setValue('');
            this.selectedKeybindingClass = null;
            this.selectedKeybindingSpec = null;
            this.selectedKeybindingHeroTalent = null;
            if (this.abilitiesComponent) {
                this.abilitiesComponent.abilities = [];
                this.abilitiesComponent.fetchAbilities();
            }
            // Force change detection to ensure UI updates
            this.cdr.detectChanges();
        }
    }

    onSelectionClassChanged(value: string) {
        this.selectedKeybindingClass = value;
        // You can also perform other actions here
    }

    selectNextKeybindingAfterDeletion(deletedIndex: number, originalLength: number) {
        console.log('selectNextKeybindingAfterDeletion called:', {
            deletedIndex,
            originalLength,
            currentKeybindingsLength: this.keybindingService.currentKeybindingsValue.length
        });

        // Get the updated keybindings list (after deletion)
        const updatedKeybindings = this.keybindingService.currentKeybindingsValue;

        if (updatedKeybindings.length === 0) {
            console.log('No keybindings left after deletion');
            return;
        }

        // Determine which keybinding to select next
        let nextIndex: number;

        if (deletedIndex === 0) {
            // If we deleted the first item, select the new first item
            nextIndex = 0;
        } else if (deletedIndex >= updatedKeybindings.length) {
            // If we deleted the last item, select the new last item
            nextIndex = updatedKeybindings.length - 1;
        } else {
            // Select the item at the same index (which is now the "next" item)
            nextIndex = deletedIndex;
        }

        console.log('Selecting keybinding at index:', nextIndex);
        const nextKeybinding = updatedKeybindings[nextIndex];

        if (nextKeybinding) {
            console.log('Auto-selecting next keybinding:', nextKeybinding.name);
            this.onKeybindingSelected(nextKeybinding);
        }
    }

    deleteKeybinding(keybinding: Keybinding | null) {
        if (!keybinding) {
            console.error('No keybinding provided for deletion');
            return;
        }

        // Get current keybindings to determine which one to select next
        const currentKeybindings = this.keybindingService.currentKeybindingsValue;
        const deletedIndex = currentKeybindings.findIndex(kb => kb.keybindingId === keybinding.keybindingId);

        const dialogRef = this.dialog.open(DeleteKeybindingDialogComponent, {
            data: { keybinding },
            width: '500px',
            disableClose: true
        });

        dialogRef.afterClosed().subscribe((result: DeleteKeybindingDialogResult | undefined) => {
            if (result?.confirmed) {
                console.log('Deleted keybinding versions:', result.deletedVersionIds);

                // Clear the selected keybinding immediately
                this.selectedKeybinding = null;
                this.keybindingSelected = false;
                this.selectedKeybindingName = '';
                this.nameForm.get('name')?.setValue('');

                // Clear the drawer selection as well
                if (this.keybindsDrawerComponent) {
                    this.keybindsDrawerComponent.clearSelection();
                }

                // Force refresh keybindings from server to update the list
                this.keybindingService.forceRefreshKeybindings().subscribe({
                    next: () => {
                        // Select the next keybinding after deletion
                        setTimeout(() => {
                            this.selectNextKeybindingAfterDeletion(deletedIndex, currentKeybindings.length);
                        }, 100);
                    }
                });

                // Show success message
                const deletedCount = result.deletedVersionIds?.length || 1;
                this.snackBar.open(
                    deletedCount > 1
                        ? `Deleted ${deletedCount} version(s) successfully`
                        : 'Keybinding deleted successfully',
                    'Close',
                    { duration: 3000 }
                );
            }
        });
    }

    refreshChildKeybindings() {
        console.log('refreshChildKeybindings');

        // Store the current selected keybinding ID to maintain selection
        const currentSelectedId = this.selectedKeybinding?.keybindingId;

        //check if loggedin
        this._authService.check().subscribe((authenticated) => {
            if (authenticated) {
                //refetch the keybindings from server
                this.keybindingService.getKeybindings().subscribe((keybindings) => {
                    console.log('refreshChildKeybindings - keybindings', keybindings);

                    // Maintain the current selection if we had a selected keybinding
                    if (currentSelectedId) {
                        const updatedKeybinding = keybindings.find(kb => kb.keybindingId === currentSelectedId);
                        if (updatedKeybinding) {
                            // Update the selected keybinding with the latest data
                            this.selectedKeybinding = updatedKeybinding;
                            this.selectedKeybindingName = updatedKeybinding.name;

                            // Set the drawer selection BEFORE loading keybindings to prevent auto-selection
                            if (this.keybindsDrawerComponent) {
                                this.keybindsDrawerComponent.setSelectedKeybinding(updatedKeybinding);
                            }
                        }
                    }

                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }

                    if (this.abilitiesComponent) {
                        this.abilitiesComponent.abilities = [];
                        // Only fetch abilities if both spec and hero talent are selected
                        if (this.selectedKeybinding?.spec && this.selectedKeybinding?.heroTalent) {
                            this.abilitiesComponent.fetchAbilities();
                        }
                    }

                    if (!this.selectedKeybinding?.spec || !this.selectedKeybinding?.heroTalent) {
                        console.log('reseting keyboard')
                        if (this.keyboard) {
                            this.keyboard.resetKeyboard();
                        }
                    }

                });
            } else {
                // Not authenticated - show empty state
                this.keybindingService.clearKeybindings();
            }
        });
    }

    refreshAbilitiesForMigratedKeybinding(migratedKeybinding: Keybinding) {
        console.log('refreshAbilitiesForMigratedKeybinding called with:', migratedKeybinding.keybindingId);

        if (this.abilitiesComponent) {
            // Clear current abilities
            this.abilitiesComponent.abilities = [];

            // If the migrated keybinding has spec and hero talent, fetch abilities
            if (migratedKeybinding.spec && migratedKeybinding.heroTalent) {
                console.log('refreshAbilitiesForMigratedKeybinding - fetching abilities for:', {
                    class: migratedKeybinding.class,
                    spec: migratedKeybinding.spec,
                    heroTalent: migratedKeybinding.heroTalent,
                    version: migratedKeybinding.version?.game_version
                });

                // Temporarily update the abilities component's selectedKeybinding to the migrated one
                const originalSelectedKeybinding = this.abilitiesComponent.selectedKeybinding;
                this.abilitiesComponent.selectedKeybinding = migratedKeybinding;

                // Fetch abilities with the migrated keybinding data
                this.abilitiesComponent.fetchAbilities();

                // Restore the original selectedKeybinding
                this.abilitiesComponent.selectedKeybinding = originalSelectedKeybinding;
            }
        }
    }

    updateKeybinding(update) {
        console.log('updated keybinding?', update);

        this.keybindingService.updateKeybindsInKeybinding(this.selectedKeybinding.keybindingId, update)
            .subscribe({
                next: (updatedKeybinding) => {
                    // Update the selected keybinding with the latest data from server
                    this.selectedKeybinding = updatedKeybinding;
                    this.selectedKeybindingName = updatedKeybinding.name;

                    // Update the drawer selection
                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.setSelectedKeybinding(updatedKeybinding);
                    }

                    // Trigger the change events to update the abilities component
                    this.onSelectionClassChanged(updatedKeybinding.class);
                },
                error: (error) => {
                    console.error('Error updating keybinding:', error);
                }
            });
    }

    shareKeybinding() {
        if (!this.selectedKeybinding) {
            return;
        }

        const isMobile = window.innerWidth < 768;
        this.dialog.open(ShareDialogComponent, {
            data: {
                keybindingId: this.selectedKeybinding.keybindingId
            },
            width: isMobile ? '95vw' : '500px',
            maxWidth: isMobile ? '95vw' : '90vw',
            maxHeight: isMobile ? '90vh' : '80vh',
            panelClass: isMobile ? 'mobile-dialog' : ''
        });
    }

    editName() {
        this.editingName = true;
    }

    saveName() {
        if (this.nameForm.valid) {
            console.log('Form Submitted', this.nameForm.value);
            this.selectedKeybindingName = this.nameForm.value.name;
            this.selectedKeybinding.name = this.selectedKeybindingName;
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { name: this.nameForm.value.name }).subscribe({
                next: (updatedKeybinding) => {
                    console.log('updatedKeybinding', updatedKeybinding);
                    this.editingName = false;

                    console.log('this.selectedKeybindingName', this.selectedKeybindingName)
                },
                error: (error) => {
                    console.error('Error updating keybinding:', error);
                }
            });
        } else {
            console.log('Form is invalid');
        }
    }

    cancelName() {
        this.editingName = false;
        console.log('this.nameForm.get(name).value', this.nameForm.get('name').value);
        this.nameForm.reset(); // Resets the form to its initial state
        this.nameForm.get('name')?.setValue(this.selectedKeybindingName);
        console.log('Form reset');
    }

    togglePublic(): void {
        if (!this.selectedKeybinding) return;

        const newPublicStatus = !this.selectedKeybinding.isPublic;
        this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, {
            isPublic: newPublicStatus
        }).subscribe({
            next: (updatedKeybinding) => {
                // Update the selected keybinding
                this.selectedKeybinding = updatedKeybinding;
                this.keyboard.updateKeyboardBindings();

                this.snackBar.open(
                    newPublicStatus ? 'Keybinding is now public' : 'Keybinding is now private',
                    'Close',
                    { duration: 3000 }
                );
            },
            error: (error) => {
                console.error('Error updating keybinding:', error);
                this.snackBar.open('Error updating keybinding status', 'Close', { duration: 3000 });
            }
        });
    }

    duplicateKeybinding(keybinding: Keybinding): void {
        if (!this.isAuthenticated) {
            return;
        }

        // Get current keybindings to check for existing names
        const currentKeybindings = this.keybindings;

        // Find all keybindings that start with the same name
        const baseName = keybinding.name;
        const existingNames = currentKeybindings
            .filter(kb => kb.name.startsWith(baseName))
            .map(kb => kb.name);

        // Generate the new name
        let newName = `${baseName} (Copy)`;
        let counter = 1;

        // If there are existing copies, find the highest number and increment
        const copyRegex = /\(Copy\)(?:\s*(\d+))?$/;
        const existingCopies = existingNames
            .map(name => {
                const match = name.match(copyRegex);
                return match ? (match[1] ? parseInt(match[1]) : 1) : 0;
            })
            .filter(num => !isNaN(num));

        if (existingCopies.length > 0) {
            counter = Math.max(...existingCopies) + 1;
            newName = `${baseName} (Copy ${counter})`;
        }

        this._userService.user$.pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe(user => {
            const newKeybinding = {
                ...keybinding,
                name: newName,
                keybindingId: undefined, // Let the server generate a new ID
                isPublic: false, // Default to private
                userId: user._id // Use the user ID from UserService
            };

            this.keybindingService.createKeybinding(newKeybinding).subscribe({
                next: (createdKeybinding) => {
                    // Refresh the keybindings list
                    this.keybindingService.getKeybindings().subscribe(keybindings => {
                        // Update the drawer with new keybindings
                        if (this.keybindsDrawerComponent) {
                            this.keybindsDrawerComponent.loadKeybindings();
                        }
                        // Set the selected keybinding to the new one
                        this.onKeybindingSelected(createdKeybinding);
                        // Navigate to my-keybindings with the new keybinding selected
                        this.router.navigate(['/keybinds/my-keybindings'], {
                            queryParams: { keybindingId: createdKeybinding.keybindingId }
                        });
                    });
                    this.snackBar.open('Keybinding duplicated successfully', 'Close', { duration: 3000 });
                },
                error: (error) => {
                    console.error('Error duplicating keybinding:', error);
                    this.snackBar.open('Error duplicating keybinding', 'Close', { duration: 3000 });
                }
            });
        });
    }

    // Add a method to handle the newly created keybinding
    onKeybindingCreated(newKeybinding: Keybinding): void {
        // First set the newly created keybinding as selected
        this.onKeybindingSelected(newKeybinding);

        // Then update the drawer's selection
        if (this.keybindsDrawerComponent) {
            this.keybindsDrawerComponent.setSelectedKeybinding(newKeybinding);
        }

        // Finally refresh the keybindings list
        this.refreshChildKeybindings();
    }

    onKeybindingUpdated(keybinding: Keybinding): void {
        if (!keybinding.keybindingId) {
            console.error('Invalid keybinding or missing keybindingId:', keybinding);
            return;
        }
        // This is a new keybinding (either created or duplicated)
        this.keybindingService.createKeybinding(keybinding).subscribe({
            next: (createdKeybinding) => {
                this.refreshChildKeybindings();
                // Navigate to the view page with the new keybinding selected
                this.router.navigate(['/keybinds', createdKeybinding.keybindingId]);
            },
            error: (error) => {
                console.error('Error creating keybinding:', error);
            }
        });
    }

    navigateToKeybinding(keybinding: Keybinding): void {
        this.router.navigate(['/keybinds', keybinding.keybindingId]);
    }

    toggleDrawer(): void {
        this.drawerOpen = !this.drawerOpen;
        this.opened = this.drawerOpen; // Keep opened in sync for backward compatibility
    }

    private checkMobile(): void {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 1024; // lg breakpoint

        // Only change drawer state if the mobile status changed
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                // On mobile, start with drawer closed (it will overlay when opened)
                this.opened = false;
                this.drawerOpen = false;
            } else {
                // On desktop, show drawer by default
                this.opened = true;
                this.drawerOpen = true;
            }
        }
    }

    private loadVersions(keybindingId: string): void {
        this.keybindingService.getKeybindingVersions(keybindingId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.keybindingVersions = response.versions;
                    this.availableVersions = response.availableVersions;
                    // Find versions that don't have this keybinding yet
                    const existingVersionIds = this.keybindingVersions.map(v => v.versionId);
                    this.versionsWithoutKeybinding = this.availableVersions.filter(
                        v => !existingVersionIds.includes(v.id)
                    );
                },
                error: (error) => {
                    console.error('Error loading keybinding versions:', error);
                }
            });
    }

    onVersionChange(keybindingId: string): void {
        if (keybindingId && keybindingId !== this.selectedKeybinding?.keybindingId) {
            // Always fetch the keybinding fresh from server when switching versions
            // This ensures we get the correct keybinds for that specific version
            this.keybindingService.getKeybinding(keybindingId).subscribe({
                next: (kb) => {
                    // Directly update the selected keybinding without going through the stream
                    // since the stream only contains the latest version of each keybinding
                    this.selectedKeybinding = kb;
                    this.selectedKeybindingName = kb.name;
                    this.keybindingSelected = true;
                    this.nameForm.get('name')?.setValue(kb.name);

                    // Update the class, spec, and heroTalent selections
                    this.selectedKeybindingClass = kb.class;
                    this.selectedKeybindingSpec = kb.spec;
                    this.selectedKeybindingHeroTalent = kb.heroTalent;

                    // Update the drawer's selection
                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.setSelectedKeybinding(kb);
                    }

                    // Trigger the change events to update the abilities component
                    this.onSelectionClassChanged(kb.class);

                    // Force change detection to ensure UI updates
                    this.cdr.detectChanges();

                    // Reload versions to update the dropdown
                    this.loadVersions(keybindingId);
                },
                error: (error) => {
                    console.error('Error loading keybinding:', error);
                }
            });
        }
    }

    copyToVersion(versionId: string): void {
        if (!this.selectedKeybinding || this.isCopyingToVersion) return;

        this.isCopyingToVersion = true;
        this.keybindingService.copyToVersion(this.selectedKeybinding.keybindingId, versionId)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response) => {
                    this.isCopyingToVersion = false;

                    // Show the version copy dialog with changes
                    const dialogData: VersionCopyDialogData = {
                        targetVersion: response.targetVersion,
                        changes: response.changes,
                        keybindingId: response.keybinding.keybindingId
                    };

                    const dialogRef = this.dialog.open(VersionCopyDialogComponent, {
                        data: dialogData,
                        disableClose: false
                    });

                    dialogRef.afterClosed().subscribe(result => {
                        if (result?.action === 'view') {
                            // Refresh and select the new keybinding
                            this.keybindingService.forceRefreshKeybindings().subscribe({
                                next: () => {
                                    this.keybindingService.getKeybinding(result.keybindingId).subscribe({
                                        next: (kb) => {
                                            this.onKeybindingSelected(kb);
                                            if (this.keybindsDrawerComponent) {
                                                this.keybindsDrawerComponent.loadKeybindings();
                                            }
                                        }
                                    });
                                }
                            });
                        }
                        // Reload versions to show the new one
                        if (this.selectedKeybinding) {
                            this.loadVersions(this.selectedKeybinding.keybindingId);
                        }
                        // Refresh the keybindings list
                        this.refreshChildKeybindings();
                    });
                },
                error: (error) => {
                    console.error('Error copying keybinding:', error);
                    this.snackBar.open(error.error?.message || 'Error copying keybinding', 'Close', { duration: 5000 });
                    this.isCopyingToVersion = false;
                }
            });
    }
}
