import {
    HttpErrorResponse,
    HttpEvent,
    HttpHandlerFn,
    HttpRequest,
} from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthUtils } from 'app/core/auth/auth.utils';
import { Observable, catchError, throwError } from 'rxjs';
import { Router } from '@angular/router';
import { BackendService } from 'app/core/services/backend.service';

/**
 * Intercept
 *
 * @param req
 * @param next
 */
export const authInterceptor = (
    req: HttpRequest<unknown>,
    next: HttpHandlerFn
): Observable<HttpEvent<unknown>> => {
    const authService = inject(AuthService);
    const router = inject(Router);
    const backendService = inject(BackendService);

    // Clone the request object
    let newReq = req.clone();

    // Request
    //
    // If the access token didn't expire, add the Authorization header.
    // We won't add the Authorization header if the access token expired.
    // This will force the server to return a "401 Unauthorized" response
    // for the protected API routes which our response interceptor will
    // catch and delete the access token from the local storage while logging
    // the user out from the app.

    const token = authService.accessToken;

    // Helper function to check if token is a valid JWT format
    const isValidJWT = (token: string): boolean => {
        if (!token || token.trim() === '' || token === 'null' || token === 'undefined') {
            return false;
        }
        // Check if it has 3 parts separated by dots (basic JWT structure)
        const parts = token.split('.');
        return parts.length === 3;
    };

    if (
        token &&
        isValidJWT(token) &&
        !AuthUtils.isTokenExpired(token)
    ) {
        newReq = req.clone({
            headers: req.headers.set(
                'Authorization',
                'Bearer ' + token
            ),
        });
    }

    // Response
    return next(newReq).pipe(
        catchError((error) => {
            // Catch "401 Unauthorized" responses
            if (error instanceof HttpErrorResponse && error.status === 401) {
                // Sign out


                authService.signOut().subscribe(() => {

                    backendService.stopPing();

                    router.navigate(['home']);
                });

            }

            return throwError(error);
        })
    );
};
