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
                this.keybinding = keybinding;
                this.checkOwnership();
                this.loadVersions(id);
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
                    description: kb.spell?.description ?? ''
                },
                barId: kb.barId ?? undefined,
                slotIndex: kb.slotIndex ?? undefined
            }))
        };
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
}
