import { inject, Injectable, Injector } from '@angular/core';
import { FUSE_CONFIG } from '@fuse/services/config/config.constants';
import { SettingsService } from 'app/core/services/user/settings.service';
import { merge } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

const SCHEME_STORAGE_KEY = 'wowkeyb_scheme';

@Injectable({ providedIn: 'root' })
export class FuseConfigService {
    private _config: BehaviorSubject<any>;
    private _injector = inject(Injector);

    constructor() {
        const defaultConfig = inject(FUSE_CONFIG);

        // Restore scheme from localStorage if available
        const savedScheme = localStorage.getItem(SCHEME_STORAGE_KEY);
        if (savedScheme && ['light', 'dark', 'auto'].includes(savedScheme)) {
            defaultConfig.scheme = savedScheme;
        }

        this._config = new BehaviorSubject(defaultConfig);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for config
     */
    set config(value: any) {
        // Merge the new config over to the current config
        const config = merge({}, this._config.getValue(), value);

        // Persist scheme to localStorage
        if (value.scheme) {
            localStorage.setItem(SCHEME_STORAGE_KEY, value.scheme);

            // Persist scheme to backend if user is authenticated
            this._persistSchemeToBackend(value.scheme);
        }

        // Execute the observable
        this._config.next(config);
    }

    // eslint-disable-next-line @typescript-eslint/member-ordering
    get config$(): Observable<any> {
        return this._config.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Resets the config to the default
     */
    reset(): void {
        // Set the config
        this._config.next(this.config);
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Private methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Persist the scheme to the backend if the user is authenticated.
     * Uses the Injector to lazily resolve SettingsService to avoid
     * issues during early initialization.
     */
    private _persistSchemeToBackend(scheme: string): void {
        // Check if user is authenticated by looking for access token
        const accessToken = localStorage.getItem('accessToken');
        if (!accessToken || accessToken.trim() === '') {
            return;
        }

        try {
            const settingsService = this._injector.get(SettingsService, null);
            if (settingsService) {
                settingsService.saveSettings({ scheme }).subscribe({
                    next: () => {},
                    error: (err: any) => console.error('Failed to persist scheme to backend:', err)
                });
            }
        } catch (e) {
            // SettingsService not available during early initialization
        }
    }
}
