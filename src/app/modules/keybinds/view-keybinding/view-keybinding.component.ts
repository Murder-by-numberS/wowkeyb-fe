import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, takeUntil } from 'rxjs';
import { KeybindingService } from '../../../core/services/keybinding.service';
import { AbilitiesService } from '../../../core/services/abilities.service';
import { Keybinding } from '../../../core/types/keybinding';
import { ViewKeyboardComponent } from '../view-keyboard/view-keyboard.component';
import { AuthService } from '../../../core/services/auth.service';
import { KeybindDetailsDialogComponent } from './keybind-details-dialog/keybind-details-dialog.component';
import { ExpandedKeyboardComponent } from '../expanded-keyboard/expanded-keyboard.component';
import { VersionCopyDialogComponent, VersionCopyDialogData } from '../version-copy-dialog/version-copy-dialog.component';

@Component({
    selector: 'app-view-keybinding',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatSelectModule,
        MatFormFieldModule,
        MatMenuModule,
        MatTooltipModule,
        ViewKeyboardComponent,
        ExpandedKeyboardComponent
    ],
    templateUrl: './view-keybinding.component.html'
})
export class ViewKeybindingComponent implements OnInit, OnDestroy {
    private static readonly ADDON_SHARE_CODE_PREFIX = 'WK1:';
    keybinding: Keybinding | null = null;
    isOwner = false;
    isAuthenticated = false;
    isExpanded = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();
    @ViewChild('expandedKeyboard') expandedKeyboardComponent?: ExpandedKeyboardComponent;

