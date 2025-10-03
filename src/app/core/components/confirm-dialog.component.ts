import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [
        MatDialogActions, MatDialogContent, MatButtonModule,
    ],
    template: `
    <h2 mat-dialog-title>{{ data?.title || 'Confirm' }}</h2>
    <mat-dialog-content>
      <p class="leading-relaxed">{{ data?.message || 'Are you sure you want to proceed?' }}</p>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-stroked-button (click)="onCancel()">{{ data?.cancelText || 'Cancel' }}</button>
      <button mat-stroked-button color="primary" (click)="onConfirm()">{{ data?.confirmText || 'Confirm' }}</button>
    </mat-dialog-actions>
  `
})
export class ConfirmDialogComponent {
    constructor(
        public dialogRef: MatDialogRef<ConfirmDialogComponent>,
        @Inject(MAT_DIALOG_DATA) public data: any
    ) { }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        this.dialogRef.close(true);
    }
}
