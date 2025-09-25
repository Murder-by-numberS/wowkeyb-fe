import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { Subject, takeUntil } from 'rxjs';
import { KeybindingService } from '../../../core/services/keybinding.service';
import { Keybinding } from '../../../core/types/keybinding';
import { ViewKeyboardComponent } from '../view-keyboard/view-keyboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { KeybindDetailsDialogComponent } from './keybind-details-dialog/keybind-details-dialog.component';
import { ExpandedKeyboardComponent } from '../expanded-keyboard/expanded-keyboard.component';

@Component({
    selector: 'app-view-keybinding',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        ViewKeyboardComponent,
        ExpandedKeyboardComponent
    ],
    templateUrl: './view-keybinding.component.html'
})
export class ViewKeybindingComponent implements OnInit, OnDestroy {
    keybinding: Keybinding | null = null;
    isOwner = false;
    isAuthenticated = false;
    isExpanded = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('expandedKeyboard') expandedKeyboardComponent?: ExpandedKeyboardComponent;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private keybindingService: KeybindingService,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.isAuthenticated = this.authService.isAuthenticated();
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadKeybinding(id);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private loadKeybinding(id: string): void {
        this.keybindingService.getKeybinding(id).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (keybinding) => {
                this.keybinding = keybinding;
                this.checkOwnership();
            },
            error: (error) => {
                console.error('Error loading keybinding:', error);
                this.snackBar.open('Error loading keybinding', 'Close', { duration: 3000 });
            }
        });
    }

    private checkOwnership(): void {
        if (!this.keybinding) return;

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            this.isOwner = false;
            return;
        }
        this.isOwner = this.keybinding?.userId === currentUser.id;
        console.log('Ownership check:', {
            keybindingUserId: this.keybinding?.userId,
            currentUserId: currentUser.id,
            isOwner: this.isOwner
        });
    }

    onEditKeybinding(): void {
        if (this.keybinding) {
            this.router.navigate(['/keybinds/edit', this.keybinding.keybindingId]);
        }
    }

    onDuplicateKeybinding(): void {
        if (!this.keybinding) return;

        this.keybindingService.duplicateKeybinding(this.keybinding.keybindingId).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (duplicatedKeybinding) => {
                this.snackBar.open('Keybinding duplicated successfully', 'Close', { duration: 3000 });
                this.router.navigate(['/keybinds/my-keybindings'], {
                    queryParams: { keybindingId: duplicatedKeybinding.keybindingId }
                });
            },
            error: (error) => {
                console.error('Error duplicating keybinding:', error);
                this.snackBar.open('Error duplicating keybinding', 'Close', { duration: 3000 });
            }
        });
    }

    onKeyClick(key: string, keybinds: any[]): void {
        this.dialog.open(KeybindDetailsDialogComponent, {
            data: {
                key,
                keybinds
            },
            width: '400px'
        });
    }

    onExpand(): void {
        this.isExpanded = true;
        // Don't call reset here - let the expanded keyboard component handle its own initialization
    }

    onCollapse(): void {
        this.isExpanded = false;
    }
}
