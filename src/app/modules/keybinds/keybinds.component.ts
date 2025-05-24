//Angular
import { Component, ViewEncapsulation, OnInit, ViewChild, EventEmitter, Output, Input, SimpleChanges, inject } from '@angular/core';
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
import { KeyboardComponent } from './keyboard/keyboard.component';
import { AbilitiesComponent } from './abilities/abilities.component';
import { KeybindsDrawerComponent } from './keybinds-drawer/keybinds-drawer.component';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { ShareDialogComponent } from './share-dialog/share-dialog.component';
import { ViewAllKeybindingsComponent } from './view-all-keybindings/view-all-keybindings.component';
import { ViewKeybindingComponent } from './view-keybinding/view-keybinding.component';
import { KeybindsHomeComponent } from './keybinds-home/keybinds-home.component';

//Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';

//Types
import { Keybinding } from 'app/core/types/keybinding';

@Component({
    selector: 'keybinds',
    templateUrl: './keybinds.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
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
        KeybindsDrawerComponent,
        ViewAllKeybindingsComponent,
        ViewKeybindingComponent,
        KeybindsHomeComponent
    ],
})
export class KeybindsComponent implements OnInit {
    @ViewChild(KeybindsDrawerComponent) keybindsDrawerComponent: KeybindsDrawerComponent;
    @ViewChild(AbilitiesComponent) abilitiesComponent: AbilitiesComponent;
    @ViewChild(KeyboardComponent) keyboard: KeyboardComponent;

    isAuthenticated: boolean;

    nameForm: FormGroup;

    opened: boolean;

    selectedKeybinding: any = null;
    selectedKeybindingName: string;
    keybindingSelected: boolean;
    selectedKeybindingClass: string;
    selectedKeybindingSpec: string;
    selectedKeybindingHeroTalent: string;
    viewKeybinding: any = null;
    viewKeybindingName: string;
    viewKeybindingClass: string;
    viewKeybindingSpec: string;
    viewKeybindingHeroTalent: string;

    refresh: boolean = false;

    editingName: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    isHomeRoute: boolean = false;
    isMyKeybindingsRoute: boolean = false;
    isViewKeybindingRoute: boolean = false;
    currentUserId: string | null = null;
    keybindings: any[] = [];  // Initialize as empty array
    MAX_SIZE = 10;

    constructor(
        private keybindingService: KeybindingService,
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _userService: UserService,
        private dialog: MatDialog,
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar) {

        this.keybindingSelected = false;
    }

    ngOnInit(): void {
        this._authService.check()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((authenticated) => {
                this.isAuthenticated = authenticated;

                // Check current route
                const url = this.router.url;
                const path = this.route.snapshot.routeConfig?.path;
                this.isHomeRoute = path === '' || (path === 'view-all' && authenticated);
                this.isMyKeybindingsRoute = path === 'my-keybindings';
                this.isViewKeybindingRoute = path === ':id';

                // If user is not authenticated and tries to access my-keybindings, redirect to home
                if (!authenticated && this.isMyKeybindingsRoute) {
                    this.router.navigate(['/keybinds']);
                    return;
                }

                // Only show drawer on my-keybindings route
                this.opened = this.isMyKeybindingsRoute;

                // If user is not authenticated and on /keybinds, ensure they see the home component
                if (!authenticated && url === '/keybinds') {
                    this.isHomeRoute = true;
                }
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
                            this.viewKeybinding = keybinding;
                            this.viewKeybindingName = keybinding.name;
                            this.viewKeybindingClass = keybinding.class;
                            this.viewKeybindingSpec = keybinding.spec;
                            this.viewKeybindingHeroTalent = keybinding.heroTalent;
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
                if (params['keybindingId'] && this.isMyKeybindingsRoute) {
                    const keybindingId = params['keybindingId'];
                    // Ensure drawer is opened
                    this.opened = true;
                    // Load and select the keybinding
                    this.keybindingService.getKeybinding(keybindingId).subscribe({
                        next: (keybinding) => {
                            // First select the keybinding
                            this.onKeybindingSelected(keybinding);
                            // Then update drawer selection after a short delay to ensure component is ready
                            setTimeout(() => {
                                if (this.keybindsDrawerComponent) {
                                    this.keybindsDrawerComponent.setSelectedKeybinding(keybinding);
                                }
                            }, 0);
                            // Remove the query parameter
                            this.router.navigate(['/keybinds/my-keybindings'], { replaceUrl: true });
                        },
                        error: (error) => {
                            console.error('Error loading keybinding:', error);
                            // Remove the query parameter even if there's an error
                            this.router.navigate(['/keybinds/my-keybindings'], { replaceUrl: true });
                        }
                    });
                }
            });

        // If we're on a view keybinding route, load the keybinding
        if (this.isViewKeybindingRoute) {
            const id = this.route.snapshot.paramMap.get('id');
            if (id) {
                this.keybindingService.getKeybinding(id).subscribe({
                    next: (keybinding) => {
                        this.viewKeybinding = keybinding;
                        this.viewKeybindingName = keybinding.name;
                        this.viewKeybindingClass = keybinding.class;
                        this.viewKeybindingSpec = keybinding.spec;
                        this.viewKeybindingHeroTalent = keybinding.heroTalent;
                    },
                    error: (error) => {
                        console.error('Error loading keybinding:', error);
                    }
                });
            }
        }

        // If we're on the my-keybindings route, subscribe to keybindings to select the last one
        if (this.isMyKeybindingsRoute) {
            this.keybindingService.currentKeybindings
                .pipe(takeUntil(this._unsubscribeAll))
                .subscribe(keybindings => {
                    if (keybindings.length > 0 && !this.selectedKeybinding && !this.route.snapshot.queryParams['id']) {
                        const lastKeybinding = keybindings[keybindings.length - 1];
                        this.onKeybindingSelected(lastKeybinding);
                    }
                });
        }
    }

