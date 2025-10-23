import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { AuthService } from '../auth/auth.service';
import { Keybinding } from '../types/keybinding';

export interface UserProfile {
    username: string;
    description: string;
    favorite_class: string | null;
    created_at: string;
    keybindings: Keybinding[];
    macros: any[];
    stats: {
        total_keybindings: number;
        total_macros: number;
    };
}

export interface UserKeybindingsResponse {
    keybindings: Keybinding[];
    pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        has_next_page: boolean;
        has_prev_page: boolean;
        limit: number;
    };
}

export interface UserMacrosResponse {
    macros: any[];
    pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        has_next_page: boolean;
        has_prev_page: boolean;
        limit: number;
    };
}

@Injectable({
    providedIn: 'root',
})
export class ProfileService {
    apiUrl: string;

    constructor(private http: HttpClient, private authService: AuthService) {
        this.getBackendURL();
    }

    getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
        }
    }

    /**
     * Get user profile by username
     */
    getUserProfile(username: string): Observable<UserProfile> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/profile/${username}`;
        return this.http.get<UserProfile>(urlString);
    }

    /**
     * Get user's public keybindings
     */
    getUserKeybindings(username: string, page: number = 1, limit: number = 20): Observable<UserKeybindingsResponse> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/profile/${username}/keybindings?page=${page}&limit=${limit}`;
        return this.http.get<UserKeybindingsResponse>(urlString);
    }

    /**
     * Get user's public macros
     */
    getUserMacros(username: string, page: number = 1, limit: number = 20): Observable<UserMacrosResponse> {
        this.getBackendURL();
        const urlString = `${this.apiUrl}/profile/${username}/macros?page=${page}&limit=${limit}`;
        return this.http.get<UserMacrosResponse>(urlString);
    }
}

