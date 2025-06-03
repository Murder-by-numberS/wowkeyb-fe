import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { Keybinding } from 'app/core/types/keybinding';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ViewKeyboardComponent } from '../view-keyboard/view-keyboard.component';
import { Router, ActivatedRoute } from '@angular/router';
import { UserService } from 'app/core/user/user.service';
import { Subject, takeUntil } from 'rxjs';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
    selector: 'view-keybinding',
    templateUrl: './view-keybinding.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        ViewKeyboardComponent
    ]
})
export class ViewKeybindingComponent implements OnInit, OnChanges {
    @Input() keybinding: Keybinding | null = null;
    @Input() isAuthenticated: boolean = false;
    @Input() currentKeybindingCount: number = 0;
    @Input() maxKeybindings: number = 10;
    @Output() keybindingUpdated = new EventEmitter<any>();
    @Output() refreshKeybindings = new EventEmitter<void>();

    isOwner: boolean = false;
    canDuplicate: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private currentUserId: string | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private _userService: UserService,
        private dialog: MatDialog,
        private keybindingService: KeybindingService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        this._userService.user$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(user => {
                console.log('Current user:', user);
                this.currentUserId = user?._id || null;
                console.log('Current user ID:', this.currentUserId);
                this.checkOwnership();
            });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['keybinding']) {
            console.log('Keybinding changed:', this.keybinding);
            this.checkOwnership();
        }
        if (changes['currentKeybindingCount'] || changes['maxKeybindings']) {
            this.updateCanDuplicate();
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private checkOwnership(): void {
        console.log('Checking ownership:');
        console.log('Keybinding:', this.keybinding);
        console.log('Current user ID:', this.currentUserId);

        if (this.keybinding?.userId && this.currentUserId) {
            console.log('Keybinding user ID:', this.keybinding.userId);
            console.log('Current user ID:', this.currentUserId);
            this.isOwner = this.keybinding.userId === this.currentUserId;
            console.log('Is owner:', this.isOwner);
        } else {
            this.isOwner = false;
            console.log('Is owner (no IDs):', this.isOwner);
        }
    }

    private updateCanDuplicate(): void {
        this.canDuplicate = this.currentKeybindingCount < this.maxKeybindings;
    }

    onRefreshChildKeybindings(): void {
        this.refreshKeybindings.emit();
    }

    onUpdateKeybinding(update: any): void {
        this.keybindingUpdated.emit(update);
    }

    onEditKeybinding(): void {
        if (this.keybinding) {
            this.router.navigate(['/keybinds/my-keybindings'], {
                queryParams: { keybindingId: this.keybinding.keybindingId }
            });
        }
    }

    onDuplicateKeybinding(): void {
        if (!this.keybinding || !this.isAuthenticated || !this.canDuplicate) {
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { text: `Are you sure you want to duplicate "${this.keybinding.name}"?` }
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
                        const originalName = this.keybinding.name;

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
                            ...this.keybinding,
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
