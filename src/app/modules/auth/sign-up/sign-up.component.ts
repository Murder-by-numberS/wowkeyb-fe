import { Component, NgZone, OnInit, ViewChild, ViewEncapsulation } from '@angular/core';
import {
    FormsModule,
    NgForm,
    ReactiveFormsModule,
    UntypedFormBuilder,
    UntypedFormGroup,
    Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { FuseAlertComponent, FuseAlertType } from '@fuse/components/alert';
import { FuseConfigService, Scheme } from '@fuse/services/config';
import { Subject, takeUntil } from 'rxjs';

import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';
import { BackendService } from 'app/core/services/backend.service';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthBackgroundComponent } from 'app/shared/auth-background/auth-background.component';
import { SchemeToggleComponent } from 'app/shared/scheme-toggle/scheme-toggle.component';

declare const google: any;

@Component({
    selector: 'auth-sign-up',
    templateUrl: './sign-up.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [
        RouterLink,
        FuseAlertComponent,
        FormsModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatButtonModule,
        MatIconModule,
        MatCheckboxModule,
        MatProgressSpinnerModule,
        AuthBackgroundComponent,
        SchemeToggleComponent,
    ],
})
export class AuthSignUpComponent implements OnInit {
    @ViewChild('signUpNgForm') signUpNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signUpForm: UntypedFormGroup;
    showAlert: boolean = false;

    /**
     * Constructor
     */
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _backendService: BackendService,
        private _formBuilder: UntypedFormBuilder,
        private _fuseConfigService: FuseConfigService,
        private _keybindingService: KeybindingService,
        private _ngZone: NgZone,
        private _router: Router
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Create the form
        this.signUpForm = this._formBuilder.group({
            username: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', Validators.required],
            // agreements: ['', Validators.requiredTrue],
        });

        this._initGoogleSignIn();
    }

    private _initGoogleSignIn(): void {
        if (typeof google === 'undefined') {
            setTimeout(() => this._initGoogleSignIn(), 200);
            return;
        }

        google.accounts.id.initialize({
            client_id: environment.googleClientId,
            callback: (response: any) => {
                this._ngZone.run(() => this._handleGoogleSignIn(response));
            },
        });

        google.accounts.id.renderButton(
            document.getElementById('google-signup-btn'),
            {
                theme: 'outline',
                size: 'large',
                width: 320,
                text: 'signup_with',
            }
        );
    }

    private _handleGoogleSignIn(response: any): void {
        this.showAlert = false;

        this._authService.signInWithGoogle(response.credential).subscribe(
            (res) => {
                if (res.userSettings?.scheme) {
                    this._fuseConfigService.config = { scheme: res.userSettings.scheme as Scheme };
                }
                this._backendService.startPing();

                this._keybindingService.getKeybindings()
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((keybindings) => {
                        console.log('Keybindings loaded after Google sign-up:', keybindings.length);
                    });

                const redirectURL =
                    this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
            },
            (error) => {
                const errorMessage = error.error?.message || 'Error signing up with Google';

                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };
                this.showAlert = true;
            }
        );
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Sign up
     */
    signUp(): void {
        // Do nothing if the form is invalid
        if (this.signUpForm.invalid) {
            return;
        }

        // Disable the form
        this.signUpForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign up
        this._authService.signUp(this.signUpForm.value).subscribe(
            (response) => {

                console.log('sending to confirmation page')

                // Navigate to the confirmation required page
                this._router.navigateByUrl('/confirmation-required');
            },
            (response) => {
                // Re-enable the form
                this.signUpForm.enable();

                // Reset the form
                this.signUpNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: 'Something went wrong, please try again.',
                };

                // Show the alert
                this.showAlert = true;
            }
        );
    }

    /**
     * Navigate back to home
     */
    goBackToHome(): void {
        this._router.navigate(['/']);
    }
}
