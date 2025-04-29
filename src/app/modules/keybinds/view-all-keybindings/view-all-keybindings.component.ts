import { Component, EventEmitter, Input, Output } from '@angular/core';
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
import { CommonModule } from '@angular/common';

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
        KeyboardComponent
    ]
})
export class ViewAllKeybindingsComponent {
    @Input() keybindingSelected: boolean = false;
    @Input() selectedKeybinding: Keybinding | null = null;
    @Input() selectedKeybindingName: string = '';
    @Input() isAuthenticated: boolean = false;
    @Input() editingName: boolean = false;
    @Input() nameForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(32)]]
    });

    @Output() deleteKeybinding = new EventEmitter<void>();
    @Output() shareKeybinding = new EventEmitter<void>();
    @Output() editName = new EventEmitter<void>();
    @Output() saveName = new EventEmitter<void>();
    @Output() cancelName = new EventEmitter<void>();
    @Output() togglePublic = new EventEmitter<void>();
    @Output() refreshChildKeybindings = new EventEmitter<void>();
    @Output() updateKeybinding = new EventEmitter<Keybinding>();

    constructor(private fb: FormBuilder) { }

    onDeleteKeybinding(): void {
        this.deleteKeybinding.emit();
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
}
