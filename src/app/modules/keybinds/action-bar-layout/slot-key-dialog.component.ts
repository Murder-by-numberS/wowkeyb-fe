import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

export interface SlotKeyDialogData {
    currentKey: string;
    options: string[];
}

@Component({
    selector: 'slot-key-dialog',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
    ],
    template: `
        <h2 mat-dialog-title>Change Slot Keybind</h2>
        <mat-dialog-content>
            <mat-form-field appearance="outline" class="w-full mt-2">
                <mat-label>Keybind</mat-label>
                <input
                    matInput
                    [(ngModel)]="selectedKeyInput"
                    (keydown)="onKeyDown($event)"
                    (ngModelChange)="onInputChange($event)"
                    (keyup.enter)="save()"
                    placeholder="Press a key combo (e.g. Shift+1)" />
            </mat-form-field>
            <p class="text-xs text-gray-500 dark:text-gray-400">
                Press your key combo directly. Format is Modifier+Key.
            </p>
            @if (selectedKeyInput && !isValidSelection) {
            <p class="mt-2 text-xs text-red-500">
                Invalid keybind. Use formats like 1, Shift+1, Ctrl+1, or Alt+1.
            </p>
            }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="dialogRef.close()">Cancel</button>
            <button
                mat-flat-button
                color="primary"
                [disabled]="!isValidSelection"
                (click)="save()">
                Save
            </button>
        </mat-dialog-actions>
    `,
})
export class SlotKeyDialogComponent {
    selectedKeyInput: string;
    isValidSelection = false;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SlotKeyDialogData,
        public dialogRef: MatDialogRef<SlotKeyDialogComponent>
    ) {
        this.selectedKeyInput = data.currentKey || '';
        this.onInputChange(this.selectedKeyInput);
    }

    onInputChange(value: string): void {
        this.selectedKeyInput = value || '';
        const canonical = this.toCanonical(this.selectedKeyInput);
        this.isValidSelection = !!canonical;
    }

    onKeyDown(event: KeyboardEvent): void {
        // Let normal editing/navigation keys work in the input.
        const passthroughKeys = new Set([
            'Tab',
            'Escape',
            'Backspace',
            'Delete',
            'ArrowLeft',
            'ArrowRight',
            'ArrowUp',
            'ArrowDown',
            'Home',
            'End',
        ]);
        if (passthroughKeys.has(event.key)) return;

        // Mirror ability dialog behavior: derive keybind from key event metadata, not typed character.
        event.preventDefault();
        event.stopPropagation();

        const modifiers: Array<'Ctrl' | 'Shift' | 'Alt'> = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.altKey) modifiers.push('Alt');
        if (modifiers.length > 1) {
            this.isValidSelection = false;
            return;
        }

        const keyToken = this.parseKeyTokenFromEventCode(event.code);
        if (!keyToken) {
            this.isValidSelection = false;
            return;
        }

        const canonical = modifiers.length ? `${modifiers[0]}+${keyToken}` : `${keyToken}`;
        this.selectedKeyInput = canonical;
        this.isValidSelection = true;
    }

    save(): void {
        const canonical = this.toCanonical(this.selectedKeyInput);
        if (!canonical) return;
        this.dialogRef.close(canonical);
    }

    private toCanonical(value: string): string | null {
        const trimmed = (value || '').trim();
        if (!trimmed) return null;

        // If user physically presses Shift+number in the input, browser emits symbols (!, @, #, ...).
        const shiftedNumberSymbols: Record<string, number> = {
            '!': 1,
            '@': 2,
            '#': 3,
            '$': 4,
            '%': 5,
            '^': 6,
            '&': 7,
            '*': 8,
            '(': 9,
            ')': 10,
            '_': 11,
            '+': 12,
        };
        if (trimmed.length === 1 && shiftedNumberSymbols[trimmed] !== undefined) {
            return `Shift+${shiftedNumberSymbols[trimmed]}`;
        }

        // Support aliases for 10/11/12 from common keyboard labels.
        const keyAliases: Record<string, number> = {
            '0': 10,
            '-': 11,
            '=': 12,
        };

        // Accept flexible input forms while normalizing output to Modifier+Key:
        // "shift+1", "shift 1", "1 shift", "ctrl-12", "alt =", "shift+e", "e"
        const lowered = trimmed.toLowerCase();
        const tokens = lowered
            .split(/[+\s]+/)
            .map((t) => t.trim())
            .filter(Boolean);
        if (!tokens.length) return null;

        const normalizeModifier = (token: string): 'Shift' | 'Ctrl' | 'Alt' | null => {
            if (token === 'shift') return 'Shift';
            if (token === 'ctrl' || token === 'control') return 'Ctrl';
            if (token === 'alt') return 'Alt';
            return null;
        };

        const parseKeyToken = (token: string): string | null => {
            if (/^\d{1,2}$/.test(token)) {
                const parsed = Number(token);
                if (parsed >= 1 && parsed <= 12) return String(parsed);
                return null;
            }
            if (keyAliases[token] !== undefined) return String(keyAliases[token]);
            if (/^[a-z]$/.test(token)) return token.toUpperCase();
            return null;
        };

        let modifier: 'Shift' | 'Ctrl' | 'Alt' | null = null;
        let keyToken: string | null = null;
        for (const token of tokens) {
            const maybeMod = normalizeModifier(token);
            if (maybeMod) {
                if (modifier && modifier !== maybeMod) return null;
                modifier = maybeMod;
                continue;
            }

            const maybeKey = parseKeyToken(token);
            if (maybeKey !== null) {
                if (keyToken !== null) return null;
                keyToken = maybeKey;
                continue;
            }

            // Handle compact forms like "shift1", "ctrl12", "alt0".
            const compact = token.match(/^(shift|ctrl|control|alt)(\d{1,2}|-|=|0|[a-z])$/);
            if (compact) {
                const compactMod = normalizeModifier(compact[1]);
                const compactKey = parseKeyToken(compact[2]);
                if (!compactMod || compactKey === null) return null;
                if (modifier && modifier !== compactMod) return null;
                if (keyToken !== null) return null;
                modifier = compactMod;
                keyToken = compactKey;
                continue;
            }

            return null;
        }

        if (keyToken === null) return null;
        return modifier ? `${modifier}+${keyToken}` : `${keyToken}`;
    }

    private parseKeyTokenFromEventCode(code: string): string | null {
        const codeToToken: Record<string, string> = {
            Digit1: '1',
            Digit2: '2',
            Digit3: '3',
            Digit4: '4',
            Digit5: '5',
            Digit6: '6',
            Digit7: '7',
            Digit8: '8',
            Digit9: '9',
            Digit0: '10',
            Minus: '11',
            Equal: '12',
            Numpad1: '1',
            Numpad2: '2',
            Numpad3: '3',
            Numpad4: '4',
            Numpad5: '5',
            Numpad6: '6',
            Numpad7: '7',
            Numpad8: '8',
            Numpad9: '9',
            Numpad0: '10',
            NumpadSubtract: '11',
            NumpadAdd: '12',
        };
        if (codeToToken[code]) return codeToToken[code];

        const letterMatch = code.match(/^Key([A-Z])$/);
        if (letterMatch) return letterMatch[1];
        return null;
    }
}

