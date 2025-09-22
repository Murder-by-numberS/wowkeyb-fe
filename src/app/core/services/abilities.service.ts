import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from 'environments/environment';

import { formatString } from '../util/util';

import { Ability } from '../types/ability';

@Injectable({
    providedIn: 'root',
})
export class AbilitiesService {

    // private abilities: Ability[] = [
    //     { id: 1, name: 'Fireball', description: 'Shoots a ball of fire.', power: 50, icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_sword_48.jpg' },
    //     { id: 2, name: 'Ice Shard', description: 'Launches a shard of ice.', power: 40, icon: 'assets/icons/ice_shard.png' },
    //     { id: 3, name: 'Lightning Bolt', description: 'Strikes with a bolt of lightning.', power: 60, icon: 'assets/icons/lightning_bolt.png' },
    // ];

    constructor(private http: HttpClient,) { }

    // getAbilities(wowClass: string): Ability[] {
    //     return this.abilities;
    // }

    // //gets all proposals
    getAbilities(wowClass: string, spec: string, heroTalent: string, gameVersion: string): Observable<any> {
        //lowercase class spec and heroTalent
        const urlString = `${environment.apiUrl}/abilities/${formatString(wowClass.toLowerCase())}/${formatString(spec.toLowerCase())}/${formatString(heroTalent.toLowerCase())}/${gameVersion}`;
        return this.http.get(urlString);
    }

    // Gets abilities with optional filters and pagination (updated with column filters)
    getAbilitiesWithFilters(filters: {
        gameVersion?: string;
        class?: string;
        spec?: string;
        heroTalent?: string;
        columnName?: string;
        columnClass?: string;
        columnSpec?: string;
        columnHeroTalent?: string;
        columnDescription?: string;
        filterMode?: 'inclusion' | 'exact';
        page?: number;
        limit?: number;
    }): Observable<any> {
        console.log('🔍 AbilitiesService - Environment debug:', {
            apiUrl: environment.apiUrl,
            envName: environment.envName,
            debugFlag: environment.debugFlag,
            production: environment.production,
            filters: filters
        });
        let urlString = `${environment.apiUrl}/abilities`;
        const params = new URLSearchParams();

        // Add filters as query parameters
        if (filters.gameVersion) {
            params.append('gameVersion', filters.gameVersion);
        }
        if (filters.class) {
            params.append('class', filters.class);
        }
        if (filters.spec) {
            params.append('spec', filters.spec);
        }
        if (filters.heroTalent) {
            params.append('heroTalent', filters.heroTalent);
        }

        // Add column filter parameters
        if (filters.columnName) {
            params.append('columnName', filters.columnName);
        }
        if (filters.columnClass) {
            params.append('columnClass', filters.columnClass);
        }
        if (filters.columnSpec) {
            params.append('columnSpec', filters.columnSpec);
        }
        if (filters.columnHeroTalent) {
            params.append('columnHeroTalent', filters.columnHeroTalent);
        }
        if (filters.columnDescription) {
            params.append('columnDescription', filters.columnDescription);
        }
        if (filters.filterMode) {
            params.append('filterMode', filters.filterMode);
        }

        // Add pagination parameters
        if (filters.page !== undefined) {
            params.append('page', filters.page.toString());
        }
        if (filters.limit !== undefined) {
            params.append('limit', filters.limit.toString());
        }

        // Append query parameters if any exist
        if (params.toString()) {
            urlString += `?${params.toString()}`;
        }

        return this.http.get(urlString);
    }

}
