import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { KeybindingService, HomeKeybindingsResponse } from 'app/core/services/keybinding.service';
import { Keybinding } from 'app/core/types/keybinding';
import { Subject, takeUntil } from 'rxjs';

export interface ClassInfo {
    name: string;
    displayName: string;
    icon: string;
    color: string;
    keybindingCount: number;
}



@Component({
    selector: 'view-all-keybindings',
    standalone: true,
    templateUrl: './view-all-keybindings.component.html',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        RouterLink
    ]
})
export class ViewAllKeybindingsComponent implements OnInit, OnDestroy {
    classKeybindings: HomeKeybindingsResponse = {};
    isAuthenticated = false;
    isLoading = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Expose Object to template
    Object = Object;

    classes: ClassInfo[] = [
        { name: 'deathknight', displayName: 'Death Knight', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg', color: '#C41F3B', keybindingCount: 0 },
        { name: 'demonhunter', displayName: 'Demon Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg', color: '#A330C9', keybindingCount: 0 },
        { name: 'druid', displayName: 'Druid', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg', color: '#FF7D0A', keybindingCount: 0 },
        { name: 'evoker', displayName: 'Evoker', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg', color: '#33937F', keybindingCount: 0 },
        { name: 'hunter', displayName: 'Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg', color: '#ABD473', keybindingCount: 0 },
        { name: 'mage', displayName: 'Mage', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg', color: '#69CCF0', keybindingCount: 0 },
        { name: 'monk', displayName: 'Monk', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg', color: '#00FF96', keybindingCount: 0 },
        { name: 'paladin', displayName: 'Paladin', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg', color: '#F58CBA', keybindingCount: 0 },
        { name: 'priest', displayName: 'Priest', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg', color: '#FFFFFF', keybindingCount: 0 },
        { name: 'rogue', displayName: 'Rogue', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg', color: '#FFF569', keybindingCount: 0 },
        { name: 'shaman', displayName: 'Shaman', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg', color: '#0070DE', keybindingCount: 0 },
        { name: 'warlock', displayName: 'Warlock', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg', color: '#9482C9', keybindingCount: 0 },
        { name: 'warrior', displayName: 'Warrior', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg', color: '#C79C6E', keybindingCount: 0 }
    ];

    constructor(
        private _authService: AuthService,
        private router: Router,
        private keybindingService: KeybindingService
    ) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });

        this.loadKeybindings();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadKeybindings() {
        this.isLoading = true;
        this.classKeybindings = {};

        // Load home keybindings (public endpoint, no auth required)
        this.keybindingService.getHomeKeybindings()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: HomeKeybindingsResponse) => {
                    console.log('Loaded home keybindings:', response);
                    this.classKeybindings = response;
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading home keybindings:', error);
                    this.isLoading = false;
                }
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
