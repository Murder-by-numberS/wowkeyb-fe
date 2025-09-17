import { Injectable, inject } from '@angular/core';
import { BehaviorSubject, Observable, switchMap } from 'rxjs';
import { Navigation } from './navigation.types';
import { AuthService } from '../auth/auth.service';
import { getNavigationForAuthState } from './navigation.config';

@Injectable({ providedIn: 'root' })
export class NavigationService {
    private _authService = inject(AuthService);
    private _navigation = new BehaviorSubject<Navigation>({
        compact: [],
        default: [],
        futuristic: [],
        horizontal: []
    });

    constructor() {
        // Initialize navigation on service creation
        this.updateNavigation(false);
    }

    get navigation$(): Observable<Navigation> {
        return this._navigation.asObservable();
    }

    private updateNavigation(isAuthenticated: boolean): void {
        const navigationItems = getNavigationForAuthState(isAuthenticated);

        const navigation: Navigation = {
            compact: navigationItems,
            default: navigationItems,
            futuristic: navigationItems,
            horizontal: navigationItems
        };

        this._navigation.next(navigation);
    }

    refresh(): Observable<Navigation> {
        // Check current auth state and update navigation
        this._authService.check().subscribe(authenticated => {
            this.updateNavigation(authenticated);
        });
        return this.navigation$;
    }

    // Method to manually update navigation when auth state changes
    updateForAuthState(isAuthenticated: boolean): void {
        this.updateNavigation(isAuthenticated);
    }
}
