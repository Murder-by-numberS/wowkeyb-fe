import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Navigation } from 'app/core/navigation/navigation.types';
import { Observable, ReplaySubject, tap, map } from 'rxjs';
import { environment } from 'environments/environment';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _httpClient = inject(HttpClient);
    private _navigation: ReplaySubject<Navigation> =
        new ReplaySubject<Navigation>(1);

    apiUrl: string;

    constructor() {
        this.getBackendURL();
        console.log('BackendService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {
        if (environment.production === true) {
            this.apiUrl = sessionStorage.getItem('backend_url');
        } else {
            this.apiUrl = environment.apiUrl;
        }
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Getter for navigation
     */
    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Get all navigation data
     */
    get(): Observable<Navigation> {
        // Get the auth token from localStorage
        const token = localStorage.getItem('accessToken');

        // Create headers with auth token if it exists
        const headers = new HttpHeaders().set(
            'Authorization',
            token ? `Bearer ${token}` : ''
        );

        // Make the request with optional auth header
        return this._httpClient.get<Navigation>(`${this.apiUrl}/navigation`, {
            headers,
            // Don't throw error if auth fails
            observe: 'response'
        }).pipe(
            map((response: HttpResponse<Navigation>) => response.body),
            tap((navigation) => {
                // Always emit the navigation data, even if auth failed
                this._navigation.next(navigation);
            })
        );
    }
}
