import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Keybinding } from 'app/core/types/keybinding';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { ViewKeyboardComponent } from '../view-keyboard/view-keyboard.component';

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
export class ViewKeybindingComponent {
    @Input() keybinding: Keybinding | null = null;
    @Input() isAuthenticated: boolean = false;
    @Input() opened: boolean = true;
    @Output() keybindingUpdated = new EventEmitter<any>();
    @Output() refreshKeybindings = new EventEmitter<void>();
    @Output() duplicateKeybinding = new EventEmitter<Keybinding>();
    @Output() toggleDrawer = new EventEmitter<void>();

    onRefreshChildKeybindings(): void {
        this.refreshKeybindings.emit();
    }

    onUpdateKeybinding(update: any): void {
        this.keybindingUpdated.emit(update);
    }

    onDuplicateKeybinding(): void {
        if (this.keybinding) {
            this.duplicateKeybinding.emit(this.keybinding);
        }
    }
}
