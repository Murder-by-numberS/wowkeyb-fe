import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface User {
    id: string;
    email: string;
    // Add other user properties as needed
}

@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private currentUserSubject = new BehaviorSubject<User | null>(null);
    public currentUser$ = this.currentUserSubject.asObservable();

    constructor() {
        // Initialize from localStorage if available
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUserSubject.next(JSON.parse(savedUser));
        }
    }

    getCurrentUser(): User | null {
        return this.currentUserSubject.value;
    }

    setCurrentUser(user: User | null): void {
        if (user) {
            localStorage.setItem('currentUser', JSON.stringify(user));
        } else {
            localStorage.removeItem('currentUser');
        }
        this.currentUserSubject.next(user);
    }

    isAuthenticated(): boolean {
        return !!this.getCurrentUser();
    }
}
