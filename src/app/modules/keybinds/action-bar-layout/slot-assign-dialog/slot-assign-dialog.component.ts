import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { Ability } from 'app/core/types/ability';
import { Keybinding } from 'app/core/types/keybinding';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { formatClassName } from 'app/core/util/util';

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
        id: string;
        keybinding: string;
        name: string;
        spellId: string;
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
        <h2 mat-dialog-title>Add ability to slot</h2>
        <mat-dialog-content class="min-h-[200px]">
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-3">
                Keybind: <span class="font-mono font-medium text-gray-700 dark:text-gray-300">{{ data.slotKey }}</span>
            </p>
            @if (isLoading) {
            <div class="flex justify-center py-12">
                <mat-spinner diameter="40"></mat-spinner>
            </div>
            } @else if (abilities.length === 0) {
            <p class="text-gray-500 dark:text-gray-400 py-4">No abilities available. Select a keybinding with class and spec in Keyboard view first.</p>
            } @else {
            <div class="grid grid-cols-6 sm:grid-cols-8 gap-2 py-2 max-h-[300px] overflow-y-auto">
                @for (ability of abilities; track ability.id) {
                <button
                    type="button"
                    (click)="selectAbility(ability)"
                    class="flex flex-col items-center p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <img [src]="ability.icon" [alt]="ability.name" class="w-10 h-10 object-contain" />
                    <span class="text-xs truncate w-full text-center mt-1">{{ ability.name }}</span>
                </button>
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
    isLoading = true;

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: SlotAssignDialogData,
        private dialogRef: MatDialogRef<SlotAssignDialogComponent>,
        private abilitiesService: AbilitiesService
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

        this.abilitiesService
            .getAbilities(
                wowClass,
                spec,
                heroTalent,
                gameVersion
            )
            .subscribe({
                next: (res: any) => {
                    this.abilities = Array.isArray(res) ? res : (res?.abilities || res?.data || []);
                    this.isLoading = false;
                },
                error: () => {
                    this.abilities = [];
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
            },
        };
        this.dialogRef.close(result);
    }

    onCancel(): void {
        this.dialogRef.close();
    }
}
