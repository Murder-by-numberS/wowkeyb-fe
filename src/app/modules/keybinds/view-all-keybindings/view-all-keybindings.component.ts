import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Keybinding } from 'app/core/types/keybinding';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AbilitiesComponent } from '../abilities/abilities.component';
import { KeyboardComponent } from '../keyboard/keyboard.component';
import { ExpandedKeyboardComponent } from '../expanded-keyboard/expanded-keyboard.component';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { takeUntil } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { Subject } from 'rxjs';

@Component({
    selector: 'view-all-keybindings',
    templateUrl: './view-all-keybindings.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        AbilitiesComponent,
        KeyboardComponent,
        ExpandedKeyboardComponent
    ]
})
export class ViewAllKeybindingsComponent implements OnInit, OnChanges {
    @Input() keybindingSelected: boolean = false;
    @Input() selectedKeybinding: Keybinding | null = null;
    @Input() selectedKeybindingName: string = '';
    @Input() isAuthenticated: boolean = false;
    @Input() editingName: boolean = false;
    @Input() nameForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(32)]]
    });
    @Input() opened: boolean = true;
    @Input() currentKeybindingCount: number = 0;
    @Input() maxKeybindings: number = 10;

    @Output() deleteKeybinding = new EventEmitter<Keybinding>();
    @Output() shareKeybinding = new EventEmitter<void>();
    @Output() editName = new EventEmitter<void>();
    @Output() saveName = new EventEmitter<void>();
    @Output() cancelName = new EventEmitter<void>();
    @Output() togglePublic = new EventEmitter<void>();
    @Output() refreshChildKeybindings = new EventEmitter<void>();
    @Output() updateKeybinding = new EventEmitter<Keybinding>();
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() keybindingUpdated = new EventEmitter<Keybinding>();
    @Output() selectKeybinding = new EventEmitter<Keybinding>();

    @ViewChild('expandedKeyboard') expandedKeyboardComponent?: ExpandedKeyboardComponent;

    canDuplicate: boolean = false;
    isExpanded: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private fb: FormBuilder,
        private router: Router,
        private keybindingService: KeybindingService,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _userService: UserService
    ) { }

    ngOnInit(): void {
        this.updateCanDuplicate();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentKeybindingCount'] || changes['maxKeybindings']) {
            this.updateCanDuplicate();
        }
    }

    private updateCanDuplicate(): void {
        console.log('Current count:', this.currentKeybindingCount, 'Max:', this.maxKeybindings);
        this.canDuplicate = this.currentKeybindingCount < this.maxKeybindings;
        console.log('Can duplicate:', this.canDuplicate);
    }

    onDeleteKeybinding(): void {
        if (!this.selectedKeybinding || !this.isAuthenticated) {
            console.log('Cannot delete: No keybinding selected or user not authenticated');
            return;
        }
        console.log('Deleting keybinding:', this.selectedKeybinding);
        this.deleteKeybinding.emit(this.selectedKeybinding);
    }

    onShareKeybinding(): void {
        this.shareKeybinding.emit();
    }

    onEditName(): void {
        this.editName.emit();
    }

    onSaveName(): void {
        this.saveName.emit();
    }

    onCancelName(): void {
        this.cancelName.emit();
    }

    onTogglePublic(): void {
        this.togglePublic.emit();
    }

    onRefreshChildKeybindings(): void {
        this.refreshChildKeybindings.emit();
    }

    onUpdateKeybinding(keybinding: Keybinding): void {
        this.updateKeybinding.emit(keybinding);
    }

    onExpand(): void {
        this.isExpanded = true;
        // Collapse the drawer when expanding
        this.toggleDrawer.emit();
        setTimeout(() => {
            this.expandedKeyboardComponent?.reset();
        }, 50);
    }

    onCollapse(): void {
        this.isExpanded = false;
        // Re-expand the drawer when collapsing
        this.toggleDrawer.emit();
    }

    onCreateNewKeybinding(): void {
        if (!this.isAuthenticated || !this.canDuplicate) {
            return;
        }

        const newKeybinding: Partial<Keybinding> = {
            name: 'New Keybinding',
            class: '',
            spec: '',
            heroTalent: '',
            isPublic: false,
            keybinds: []
        };

        this.keybindingService.createKeybinding(newKeybinding as Keybinding).subscribe({
            next: (createdKeybinding) => {
                // Refresh the keybindings list
                this.keybindingService.getKeybindings().subscribe(keybindings => {
                    // Update the drawer with new keybindings
                    this.refreshChildKeybindings.emit();
                    // Set the selected keybinding to the new one
                    this.updateKeybinding.emit(createdKeybinding);
                    // Emit the selected keybinding to update the parent component and drawer
                    this.selectKeybinding.emit(createdKeybinding);
                    this.snackBar.open('New keybinding created successfully', 'Close', { duration: 3000 });
                });
            },
            error: (error) => {
                console.error('Error creating keybinding:', error);
                this.snackBar.open('Error creating keybinding', 'Close', { duration: 3000 });
            }
        });
    }

    onDuplicateKeybinding(): void {
        if (!this.selectedKeybinding || !this.isAuthenticated || !this.canDuplicate) {
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { text: `Are you sure you want to duplicate "${this.selectedKeybinding.name}"?` }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this._userService.user$.pipe(takeUntil(this._unsubscribeAll)).subscribe(user => {
                    if (!user?._id) {
                        this.snackBar.open('Error: User not found', 'Close', { duration: 3000 });
                        return;
                    }

                    // Get all keybindings first
                    this.keybindingService.getKeybindings().subscribe(allKeybindings => {
                        const existingKeybindings = allKeybindings;
                        const originalName = this.selectedKeybinding.name;

                        // Get only the user's keybindings
                        const userKeybindings = existingKeybindings.filter(kb => kb.userId === user._id);
                        console.log('User keybindings:', userKeybindings.map(kb => kb.name));

                        // Get the base name without any copy suffix
                        const baseName = originalName.replace(/ \(copy(?: \d+)?\)$/i, '');
                        console.log('Base name:', baseName);

                        // Find all copies of this specific keybinding that the user owns
                        const userCopies = userKeybindings.filter(kb => {
                            const kbBaseName = kb.name.replace(/ \(copy(?: \d+)?\)$/i, '');
                            return kbBaseName.toLowerCase() === baseName.toLowerCase();
                        });
                        console.log('User copies:', userCopies.map(kb => kb.name));

                        // Count all copies the user has
                        const userCopyCount = userCopies.length;
                        const newName = `${baseName} (Copy ${userCopyCount + 1})`;

                        console.log('New name will be:', newName);

                        const duplicatedKeybinding = {
                            ...this.selectedKeybinding,
                            name: newName,
                            keybinding_id: undefined,
                            userId: user._id
                        };

                        this.keybindingService.createKeybinding(duplicatedKeybinding).subscribe({
                            next: (createdKeybinding) => {
                                this.snackBar.open('Keybinding duplicated successfully', 'Close', { duration: 3000 });
                                // Navigate to my-keybindings route
                                this.router.navigate(['/keybinds/my-keybindings'], {
                                    queryParams: { keybindingId: createdKeybinding.keybindingId }
                                });
                            },
                            error: (error) => {
                                console.error('Error duplicating keybinding:', error);
                                this.snackBar.open('Error duplicating keybinding', 'Close', { duration: 3000 });
                            }
                        });
                    });
                });
            }
        });
    }
}
