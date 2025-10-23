import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { Keybinding } from 'app/core/types/keybinding';
import { classes } from 'app/core/data/classes';
import { HomeKeybindingsResponse } from 'app/core/types/keybinding';

@Component({
    selector: 'keybinds-home',
    templateUrl: './keybinds-home.component.html',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        RouterLink
    ]
})
export class KeybindsHomeComponent implements OnInit {
    classKeybindings: HomeKeybindingsResponse = {};
    isAuthenticated = false;
    classes = classes;

    constructor(
        private _keybindingService: KeybindingService,
        private _authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });

        this._keybindingService.getHomeKeybindings().subscribe(response => {
            console.log('Home keybindings response:', response);
            console.log('Classes:', this.classes);
            console.log('Response keys:', Object.keys(response));

            // Log keybinding IDs for debugging
            Object.entries(response).forEach(([className, data]) => {
                console.log(`Class ${className} recent keybindings:`, data.recent.map(k => k.keybindingId));
                console.log(`Class ${className} popular keybindings:`, data.popular.map(k => k.keybindingId));
            });

            // Filter out keybindings without valid IDs
            const filteredResponse: HomeKeybindingsResponse = {};
            Object.entries(response).forEach(([className, data]) => {
                filteredResponse[className] = {
                    recent: data.recent.filter(k => k && k.keybindingId),
                    popular: data.popular.filter(k => k && k.keybindingId)
                };
            });

            this.classKeybindings = filteredResponse;
            console.log('Updated classKeybindings:', this.classKeybindings);
        });
    }

    scrollToClass(className: string): void {
        const elementId = `class-${className.toLowerCase().replace(/\s+/g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    navigateToKeybinding(keybinding: Keybinding): void {
        console.log('Navigating to keybinding:', keybinding);
        if (!keybinding || !keybinding.keybindingId) {
            console.error('Invalid keybinding or missing keybindingId:', keybinding);
            return;
        }
        this.router.navigate(['/keybinds', keybinding.keybindingId]);
    }
}
