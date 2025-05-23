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
    @Output() keybindingUpdated = new EventEmitter<any>();
    @Output() refreshKeybindings = new EventEmitter<void>();

    isOwner: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    private currentUserId: string | null = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private _userService: UserService
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
        if (this.keybinding) {
            this.router.navigate(['/keybinds/my-keybindings'], {
                state: { duplicateKeybinding: this.keybinding }
            });
        }
    }
}
