import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap, throwError } from 'rxjs';

import { environment } from 'environments/environment';

import { AuthUtils } from 'app/core/auth/auth.utils';
import { UserService } from 'app/core/user/user.service';
import { KeybindingService } from 'app/core/services/keybinding.service';

@Injectable({ providedIn: 'root' })
export class AuthService {
    private _authenticated: boolean = false;
    private _httpClient = inject(HttpClient);
    private _userService = inject(UserService);
    private _keybindingService = inject(KeybindingService);
    private apiUrl: string;

    // -----------------------------------------------------------------------------------------------------
    // @ Accessors
    // -----------------------------------------------------------------------------------------------------

    /**
     * Setter & getter for access token
     */
    set accessToken(token: string) {
        localStorage.setItem('accessToken', token);
    }

    get accessToken(): string {
        return localStorage.getItem('accessToken') ?? '';
    }

    set currentUser(user: string) {
        localStorage.setItem('currentUser', user);
    }

    get currentUser(): string {
        return localStorage.getItem('currentUser') ?? '';
    }

    // -----------------------------------------------------------------------------------------------------
    // @ Public methods
    // -----------------------------------------------------------------------------------------------------

    /**
     * Forgot password
     *
     * @param email
     */
    forgotPassword(email: string): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/forgot-password`, { email });
    }

    /**
     * Reset password
     *
     * @param passwordPayload
     */
    resetPassword(passwordPayload: any): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/auth/reset-password`, passwordPayload);
    }

    /**
     * Change password
     *
     * @param passwordPayload
     */
    changePassword(passwordPayload: any): Observable<any> {
        return this._httpClient.put(`${this.apiUrl}/auth/change-password`, passwordPayload);
    }

    /**
     * Sign in
     *
     * @param credentials
     */
    signIn(credentials: { email: string; password: string }): Observable<any> {
        // Throw error, if the user is already logged in
        if (this._authenticated) {
            return throwError('User is already logged in.');
        }

        return this._httpClient.post(`${this.apiUrl}/auth/login`, credentials).pipe(
            switchMap((response: any) => {

                console.log('AuthService - response', response);

                // Store the access token in the local storage
                this.accessToken = response.token;
                this.currentUser = JSON.stringify(response.user);

                // Set the authenticated flag to true
                this._authenticated = true;

                // // Store the user on the user service
                this._userService.user = response.user;

                //set response.user.keybindings to local storage
                localStorage.setItem('keybindings', JSON.stringify(response.keybindings));

                // Return a new observable with the response
                return of(response);
            })
        );
    }

    /**
     * Sign in using the access token
     */
    signInUsingToken(): Observable<any> {
        // Add check for token existence
        if (!this.accessToken) {
            return of(false);
        }

        // Sign in using the token
        return this._httpClient
            .post(`${this.apiUrl}/auth/refresh-access-token`, {
                accessToken: this.accessToken,
            })
            .pipe(
                catchError((error) => {
                    // Clear everything on error
                    this.signOut().subscribe();
                    return of(false);
                }),
                switchMap((response: any) => {
                    if (!response) {
                        return of(false);
                    }

                    // Store the access token in the local storage
                    this.accessToken = response.token;

                    // Set the authenticated flag to true
                    this._authenticated = true;

                    // Store the user on the user service
                    this._userService.user = response.user;

                    // Set keybindings
                    if (response.keybindings) {
                        localStorage.setItem('keybindings', JSON.stringify(response.keybindings));
                    }

                    // Return true
                    return of(true);
                })
            );
    }

    /**
     * Sign out
     */
    signOut(): Observable<any> {
        // Clear all auth-related storage
        localStorage.clear();  // This will clear all localStorage items
        // OR if you want to be more specific:
        // localStorage.removeItem('accessToken');
        // localStorage.removeItem('currentUser');
        // localStorage.removeItem('keybindings');

        // Set the authenticated flag to false
        this._authenticated = false;

        // Clear keybindings
        this._keybindingService.clearKeybindings();

        // Return the observable
        return of(true);
    }

    /**
     * Sign up
     *
     * @param user
     */
    signUp(user: {
        username: string;
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/register`, user);
    }

    /**
     * Confirm
     *
     * @param confirmCode
     */
    confirmUser(confirmCode: string): Observable<any> {
        return this._httpClient.post(`${this.apiUrl}/auth/confirm-user`, { confirmCode });
    }

    /**
     * Unlock session
     *
     * @param credentials
     */
    unlockSession(credentials: {
        email: string;
        password: string;
    }): Observable<any> {
        return this._httpClient.post('api/auth/unlock-session', credentials);
    }

    /**
     * Check the authentication status
     */
    check(): Observable<boolean> {
        // Check if the user is logged in
        if (this._authenticated) {
            return of(true);
        }

        // Check the access token availability
        if (!this.accessToken) {
            return of(false);
        }

        // Check the access token expire date
        if (AuthUtils.isTokenExpired(this.accessToken)) {
            // Clear all localStorage when token is expired
            localStorage.clear();
            this._authenticated = false;
            this._keybindingService.clearKeybindings();

            return of(false);
        }

        // If the access token exists, and it didn't expire, sign in using it
        return this.signInUsingToken();
    }

    setBackendURL(): void {
        if (environment.production === true) {
            this.apiUrl = sessionStorage.getItem('backend_url');
        } else {
            this.apiUrl = environment.apiUrl;
        }
    }

    getBackendURL(): string {
        return this.apiUrl;
    }

    initializeBackendURL(): Observable<any> {
        console.log('initializing backend');
        if (environment.production === true) {
            console.log(
                'getting backend URL',
                `${window.location.origin}/backend`
            );
            return this._httpClient.get(`${window.location.origin}/backend`);
        } else {
            console.log('production env', environment.production);

            return of(true);
        }
    }
}
