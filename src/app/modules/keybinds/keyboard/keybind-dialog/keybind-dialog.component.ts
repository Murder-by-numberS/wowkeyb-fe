import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { Keybind } from 'app/core/types/keybind';

@Component({
    selector: 'keybind-dialog',
    standalone: true,
    imports: [CommonModule, MatDialogModule, MatButtonModule],
    templateUrl: './keybind-dialog.component.html'
})
export class KeybindDialogComponent {
    label: string;
    keybinds: Keybind[];
    markedForRemoval = new Set<Keybind>();

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: KeybindDialogData,
        private dialogRef: MatDialogRef<KeybindDialogComponent>
    ) {
        console.log('data', data);
        this.label = data.key.label;
        this.keybinds = data.key.keybinds;

        console.log('label', this.label);
        console.log('keybinds', this.keybinds);
    }

    get hasChanges(): boolean {
        return this.markedForRemoval.size > 0;
    }

    toggleRemoval(bind: Keybind) {
        if (this.markedForRemoval.has(bind)) {
            this.markedForRemoval.delete(bind);
            console.log('KeybindDialog - Removed from markedForRemoval:', bind.spell?.name);
        } else {
            this.markedForRemoval.add(bind);
            console.log('KeybindDialog - Added to markedForRemoval:', bind.spell?.name);
        }
        console.log('KeybindDialog - markedForRemoval size:', this.markedForRemoval.size);
        console.log('KeybindDialog - markedForRemoval contents:', Array.from(this.markedForRemoval).map(b => b.spell?.name));
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        console.log('KeybindDialog - onConfirm called');
        console.log('KeybindDialog - original keybinds:', this.keybinds.length);
        console.log('KeybindDialog - original keybinds details:', this.keybinds.map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));
        console.log('KeybindDialog - markedForRemoval size:', this.markedForRemoval.size);
        console.log('KeybindDialog - marked for removal:', Array.from(this.markedForRemoval).map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));

        // Filter out the marked keybinds from the working copy
        const filteredKeybinds = this.keybinds.filter(bind => {
            const isMarked = this.markedForRemoval.has(bind);
            console.log('KeybindDialog - checking keybind:', {
                name: bind.spell?.name,
                spellId: bind.spell?.spellId,
                isMarked,
                willKeep: !isMarked
            });
            return !isMarked;
        });

        console.log('KeybindDialog - filtered keybinds:', filteredKeybinds.length);
        console.log('KeybindDialog - filtered keybinds details:', filteredKeybinds.map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));

        this.dialogRef.close(filteredKeybinds);
    }
}

interface KeybindDialogData {
    key: {
        label: string;
        keybinds: Keybind[];
    }
}
