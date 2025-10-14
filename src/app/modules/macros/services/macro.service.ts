import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';

export interface Macro {
    id?: string;
    name: string;
    description?: string;
    text?: string; // For compatibility
    macro_text?: string; // Backend field name
    macroText?: string; // Alias for compatibility
    class?: string;
    spec?: string;
    hero_talent?: string; // Backend field name
    heroTalent?: string; // For compatibility
    ability?: string; // Ability ID reference
    show_tooltip?: boolean; // Backend field name
    showTooltip?: boolean; // For compatibility
    tags?: string[];
    icon?: string | { _id: string; name: string; cloudfrontUrl: string; keywords: string[] }; // Icon ID or populated icon object
    is_public?: boolean; // Backend field name
    isPublic?: boolean; // For compatibility
    created_by?: string; // Backend field name
    createdBy?: string; // For compatibility
    usage_count?: number; // Backend field name
    usageCount?: number; // For compatibility
    created_at?: string; // Backend field name
    updated_at?: string; // Backend field name
    createdAt?: Date; // For compatibility
    updatedAt?: Date; // For compatibility
    user_id?: string;
}

export interface CreateMacroRequest {
    name: string;
    description?: string;
    macro_text: string;
    class?: string; // Made optional - only required when ability is specified
    spec?: string;
    hero_talent?: string;
    ability?: string; // Ability ID reference
    show_tooltip?: boolean;
    game_version?: string; // Optional - backend will auto-set to latest
    tags?: string[];
    icon?: string; // Icon ID, not object
    is_public?: boolean;
}

export interface UpdateMacroRequest {
    name?: string;
    description?: string;
    text?: string;
    class?: string;
    spec?: string;
    heroTalent?: string;
    ability?: string;
    show_tooltip?: boolean;
    tags?: string[];
    icon?: string; // Icon ID for macro icon
    is_public?: boolean;
}

export interface GetMacrosParams {
    page?: number;
    limit?: number;
    search?: string;
    class?: string;
    spec?: string;
    heroTalent?: string;
    tags?: string[];
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
}

export interface GetMacrosByTagsParams {
    tags: string[];
    page?: number;
    limit?: number;
}

export interface GetMacrosByAbilityParams {
    ability: string;
    page?: number;
    limit?: number;
}

export interface MacroResponse {
    macros: Macro[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

@Injectable({
    providedIn: 'root'
})
export class MacroService {
    private apiUrl: string;

    constructor(
        private http: HttpClient,
        private authService: AuthService
    ) {
        this.getBackendURL();
    }

    private getBackendURL(): void {
        if (!environment.production) {
            this.apiUrl = environment.apiUrl;
        } else {
            this.apiUrl = this.authService.getBackendURL();
        }
    }

    /**
     * Get all macros (public route)
     */
    getMacros(params?: GetMacrosParams): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (params) {
            if (params.page) httpParams = httpParams.set('page', params.page.toString());
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
            if (params.search) httpParams = httpParams.set('search', params.search);
            if (params.class) httpParams = httpParams.set('class', params.class);
            if (params.spec) httpParams = httpParams.set('spec', params.spec);
            if (params.heroTalent) httpParams = httpParams.set('heroTalent', params.heroTalent);
            if (params.tags && params.tags.length > 0) {
                params.tags.forEach(tag => {
                    httpParams = httpParams.append('tags', tag);
                });
            }
            if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
            if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);
        }

        const url = `${this.apiUrl}/macros`;
        return this.http.get<MacroResponse>(url, { params: httpParams });
    }

    /**
     * Get popular macros (public route)
     */
    getPopularMacros(page?: number, limit?: number): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (page) httpParams = httpParams.set('page', page.toString());
        if (limit) httpParams = httpParams.set('limit', limit.toString());

        const url = `${this.apiUrl}/macros/popular`;
        return this.http.get<MacroResponse>(url, { params: httpParams });
    }

    /**
     * Get macros by tags (public route)
     */
    getMacrosByTags(params: GetMacrosByTagsParams): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        // Add tags as multiple query parameters
        params.tags.forEach(tag => {
            httpParams = httpParams.append('tags', tag);
        });

        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

        const url = `${this.apiUrl}/macros/by-tags`;
        return this.http.get<MacroResponse>(url, { params: httpParams });
    }

    /**
     * Get macros by ability (public route)
     */
    getMacrosByAbility(params: GetMacrosByAbilityParams): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        httpParams = httpParams.set('ability', params.ability);
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());

        const url = `${this.apiUrl}/macros/by-ability`;
        return this.http.get<MacroResponse>(url, { params: httpParams });
    }

    /**
     * Get a specific macro by ID (public route)
     */
    getMacro(id: string): Observable<Macro> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/${id}`;
        return this.http.get<{ macro: Macro }>(url).pipe(
            map(response => response.macro)
        );
    }

    /**
     * Create a new macro (protected route)
     */
    createMacro(macro: CreateMacroRequest): Observable<Macro> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros`;
        return this.http.post<Macro>(url, macro);
    }

    /**
     * Get user's macros (protected route)
     */
    getMyMacros(page?: number, limit?: number): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (page) httpParams = httpParams.set('page', page.toString());
        if (limit) httpParams = httpParams.set('limit', limit.toString());

        const url = `${this.apiUrl}/macros/my/list`;
        return this.http.get<MacroResponse>(url, { params: httpParams });
    }

    /**
     * Update a macro (protected route)
     */
    updateMacro(id: string, macro: UpdateMacroRequest): Observable<Macro> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/${id}`;
        return this.http.put<Macro>(url, macro);
    }

    /**
     * Delete a macro (protected route)
     */
    deleteMacro(id: string): Observable<any> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/${id}`;
        return this.http.delete(url);
    }

    /**
     * Duplicate a macro (protected route)
     */
    duplicateMacro(id: string): Observable<Macro> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/${id}/duplicate`;
        return this.http.post<Macro>(url, {});
    }

    /**
     * Search macros with advanced filters
     */
    searchMacros(searchTerm: string, filters?: Partial<GetMacrosParams>): Observable<MacroResponse> {
        const searchParams: GetMacrosParams = {
            search: searchTerm,
            ...filters
        };
        return this.getMacros(searchParams);
    }

    /**
     * Get macros by class
     */
    getMacrosByClass(className: string, params?: Partial<GetMacrosParams>): Observable<MacroResponse> {
        const classParams: GetMacrosParams = {
            class: className,
            ...params
        };
        return this.getMacros(classParams);
    }

    /**
     * Get macros by class and spec
     */
    getMacrosByClassAndSpec(className: string, spec: string, params?: Partial<GetMacrosParams>): Observable<MacroResponse> {
        const specParams: GetMacrosParams = {
            class: className,
            spec: spec,
            ...params
        };
        return this.getMacros(specParams);
    }

    /**
     * Get macros by class, spec, and hero talent
     */
    getMacrosByClassSpecAndHeroTalent(className: string, spec: string, heroTalent: string, params?: Partial<GetMacrosParams>): Observable<MacroResponse> {
        const heroTalentParams: GetMacrosParams = {
            class: className,
            spec: spec,
            heroTalent: heroTalent,
            ...params
        };
        return this.getMacros(heroTalentParams);
    }

    /**
     * Increment usage count for a macro
     */
    incrementUsageCount(id: string): Observable<any> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/${id}/usage`;
        return this.http.post(url, {});
    }
}
