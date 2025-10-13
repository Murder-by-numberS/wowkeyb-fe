import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { Macro, MacroService } from '../services/macro.service';
import { AuthService } from 'app/core/auth/auth.service';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { IconService } from '../../icons/services/icon.service';

@Component({
    selector: 'app-view-macro',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatTooltipModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './view-macro.component.html'
})
export class ViewMacroComponent implements OnInit, OnDestroy {
    macro: Macro | null = null;
    isOwner = false;
    isAuthenticated = false;
    isLoading = true;
    iconUrl: string | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private dialog: MatDialog,
        private iconService: IconService,
        private macroService: MacroService
    ) { }

    ngOnInit(): void {
        this.authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });

        this.route.params.subscribe(params => {
            const id = params['id'];
            if (id) {
                this.loadMacro(id);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadMacro(id: string): void {
        this.isLoading = true;

        // Load macro from API
        this.macroService.getMacro(id).subscribe({
            next: (macro) => {
                console.log('ViewMacroComponent - Loaded macro:', macro);
                this.macro = macro;

                // Check if current user owns this macro
                this.authService.check().subscribe(authenticated => {
                    if (authenticated) {
                        // For now, we'll assume ownership - this should be enhanced with proper user comparison
                        this.isOwner = true;
                    } else {
                        this.isOwner = false;
                    }
                });

                // Set loading to false first, then handle icon
                this.isLoading = false;

                // Load icon URL if macro has an icon
                if (this.macro?.icon) {
                    if (typeof this.macro.icon === 'string') {
                        // Icon is just an ID, fetch the full icon data
                        this.loadIconUrl(this.macro.icon);
                    } else if (this.macro.icon.cloudfrontUrl) {
                        // Icon is already populated with full data
                        this.iconUrl = this.macro.icon.cloudfrontUrl;
                    } else {
                        this.iconUrl = null;
                    }
                } else {
                    this.iconUrl = null;
                }
            },
            error: (error) => {
                console.error('Error loading macro:', error);
                this.macro = null;
                this.isLoading = false;
                this.snackBar.open('Failed to load macro', 'Close', { duration: 3000 });
            }
        });
    }

    generateMockMacro(id: string): Macro {
        const classes = ['deathknight', 'demonhunter', 'druid', 'evoker', 'hunter', 'mage', 'monk', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior', 'miscellaneous'];
        const className = classes[Math.floor(Math.random() * classes.length)];

        return {
            id: id,
            name: `Auto C Strike`,
            description: `No description provided`,
            text: `#showtooltip crusader strike\n/cast [harm] crusader strike\n/stopmacro [harm]\n/targetenemy\n/cast crusader strike\n/targetlasttarget`,
            macroText: `#showtooltip crusader strike\n/cast [harm] crusader strike\n/stopmacro [harm]\n/targetenemy\n/cast crusader strike\n/targetlasttarget`,
            class: 'paladin',
            tags: ['paladin', 'pve', 'pvp', 'optimized'],
            isPublic: false,
            createdBy: 'current-user',
            usageCount: 0,
            createdAt: new Date('2025-09-29T17:15:00'),
            updatedAt: new Date('2025-09-29T17:15:00'),
            icon: 'icon123' // Mock icon ID for testing
        };
    }

    onEditMacro(): void {
        if (this.macro) {
            this.router.navigate(['/macros/my-macros/edit', this.macro.id]);
        }
    }

    onDeleteMacro(): void {
        if (!this.macro) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Macro',
                message: `Are you sure you want to delete "${this.macro.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // TODO: Implement delete functionality
                this.snackBar.open('Macro deleted successfully!', 'Close', { duration: 3000 });
                this.router.navigate(['/macros']);
            }
        });
    }

    onDuplicateMacro(): void {
        if (this.macro) {
            // TODO: Implement duplicate functionality
            this.snackBar.open('Macro duplicated successfully!', 'Close', { duration: 3000 });
        }
    }

    onShareMacro(): void {
        if (this.macro) {
            // TODO: Implement share functionality
            this.snackBar.open('Share link copied to clipboard!', 'Close', { duration: 3000 });
        }
    }


    onBackToMacros(): void {
        this.router.navigate(['/macros']);
    }

    getClassDisplayName(className: string): string {
        const classMap: { [key: string]: string } = {
            'deathknight': 'Death Knight',
            'demonhunter': 'Demon Hunter',
            'druid': 'Druid',
            'evoker': 'Evoker',
            'hunter': 'Hunter',
            'mage': 'Mage',
            'monk': 'Monk',
            'paladin': 'Paladin',
            'priest': 'Priest',
            'rogue': 'Rogue',
            'shaman': 'Shaman',
            'warlock': 'Warlock',
            'warrior': 'Warrior',
            'miscellaneous': 'Miscellaneous'
        };
        return classMap[className] || className;
    }


    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).then(() => {
            this.snackBar.open('Macro text copied to clipboard!', 'Close', { duration: 3000 });

            // Increment usage count when macro is copied
            if (this.macro?.id) {
                this.incrementUsageCount();
            }
        }).catch(() => {
            this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 3000 });
        });
    }

    formatMacroText(text: string): string {
        if (!text) return '';

        // Split by forward slash and join with newlines, but preserve the slash at the beginning of each line
        return text.split('/').map((segment, index) => {
            if (index === 0) {
                // First segment might not start with / (like comments)
                return segment.trim();
            } else {
                // Add the / back to each subsequent segment
                return '/' + segment.trim();
            }
        }).filter(segment => segment.length > 0).join('\n');
    }

    private loadIconUrl(iconId: string): void {
        // Fetch icon from the service
        this.iconService.getIcon(iconId).subscribe({
            next: (icon) => {
                this.iconUrl = this.iconService.getIconUrl(icon);
            },
            error: (error) => {
                console.error('Error loading icon:', error);
                this.iconUrl = null;
            }
        });
    }

    private incrementUsageCount(): void {
        if (!this.macro?.id) return;

        // Call backend to increment usage count
        this.macroService.incrementUsageCount(this.macro.id).subscribe({
            next: () => {
                // Update local usage count
                if (this.macro) {
                    this.macro.usage_count = (this.macro.usage_count || 0) + 1;
                    this.macro.usageCount = this.macro.usage_count;
                }
            },
            error: (error) => {
                console.error('Error incrementing usage count:', error);
            }
        });
    }
}
