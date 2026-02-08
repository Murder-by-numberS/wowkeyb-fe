import { Component, OnDestroy, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import {
    FormBuilder,
    FormGroup,
    NgForm,
    Validators,
    FormControl,
} from '@angular/forms';
import {
    FuseConfig,
    FuseConfigService,
    Scheme,
} from '@fuse/services/config';
import { FuseAlertType } from '@fuse/components/alert';
import { Subject, takeUntil, finalize } from 'rxjs';

import { SettingsService } from 'app/core/services/user/settings.service';

@Component({
    selector: 'settings-app',
    templateUrl: './app-settings.component.html',
    styles: [
        `
            settings {
                position: static;
                display: block;
                flex: none;
                width: auto;
            }

            @media (screen and min-width: 1280px) {
                empty-layout + settings .settings-cog {
                    right: 0 !important;
                }
            }
        `,
    ],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
    ],
})
export class SettingsAppComponent implements OnInit, OnDestroy {
    @ViewChild('saveSettingsNgForm') saveSettingsNgForm: NgForm;

    config: FuseConfig;
    scheme: 'dark' | 'light';
    settingsScheme: string;

    toggledScheme: boolean = false;

    alert: { type: FuseAlertType; message: string } = {
        type: 'success',
        message: 'default',
    };
    // saveSettingsForm: FormGroup;
    showAlert: boolean = false;
    durationInSeconds: number = 3;

    saveSettingsForm = new FormGroup({
        scheme: new FormControl('', Validators.required),
    });

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private _router: Router,
        private _fuseConfigService: FuseConfigService,
        private _formBuilder: FormBuilder,
        private _snackBar: MatSnackBar,
        private _settingsService: SettingsService
    ) { }

    // -----------------------------------------------------------------------------------------------------
    // @ Lifecycle hooks
    // -----------------------------------------------------------------------------------------------------

    /**
     * On init
     */
    ngOnInit(): void {
        // Subscribe to config changes
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config: FuseConfig) => {
                // Store the config
                this.config = config;
            });

        // Create the form
        this.saveSettingsForm = this._formBuilder.group({
            scheme: ['', [Validators.required]],
        });

    }

    /**
     * On destroy
     */
    ngOnDestroy(): void {
        // Unsubscribe from all subscriptions
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Set the scheme on the config
     *
     * @param scheme
     */
    setScheme(scheme: Scheme): void {
        this._fuseConfigService.config = { scheme };
        this.showAlert = false;
        this.settingsScheme = scheme;
        this.toggledScheme = true;
    }

    saveScheme(): void {
        this.alert.message = 'saving';
        this.showAlert = true;
        this.toggledScheme = false;

        const payload = {
            scheme: this.settingsScheme,
        };

        this._settingsService
            .saveSettings(payload)
            .pipe(
                finalize(() => {
                    this.openSnackBar(this.alert);
                })
            )
            .subscribe(
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'success',
                        message: response.message,
                    };

                },
                (response) => {
                    // Set the alert
                    this.alert = {
                        type: 'error',
                        message: response.error.message,
                    };
                }
            )
    }

    // clearAlertMessage(): void {
    //     this.showAlert = false;
    // }

    openSnackBar(alert): void {
        this._snackBar.open(alert.message, 'OK', {
            duration: this.durationInSeconds * 1000,
        });
    }

}
