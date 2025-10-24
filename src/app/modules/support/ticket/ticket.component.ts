import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { UserService } from 'app/core/user/user.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'app-ticket',
    templateUrl: './ticket.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatSnackBarModule,
        RouterLink
    ]
})
export class TicketComponent implements OnInit {
    ticketForm: FormGroup;
    isAuthenticated = false;
    isSubmitting = false;
    submitted = false;

    categories = [
        { value: 'technical', label: 'Technical Issue' },
        { value: 'account', label: 'Account Issue' },
        { value: 'ability', label: 'Ability Issue' },
        { value: 'keybind', label: 'Keybind Help' },
        { value: 'macro', label: 'Macro Help' },
        { value: 'feature', label: 'Feature Request' },
        { value: 'bug', label: 'Bug Report' },
        { value: 'other', label: 'Other' }
    ];

    priorities = [
        { value: 'low', label: 'Low - General question' },
        { value: 'medium', label: 'Medium - Need assistance' },
        { value: 'high', label: 'High - Blocking issue' },
        { value: 'urgent', label: 'Urgent - Critical problem' }
    ];

    constructor(
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private _userService: UserService,
        private _snackBar: MatSnackBar,
        private _http: HttpClient
    ) {
        this.ticketForm = this._formBuilder.group({
            email: ['', [Validators.required, Validators.email]],
            category: ['', Validators.required],
            priority: ['medium', Validators.required],
            subject: ['', [Validators.required, Validators.minLength(5)]],
            description: ['', [Validators.required, Validators.minLength(20)]]
        });
    }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;

            // Pre-fill email if authenticated
            if (authenticated) {
                this._userService.user$.subscribe(user => {
                    if (user) {
                        this.ticketForm.patchValue({
                            email: user.email
                        });
                        // Make email field read-only for authenticated users
                        this.ticketForm.get('email')?.disable();
                    }
                });
            }
        });
    }

    submitTicket(): void {
        if (this.ticketForm.invalid) {
            Object.keys(this.ticketForm.controls).forEach(key => {
                this.ticketForm.get(key)?.markAsTouched();
            });
            return;
        }

        this.isSubmitting = true;

        // Get form values (including disabled fields for authenticated users)
        const ticketData = {
            email: this.ticketForm.get('email')?.value || this.ticketForm.get('email')?.getRawValue(),
            category: this.ticketForm.get('category')?.value,
            priority: this.ticketForm.get('priority')?.value,
            subject: this.ticketForm.get('subject')?.value,
            description: this.ticketForm.get('description')?.value
        };

        // Call backend API
        this._http.post(`${environment.apiUrl}/support/ticket`, ticketData)
            .subscribe({
                next: (response: any) => {
                    this.isSubmitting = false;
                    this.submitted = true;

                    const issueKey = response.ticket?.issue_key || 'Your ticket';
                    const message = response.ticket?.issue_key
                        ? `Support ticket ${issueKey} submitted successfully! We'll get back to you soon.`
                        : 'Support ticket submitted successfully! We\'ll get back to you soon.';

                    this._snackBar.open(message, 'Close', {
                        duration: 5000,
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: ['success-snackbar']
                    });

                    // Reset form
                    this.ticketForm.reset({
                        priority: 'medium'
                    });
                },
                error: (error) => {
                    this.isSubmitting = false;

                    const errorMessage = error.error?.message || 'Failed to submit ticket. Please try again.';

                    this._snackBar.open(errorMessage, 'Close', {
                        duration: 5000,
                        horizontalPosition: 'center',
                        verticalPosition: 'top',
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }

    getErrorMessage(fieldName: string): string {
        const field = this.ticketForm.get(fieldName);

        if (field?.hasError('required')) {
            return 'This field is required';
        }
        if (field?.hasError('email')) {
            return 'Please enter a valid email address';
        }
        if (field?.hasError('minlength')) {
            const minLength = field.errors?.['minlength'].requiredLength;
            return `Minimum length is ${minLength} characters`;
        }

        return '';
    }
}

