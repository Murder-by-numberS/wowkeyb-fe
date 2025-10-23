import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { MacroService, Macro, MacroResponse } from '../services/macro.service';
import { Subject, takeUntil } from 'rxjs';

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
    selector: 'view-all-macros',
    standalone: true,
    templateUrl: './view-all-macros.component.html',
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        RouterLink
    ]
})
export class ViewAllMacrosComponent implements OnInit, OnDestroy {
    classMacros: HomeMacrosResponse = {};
    isAuthenticated = false;
    isLoading = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Expose Object to template
    Object = Object;

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
        private router: Router,
        private macroService: MacroService
    ) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });

        this.loadMacros();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadMacros() {
        this.isLoading = true;
        this.classMacros = {};

        // Load popular macros for all classes
        this.macroService.getPopularMacros(1, 5)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: MacroResponse) => {
                    this.processMacrosResponse(response);
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading popular macros:', error);
                    this.isLoading = false;
                }
            });
    }

    private processMacrosResponse(response: MacroResponse) {
        const processedResponse: HomeMacrosResponse = {};

        // Initialize all classes with empty arrays
        this.classes.forEach(classInfo => {
            processedResponse[classInfo.name] = {
                recent: [],
                popular: []
            };
        });

        // Group macros by class
        response.macros.forEach(macro => {
            const className = macro.class || 'miscellaneous';
            if (processedResponse[className]) {
                // Add to popular macros (since we're using getPopularMacros)
                processedResponse[className].popular.push(this.transformMacro(macro));
            }
        });

        this.classMacros = processedResponse;
    }

    private transformMacro(apiMacro: any): Macro {
        return {
            id: apiMacro.id,
            name: apiMacro.name,
            description: apiMacro.description || '',
            text: apiMacro.text || apiMacro.macroText || '',
            macroText: apiMacro.text || apiMacro.macroText || '',
            class: apiMacro.class || 'miscellaneous',
            spec: apiMacro.spec,
            heroTalent: apiMacro.heroTalent,
            icon: apiMacro.icon?.url || apiMacro.icon,
            tags: apiMacro.tags || [],
            isPublic: apiMacro.isPublic || false,
            createdBy: apiMacro.createdBy,
            usageCount: apiMacro.usageCount || 0,
            createdAt: apiMacro.createdAt ? new Date(apiMacro.createdAt) : new Date(),
            updatedAt: apiMacro.updatedAt ? new Date(apiMacro.updatedAt) : new Date()
        };
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
