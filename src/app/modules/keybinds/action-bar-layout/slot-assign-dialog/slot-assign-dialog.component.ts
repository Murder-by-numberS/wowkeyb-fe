import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';

import { Ability } from 'app/core/types/ability';
import { Keybinding } from 'app/core/types/keybinding';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { formatClassName } from 'app/core/util/util';
import { Macro, MacroService } from 'app/modules/macros/services/macro.service';

export interface SlotAssignDialogData {
    slotKey: string;
    keybinding: Keybinding;
}

export interface SlotAssignDialogResult {
    key: string;
    spell: {
        key: string;
        description: string;
        icon: string;
        id: string | number;
        keybinding: string;
        name: string;
        spellId: string;
        actionType?: 'spell' | 'macro';
        isMacro?: boolean;
        macroId?: string;
        macroText?: string;
    };
}

@Component({
    selector: 'slot-assign-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatProgressSpinnerModule,
    ],
    template: `
        <h2 mat-dialog-title class="text-2xl">Add ability to slot</h2>
        <mat-dialog-content class="h-[68vh] max-h-[70vh] min-h-[360px] overflow-hidden flex flex-col">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Keybind: <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{ data.slotKey }}</span>
            </p>
            @if (isLoading) {
            <div class="flex justify-center items-center grow py-12">
                <mat-spinner diameter="40"></mat-spinner>
            </div>
            } @else if (abilities.length === 0 && macros.length === 0) {
            <p class="text-gray-500 dark:text-gray-400 py-4">No abilities or macros available. Create macros in My Macros or select a keybinding with class/spec first.</p>
            } @else {
            <div class="grow overflow-y-auto pr-1">
            @if (abilities.length > 0) {
            <div class="mb-4">
                <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Abilities</div>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 py-2">
                    @for (ability of abilities; track ability.id) {
                    <button
                        type="button"
                        (click)="selectAbility(ability)"
                        class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-full">
                        <img [src]="ability.icon" [alt]="ability.name" class="w-14 h-14 object-contain" />
                        <span class="text-sm w-full text-center mt-2 leading-snug break-words whitespace-normal">{{ ability.name }}</span>
                    </button>
                    }
                </div>
            </div>
            }
            @if (macros.length > 0) {
            <div>
                <div class="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">Macros</div>
                <div class="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-3 py-2">
                    @for (macro of macros; track macro.id || macro.name) {
                    <button
                        type="button"
                        (click)="selectMacro(macro)"
                        class="flex flex-col items-center p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors h-full">
                        <img [src]="resolveMacroIcon(macro)" [alt]="macro.name" class="w-14 h-14 object-contain" />
                        <span class="text-sm w-full text-center mt-2 leading-snug break-words whitespace-normal">{{ macro.name }}</span>
                    </button>
                    }
                </div>
            </div>
            }
            </div>
            }
        </mat-dialog-content>
        <mat-dialog-actions align="end">
            <button mat-button (click)="onCancel()">Cancel</button>
        </mat-dialog-actions>
    `,
})
export class SlotAssignDialogComponent implements OnInit {
    abilities: Ability[] = [];
    macros: Macro[] = [];
    isLoading = true;
    private readonly macroFallbackIcon = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SlotAssignDialogData,
        private dialogRef: MatDialogRef<SlotAssignDialogComponent>,
        private abilitiesService: AbilitiesService,
        private macroService: MacroService
    ) {}

    ngOnInit(): void {
        this.loadAbilities();
    }

    private loadAbilities(): void {
        const kb = this.data.keybinding;
        const gameVersion = kb.version?.game_version || kb.versionDetails?.gameVersion || '12.0';
        const wowClass = formatClassName(kb.class || kb.randomClassDetails?.class || '');
        const spec = this.getSpec(kb);
        const heroTalent = this.getHeroTalent(kb, spec);

        if (!wowClass) {
            this.isLoading = false;
            return;
        }

        const abilities$ = this.abilitiesService
            .getAbilities(wowClass, spec, heroTalent, gameVersion)
            .pipe(catchError(() => of([])));

        const macros$ = this.macroService
            .getMyMacros(1, 250, 'created_at', 'desc')
            .pipe(catchError(() => of({ macros: [] })));

        forkJoin([abilities$, macros$]).subscribe({
            next: ([abilityRes, macroRes]: [any, any]) => {
                this.abilities = Array.isArray(abilityRes)
                    ? abilityRes
                    : (abilityRes?.abilities || abilityRes?.data || []);
                const allMacros: Macro[] = Array.isArray(macroRes?.macros) ? macroRes.macros : [];
                this.macros = allMacros.filter((macro) => this.macroMatchesContext(macro, wowClass, spec, heroTalent));
                this.isLoading = false;
            },
            error: () => {
                this.abilities = [];
                this.macros = [];
                this.isLoading = false;
            },
        });
    }

    /** Get valid spec for API (required by backend) */
    private getSpec(kb: Keybinding): string {
        const s = kb.spec || kb.randomClassDetails?.spec || '';
        if (s) return s.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
        const classSpecs: Record<string, string> = {
            deathknight: 'blood', demonhunter: 'havoc', druid: 'balance', evoker: 'devastation',
            hunter: 'beast-mastery', mage: 'arcane', monk: 'brewmaster', paladin: 'holy',
            priest: 'discipline', rogue: 'assassination', shaman: 'elemental',
            warlock: 'affliction', warrior: 'arms'
        };
        const cls = (kb.class || '').toLowerCase().replace(/\s+/g, '');
        return classSpecs[cls] || 'balance';
    }

    /** Get valid hero talent for API */
    private getHeroTalent(kb: Keybinding, spec: string): string {
        const ht = kb.heroTalent || kb.randomClassDetails?.heroTalent || '';
        if (ht) return ht.toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
        const defaults: Record<string, string> = {
            deathknight: 'deathbringer', demonhunter: 'aldrachi-reaver', druid: 'elunes-chosen',
            evoker: 'flameshaper', hunter: 'dark-ranger', mage: 'spellslinger', monk: 'master-of-harmony',
            paladin: 'herald-of-the-sun', priest: 'archon', rogue: 'deathstalker', shaman: 'farseer',
            warlock: 'hellcaller', warrior: 'colossus'
        };
        const cls = (kb.class || '').toLowerCase().replace(/\s+/g, '');
        return defaults[cls] || 'herald-of-the-sun';
    }

    selectAbility(ability: Ability): void {
        const result: SlotAssignDialogResult = {
            key: this.data.slotKey,
            spell: {
                key: ability.name,
                description: ability.description || '',
                icon: ability.icon,
                id: ability.id as any,
                keybinding: this.data.slotKey,
                name: ability.name,
                spellId: ability.spellId,
                actionType: 'spell',
            },
        };
        this.dialogRef.close(result);
    }

    selectMacro(macro: Macro): void {
        const macroText = macro.macro_text || macro.macroText || macro.text || '';
        const macroId = macro.id ? String(macro.id) : this.slugifyMacroName(macro.name || 'macro');
        const result: SlotAssignDialogResult = {
            key: this.data.slotKey,
            spell: {
                key: macro.name || 'Macro',
                description: macro.description || macroText,
                icon: this.resolveMacroIcon(macro),
                id: macroId,
                keybinding: this.data.slotKey,
                name: macro.name || 'Macro',
                spellId: `macro:${macroId}`,
                actionType: 'macro',
                isMacro: true,
                macroId,
                macroText,
            },
        };
        this.dialogRef.close(result);
    }

    resolveMacroIcon(macro: Macro): string {
        const icon = macro.icon;
        if (typeof icon === 'string' && icon.trim()) {
            return icon;
        }
        if (icon && typeof icon === 'object' && 'cloudfrontUrl' in icon && icon.cloudfrontUrl) {
            return icon.cloudfrontUrl;
        }
        return this.macroFallbackIcon;
    }

    private macroMatchesContext(macro: Macro, wowClass: string, spec: string, heroTalent: string): boolean {
        const macroClass = (macro.class || '').toLowerCase().replace(/\s+/g, '');
        const normalizedClass = wowClass.toLowerCase().replace(/\s+/g, '');
        if (macroClass && macroClass !== normalizedClass) return false;

        const macroSpec = (macro.spec || '').toLowerCase().replace(/\s+/g, '-').replace(/'/g, '');
        if (macroSpec && spec && macroSpec !== spec) return false;

        const macroHero = (macro.hero_talent || macro.heroTalent || '')
            .toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/'/g, '');
        if (macroHero && heroTalent && macroHero !== heroTalent) return false;

        return true;
    }

    private slugifyMacroName(name: string): string {
        return (name || 'macro').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'macro';
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