    // Version switching
    keybindingVersions: Array<{ keybindingId: string; versionId: string; gameVersion: string; isCurrent: boolean }> = [];
    availableVersions: Array<{ id: string; gameVersion: string }> = [];
    versionsWithoutKeybinding: Array<{ id: string; gameVersion: string }> = [];
    isCopyingToVersion = false;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private keybindingService: KeybindingService,
        private abilitiesService: AbilitiesService,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private dialog: MatDialog
    ) { }

    ngOnInit(): void {
        this.isAuthenticated = this.authService.isAuthenticated();
        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadKeybinding(id);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private loadKeybinding(id: string): void {
        this.keybindingService.getKeybinding(id).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (keybinding) => {
                const normalized = this.normalizeKeybindIconsForRender(keybinding);
                this.keybinding = normalized;
                this.checkOwnership();
                this.loadVersions(id);
                this.hydrateKeybindingIconsFromAbilities(normalized);
            },
            error: (error) => {
                console.error('Error loading keybinding:', error);
                this.snackBar.open('Error loading keybinding', 'Close', { duration: 3000 });
            }
        });
    }

    private loadVersions(id: string): void {
        this.keybindingService.getKeybindingVersions(id).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.keybindingVersions = response.versions;
                this.availableVersions = response.availableVersions;
                // Find versions that don't have this keybinding yet
                const existingVersionIds = this.keybindingVersions.map(v => v.versionId);
                this.versionsWithoutKeybinding = this.availableVersions.filter(
                    v => !existingVersionIds.includes(v.id)
                );
            },
            error: (error) => {
                console.error('Error loading keybinding versions:', error);
            }
        });
    }

    private checkOwnership(): void {
        if (!this.keybinding) return;

        const currentUser = this.authService.getCurrentUser();
        if (!currentUser) {
            this.isOwner = false;
            return;
        }
        this.isOwner = this.keybinding?.userId === currentUser.id;
        console.log('Ownership check:', {
            keybindingUserId: this.keybinding?.userId,
            currentUserId: currentUser.id,
            isOwner: this.isOwner
        });
    }

    onEditKeybinding(): void {
        if (this.keybinding) {
            this.router.navigate(['/keybinds/edit', this.keybinding.keybindingId]);
        }
    }

    onDuplicateKeybinding(): void {
        if (!this.keybinding) return;

        this.keybindingService.duplicateKeybinding(this.keybinding.keybindingId).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (duplicatedKeybinding) => {
                this.snackBar.open('Keybinding duplicated successfully', 'Close', { duration: 3000 });
                this.router.navigate(['/keybinds/my-keybindings'], {
                    queryParams: { keybindingId: duplicatedKeybinding.keybindingId }
                });
            },
            error: (error) => {
                console.error('Error duplicating keybinding:', error);
                this.snackBar.open('Error duplicating keybinding', 'Close', { duration: 3000 });
            }
        });
    }

    onKeyClick(key: string, keybinds: any[]): void {
        this.dialog.open(KeybindDetailsDialogComponent, {
            data: {
                key,
                keybinds
            },
            width: '400px'
        });
    }

    onExpand(): void {
        this.isExpanded = true;
        // Don't call reset here - let the expanded keyboard component handle its own initialization
    }

    onCollapse(): void {
        this.isExpanded = false;
    }

    onVersionChange(keybindingId: string): void {
        if (keybindingId && keybindingId !== this.keybinding?.keybindingId) {
            this.router.navigate(['/keybinds', keybindingId]);
        }
    }

    /**
     * Export keybinding as share code string for the WoWKeyb addon.
     */
    exportForAddon(): void {
        if (!this.keybinding?.keybinds?.length) {
            this.snackBar.open('No keybinds to export', 'Close', { duration: 3000 });
            return;
        }
        const profile: Record<string, unknown> = {
            name: this.keybinding.name,
            class: this.keybinding.class,
            spec: this.keybinding.spec,
            heroTalent: this.keybinding.heroTalent,
            keybinds: this.keybinding.keybinds.map(kb => ({
                key: kb.key,
                spell: {
                    spellId: kb.spell?.spellId?.toString() ?? '',
                    name: kb.spell?.name ?? '',
                    icon: kb.spell?.icon ?? '',
                    description: kb.spell?.description ?? '',
                    actionType: kb.spell?.actionType,
                    isMacro: kb.spell?.isMacro,
                    macroId: kb.spell?.macroId,
                    macroText: kb.spell?.macroText,
                    sourceSpellId: kb.spell?.sourceSpellId,
                    sourceSpellName: kb.spell?.sourceSpellName,
                },
                barId: kb.barId ?? undefined,
                slotIndex: kb.slotIndex ?? undefined
            }))
        };
        const macros = (this.keybinding.keybinds || [])
            .filter((kb) => kb.spell?.isMacro || kb.spell?.actionType === 'macro' || String(kb.spell?.spellId || '').startsWith('macro:'))
            .map((kb) => ({
                id: kb.spell?.macroId || kb.spell?.spellId || '',
                name: kb.spell?.name || 'Macro',
                macroText: kb.spell?.macroText || '',
                icon: kb.spell?.icon || '',
                sourceSpellId: kb.spell?.sourceSpellId || '',
                sourceSpellName: kb.spell?.sourceSpellName || '',
            }));
        if (macros.length > 0) {
            profile.macros = Array.from(
                new Map(macros.map((macro) => [String(macro.id), macro])).values()
            );
        }
        if (this.keybinding.layout?.bars?.length) {
            profile.layout = {
                bars: this.keybinding.layout.bars,
                screenWidth: this.keybinding.layout.screenWidth ?? 2560,
                screenHeight: this.keybinding.layout.screenHeight ?? 1440
            };
        }
        const json = JSON.stringify(profile);
        const shareCode = this.encodeAddonShareCode(json);
        navigator.clipboard.writeText(shareCode).then(() => {
            this.snackBar.open(
                'Copied share code! In WoW: /wowkeyb import ' + this.keybinding!.name.replace(/[^a-zA-Z0-9]/g, '') + ' then paste',
                'Close',
                { duration: 5000 }
            );
        }).catch(() => {
            this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 3000 });
        });
    }

    private encodeAddonShareCode(payload: string): string {
        const bytes = new TextEncoder().encode(payload);
        let binary = '';
        bytes.forEach((b) => {
            binary += String.fromCharCode(b);
        });
        return `${ViewKeybindingComponent.ADDON_SHARE_CODE_PREFIX}${btoa(binary)}`;
    }

    copyToVersion(versionId: string): void {
        if (!this.keybinding || this.isCopyingToVersion) return;

        this.isCopyingToVersion = true;
        this.keybindingService.copyToVersion(this.keybinding.keybindingId, versionId).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (response) => {
                this.isCopyingToVersion = false;
                
                // Show the version copy dialog with changes
                const dialogData: VersionCopyDialogData = {
                    targetVersion: response.targetVersion,
                    changes: response.changes,
                    keybindingId: response.keybinding.keybindingId
                };
                
                const dialogRef = this.dialog.open(VersionCopyDialogComponent, {
                    data: dialogData,
                    disableClose: false
                });
                
                dialogRef.afterClosed().subscribe(result => {
                    if (result?.action === 'view') {
                        this.router.navigate(['/keybinds', result.keybindingId]);
                    }
                    // Reload versions to show the new one
                    if (this.keybinding) {
                        this.loadVersions(this.keybinding.keybindingId);
                    }
                });
            },
            error: (error) => {
                console.error('Error copying keybinding:', error);
                this.snackBar.open(error.error?.message || 'Error copying keybinding', 'Close', { duration: 5000 });
                this.isCopyingToVersion = false;
            }
        });
    }

    private hydrateKeybindingIconsFromAbilities(keybinding: Keybinding): void {
        if (!keybinding?.keybinds?.length) return;
        if (!keybinding.class || !keybinding.version?.game_version) return;

        const needsIconHydration = keybinding.keybinds.some((kb) => !this.isRenderableIcon(kb?.spell?.icon));
        if (!needsIconHydration) return;

        const normalizedClass = this.normalizeFilterValue(keybinding.class);
        const normalizedSpec = this.normalizeFilterValue(keybinding.spec);
        const normalizedHeroTalent = this.normalizeFilterValue(keybinding.heroTalent);

        const filterCandidates = [
            {
                gameVersion: keybinding.version.game_version,
                class: normalizedClass,
                spec: normalizedSpec || undefined,
                heroTalent: normalizedHeroTalent || undefined,
                page: 1,
                limit: 100,
            },
            {
                gameVersion: keybinding.version.game_version,
                class: normalizedClass,
                spec: normalizedSpec || undefined,
                page: 1,
                limit: 100,
            },
            {
                gameVersion: keybinding.version.game_version,
                class: normalizedClass,
                page: 1,
                limit: 100,
            },
        ];

        const tryHydrateWithFilters = (index: number): void => {
            if (index >= filterCandidates.length) return;
            this.abilitiesService.getAbilitiesWithFilters(filterCandidates[index]).pipe(
                takeUntil(this._unsubscribeAll)
            ).subscribe({
                next: (response: any) => {
                    const abilities = Array.isArray(response) ? response : (Array.isArray(response?.abilities) ? response.abilities : []);
                    if (!abilities.length) {
                        tryHydrateWithFilters(index + 1);
                        return;
                    }

                    const bySpellId = new Map<string, string>();
                    const byName = new Map<string, string>();
                    abilities.forEach((ability: any) => {
                        const spellId = String(ability?.spellId ?? '');
                        const icon = String(ability?.icon ?? '');
                        const name = this.normalizeAbilityName(String(ability?.name ?? ''));
                        if (spellId && icon) bySpellId.set(spellId, icon);
                        if (name && icon) byName.set(name, icon);
                    });

                    let changed = false;
                    const hydratedKeybinds = keybinding.keybinds.map((kb) => {
                        const normalizedIcon = this.resolveIconForRender(kb?.spell?.icon);
                        if (this.isRenderableIcon(normalizedIcon)) {
                            if (normalizedIcon !== String(kb?.spell?.icon || '')) {
                                changed = true;
                                return {
                                    ...kb,
                                    spell: {
                                        ...kb.spell,
                                        icon: normalizedIcon,
                                    },
                                };
                            }
                            return kb;
                        }

                        const directSpellId = String(kb?.spell?.spellId ?? '').replace(/^macro:/i, '');
                        const sourceSpellId = String(kb?.spell?.sourceSpellId ?? '');
                        const sourceSpellName = this.normalizeAbilityName(String(kb?.spell?.sourceSpellName ?? ''));
                        const spellName = this.normalizeAbilityName(String(kb?.spell?.name ?? ''));
                        const hydratedIcon =
                            bySpellId.get(sourceSpellId) ||
                            bySpellId.get(directSpellId) ||
                            byName.get(sourceSpellName) ||
                            byName.get(spellName) ||
                            '';

                        if (!hydratedIcon) return kb;
                        const renderableHydratedIcon = this.resolveIconForRender(hydratedIcon);
                        changed = true;
                        return {
                            ...kb,
                            spell: {
                                ...kb.spell,
                                icon: renderableHydratedIcon || hydratedIcon,
                            },
                        };
                    });

                    if (!changed || !this.keybinding) return;
                    this.keybinding = {
                        ...this.keybinding,
                        keybinds: hydratedKeybinds,
                    };
                },
                error: (error) => {
                    if (index + 1 < filterCandidates.length) {
                        tryHydrateWithFilters(index + 1);
                        return;
                    }
                    console.error('Failed to hydrate keybinding icons from abilities:', error);
                }
            });
        };

        tryHydrateWithFilters(0);
    }

    private isRenderableIcon(icon: unknown): boolean {
        if (typeof icon !== 'string') return false;
        const value = icon.trim();
        if (!value) return false;
        return value.startsWith('http://')
            || value.startsWith('https://')
            || value.startsWith('assets/')
            || value.startsWith('/')
            || value.startsWith('data:');
    }

    private resolveIconForRender(icon: unknown): string {
        if (typeof icon !== 'string') return '';
        const value = icon.trim();
        if (!value) return '';
        if (this.isRenderableIcon(value)) return value;
        if (/^\d+$/.test(value)) {
            return `https://render.worldofwarcraft.com/us/icons/56/${value}.jpg`;
        }
        const normalized = value
            .replace(/^interface[\\/]+icons[\\/]+/i, '')
            .replace(/\.blp$/i, '')
            .replace(/\\/g, '/');
        const iconName = normalized.split('/').pop() || '';
        if (iconName) {
            return `https://wow.zamimg.com/images/wow/icons/large/${iconName.toLowerCase()}.jpg`;
        }
        return '';
    }

    private normalizeAbilityName(value: string): string {
        return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private normalizeFilterValue(value: string | null | undefined): string {
        return String(value || '').trim().toLowerCase();
    }

    private normalizeKeybindIconsForRender(keybinding: Keybinding): Keybinding {
        if (!keybinding?.keybinds?.length) return keybinding;
        let changed = false;
        const keybinds = keybinding.keybinds.map((kb) => {
            const resolvedIcon = this.resolveIconForRender(kb?.spell?.icon);
            if (!resolvedIcon || resolvedIcon === String(kb?.spell?.icon || '')) return kb;
            changed = true;
            return {
                ...kb,
                spell: {
                    ...kb.spell,
                    icon: resolvedIcon,
                },
            };
        });
        return changed ? { ...keybinding, keybinds } : keybinding;
    }
}
