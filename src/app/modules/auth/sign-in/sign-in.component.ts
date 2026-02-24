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
import { FuseConfigService, FuseConfig, Scheme } from '@fuse/services/config';

import { Subject, takeUntil } from 'rxjs';

import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';
import { BackendService } from 'app/core/services/backend.service';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthBackgroundComponent } from 'app/shared/auth-background/auth-background.component';
import { SchemeToggleComponent } from 'app/shared/scheme-toggle/scheme-toggle.component';

declare const google: any;

@Component({
    selector: 'auth-sign-in',
    templateUrl: './sign-in.component.html',
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
export class AuthSignInComponent implements OnInit {
    @ViewChild('signInNgForm') signInNgForm: NgForm;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: '',
    };
    signInForm: UntypedFormGroup;
    showAlert: boolean = false;
    config: FuseConfig;
    scheme: 'dark' | 'light';

    private _unsubscribeAll: Subject<any> = new Subject<any>();
    /**
     * Constructor
     */
    constructor(
        private _activatedRoute: ActivatedRoute,
        private _authService: AuthService,
        private _formBuilder: UntypedFormBuilder,
        private _backendService: BackendService,
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
        this.signInForm = this._formBuilder.group({
            email: [
                '',
                [Validators.required, Validators.email],
            ],
            password: ['', Validators.required],
            rememberMe: [''],
        });

        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                this.config = config;
                this.scheme = config.scheme as 'dark' | 'light';
                this._renderGoogleButton();
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

        this._renderGoogleButton();
    }

    private _renderGoogleButton(): void {
        if (typeof google === 'undefined') return;

        const container = document.getElementById('google-signin-btn');
        if (!container) return;

        container.innerHTML = '';
        google.accounts.id.renderButton(container, {
            theme: 'filled_blue',
            size: 'large',
            width: 320,
            text: 'signin_with',
        });
    }

    private _handleGoogleSignIn(response: any): void {
        this.showAlert = false;

        this._authService.signInWithGoogle(response.credential).subscribe(
            (res) => {
                this.setScheme(res.userSettings.scheme);
                this._backendService.startPing();

                this._keybindingService.getKeybindings()
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((keybindings) => {
                        console.log('Keybindings loaded after Google sign-in:', keybindings.length);
                    });

                const redirectURL =
                    this._activatedRoute.snapshot.queryParamMap.get('redirectURL') || '/signed-in-redirect';
                this._router.navigateByUrl(redirectURL);
            },
            (error) => {
                const errorMessage = error.error?.message || 'Error signing in with Google';

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
     * Sign in
     */
    signIn(): void {
        // Return if the form is invalid
        if (this.signInForm.invalid) {
            return;
        }

        // Disable the form
        this.signInForm.disable();

        // Hide the alert
        this.showAlert = false;

        // Sign in
        this._authService.signIn(this.signInForm.value).subscribe(
            (response) => {
                this.setScheme(response.userSettings.scheme);
                this._backendService.startPing();

                //call keybinding service to get keybindings
                this._keybindingService.getKeybindings()
                    .pipe(takeUntil(this._unsubscribeAll))
                    .subscribe((keybindings) => {
                        // Keybindings are now automatically stored in the service state
                        console.log('Keybindings loaded after sign-in:', keybindings.length);
                    });


                // Set the redirect url.
                // The '/signed-in-redirect' is a dummy url to catch the request and redirect the user
                // to the correct page after a successful sign in. This way, that url can be set via
                // routing file and we don't have to touch here.
                const redirectURL =
                    this._activatedRoute.snapshot.queryParamMap.get(
                        'redirectURL'
                    ) || '/signed-in-redirect';

                // Navigate to the redirect url
                this._router.navigateByUrl(redirectURL);
            },
            (response) => {

                console.log('sign-in - response', response);

                const errorMessage = response.error.error ? response.error.error[0].msg : response.error.message;

                // Re-enable the form
                this.signInForm.enable();

                // Reset the form
                this.signInNgForm.resetForm();

                // Set the alert
                this.alert = {
                    type: 'error',
                    message: errorMessage,
                };

                // Show the alert
                this.showAlert = true;
            }
        );
    }

    /**
 * Set the scheme on the config
 *
 * @param scheme
 */
    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
    }

    /**
     * Navigate back to home
     */
    goBackToHome(): void {
        this._router.navigate(['/']);
    }
}
