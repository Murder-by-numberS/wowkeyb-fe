import { inject, Injectable } from '@angular/core';
import { FUSE_CONFIG } from '@fuse/services/config/config.constants';
import { merge } from 'lodash-es';
import { BehaviorSubject, Observable } from 'rxjs';

const SCHEME_STORAGE_KEY = 'wowkeyb_scheme';

@Injectable({ providedIn: 'root' })
export class FuseConfigService {
    private _config: BehaviorSubject<any>;

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
}
