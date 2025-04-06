import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'share-dialog',
    templateUrl: './share-dialog.component.html',
    standalone: true,
    imports: [
        MatDialogActions,
        MatDialogContent,
        MatButtonModule,
        MatInputModule,
        MatFormFieldModule,
        MatIconModule,
        FormsModule,
        CommonModule
    ]
})
export class ShareDialogComponent implements OnInit {
    shareUrl: string;
    @ViewChild('urlInput') urlInput: ElementRef;
    @ViewChild('copyButton') copyButton: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<ShareDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { keybindingId: string }
    ) {
        // Construct the share URL using the current domain and the keybinding ID
        this.shareUrl = `${window.location.origin}/keybinds/${data.keybindingId}`;
    }

    ngOnInit(): void {
        // Focus the URL input when dialog opens
        setTimeout(() => {
            this.urlInput.nativeElement.focus();
        });
    }

    copyToClipboard(): void {
        navigator.clipboard.writeText(this.shareUrl).then(() => {
            // Try to focus the copy button if it exists
            if (this.copyButton?.nativeElement) {
                this.copyButton.nativeElement.focus();
            }
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
