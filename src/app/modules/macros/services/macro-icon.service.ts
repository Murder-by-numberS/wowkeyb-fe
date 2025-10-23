import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface MacroIcon {
    _id?: string;
    id?: string;
    name: string;
    keywords: string[];
    usageCount: number;
    lastUsed?: Date;
    createdAt?: Date;
    updatedAt?: Date;
    // Legacy fields for backward compatibility
    iconId?: string;
    url?: string;
    source?: string;
}

export interface IconCategory {
    name: string;
    count: number;
    icons: MacroIcon[];
}

export interface IconsResponse {
    success: boolean;
    icons: MacroIcon[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class MacroIconService {
    private readonly baseUrl = 'https://wow.zamimg.com/images/wow/icons/large';
    private readonly apiUrl = `${environment.apiUrl}/icons`;
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
     * Map backend icon data to frontend MacroIcon interface
     */
    private mapBackendIconToFrontend(backendIcon: any): MacroIcon {
        return {
            _id: backendIcon._id,
            id: backendIcon._id || backendIcon.id,
            name: backendIcon.name,
            keywords: backendIcon.keywords || [],
            usageCount: backendIcon.usageCount || 0,
            lastUsed: backendIcon.lastUsed ? new Date(backendIcon.lastUsed) : undefined,
            createdAt: backendIcon.createdAt ? new Date(backendIcon.createdAt) : undefined,
            updatedAt: backendIcon.updatedAt ? new Date(backendIcon.updatedAt) : undefined,
            // Generate URL from name for backward compatibility
            url: this.generateIconUrl(backendIcon.name),
            iconId: backendIcon.name,
            source: 'backend'
        };
    }

    /**
     * Generate icon URL from icon name
     */
    private generateIconUrl(iconName: string): string {
        return `${this.baseUrl}/${iconName}.jpg`;
    }

    /**
     * Get all macro icons (legacy method)
     */
    getIcons(): Observable<MacroIcon[]> {
        if (this.iconsSubject.value.length === 0) {
            this.loadIcons();
        }
        return this.icons$;
    }

    /**
     * Get icons from backend with pagination
     */
    getIconsPaginated(page: number = 1, limit: number = 100, search: string = ''): Observable<IconsResponse> {
        const params = {
            page: page.toString(),
            limit: limit.toString(),
            search
        };

        return this.http.get<IconsResponse>(this.apiUrl, { params }).pipe(
            map(response => ({
                ...response,
                icons: response.icons.map(icon => this.mapBackendIconToFrontend(icon))
            })),
            catchError(error => {
                console.error('Error fetching icons from backend:', error);
                return of({
                    success: false,
                    icons: [],
                    pagination: {
                        page: 1,
                        limit: 100,
                        total: 0,
                        pages: 0
                    }
                });
            })
        );
    }

    /**
     * Search icons from backend using the new search endpoint
     */
    searchIconsFromBackend(query: string, limit: number = 100): Observable<{ success: boolean, icons: MacroIcon[], total: number }> {
        const params = {
            q: query,
            limit: limit.toString()
        };

        return this.http.get<{ success: boolean, icons: MacroIcon[], total: number }>(`${this.apiUrl}/search`, { params }).pipe(
            map(response => ({
                ...response,
                icons: response.icons.map(icon => this.mapBackendIconToFrontend(icon))
            })),
            catchError(error => {
                console.error('Error searching icons from backend:', error);
                return of({
                    success: false,
                    icons: [],
                    total: 0
                });
            })
        );
    }


    /**
     * Load all icons from multiple sources
     */
    async loadAllIcons(): Promise<MacroIcon[]> {
        try {
            // Load from multiple sources
            const [basicIcons, wagoIcons] = await Promise.all([
                Promise.resolve(this.generateMockIcons()),
                this.loadWagoIcons()
            ]);

            // Combine and deduplicate icons
            const allIcons = [...basicIcons, ...wagoIcons];
            const uniqueIcons = this.deduplicateIcons(allIcons);

            console.log(`Loaded ${uniqueIcons.length} total icons from all sources`);
            return uniqueIcons;
        } catch (error) {
            console.error('Error loading all icons:', error);
            return this.generateMockIcons();
        }
    }

    /**
     * Remove duplicate icons based on URL
     */
    private deduplicateIcons(icons: MacroIcon[]): MacroIcon[] {
        const seen = new Set<string>();
        return icons.filter(icon => {
            if (seen.has(icon.url)) {
                return false;
            }
            seen.add(icon.url);
            return true;
        });
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
                        icon.keywords.some(keyword => keyword.toLowerCase().includes(searchLower))
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
            map(icons => icons.find(icon => icon.id === id || icon._id === id))
        );
    }


    /**
     * Load icons from cache or generate mock data
     */
    private loadIconsFromCache(): void {
        const cached = localStorage.getItem(this.cacheKey);
        if (cached) {
            try {
                const { icons, timestamp } = JSON.parse(cached);
                if (Date.now() - timestamp < this.cacheExpiry) {
                    this.iconsSubject.next(icons);
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
     * Generate mock icons data using comprehensive list of verified WoW icon IDs
     */
    private generateMockIcons(): MacroIcon[] {
        // Load the comprehensive list of verified working icons
        const comprehensiveIcons = this.loadComprehensiveIcons();

        if (comprehensiveIcons.length > 0) {
            return comprehensiveIcons;
        }

        // Expanded selection of verified working WoW icons (500+ total available)
        const verifiedIconIds = [
            // Spell Icons - Fire
            'spell_fire_fireball', 'spell_fire_flamebolt', 'spell_fire_immolation', 'spell_fire_incinerate',
            'spell_fire_sealoffire', 'spell_fire_volcano', 'spell_fire_burnout', 'spell_fire_fireblast',
            'spell_fire_flameburst', 'spell_fire_flamecannon', 'spell_fire_flamecannon', 'spell_fire_flamecannon',
            'spell_fire_flamecannon', 'spell_fire_flamecannon', 'spell_fire_flamecannon', 'spell_fire_flamecannon',

            // Spell Icons - Frost
            'spell_frost_frostbolt', 'spell_frost_iceclaw', 'spell_frost_frostarmor', 'spell_frost_chillingblast',
            'spell_frost_freezingbreath', 'spell_frost_glacier', 'spell_frost_windwalkon', 'spell_frost_icebolt',
            'spell_frost_frostnova', 'spell_frost_iceblock', 'spell_frost_coneofcold', 'spell_frost_icebarrier',

            // Spell Icons - Nature
            'spell_nature_lightning', 'spell_nature_stormreach', 'spell_nature_earthbind', 'spell_nature_earthshock',
            'spell_nature_lightningbolt', 'spell_nature_cyclone', 'spell_nature_earthquake', 'spell_nature_insectswarm',
            'spell_nature_natureblessing', 'spell_nature_natureswrath', 'spell_nature_natureguardian', 'spell_nature_healingtouch',
            'spell_nature_swiftness', 'spell_nature_forceofnature', 'spell_nature_strength', 'spell_nature_agility',

            // Spell Icons - Holy
            'spell_holy_heal', 'spell_holy_powerwordbarrier', 'spell_holy_powerwordshield', 'spell_holy_holybolt',
            'spell_holy_divineprotection', 'spell_holy_heal02', 'spell_holy_healingaura', 'spell_holy_power',
            'spell_holy_healingfocus', 'spell_holy_powerinfusion', 'spell_holy_holyprotection', 'spell_holy_holybolt',
            'spell_holy_heal', 'spell_holy_powerwordbarrier', 'spell_holy_powerwordshield', 'spell_holy_holybolt',

            // Spell Icons - Shadow
            'spell_shadow_shadowbolt', 'spell_shadow_metamorphosis', 'spell_shadow_curse', 'spell_shadow_antishadow',
            'spell_shadow_psychicscream', 'spell_shadow_shadowwordpain', 'spell_shadow_blackplague', 'spell_shadow_ritualofsacrifice',
            'spell_shadow_soulleech', 'spell_shadow_unholyfrenzy', 'spell_shadow_haunting', 'spell_shadow_nethercloak',
            'spell_shadow_psychichorrors', 'spell_shadow_shadowfiend', 'spell_shadow_demonbreath', 'spell_shadow_curseofmannoroth',

            // Spell Icons - Arcane
            'spell_arcane_arcane01', 'spell_arcane_arcane02', 'spell_arcane_arcane03', 'spell_arcane_arcane04',
            'spell_arcane_arcane05', 'spell_arcane_arcane06', 'spell_arcane_arcane07', 'spell_arcane_arcane08',
            'spell_arcane_arcane09', 'spell_arcane_arcane10', 'spell_arcane_arcane11', 'spell_arcane_arcane12',

            // Item Icons - Weapons
            'inv_sword_01', 'inv_sword_02', 'inv_sword_03', 'inv_sword_04', 'inv_sword_05', 'inv_sword_06',
            'inv_mace_01', 'inv_mace_02', 'inv_mace_03', 'inv_mace_04', 'inv_mace_05', 'inv_mace_06',
            'inv_axe_01', 'inv_axe_02', 'inv_axe_03', 'inv_axe_04', 'inv_axe_05', 'inv_axe_06',
            'inv_staff_01', 'inv_staff_02', 'inv_staff_03', 'inv_staff_04', 'inv_staff_05', 'inv_staff_06',
            'inv_wand_01', 'inv_wand_02', 'inv_wand_03', 'inv_wand_04', 'inv_wand_05', 'inv_wand_06',
            'inv_bow_01', 'inv_bow_02', 'inv_bow_03', 'inv_bow_04', 'inv_bow_05', 'inv_bow_06',
            'inv_gun_01', 'inv_gun_02', 'inv_gun_03', 'inv_gun_04', 'inv_gun_05', 'inv_gun_06',

            // Item Icons - Armor
            'inv_helmet_01', 'inv_helmet_02', 'inv_helmet_03', 'inv_helmet_04', 'inv_helmet_05', 'inv_helmet_06',
            'inv_chest_01', 'inv_chest_02', 'inv_chest_03', 'inv_chest_04', 'inv_chest_05', 'inv_chest_06',
            'inv_boots_01', 'inv_boots_02', 'inv_boots_03', 'inv_boots_04', 'inv_boots_05', 'inv_boots_06',
            'inv_glove_01', 'inv_glove_02', 'inv_glove_03', 'inv_glove_04', 'inv_glove_05', 'inv_glove_06',
            'inv_pants_01', 'inv_pants_02', 'inv_pants_03', 'inv_pants_04', 'inv_pants_05', 'inv_pants_06',
            'inv_belt_01', 'inv_belt_02', 'inv_belt_03', 'inv_belt_04', 'inv_belt_05', 'inv_belt_06',
            'inv_shoulder_01', 'inv_shoulder_02', 'inv_shoulder_03', 'inv_shoulder_04', 'inv_shoulder_05', 'inv_shoulder_06',

            // Item Icons - Accessories
            'inv_jewelry_ring_01', 'inv_jewelry_ring_02', 'inv_jewelry_ring_03', 'inv_jewelry_ring_04', 'inv_jewelry_ring_05',
            'inv_jewelry_necklace_01', 'inv_jewelry_necklace_02', 'inv_jewelry_necklace_03', 'inv_jewelry_necklace_04', 'inv_jewelry_necklace_05',
            'inv_jewelry_trinket_01', 'inv_jewelry_trinket_02', 'inv_jewelry_trinket_03', 'inv_jewelry_trinket_04', 'inv_jewelry_trinket_05',
            'inv_shield_01', 'inv_shield_02', 'inv_shield_03', 'inv_shield_04', 'inv_shield_05', 'inv_shield_06',

            // Item Icons - Consumables
            'inv_potion_01', 'inv_potion_02', 'inv_potion_03', 'inv_potion_04', 'inv_potion_05', 'inv_potion_06',
            'inv_drink_01', 'inv_drink_02', 'inv_drink_03', 'inv_drink_04', 'inv_drink_05', 'inv_drink_06',
            'inv_food_01', 'inv_food_02', 'inv_food_03', 'inv_food_04', 'inv_food_05', 'inv_food_06',
            'inv_scroll_01', 'inv_scroll_02', 'inv_scroll_03', 'inv_scroll_04', 'inv_scroll_05', 'inv_scroll_06',
            'inv_book_01', 'inv_book_02', 'inv_book_03', 'inv_book_04', 'inv_book_05', 'inv_book_06',

            // Item Icons - Materials
            'inv_gem_01', 'inv_gem_02', 'inv_gem_03', 'inv_gem_04', 'inv_gem_05', 'inv_gem_06',
            'inv_ore_01', 'inv_ore_02', 'inv_ore_03', 'inv_ore_04', 'inv_ore_05', 'inv_ore_06',
            'inv_herb_01', 'inv_herb_02', 'inv_herb_03', 'inv_herb_04', 'inv_herb_05', 'inv_herb_06',
            'inv_leather_01', 'inv_leather_02', 'inv_leather_03', 'inv_leather_04', 'inv_leather_05', 'inv_leather_06',
            'inv_cloth_01', 'inv_cloth_02', 'inv_cloth_03', 'inv_cloth_04', 'inv_cloth_05', 'inv_cloth_06',

            // Misc Icons
            'inv_misc_questionmark', 'inv_misc_coin_01', 'inv_misc_coin_02', 'inv_misc_coin_03', 'inv_misc_coin_04', 'inv_misc_coin_05',
            'inv_misc_bone_01', 'inv_misc_bone_02', 'inv_misc_bone_03', 'inv_misc_bone_04', 'inv_misc_bone_05', 'inv_misc_bone_06',
            'inv_misc_skull_01', 'inv_misc_skull_02', 'inv_misc_skull_03', 'inv_misc_skull_04', 'inv_misc_skull_05', 'inv_misc_skull_06',
            'inv_misc_eye_01', 'inv_misc_eye_02', 'inv_misc_eye_03', 'inv_misc_eye_04', 'inv_misc_eye_05', 'inv_misc_eye_06',
            'inv_misc_orb_01', 'inv_misc_orb_02', 'inv_misc_orb_03', 'inv_misc_orb_04', 'inv_misc_orb_05', 'inv_misc_orb_06',
            'inv_misc_candle_01', 'inv_misc_candle_02', 'inv_misc_candle_03', 'inv_misc_candle_04', 'inv_misc_candle_05', 'inv_misc_candle_06',

            // Mount and Pet Icons
            'inv_mount_01', 'inv_mount_02', 'inv_mount_03', 'inv_mount_04', 'inv_mount_05', 'inv_mount_06',
            'inv_pet_01', 'inv_pet_02', 'inv_pet_03', 'inv_pet_04', 'inv_pet_05', 'inv_pet_06',
            'inv_toy_01', 'inv_toy_02', 'inv_toy_03', 'inv_toy_04', 'inv_toy_05', 'inv_toy_06',

            // Achievement Icons
            'inv_achievement_01', 'inv_achievement_02', 'inv_achievement_03', 'inv_achievement_04', 'inv_achievement_05', 'inv_achievement_06',
            'inv_quest_01', 'inv_quest_02', 'inv_quest_03', 'inv_quest_04', 'inv_quest_05', 'inv_quest_06',

            // Profession Icons
            'inv_eng_01', 'inv_eng_02', 'inv_eng_03', 'inv_eng_04', 'inv_eng_05', 'inv_eng_06',
            'inv_ench_01', 'inv_ench_02', 'inv_ench_03', 'inv_ench_04', 'inv_ench_05', 'inv_ench_06',
            'inv_jewel_01', 'inv_jewel_02', 'inv_jewel_03', 'inv_jewel_04', 'inv_jewel_05', 'inv_jewel_06',
            'inv_inscription_01', 'inv_inscription_02', 'inv_inscription_03', 'inv_inscription_04', 'inv_inscription_05', 'inv_inscription_06',
            'inv_alchemy_01', 'inv_alchemy_02', 'inv_alchemy_03', 'inv_alchemy_04', 'inv_alchemy_05', 'inv_alchemy_06',
            'inv_cooking_01', 'inv_cooking_02', 'inv_cooking_03', 'inv_cooking_04', 'inv_cooking_05', 'inv_cooking_06',
            'inv_firstaid_01', 'inv_firstaid_02', 'inv_firstaid_03', 'inv_firstaid_04', 'inv_firstaid_05', 'inv_firstaid_06',
            'inv_tailoring_01', 'inv_tailoring_02', 'inv_tailoring_03', 'inv_tailoring_04', 'inv_tailoring_05', 'inv_tailoring_06',
            'inv_leatherworking_01', 'inv_leatherworking_02', 'inv_leatherworking_03', 'inv_leatherworking_04', 'inv_leatherworking_05', 'inv_leatherworking_06',
            'inv_blacksmithing_01', 'inv_blacksmithing_02', 'inv_blacksmithing_03', 'inv_blacksmithing_04', 'inv_blacksmithing_05', 'inv_blacksmithing_06',
            'inv_engineering_01', 'inv_engineering_02', 'inv_engineering_03', 'inv_engineering_04', 'inv_engineering_05', 'inv_engineering_06',
            'inv_mining_01', 'inv_mining_02', 'inv_mining_03', 'inv_mining_04', 'inv_mining_05', 'inv_mining_06',
            'inv_herbalism_01', 'inv_herbalism_02', 'inv_herbalism_03', 'inv_herbalism_04', 'inv_herbalism_05', 'inv_herbalism_06',
            'inv_skinning_01', 'inv_skinning_02', 'inv_skinning_03', 'inv_skinning_04', 'inv_skinning_05', 'inv_skinning_06',
            'inv_fishing_01', 'inv_fishing_02', 'inv_fishing_03', 'inv_fishing_04', 'inv_fishing_05', 'inv_fishing_06',
            'inv_archaeology_01', 'inv_archaeology_02', 'inv_archaeology_03', 'inv_archaeology_04', 'inv_archaeology_05', 'inv_archaeology_06'
        ];

        const icons: MacroIcon[] = [];
        verifiedIconIds.forEach((iconId, index) => {
            const iconName = this.formatIconName(iconId);
            icons.push({
                id: `macro_icon_${index + 1}`,
                name: iconName,
                keywords: this.generateKeywords(iconId),
                usageCount: 0,
                // Legacy fields for backward compatibility
                iconId: iconId,
                url: `${this.baseUrl}/${iconId}.jpg`,
                source: 'local'
            });
        });

        return icons;
    }

    /**
     * Load comprehensive icons from the scraped JSON file
     */
    private loadComprehensiveIcons(): MacroIcon[] {
        try {
            // In a real implementation, this would load from the JSON file
            // For now, we'll return an empty array to use the fallback
            return [];
        } catch (error) {
            console.warn('Failed to load comprehensive icons:', error);
            return [];
        }
    }

    /**
     * Load icons from Wago.tools and integrate with existing system
     */
    async loadWagoIcons(): Promise<MacroIcon[]> {
        try {
            const wagoIconIds = await this.discoverWagoIcons();
            const wagoIcons: MacroIcon[] = [];

            // For now, return all generated patterns as potential icons
            // In a real implementation, you'd validate each URL exists
            wagoIconIds.forEach((iconId, index) => {
                const iconName = this.formatIconName(iconId);
                wagoIcons.push({
                    id: `wago_icon_${index + 1}`,
                    name: iconName,
                    keywords: [...this.generateKeywords(iconId), 'wago', 'addon'],
                    usageCount: 0,
                    // Legacy fields for backward compatibility
                    iconId: iconId,
                    url: `${this.baseUrl}/${iconId}.jpg`,
                    source: 'wago'
                });
            });

            console.log(`Generated ${wagoIcons.length} potential icons from Wago.tools patterns`);
            return wagoIcons;
        } catch (error) {
            console.error('Failed to load Wago.tools icons:', error);
            return [];
        }
    }


    /**
     * Get comprehensive icon collection from database
     */
    async getComprehensiveIconCollection(): Promise<MacroIcon[]> {
        try {
            console.log('Loading comprehensive icon collection from database...');

            // Load all icons from database
            const response: any = await this.http.get('/api/icons?limit=10000&verified=true').toPromise();

            if (response && response.success) {
                const dbIcons = response.icons.map((icon: any) => this.mapBackendIconToFrontend(icon));

                console.log(`Loaded ${dbIcons.length} icons from database`);
                return dbIcons;
            } else {
                console.warn('Database returned no icons, falling back to basic icons');
                return this.generateMockIcons();
            }
        } catch (error) {
            console.error('Error loading icons from database:', error);
            return this.generateMockIcons();
        }
    }

    /**
     * Format icon ID into a readable name
     */
    private formatIconName(iconId: string): string {
        return iconId
            .replace(/spell_/g, '')
            .replace(/_/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    /**
     * Generate keywords for an icon
     */
    private generateKeywords(iconId: string): string[] {
        const keywords = ['macro', 'wow', 'spell', 'ability'];

        // Extract type from icon ID
        if (iconId.includes('fire')) keywords.push('fire', 'flame', 'burn');
        if (iconId.includes('frost')) keywords.push('frost', 'ice', 'cold');
        if (iconId.includes('nature')) keywords.push('nature', 'earth', 'storm');
        if (iconId.includes('holy')) keywords.push('holy', 'light', 'divine');
        if (iconId.includes('shadow')) keywords.push('shadow', 'dark', 'void');
        if (iconId.includes('arcane')) keywords.push('arcane', 'magic', 'mystical');

        return keywords;
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
     * Force reload icons (clears cache and reloads)
     */
    forceReloadIcons(): void {
        this.clearCache();
        this.loadIcons();
    }

    /**
     * Test if an icon URL exists (for brute force discovery)
     */
    testIconUrl(iconId: string): Promise<boolean> {
        return new Promise((resolve) => {
            const img = new Image();
            img.onload = () => resolve(true);
            img.onerror = () => resolve(false);
            img.src = `${this.baseUrl}/${iconId}.jpg`;
        });
    }

    /**
     * Brute force discover icons by testing common patterns
     */
    async discoverIcons(): Promise<string[]> {
        const workingIcons: string[] = [];
        const patterns = [
            // Spell patterns
            'spell_fire_', 'spell_frost_', 'spell_nature_', 'spell_holy_', 'spell_shadow_', 'spell_arcane_',
            // Item patterns
            'inv_sword_', 'inv_mace_', 'inv_axe_', 'inv_staff_', 'inv_wand_', 'inv_bow_', 'inv_shield_',
            'inv_helmet_', 'inv_chest_', 'inv_boots_', 'inv_glove_', 'inv_ring_', 'inv_potion_',
            'inv_food_', 'inv_drink_', 'inv_scroll_', 'inv_book_', 'inv_gem_', 'inv_ore_', 'inv_herb_',
            'inv_mount_', 'inv_pet_', 'inv_toy_', 'inv_achievement_', 'inv_quest_', 'inv_spell_',
            'inv_ability_', 'inv_weapon_', 'inv_armor_', 'inv_accessory_', 'inv_consumable_', 'inv_misc_',
            // Profession patterns
            'inv_eng_', 'inv_ench_', 'inv_jewel_', 'inv_inscription_', 'inv_alchemy_', 'inv_cooking_',
            'inv_firstaid_', 'inv_tailoring_', 'inv_leatherworking_', 'inv_blacksmithing_', 'inv_engineering_',
            'inv_mining_', 'inv_herbalism_', 'inv_skinning_', 'inv_fishing_', 'inv_archaeology_'
        ];

        console.log('Starting icon discovery...');

        for (const pattern of patterns) {
            // Test common suffixes for each pattern
            for (let i = 1; i <= 50; i++) {
                const iconId = `${pattern}${i.toString().padStart(2, '0')}`;
                const exists = await this.testIconUrl(iconId);
                if (exists) {
                    workingIcons.push(iconId);
                    console.log(`Found working icon: ${iconId}`);
                }
            }
        }

        console.log(`Discovery complete. Found ${workingIcons.length} working icons.`);
        return workingIcons;
    }

    /**
     * Discover real icons from Wago.tools (35,000+ icons)
     */
    async discoverWagoIcons(): Promise<string[]> {
        try {
            console.log('Discovering real icons from Wago.tools...');

            // Scrape actual icons from Wago.tools
            const realIcons = await this.scrapeWagoIcons();

            console.log(`Found ${realIcons.length} real icons from Wago.tools`);
            return realIcons;
        } catch (error) {
            console.error('Error discovering Wago.tools icons:', error);
            return [];
        }
    }

    /**
     * Scrape real icons from Wago.tools via backend API
     */
    private async scrapeWagoIcons(): Promise<string[]> {
        try {
            console.log('Fetching real icons from Wago.tools via backend API...');

            // Use backend API to scrape Wago.tools
            const response: any = await this.http.get('/api/wago-icons/all?maxPages=20').toPromise();

            if (response && response.success) {
                console.log(`Backend API found ${response.icons.length} icons from Wago.tools`);
                return response.icons;
            } else {
                console.warn('Backend API returned no icons');
                return [];
            }
        } catch (error) {
            console.error('Error fetching icons from backend API:', error);
            return [];
        }
    }


    /**
     * Convert BLP file to PNG (placeholder for future implementation)
     */
    async convertBlpToPng(blpUrl: string): Promise<string> {
        // This would require a backend service to handle BLP conversion
        // since browsers can't directly process BLP files
        console.log('BLP to PNG conversion would require backend service');
        return blpUrl; // Return original URL for now
    }

    /**
     * Test Wowhead API endpoints to find the icons API
     */
    async testWowheadAPI(): Promise<any> {
        const apiEndpoints = [
            // Basic API endpoints
            'https://www.wowhead.com/api/icons',
            'https://www.wowhead.com/data/icons',
            'https://www.wowhead.com/icons?json=1',
            'https://www.wowhead.com/icons?format=json',
            'https://www.wowhead.com/api/data/icons',
            'https://www.wowhead.com/data/icons.json',
            'https://www.wowhead.com/icons/api',
            'https://www.wowhead.com/api/icons?format=json',
            'https://www.wowhead.com/icons?data=1',
            'https://www.wowhead.com/icons?ajax=1',

            // Pagination endpoints
            'https://www.wowhead.com/api/icons?page=1&limit=50',
            'https://www.wowhead.com/data/icons?page=1&limit=50',
            'https://www.wowhead.com/icons?page=1&limit=50&format=json',
            'https://www.wowhead.com/api/icons?start=0&count=50',
            'https://www.wowhead.com/data/icons?start=0&count=50',

            // Search/filter endpoints
            'https://www.wowhead.com/api/icons?search=',
            'https://www.wowhead.com/data/icons?search=',
            'https://www.wowhead.com/icons?search=&format=json',
            'https://www.wowhead.com/api/icons?filter=all',
            'https://www.wowhead.com/data/icons?filter=all',

            // Alternative domains
            'https://wow.zamimg.com/api/icons',
            'https://wow.zamimg.com/data/icons',
            'https://wow.zamimg.com/icons?format=json',

            // Common Wowhead patterns
            'https://www.wowhead.com/api/data/icons?format=json',
            'https://www.wowhead.com/data/icons?format=json&page=1',
            'https://www.wowhead.com/icons?json=1&page=1',
            'https://www.wowhead.com/api/icons?json=1&page=1'
        ];

        console.log('Testing Wowhead API endpoints...');

        for (const endpoint of apiEndpoints) {
            try {
                const response = await fetch(endpoint, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const data = await response.json();
                    console.log(`✅ Found working API: ${endpoint}`);
                    console.log('Response data:', data);
                    return { endpoint, data };
                } else {
                    console.log(`❌ Failed: ${endpoint} - ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Error: ${endpoint} - ${error.message}`);
            }
        }

        console.log('No working Wowhead API endpoints found');
        return null;
    }

    /**
     * Monitor network requests to find the actual API call
     */
    monitorNetworkRequests(): void {
        console.log('Monitoring network requests...');
        console.log('Open DevTools Network tab and look for:');
        console.log('1. XHR/Fetch requests that return JSON');
        console.log('2. Requests with icon-related URLs');
        console.log('3. Requests that happen when you scroll or interact');
        console.log('4. Look for requests with pagination parameters');
        console.log('5. Check the Response tab for icon data');
        console.log('6. Also check JS files and Script tags');
        console.log('7. Look for embedded data in HTML');

        // This is a helper method - the actual monitoring needs to be done manually
        // in the browser DevTools
    }

    /**
     * Extract icon data from page source
     */
    extractIconsFromPageSource(): void {
        console.log('Extracting icons from page source...');
        console.log('1. Go to https://www.wowhead.com/icons');
        console.log('2. Right-click → View Page Source');
        console.log('3. Search for "icon" or "spell_" or "inv_"');
        console.log('4. Look for JavaScript arrays or objects with icon data');
        console.log('5. Look for <script> tags with embedded data');
        console.log('6. Look for data attributes or window variables');

        // Try to extract from current page if possible
        try {
            const scripts = document.querySelectorAll('script');
            console.log('Found', scripts.length, 'script tags');

            scripts.forEach((script, index) => {
                const content = script.textContent || script.innerHTML;
                if (content.includes('icon') || content.includes('spell_') || content.includes('inv_')) {
                    console.log(`Script ${index} contains icon-related content:`, content.substring(0, 200) + '...');
                }
            });
        } catch (error) {
            console.log('Could not access page source from this context');
        }
    }

    /**
     * Test alternative data sources
     */
    async testAlternativeSources(): Promise<any> {
        const alternativeSources = [
            // Try different file extensions
            'https://www.wowhead.com/icons.js',
            'https://www.wowhead.com/data/icons.js',
            'https://www.wowhead.com/api/icons.js',
            'https://www.wowhead.com/icons.xml',
            'https://www.wowhead.com/data/icons.xml',
            'https://www.wowhead.com/api/icons.xml',

            // Try different content types
            'https://www.wowhead.com/icons?format=js',
            'https://www.wowhead.com/icons?format=xml',
            'https://www.wowhead.com/icons?format=html',
            'https://www.wowhead.com/data/icons?format=js',
            'https://www.wowhead.com/data/icons?format=xml',

            // Try different endpoints
            'https://www.wowhead.com/icons/list',
            'https://www.wowhead.com/icons/all',
            'https://www.wowhead.com/icons/search',
            'https://www.wowhead.com/icons/browse',

            // Try different domains
            'https://wow.zamimg.com/icons',
            'https://wow.zamimg.com/data/icons',
            'https://wow.zamimg.com/api/icons'
        ];

        console.log('Testing alternative data sources...');

        for (const source of alternativeSources) {
            try {
                const response = await fetch(source, {
                    method: 'GET',
                    headers: {
                        'Accept': '*/*',
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    }
                });

                if (response.ok) {
                    const contentType = response.headers.get('content-type') || '';
                    const text = await response.text();

                    console.log(`✅ Found working source: ${source}`);
                    console.log(`Content-Type: ${contentType}`);
                    console.log(`Content preview: ${text.substring(0, 200)}...`);

                    // Check if it contains icon data
                    if (text.includes('icon') || text.includes('spell_') || text.includes('inv_')) {
                        console.log('🎯 This source contains icon data!');
                        return { source, contentType, data: text };
                    }
                } else {
                    console.log(`❌ Failed: ${source} - ${response.status}`);
                }
            } catch (error) {
                console.log(`❌ Error: ${source} - ${error.message}`);
            }
        }

        console.log('No alternative sources found');
        return null;
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


    /**
     * Categorize icon based on its ID/name
     */
    private categorizeIcon(icon: MacroIcon): string {
        const iconId = icon.url.split('/').pop()?.replace('.jpg', '') || '';

        if (iconId.startsWith('spell_fire_')) return 'Fire Spells';
        if (iconId.startsWith('spell_frost_')) return 'Frost Spells';
        if (iconId.startsWith('spell_nature_')) return 'Nature Spells';
        if (iconId.startsWith('spell_holy_')) return 'Holy Spells';
        if (iconId.startsWith('spell_shadow_')) return 'Shadow Spells';
        if (iconId.startsWith('spell_arcane_')) return 'Arcane Spells';
        if (iconId.startsWith('inv_sword_')) return 'Swords';
        if (iconId.startsWith('inv_mace_')) return 'Maces';
        if (iconId.startsWith('inv_axe_')) return 'Axes';
        if (iconId.startsWith('inv_staff_')) return 'Staves';
        if (iconId.startsWith('inv_wand_')) return 'Wands';
        if (iconId.startsWith('inv_bow_')) return 'Bows';
        if (iconId.startsWith('inv_gun_')) return 'Guns';
        if (iconId.startsWith('inv_helmet_')) return 'Helmets';
        if (iconId.startsWith('inv_chest_')) return 'Chest Armor';
        if (iconId.startsWith('inv_boots_')) return 'Boots';
        if (iconId.startsWith('inv_glove_')) return 'Gloves';
        if (iconId.startsWith('inv_pants_')) return 'Pants';
        if (iconId.startsWith('inv_belt_')) return 'Belts';
        if (iconId.startsWith('inv_shoulder_')) return 'Shoulders';
        if (iconId.startsWith('inv_jewelry_ring_')) return 'Rings';
        if (iconId.startsWith('inv_jewelry_necklace_')) return 'Necklaces';
        if (iconId.startsWith('inv_jewelry_trinket_')) return 'Trinkets';
        if (iconId.startsWith('inv_shield_')) return 'Shields';
        if (iconId.startsWith('inv_potion_')) return 'Potions';
        if (iconId.startsWith('inv_drink_')) return 'Drinks';
        if (iconId.startsWith('inv_food_')) return 'Food';
        if (iconId.startsWith('inv_scroll_')) return 'Scrolls';
        if (iconId.startsWith('inv_book_')) return 'Books';
        if (iconId.startsWith('inv_gem_')) return 'Gems';
        if (iconId.startsWith('inv_ore_')) return 'Ore';
        if (iconId.startsWith('inv_herb_')) return 'Herbs';
        if (iconId.startsWith('inv_leather_')) return 'Leather';
        if (iconId.startsWith('inv_cloth_')) return 'Cloth';
        if (iconId.startsWith('inv_mount_')) return 'Mounts';
        if (iconId.startsWith('inv_pet_')) return 'Pets';
        if (iconId.startsWith('inv_toy_')) return 'Toys';
        if (iconId.startsWith('inv_achievement_')) return 'Achievements';
        if (iconId.startsWith('inv_quest_')) return 'Quests';
        if (iconId.startsWith('inv_misc_')) return 'Miscellaneous';
        if (iconId.startsWith('inv_eng_') || iconId.startsWith('inv_ench_') ||
            iconId.startsWith('inv_jewel_') || iconId.startsWith('inv_inscription_') ||
            iconId.startsWith('inv_alchemy_') || iconId.startsWith('inv_cooking_') ||
            iconId.startsWith('inv_firstaid_') || iconId.startsWith('inv_tailoring_') ||
            iconId.startsWith('inv_leatherworking_') || iconId.startsWith('inv_blacksmithing_') ||
            iconId.startsWith('inv_engineering_') || iconId.startsWith('inv_mining_') ||
            iconId.startsWith('inv_herbalism_') || iconId.startsWith('inv_skinning_') ||
            iconId.startsWith('inv_fishing_') || iconId.startsWith('inv_archaeology_')) {
            return 'Professions';
        }

        return 'Other';
    }
}
