import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { NavigationService } from '../navigation/navigation.service';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class BackendService {
    apiUrl: string;
    pinger: any;

    constructor(
        private http: HttpClient,
        private _authService: AuthService,
        private _router: Router,
        private _navigationService: NavigationService
    ) {
        this.getBackendURL();

        console.log('BackendService - this.apiUrl', this.apiUrl);
    }

    getBackendURL(): void {

        console.log('🔍 BackendService - Environment debug:', {
            apiUrl: environment.apiUrl,
            envName: environment.envName,
            debugFlag: environment.debugFlag,
            production: environment.production
        });

        // if (environment.production === true) {
        //     this.apiUrl = sessionStorage.getItem('backend_url');
        // } else {
        this.apiUrl = environment.apiUrl;
        // }
    }

    health(): Observable<any> {
        this.getBackendURL();

        const urlString = `${this.apiUrl}/health`;

        console.log('health url - ', urlString);

        return this.http.get(urlString);
    }

    ping(): Observable<any> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/ping`;

        console.log('Inside Ping');
        console.log('check localStorage', localStorage.getItem('accessToken'));
        const token = localStorage.getItem('accessToken');

        // Get current access_level from localStorage to send to backend for validation
        let clientAccessLevel: number | undefined;
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                clientAccessLevel = user.access_level;
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }

        console.log('ping url - ', urlString);

        return this.http.post(urlString, { token, access_level: clientAccessLevel });
    }

    startPing(): void {
        console.log('starting ping');
        this.pinger = setInterval(() => {
            this.backendPinger();
        }, 30000);
    }

    stopPing(): void {
        console.log('stopping ping');
        if (this.pinger) {
            clearInterval(this.pinger);
            this.pinger = null;
        }
    }

    //runs every 30 seconds
    backendPinger(): void {
        console.log('pinging backend');
        this.ping().subscribe({
            next: (response) => {
                // Sync access_level from backend to ensure it hasn't been tampered with
                if (response.access_level !== undefined) {
                    this.syncAccessLevel(response.access_level);
                }

                this._authService.check().subscribe((authenticated) => {
                    console.log('Auth Check Result:', {
                        authenticated,
                        timestamp: new Date().toISOString()
                    });
                    if (!authenticated) {
                        this._router.navigate(['/sign-out']);
                    }
                });
            },
            error: (error) => {

                this._authService.signOut().subscribe(() => {
                    console.log('Signing out and routing to home');
                    this._router.navigate(['/sign-out']);
                });
            }
        });
    }

    /**
     * Sync access_level from backend to localStorage
     * This prevents users from manipulating their access_level client-side
     */
    private syncAccessLevel(backendAccessLevel: number): void {
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                const user = JSON.parse(storedUser);
                const clientAccessLevel = user.access_level || 1;

                // If there's a mismatch, update localStorage with the correct value
                if (clientAccessLevel !== backendAccessLevel) {
                    console.warn(`Access level mismatch detected! Client: ${clientAccessLevel}, Backend: ${backendAccessLevel}. Syncing to backend value.`);
                    user.access_level = backendAccessLevel;
                    localStorage.setItem('currentUser', JSON.stringify(user));

                    // Refresh navigation to show/hide admin menu based on new access level
                    this._navigationService.refresh();
                }
            } catch (e) {
                console.error('Error syncing access level:', e);
            }
        }
    }

}
