import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';

export interface Macro {
    id: string;
    name: string;
    description: string;
    class: string;
    spec?: string;
    heroTalent?: string;
    macroText: string;
    icon?: string;
    tags: string[];
    isPublic: boolean;
    createdBy?: string;
    usageCount: number;
    rating?: number;
    createdAt: Date;
    updatedAt: Date;
}

export interface ClassInfo {
    name: string;
    displayName: string;
    icon: string;
    color: string;
    macroCount: number;
}

export interface HomeMacrosResponse {
    [className: string]: {
        recent: Macro[];
        popular: Macro[];
    };
}

@Component({
    selector: 'app-macros-home',
    standalone: true,
    templateUrl: './macros-home.component.html',
    styleUrls: ['./macros-home.component.scss'],
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        RouterLink
    ]
})
export class MacrosHomeComponent implements OnInit {
    classMacros: HomeMacrosResponse = {};
    isAuthenticated = false;

    classes: ClassInfo[] = [
        { name: 'deathknight', displayName: 'Death Knight', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg', color: '#C41F3B', macroCount: 0 },
        { name: 'demonhunter', displayName: 'Demon Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg', color: '#A330C9', macroCount: 0 },
        { name: 'druid', displayName: 'Druid', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg', color: '#FF7D0A', macroCount: 0 },
        { name: 'evoker', displayName: 'Evoker', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg', color: '#33937F', macroCount: 0 },
        { name: 'hunter', displayName: 'Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg', color: '#ABD473', macroCount: 0 },
        { name: 'mage', displayName: 'Mage', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg', color: '#69CCF0', macroCount: 0 },
        { name: 'monk', displayName: 'Monk', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg', color: '#00FF96', macroCount: 0 },
        { name: 'paladin', displayName: 'Paladin', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg', color: '#F58CBA', macroCount: 0 },
        { name: 'priest', displayName: 'Priest', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg', color: '#FFFFFF', macroCount: 0 },
        { name: 'rogue', displayName: 'Rogue', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg', color: '#FFF569', macroCount: 0 },
        { name: 'shaman', displayName: 'Shaman', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg', color: '#0070DE', macroCount: 0 },
        { name: 'warlock', displayName: 'Warlock', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg', color: '#9482C9', macroCount: 0 },
        { name: 'warrior', displayName: 'Warrior', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg', color: '#C79C6E', macroCount: 0 },
        { name: 'miscellaneous', displayName: 'Miscellaneous', icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg', color: '#808080', macroCount: 0 }
    ];

    constructor(
        private _authService: AuthService,
        private router: Router
    ) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });

        this.loadMacros();
    }

    loadMacros() {
        // Mock data - replace with actual service call
        // For now, we'll generate mock data similar to keybinds-home structure
        const mockResponse: HomeMacrosResponse = {};

        this.classes.forEach(classInfo => {
            const recentMacros: Macro[] = [];
            const popularMacros: Macro[] = [];

            // Generate 3-5 recent macros
            for (let i = 1; i <= Math.floor(Math.random() * 3) + 3; i++) {
                recentMacros.push({
                    id: `${classInfo.name}_recent_${i}`,
                    name: `${classInfo.displayName} Recent Macro ${i}`,
                    description: `A recent macro for ${classInfo.displayName}`,
                    class: classInfo.name,
                    macroText: `/cast ${classInfo.name} ability`,
                    tags: ['recent', classInfo.name],
                    isPublic: true,
                    usageCount: Math.floor(Math.random() * 50),
                    rating: Math.floor(Math.random() * 5) + 1,
                    createdAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - Math.random() * 2 * 24 * 60 * 60 * 1000)
                });
            }

            // Generate 3-5 popular macros
            for (let i = 1; i <= Math.floor(Math.random() * 3) + 3; i++) {
                popularMacros.push({
                    id: `${classInfo.name}_popular_${i}`,
                    name: `${classInfo.displayName} Popular Macro ${i}`,
                    description: `A popular macro for ${classInfo.displayName}`,
                    class: classInfo.name,
                    macroText: `/cast ${classInfo.name} utility`,
                    tags: ['popular', classInfo.name],
                    isPublic: true,
                    usageCount: Math.floor(Math.random() * 200) + 100,
                    rating: Math.floor(Math.random() * 2) + 4,
                    createdAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000),
                    updatedAt: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000)
                });
            }

            mockResponse[classInfo.name] = {
                recent: recentMacros,
                popular: popularMacros
            };
        });

        this.classMacros = mockResponse;
    }

    scrollToClass(className: string): void {
        const elementId = `class-${className.toLowerCase().replace(/\s+/g, '-')}`;
        const element = document.getElementById(elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    }

    navigateToMacro(macro: Macro): void {
        console.log('Navigating to macro:', macro);
        if (!macro || !macro.id) {
            console.error('Invalid macro or missing id:', macro);
            return;
        }
        this.router.navigate(['/macros', macro.id]);
    }
}
