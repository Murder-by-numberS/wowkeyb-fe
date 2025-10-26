import { Component, ViewEncapsulation, Inject, HostListener } from '@angular/core';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { KeybindingService } from 'app/core/services/keybinding.service';

@Component({
    selector: 'ability-dialog',
    templateUrl: './ability-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatDialogContent,
        MatDialogActions
    ],
})
export class AbilityDialogComponent {
    isOpen = false;

    keybindings: string[] = [];
    originalKeybindings: string[] = [];
    newKeybinding: string | null = null;
    isKeybindingActive = false;
    errorMessage: string | null = null;
    private readonly ERROR_TIMEOUT = 3000; // 3 seconds

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AbilityDialogData,
        private dialogRef: MatDialogRef<AbilityDialogComponent>,
        private keybindingService: KeybindingService
    ) {
        // Initialize keybindings from data with deep copies
        this.originalKeybindings = [...(data.ability.keybindings || [])];
        this.keybindings = [...(data.ability.keybindings || [])];
    }

    toggleKeybinding(): void {
        if (this.isKeybindingActive) {
            // Add the new keybinding if it exists
            if (this.newKeybinding) {
                if (this.keybindingService.hasKeybindKey(this.data.keybinding.keybindingId, this.newKeybinding)) {
                    this.errorMessage = `The key "${this.newKeybinding}" is already in use`;
                    setTimeout(() => {
                        this.errorMessage = null;
                    }, this.ERROR_TIMEOUT);
                    return;
                }
                this.keybindings.push(this.newKeybinding);
                this.errorMessage = null;
            }
            this.newKeybinding = null;
        }
        this.isKeybindingActive = !this.isKeybindingActive;
    }

    removeKeybinding(binding: string): void {
        this.keybindings = this.keybindings.filter(kb => kb !== binding);
    }

    cancelKeybinding(): void {
        this.newKeybinding = null;
        this.isKeybindingActive = false;
    }

    @HostListener('window:keydown', ['$event'])
    onKeyDown(event: KeyboardEvent): void {
        // Always prevent default behavior when dialog is open to avoid browser shortcuts
        event.preventDefault();
        event.stopPropagation();

        if (!this.isKeybindingActive) return;

        const key = event.key.toLowerCase();
        if (key === 'escape') {
            this.cancelKeybinding();
            return;
        }

        // Create keybinding string
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.altKey) modifiers.push('Alt');

        // Handle numbers specifically to prevent shift+number becoming special characters
        let keyString;
        if (event.code.startsWith('Digit')) {
            keyString = event.code.replace('Digit', '');
        } else {
            // Don't use the key directly if it's a modifier key
            if (['shift', 'control', 'alt'].includes(key)) {
                return; // Skip if it's just a modifier key press
            }
            keyString = key === ' ' ? 'Space' : event.key;
        }

        this.newKeybinding = [...modifiers, keyString].join('+');
    }

    hasKeybindingChanged(): boolean {
        if (this.originalKeybindings.length === 0 && this.keybindings.length === 0) return false;
        if (this.originalKeybindings.length !== this.keybindings.length) return true;
        return this.originalKeybindings[0] !== this.keybindings[0];
    }

    confirm(): void {
        console.log('confirming keybindings', this.keybindings);
        this.dialogRef.close({
            keybindings: this.keybindings
        });
    }

    close(): void {
        this.dialogRef.close();
    }
}

// Update the interface to support multiple keybindings
interface AbilityDialogData {
    ability: {
        name: string;
        icon: string;
        description: string;
        keybindings?: string[];
    },
    keybinding: {
        keybindingId: string;
        keybinds: {
            key: string;
            spell: string;
        }[];
    }
}
