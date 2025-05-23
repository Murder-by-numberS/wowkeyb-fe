import { Component, Inject, OnInit, ViewChild, ElementRef } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthService } from 'app/core/auth/auth.service';

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
    isPublic: boolean = false;
    isAuthenticated: boolean = false;
    showShareLink: boolean = false;
    @ViewChild('urlInput') urlInput: ElementRef;
    @ViewChild('copyButton') copyButton: ElementRef;

    constructor(
        public dialogRef: MatDialogRef<ShareDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: { keybindingId: string },
        private keybindingService: KeybindingService,
        private authService: AuthService
    ) {
        // Construct the share URL using the current domain and the keybinding ID
        this.shareUrl = `${window.location.origin}/keybinds/${data.keybindingId}`;
    }

    ngOnInit(): void {
        // Check authentication status
        this.authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;

            // If authenticated, check if the keybinding is public
            if (authenticated) {
                const keybinding = this.keybindingService.getKeybindingById(this.data.keybindingId);
                this.isPublic = keybinding?.isPublic || false;
                this.showShareLink = this.isPublic;
            } else {
                // For non-authenticated users, show the share link directly
                this.showShareLink = true;
            }

            // Focus the URL input when dialog opens
            if (this.showShareLink) {
                setTimeout(() => {
                    this.urlInput.nativeElement.focus();
                });
            }
        });
    }

    makePublic(): void {
        this.keybindingService.updateKeybinding(this.data.keybindingId, { isPublic: true })
            .subscribe({
                next: () => {
                    this.isPublic = true;
                    this.showShareLink = true;
                    // Focus the URL input after making public
                    setTimeout(() => {
                        this.urlInput.nativeElement.focus();
                    });
                },
                error: (error) => {
                    console.error('Error making keybinding public:', error);
                }
            });
    }

    copyToClipboard(): void {
        navigator.clipboard.writeText(this.shareUrl).then(() => {
            if (this.copyButton?.nativeElement) {
                this.copyButton.nativeElement.focus();
            }
        });
    }

    onClose(): void {
        this.dialogRef.close();
    }
}
