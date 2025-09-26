import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';

export interface MacroIcon {
    id: string;
    name: string;
    url: string;
    keywords: string[];
}

export interface IconCategory {
    name: string;
    count: number;
    icons: MacroIcon[];
}

@Injectable({
    providedIn: 'root'
})
export class MacroIconService {
    private readonly baseUrl = 'https://wow.zamimg.com/images/wow/icons/large';
    private readonly cacheKey = 'macro_icons_cache';
    private readonly cacheExpiry = 24 * 60 * 60 * 1000; // 24 hours

    private iconsSubject = new BehaviorSubject<MacroIcon[]>([]);
    private isLoadingSubject = new BehaviorSubject<boolean>(false);

    public icons$ = this.iconsSubject.asObservable();
    public isLoading$ = this.isLoadingSubject.asObservable();

    constructor(private http: HttpClient) {
        this.loadIconsFromCache();
    }

    /**
     * Get all macro icons
     */
    getIcons(): Observable<MacroIcon[]> {
        if (this.iconsSubject.value.length === 0) {
            this.loadIcons();
        }
        return this.icons$;
    }


    /**
     * Search icons by term
     */
    searchIcons(searchTerm: string): Observable<MacroIcon[]> {
        return this.icons$.pipe(
            map(icons => {
                let filtered = icons;

                if (searchTerm.trim()) {
                    const searchLower = searchTerm.toLowerCase();
                    filtered = filtered.filter(icon =>
                        icon.name.toLowerCase().includes(searchLower) ||
                        icon.keywords.some(keyword => keyword.includes(searchLower))
                    );
                }

                return filtered;
            })
        );
    }

    /**
     * Get icon by ID
     */
    getIconById(id: string): Observable<MacroIcon | undefined> {
        return this.icons$.pipe(
            map(icons => icons.find(icon => icon.id === id))
        );
    }


    /**
     * Load icons from cache or generate mock data
     */
    private loadIconsFromCache(): void {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            try {
                const { data, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.cacheExpiry) {
                    this.iconsSubject.next(data.icons);
                    return;
                }
            } catch (error) {
                console.warn('Failed to parse cached icons:', error);
            }
        }

        // If no cache or expired, load mock data
        this.loadMockIcons();
    }

    /**
     * Load icons (mock implementation)
     */
    private loadIcons(): void {
        this.isLoadingSubject.next(true);

        // In a real implementation, this would make an API call
        // For now, we'll use mock data
        setTimeout(() => {
            this.loadMockIcons();
            this.isLoadingSubject.next(false);
        }, 500);
    }

    /**
     * Generate mock macro icons
     */
    private loadMockIcons(): void {
        const icons = this.generateMockIcons();
        this.iconsSubject.next(icons);

        // Cache the data
        this.cacheIcons(icons);
    }

    /**
     * Generate mock icons data
     */
    private generateMockIcons(): MacroIcon[] {
        const iconTypes = [
            'sword', 'shield', 'bow', 'staff', 'wand', 'dagger', 'mace', 'axe',
            'helmet', 'armor', 'boots', 'gloves', 'ring', 'necklace', 'trinket',
            'potion', 'food', 'drink', 'scroll', 'book', 'gem', 'ore', 'herb',
            'mount', 'pet', 'toy', 'achievement', 'quest', 'spell', 'ability'
        ];

        const icons: MacroIcon[] = [];

        // Generate 500 mock icons
        for (let i = 1; i <= 500; i++) {
            const iconType = iconTypes[Math.floor(Math.random() * iconTypes.length)];
            const iconName = `${iconType} ${i}`;

            icons.push({
                id: `macro_icon_${i}`,
                name: iconName,
                url: `${this.baseUrl}/${iconType}_${i}.jpg`,
                keywords: [
                    iconType.toLowerCase(),
                    `icon${i}`,
                    'macro',
                    'wow'
                ]
            });
        }

        return icons;
    }


    /**
     * Cache icons data
     */
    private cacheIcons(icons: MacroIcon[]): void {
        try {
            const cacheData = {
                icons,
                timestamp: Date.now()
            };
            localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
        } catch (error) {
            console.warn('Failed to cache icons:', error);
        }
    }

    /**
     * Clear cache
     */
    clearCache(): void {
        localStorage.removeItem(this.cacheKey);
        this.iconsSubject.next([]);
    }

    /**
     * Get popular icons (most commonly used)
     */
    getPopularIcons(limit: number = 20): Observable<MacroIcon[]> {
        // In a real implementation, this would come from usage statistics
        return this.icons$.pipe(
            map(icons => icons.slice(0, limit))
        );
    }

    /**
     * Get recent icons (recently added)
     */
    getRecentIcons(limit: number = 20): Observable<MacroIcon[]> {
        // In a real implementation, this would come from creation timestamps
        return this.icons$.pipe(
            map(icons => icons.slice(-limit).reverse())
        );
    }

    /**
     * Validate icon URL
     */
    validateIconUrl(url: string): boolean {
        return url.startsWith(this.baseUrl) && url.endsWith('.jpg');
    }

    /**
     * Get icon URL by ID
     */
    getIconUrl(id: string): string {
        return `${this.baseUrl}/${id}.jpg`;
    }
}
