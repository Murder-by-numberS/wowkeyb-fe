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
import { Macro } from '../components/macros-home/macros-home.component';
import { AuthService } from 'app/core/auth/auth.service';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';

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
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private snackBar: MatSnackBar,
        private authService: AuthService,
        private dialog: MatDialog
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

        // Mock data - replace with actual service call
        setTimeout(() => {
            this.macro = this.generateMockMacro(id);
            this.isOwner = this.macro?.createdBy === 'current-user'; // Mock ownership check
            this.isLoading = false;
        }, 1000);
    }

    generateMockMacro(id: string): Macro {
        const classes = ['deathknight', 'demonhunter', 'druid', 'evoker', 'hunter', 'mage', 'monk', 'paladin', 'priest', 'rogue', 'shaman', 'warlock', 'warrior', 'miscellaneous'];
        const className = classes[Math.floor(Math.random() * classes.length)];

        return {
            id: id,
            name: `${className.charAt(0).toUpperCase() + className.slice(1)} Macro`,
            description: `A comprehensive macro for ${className}. This macro provides enhanced functionality and automation for your ${className} character. Perfect for both PvE and PvP content.`,
            class: className,
            macroText: `# ${className.charAt(0).toUpperCase() + className.slice(1)} Macro\n/cast ${className} ability\n/say Using macro!\n/run print("${className} macro activated")`,
            tags: [className, 'pve', 'pvp', 'optimized'],
            isPublic: Math.random() > 0.3,
            createdBy: Math.random() > 0.5 ? 'current-user' : 'other-user',
            usageCount: Math.floor(Math.random() * 500) + 50,
            rating: Math.floor(Math.random() * 5) + 1,
            createdAt: new Date(Date.now() - Math.random() * 90 * 24 * 60 * 60 * 1000),
            updatedAt: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000)
        };
    }

    onEditMacro(): void {
        if (this.macro) {
            this.router.navigate(['/macros/edit', this.macro.id]);
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

    onTogglePublic(): void {
        if (this.macro) {
            this.macro.isPublic = !this.macro.isPublic;
            // TODO: Implement API call to update visibility
            this.snackBar.open(`Macro is now ${this.macro.isPublic ? 'public' : 'private'}`, 'Close', { duration: 3000 });
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
        }).catch(() => {
            this.snackBar.open('Failed to copy to clipboard', 'Close', { duration: 3000 });
        });
    }
}
