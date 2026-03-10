import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Keybind } from 'app/core/types/keybind';
import { Macro, MacroService } from 'app/modules/macros/services/macro.service';

@Component({
    selector: 'keybind-dialog',
    standalone: true,
    imports: [
        CommonModule,
        MatDialogModule,
        MatButtonModule,
        MatIconModule,
        MatTooltipModule,
        MatFormFieldModule,
        MatSelectModule,
    ],
    templateUrl: './keybind-dialog.component.html'
})
export class KeybindDialogComponent {
    label: string;
    keybinds: Keybind[];
    markedForRemoval = new Set<Keybind>();
    modifiedBinds = new Set<Keybind>();
    macroOptionsByBind = new Map<Keybind, Macro[]>();
    selectedMacroIdByBind = new Map<Keybind, string>();
    loadingMacrosByBind = new Map<Keybind, boolean>();
    private myMacrosCache: Macro[] | null = null;
    private readonly spellNameAliases: Record<string, string[]> = {
        'eternalflame': ['wordofglory'],
        'wordofglory': ['eternalflame'],
    };

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: KeybindDialogData,
        private dialogRef: MatDialogRef<KeybindDialogComponent>,
        private macroService: MacroService
    ) {
        console.log('data', data);
        this.label = data.key.label;
        this.keybinds = this.dedupeKeybinds(data.key.keybinds || []);
        this.loadMacrosForEligibleBinds();

        console.log('label', this.label);
        console.log('keybinds', this.keybinds);
    }

    get hasChanges(): boolean {
        return this.markedForRemoval.size > 0 || this.modifiedBinds.size > 0;
    }

    toggleRemoval(bind: Keybind) {
        if (this.markedForRemoval.has(bind)) {
            this.markedForRemoval.delete(bind);
            console.log('KeybindDialog - Removed from markedForRemoval:', bind.spell?.name);
        } else {
            this.markedForRemoval.add(bind);
            console.log('KeybindDialog - Added to markedForRemoval:', bind.spell?.name);
        }
        console.log('KeybindDialog - markedForRemoval size:', this.markedForRemoval.size);
        console.log('KeybindDialog - markedForRemoval contents:', Array.from(this.markedForRemoval).map(b => b.spell?.name));
    }

    onCancel(): void {
        this.dialogRef.close(false);
    }

    onConfirm(): void {
        console.log('KeybindDialog - onConfirm called');
        console.log('KeybindDialog - original keybinds:', this.keybinds.length);
        console.log('KeybindDialog - original keybinds details:', this.keybinds.map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));
        console.log('KeybindDialog - markedForRemoval size:', this.markedForRemoval.size);
        console.log('KeybindDialog - marked for removal:', Array.from(this.markedForRemoval).map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));

        // Filter out the marked keybinds from the working copy
        const filteredKeybinds = this.keybinds.filter(bind => {
            const isMarked = this.markedForRemoval.has(bind);
            console.log('KeybindDialog - checking keybind:', {
                name: bind.spell?.name,
                spellId: bind.spell?.spellId,
                isMarked,
                willKeep: !isMarked
            });
            return !isMarked;
        });
        const dedupedFilteredKeybinds = this.dedupeKeybinds(filteredKeybinds);

        console.log('KeybindDialog - filtered keybinds:', dedupedFilteredKeybinds.length);
        console.log('KeybindDialog - filtered keybinds details:', dedupedFilteredKeybinds.map(b => ({
            name: b.spell?.name,
            spellId: b.spell?.spellId
        })));

        this.dialogRef.close(dedupedFilteredKeybinds);
    }

    shouldOfferMacro(bind: Keybind): boolean {
        if (!bind?.spell || this.isMacroBind(bind)) return false;
        return (this.macroOptionsByBind.get(bind) || []).length > 0;
    }

    isMacroBind(bind: Keybind): boolean {
        if (!bind?.spell) return false;
        return bind.spell.isMacro === true
            || bind.spell.actionType === 'macro'
            || String(bind.spell.spellId || '').startsWith('macro:');
    }

    applyMacro(bind: Keybind): void {
        if (!this.shouldOfferMacro(bind)) return;
        const selectedId = this.selectedMacroIdByBind.get(bind);
        if (!selectedId) return;
        const macro = (this.macroOptionsByBind.get(bind) || []).find((item) => {
            const id = this.getMacroId(item);
            const fallback = item.id || item.name;
            return id === selectedId || String(fallback) === selectedId;
        });
        if (!macro) return;

        const macroId = this.getMacroId(macro);
        bind.spell = {
            ...bind.spell,
            key: macro.name || `${bind.spell.name} Macro`,
            description: macro.macro_text || macro.macroText || macro.text || bind.spell.description,
            icon: this.resolveMacroIcon(macro),
            id: macroId,
            name: macro.name || `${bind.spell.name} Macro`,
            spellId: `macro:${macroId}`,
            actionType: 'macro',
            isMacro: true,
            macroId,
            macroText: macro.macro_text || macro.macroText || macro.text || '',
            sourceSpellId: bind.spell.sourceSpellId || bind.spell.spellId,
            sourceSpellName: bind.spell.sourceSpellName || bind.spell.name,
        };
        this.modifiedBinds.add(bind);
    }

    private loadMacrosForEligibleBinds(): void {
        this.keybinds.forEach((bind) => {
            if (bind.spell.isMacro || bind.spell.actionType === 'macro' || String(bind.spell.spellId || '').startsWith('macro:')) {
                return;
            }

            this.loadingMacrosByBind.set(bind, true);
            const abilityId = bind?.spell?.id ? String(bind.spell.id) : '';
            if (abilityId) {
                this.macroService.getMacrosByAbility({ abilityId, page: 1, limit: 50 }).subscribe({
                    next: (response) => {
                        const macros = Array.isArray(response?.macros) ? response.macros : [];
                        if (macros.length > 0) {
                            this.setMacroOptions(bind, macros);
                            this.loadingMacrosByBind.set(bind, false);
                            return;
                        }
                        this.loadMacrosFromFallback(bind);
                    },
                    error: () => this.loadMacrosFromFallback(bind),
                });
                return;
            }

            this.loadMacrosFromFallback(bind);
        });
    }

    private loadMacrosFromFallback(bind: Keybind): void {
        if (this.myMacrosCache) {
            this.setMacroOptions(bind, this.filterMacrosForBind(this.myMacrosCache, bind));
            this.loadingMacrosByBind.set(bind, false);
            return;
        }

        this.macroService.getMyMacros(1, 250, 'created_at', 'desc').subscribe({
            next: (response) => {
                this.myMacrosCache = Array.isArray(response?.macros) ? response.macros : [];
                this.setMacroOptions(bind, this.filterMacrosForBind(this.myMacrosCache, bind));
                this.loadingMacrosByBind.set(bind, false);
            },
            error: () => {
                this.macroOptionsByBind.set(bind, []);
                this.loadingMacrosByBind.set(bind, false);
            },
        });
    }

    private setMacroOptions(bind: Keybind, macros: Macro[]): void {
        this.macroOptionsByBind.set(bind, macros);
        if (macros.length > 0) {
            this.selectedMacroIdByBind.set(bind, this.getMacroId(macros[0]));
        }
    }

    private filterMacrosForBind(macros: Macro[], bind: Keybind): Macro[] {
        const spellId = String(bind.spell?.sourceSpellId || bind.spell?.spellId || '');
        const spellNameCandidates = this.getSpellNameCandidates([
            String(bind.spell?.sourceSpellName || ''),
            String(bind.spell?.name || ''),
        ]);
        const abilityId = bind.spell?.id ? String(bind.spell.id) : '';

        return macros.filter((macro) => {
            const macroAbility = macro.ability;
            const macroAbilityId = typeof macroAbility === 'string'
                ? macroAbility
                : (macroAbility && typeof macroAbility === 'object' && 'id' in macroAbility ? String((macroAbility as any).id) : '');
            if (abilityId && macroAbilityId && macroAbilityId === abilityId) return true;

            const macroAbilitySpellId =
                macroAbility && typeof macroAbility === 'object'
                    ? String((macroAbility as any).spellId || (macroAbility as any).spell_id || '')
                    : '';
            if (spellId && macroAbilitySpellId && macroAbilitySpellId === spellId) return true;

            const macroAbilityName =
                macroAbility && typeof macroAbility === 'object'
                    ? this.normalizeSpellName(String((macroAbility as any).name || ''))
                    : '';
            if (macroAbilityName && spellNameCandidates.has(macroAbilityName)) return true;

            return false;
        });
    }

    private getSpellNameCandidates(names: string[]): Set<string> {
        const candidates = new Set<string>();
        names.forEach((raw) => {
            const normalized = this.normalizeSpellName(raw);
            if (!normalized) return;
            candidates.add(normalized);
            const aliases = this.spellNameAliases[normalized] || [];
            aliases.forEach((alias) => candidates.add(alias));
        });
        return candidates;
    }

    private normalizeSpellName(value: string): string {
        return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private getMacroId(macro: Macro): string {
        return macro.id ? String(macro.id) : this.slugify(macro.name || 'macro');
    }

    private resolveMacroIcon(macro: Macro): string {
        const icon = macro.icon;
        if (typeof icon === 'string' && icon.trim()) return icon;
        if (icon && typeof icon === 'object' && 'cloudfrontUrl' in icon && icon.cloudfrontUrl) {
            return icon.cloudfrontUrl;
        }
        return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
    }

    private slugify(value: string): string {
        return (value || 'macro').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'macro';
    }

    private dedupeKeybinds(keybinds: Keybind[]): Keybind[] {
        const seen = new Set<string>();
        const unique: Keybind[] = [];
        keybinds.forEach((bind) => {
            const key = String(bind?.key || '').toLowerCase().replace(/\s+/g, '');
            const spellId = String(bind?.spell?.spellId || '').toLowerCase();
            const actionType = String(bind?.spell?.actionType || '').toLowerCase();
            const macroId = String(bind?.spell?.macroId || '').toLowerCase();
            const signature = [key, spellId, actionType, macroId].join('|');
            if (!key || !spellId) return;
            if (seen.has(signature)) return;
            seen.add(signature);
            unique.push(bind);
        });
        return unique;
    }
}

interface KeybindDialogData {
    key: {
        label: string;
        keybinds: Keybind[];
    }
}
