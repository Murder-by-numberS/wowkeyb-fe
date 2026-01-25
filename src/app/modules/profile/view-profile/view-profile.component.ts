import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject, takeUntil } from 'rxjs';
import { ProfileService, UserProfile } from '../../../core/services/profile.service';
import { Keybinding } from '../../../core/types/keybinding';

@Component({
    selector: 'app-view-profile',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatProgressSpinnerModule
    ],
    templateUrl: './view-profile.component.html'
})
export class ViewProfileComponent implements OnInit, OnDestroy {
    profile: UserProfile | null = null;
    isLoading = true;
    error: string | null = null;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Class icons mapping
    classIcons: { [key: string]: string } = {
        'Death Knight': 'https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg',
        'Demon Hunter': 'https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg',
        'Druid': 'https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg',
        'Evoker': 'https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg',
        'Hunter': 'https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg',
        'Mage': 'https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg',
        'Monk': 'https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg',
        'Paladin': 'https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg',
        'Priest': 'https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg',
        'Rogue': 'https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg',
        'Shaman': 'https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg',
        'Warlock': 'https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg',
        'Warrior': 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg'
    };

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private profileService: ProfileService,
        private location: Location
    ) { }

    ngOnInit(): void {
        this.route.params.pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe(params => {
            const username = params['username'];
            if (username) {
                this.loadProfile(username);
            }
        });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    private loadProfile(username: string): void {
        this.isLoading = true;
        this.error = null;

        this.profileService.getUserProfile(username).pipe(
            takeUntil(this._unsubscribeAll)
        ).subscribe({
            next: (profile) => {
                this.profile = profile;
                this.isLoading = false;
            },
            error: (error) => {
                console.error('Error loading profile:', error);
                this.error = error.status === 404
                    ? 'User not found'
                    : 'Error loading profile. Please try again later.';
                this.isLoading = false;
            }
        });
    }

    onViewKeybinding(keybinding: Keybinding): void {
        this.router.navigate(['/keybinds', keybinding.keybindingId]);
    }

    onViewMacro(macro: any): void {
        this.router.navigate(['/macros', macro.id]);
    }

    getClassIcon(className: string | null): string {
        if (!className) return '';
        return this.classIcons[className] || '';
    }

    getFavoriteClassDisplayName(favoriteClass: string | null): string {
        if (!favoriteClass) return '';

        // Convert snake_case or lowercase to Title Case
        const specialCases: { [key: string]: string } = {
            'deathknight': 'Death Knight',
            'demonhunter': 'Demon Hunter'
        };

        if (specialCases[favoriteClass.toLowerCase()]) {
            return specialCases[favoriteClass.toLowerCase()];
        }

        return favoriteClass
            .split(/[-_\s]/)
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    }

    goBack(): void {
        this.location.back();
    }
}