    getKeybindings(authenticated: boolean = false) {
        //check local storage for keybindings
        const keybindings = localStorage.getItem('keybindings');
        if (keybindings) {
            this.keybindingService.updateKeybindings(JSON.parse(keybindings));
            if (this.keybindsDrawerComponent) {
                this.keybindsDrawerComponent.loadKeybindings();
            }
        }
    }

    onKeybindingSelected(keybinding: any) {
        console.log('onKeybindingSelected', keybinding)
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

                        // Update local storage to ensure consistency
                        const savedKeybindings = localStorage.getItem('keybindings');
                        if (savedKeybindings) {
                            try {
                                const parsedKeybindings = JSON.parse(savedKeybindings);
                                const updatedKeybindings = parsedKeybindings.map((kb: Keybinding) => {
                                    if (kb.keybindingId === updatedKeybinding.keybindingId) {
                                        return { ...kb, isPublic: updatedKeybinding.isPublic };
                                    }
                                    return kb;
                                });
                                localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
                            } catch (error) {
                                console.error('Failed to update keybindings in localStorage:', error);
                            }
                        }

                        // Update the drawer's selection
                        if (this.keybindsDrawerComponent) {
                            this.keybindsDrawerComponent.setSelectedKeybinding(updatedKeybinding);
                        }

                        // Trigger the change events to update the abilities component
                        this.onSelectionClassChanged(updatedKeybinding.class);
                    }
                });
        }
        else {
            this.selectedKeybinding = null;
            this.selectedKeybindingName = null;
            this.keybindingSelected = false;
            this.nameForm.get('name')?.setValue('');
            this.selectedKeybindingClass = null;
            this.selectedKeybindingSpec = null;
            this.selectedKeybindingHeroTalent = null;
            if (this.abilitiesComponent) {
                this.abilitiesComponent.abilities = [];
                this.abilitiesComponent.fetchAbilities();
            }
        }
    }

    onSelectionClassChanged(value: string) {
        this.selectedKeybindingClass = value;
        // You can also perform other actions here
    }

    deleteKeybinding(keybinding: Keybinding | null) {
        if (!keybinding) {
            console.error('No keybinding provided for deletion');
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { text: `Are you sure you want to delete "${keybinding.name}"?` }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('deleting keybinding', keybinding);
                this.keybindingService.removeKeybinding(keybinding.keybindingId);
                this.selectedKeybinding = null;
                this.keybindingSelected = false;
                this.refreshChildKeybindings();
            } else {
                console.log('Selection cancelled');
            }
        });
    }

    refreshChildKeybindings() {
        console.log('refreshChildKeybindings');

        //check if loggedin
        this._authService.check().subscribe((authenticated) => {
            if (authenticated) {
                //refetch the keybindings from server
                this.keybindingService.getKeybindings().subscribe((keybindings) => {
                    console.log('refreshChildKeybindings - keybindings', keybindings);

                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }

                    if (this.abilitiesComponent) {
                        this.abilitiesComponent.abilities = [];
                        this.abilitiesComponent.fetchAbilities();
                    }

                    if (!this.selectedKeybinding?.spec || !this.selectedKeybinding?.heroTalent) {
                        console.log('reseting keyboard')
                        if (this.keyboard) {
                            this.keyboard.resetKeyboard();
                        }
                    }

                });
            } else {
                //check local storage for keybindings
                const keybindings = localStorage.getItem('keybindings');
                if (keybindings) {
                    this.keybindingService.updateKeybindings(JSON.parse(keybindings));
                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }

                    if (this.abilitiesComponent) {
                        this.abilitiesComponent.abilities = [];
                        this.abilitiesComponent.fetchAbilities();
                    }
                }
            }
        });
    }

    updateKeybinding(update) {
        console.log('updated keybinding?', update);

        this.keybindingService.updateKeybindsInKeybinding(this.selectedKeybinding.keybindingId, update)
            .subscribe({
                next: () => {
                    this.selectedKeybinding = this.keybindingService.getKeybindingById(this.selectedKeybinding.keybindingId);
                    // Refresh the view-keyboard component
                    this.refreshChildKeybindings();
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

        this.dialog.open(ShareDialogComponent, {
            data: {
                keybindingId: this.selectedKeybinding.keybindingId
            },
            width: '600px',
            maxWidth: '90vw'
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
                // Update local storage
                const savedKeybindings = localStorage.getItem('keybindings');
                if (savedKeybindings) {
                    try {
                        const parsedKeybindings = JSON.parse(savedKeybindings);
                        const updatedKeybindings = parsedKeybindings.map((kb: Keybinding) => {
                            if (kb.keybindingId === this.selectedKeybinding?.keybindingId) {
                                return { ...kb, isPublic: newPublicStatus };
                            }
                            return kb;
                        });
                        localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
                    } catch (error) {
                        console.error('Failed to update keybindings in localStorage:', error);
                    }
                }

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

        this._userService.user$.subscribe(user => {
            const newKeybinding = {
                ...keybinding,
                name: `${keybinding.name} (Copy)`,
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
                        // Navigate to view all keybindings
                        this.router.navigate(['/keybinds/view']);
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

}
