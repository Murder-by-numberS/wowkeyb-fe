import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
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
            this.classKeybindings = response;
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
        this.router.navigate(['/keybinds', keybinding.keybinding_id]);
    }
}
