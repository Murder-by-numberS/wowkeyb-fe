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

    toggleRemoval(bind: Keybind) {
        if (this.markedForRemoval.has(bind)) {
            this.markedForRemoval.delete(bind);
        } else {
            this.markedForRemoval.add(bind);
        }
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        // Filter out the marked keybinds from the working copy
        const filteredKeybinds = this.keybinds.filter(bind => !this.markedForRemoval.has(bind));
        this.dialogRef.close(filteredKeybinds);
    }
}

interface KeybindDialogData {
    key: {
        label: string;
        keybinds: Keybind[];
    }
}
