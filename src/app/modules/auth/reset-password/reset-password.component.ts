import { Component, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseValidators } from '@fuse/validators';
import { AuthService } from 'app/core/auth/auth.service';
import { finalize, Subject, takeUntil, takeWhile, tap, timer } from 'rxjs';
import { AuthBackgroundComponent } from 'app/shared/auth-background/auth-background.component';
import { SchemeToggleComponent } from 'app/shared/scheme-toggle/scheme-toggle.component';
@Component({
    selector: 'auth-reset-password',
    templateUrl: './reset-password.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatProgressSpinnerModule,
        RouterLink,
        AuthBackgroundComponent,
        SchemeToggleComponent,
    ],
})
export class AuthResetPasswordComponent implements OnInit {
    @ViewChild('resetPasswordNgForm') resetPasswordNgForm: NgForm;
    countdown: number = 1;
    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    resetPasswordForm: UntypedFormGroup;
    showAlert: boolean = false;

    resetCode: string;
    resetCodeValid: boolean = false;
    checkedResetCode: boolean = false;

    validPasswordReset: any;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _router: Router,
        private route: ActivatedRoute,
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {

        this.route.queryParams.subscribe((params) => {
            this.resetCode = params.rc; // (+) converts string 'id' to a number

            //TODO: delete
            console.log('this.resetCode');
            console.log(this.resetCode);
        });

        // Create the form
        this.resetPasswordForm = this._formBuilder.group(
            {
                password: ['', Validators.required],
                passwordConfirm: ['', Validators.required],
            },
            {
                validators: FuseValidators.mustMatch(
                    'password',
                    'passwordConfirm'
                ),
            }
        );

        //turn off alert
        this.resetPasswordForm.valueChanges.subscribe(() => {
            this.showAlert = false;
        });

    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Reset password
     */
    resetPassword(): void {
        // Return if the form is invalid
        if (this.resetPasswordForm.invalid) {
            return;
        }

        // Disable the form
        this.resetPasswordForm.disable();

        // Hide the alert
        this.showAlert = false;

        const passwordPayload = {
            np: this.resetPasswordForm.get('password').value,
            rc: this.resetCode,
        };

        // Send the request to the server
        this._authService
            .resetPassword(passwordPayload)
            .pipe(
                finalize(() => {
                    // Re-enable the form
                    this.resetPasswordForm.enable();

                    // Reset the form
                    this.resetPasswordNgForm.resetForm();

                    // Show the alert
                    this.showAlert = true;
                })
            )
            .subscribe(
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: 'Your password has been reset. Redirecting...',
                    };

                    // disable the form
                    this.resetPasswordForm.disable();

                    // Redirect after the countdown
                    timer(1000, 1000)
                        .pipe(
                            finalize(() => {
                                this._router.navigate(['sign-in']);
                            }),
                            takeWhile(() => this.countdown > 0),
                            takeUntil(this._unsubscribeAll),
                            tap(() => this.countdown--)
                        )
                        .subscribe();

                },
                (response) => {

                    console.log('response', response);

                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.error ? response.error.error[0].msg : response.error.message,
                    };

                    //TODO: change to turn off alert for dirty input
                    // Redirect after the countdown
                    // timer(3000, 3000)
                    //     .pipe(
                    //         finalize(() => {

                    //             this.showAlert = false;
                    //         }),
                    //         takeWhile(() => this.countdown > 0),
                    //         takeUntil(this._unsubscribeAll),
                    //         tap(() => this.countdown--)
                    //     )
                    //     .subscribe();

                }
            );
    }
}
