import { Component, ViewEncapsulation, Inject, OnInit, OnDestroy } from '@angular/core';
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
export class AbilityDialogComponent implements OnInit, OnDestroy {
    isOpen = false;

    keybindings: string[] = [];
    originalKeybindings: string[] = [];
    newKeybinding: string | null = null;
    isKeybindingActive = false;
    errorMessage: string | null = null;
    private readonly ERROR_TIMEOUT = 3000; // 3 seconds
    private keydownHandler: (event: KeyboardEvent) => boolean;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AbilityDialogData,
        private dialogRef: MatDialogRef<AbilityDialogComponent>,
        private keybindingService: KeybindingService
    ) {
        // Initialize keybindings from data with deep copies
        this.originalKeybindings = [...(data.ability.keybindings || [])];
        this.keybindings = [...(data.ability.keybindings || [])];

        // Bind the event handler to maintain proper 'this' context
        this.keydownHandler = this.onKeyDown.bind(this);
    }

    ngOnInit(): void {
        // Multi-layered approach to prevent browser shortcuts
        // Add listeners to both window and document with capture phase

        const options = { capture: true, passive: false };

        // Window level (first line of defense)
        window.addEventListener('keydown', this.keydownHandler, options);
        window.addEventListener('keypress', this.preventDefaultEvent, options);
        window.addEventListener('keyup', this.preventDefaultEvent, options);

        // Document level (second line of defense)
        document.addEventListener('keydown', this.keydownHandler, options);
        document.addEventListener('keypress', this.preventDefaultEvent, options);
        document.addEventListener('keyup', this.preventDefaultEvent, options);

        // Body level (third line of defense)
        document.body.addEventListener('keydown', this.keydownHandler, options);
        document.body.addEventListener('keypress', this.preventDefaultEvent, options);
        document.body.addEventListener('keyup', this.preventDefaultEvent, options);

        console.log('AbilityDialog: Multi-layered event listeners attached');
    }

    ngOnDestroy(): void {
        // Clean up all event listeners
        const removeOptions = { capture: true };

        // Remove from window
        window.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        window.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        window.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        // Remove from document
        document.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        document.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        document.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        // Remove from body
        document.body.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        document.body.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        document.body.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        console.log('AbilityDialog: All event listeners removed');
    }

    private preventDefaultEvent = (event: KeyboardEvent): boolean => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
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

    private onKeyDown(event: KeyboardEvent): boolean {
        console.log('AbilityDialog: Keydown captured:', {
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            isKeybindingActive: this.isKeybindingActive
        });

        // CRITICAL: Always prevent default behavior when dialog is open
        // This is our primary defense against browser shortcuts
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!this.isKeybindingActive) {
            console.log('AbilityDialog: Ignoring keydown - keybinding mode not active');
            return false; // Still prevent default even when not actively capturing
        }

        const key = event.key.toLowerCase();
        if (key === 'escape') {
            this.cancelKeybinding();
            return false;
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
                return false; // Skip if it's just a modifier key press
            }
            keyString = key === ' ' ? 'Space' : event.key;
        }

        this.newKeybinding = [...modifiers, keyString].join('+');
        return false; // Always return false to prevent default
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
