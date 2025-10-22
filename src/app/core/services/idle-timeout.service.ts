import { Injectable, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { AuthService } from '../auth/auth.service';
import { Subject, fromEvent, merge, timer } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

@Injectable({
    providedIn: 'root'
})
export class IdleTimeoutService {
    private idle$ = new Subject<void>();
    private destroy$ = new Subject<void>();
    private idleTimer: any;
    private warningTimer: any;

    // Configurable timeouts (in minutes)
    private readonly IDLE_TIMEOUT = 30; // 30 minutes of inactivity
    private readonly WARNING_BEFORE = 3; // Warn 3 minutes before timeout
    private readonly TOKEN_REFRESH_THRESHOLD = 5; // Refresh token if expires in 5 min

    private lastActivity: Date = new Date();
    private isWarningShown: boolean = false;

    constructor(
        private authService: AuthService,
        private router: Router,
        private dialog: MatDialog,
        private ngZone: NgZone
    ) { }

    /**
     * Start monitoring user activity
     */
    startWatching(): void {
        console.log('IdleTimeoutService - Starting to watch user activity');

        // Monitor user activity events
        const events$ = merge(
            fromEvent(document, 'click'),
            fromEvent(document, 'keydown'),
            fromEvent(document, 'scroll'),
            fromEvent(document, 'mousemove')
        );

        // Debounce activity events to avoid excessive processing
        events$.pipe(
            debounceTime(1000), // Only process once per second
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.onUserActivity();
        });

        // Start the idle timer
        this.resetIdleTimer();
    }

    /**
     * Stop monitoring
     */
    stopWatching(): void {
        console.log('IdleTimeoutService - Stopping watch');
        this.destroy$.next();
        this.clearTimers();
    }

    /**
     * Called when user activity is detected
     */
    private onUserActivity(): void {
        this.lastActivity = new Date();
        this.checkAndRefreshToken();
        this.resetIdleTimer();

        // Close warning dialog if it's shown and user is active
        if (this.isWarningShown) {
            this.isWarningShown = false;
            this.dialog.closeAll();
        }
    }

    /**
     * Check if token needs refresh and refresh it
     */
    private checkAndRefreshToken(): void {
        const token = this.authService.accessToken;
        if (!token) return;

        try {
            // Decode JWT to get expiration
            const payload = JSON.parse(atob(token.split('.')[1]));
            const expiresAt = new Date(payload.exp * 1000);
            const now = new Date();
            const minutesUntilExpiry = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

            // If token expires in less than threshold minutes, refresh it
            if (minutesUntilExpiry < this.TOKEN_REFRESH_THRESHOLD && minutesUntilExpiry > 0) {
                console.log(`Token expires in ${minutesUntilExpiry.toFixed(1)} minutes, refreshing...`);
                this.refreshToken();
            }
        } catch (error) {
            console.error('Error checking token expiration:', error);
        }
    }

    /**
     * Refresh the authentication token
     */
    private refreshToken(): void {
        const token = this.authService.accessToken;
        if (!token) return;

        this.authService.refreshAccessToken(token).subscribe({
            next: (response) => {
                console.log('Token refreshed successfully');
                // Token is automatically stored by the auth service
            },
            error: (error) => {
                console.error('Error refreshing token:', error);
                // If refresh fails, log the user out
                this.logout();
            }
        });
    }

    /**
     * Reset the idle timer
     */
    private resetIdleTimer(): void {
        this.clearTimers();

        // Set warning timer (e.g., 27 minutes for 30-minute timeout with 3-minute warning)
        const warningTime = (this.IDLE_TIMEOUT - this.WARNING_BEFORE) * 60 * 1000;
        this.warningTimer = setTimeout(() => {
            this.showIdleWarning();
        }, warningTime);

        // Set logout timer
        const logoutTime = this.IDLE_TIMEOUT * 60 * 1000;
        this.idleTimer = setTimeout(() => {
            this.logout();
        }, logoutTime);
    }

    /**
     * Show idle warning dialog
     */
    private showIdleWarning(): void {
        if (this.isWarningShown) return;

        this.ngZone.run(() => {
            this.isWarningShown = true;

            // Simple confirmation using browser confirm
            // TODO: Replace with custom Material Dialog for better UX
            const stayLoggedIn = confirm(
                `You've been inactive for ${this.IDLE_TIMEOUT - this.WARNING_BEFORE} minutes.\n\n` +
                `You will be logged out in ${this.WARNING_BEFORE} minutes due to inactivity.\n\n` +
                'Click OK to stay logged in, or Cancel to log out now.'
            );

            if (stayLoggedIn) {
                this.onUserActivity(); // Treat as activity and refresh
            } else {
                this.logout();
            }
        });
    }

    /**
     * Log the user out
     */
    private logout(): void {
        console.log('IdleTimeoutService - Logging out due to inactivity');
        this.stopWatching();
        this.authService.signOut().subscribe(() => {
            this.router.navigate(['/home']);
        });
    }

    /**
     * Clear all timers
     */
    private clearTimers(): void {
        if (this.idleTimer) {
            clearTimeout(this.idleTimer);
            this.idleTimer = null;
        }
        if (this.warningTimer) {
            clearTimeout(this.warningTimer);
            this.warningTimer = null;
        }
    }

    /**
     * Get time until idle timeout
     */
    getTimeUntilTimeout(): number {
        const now = new Date();
        const timeSinceActivity = now.getTime() - this.lastActivity.getTime();
        const timeoutMs = this.IDLE_TIMEOUT * 60 * 1000;
        return Math.max(0, timeoutMs - timeSinceActivity);
    }
}

