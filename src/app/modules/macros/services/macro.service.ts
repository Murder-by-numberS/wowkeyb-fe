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
    creatorUsername?: string; // Creator's username
    usageCount?: number;
    createdAt?: Date;
    updatedAt?: Date;
    userId?: string;
    fileId?: string;
    file?: {
        id: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        uploaded_at: Date | string;
    };
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
    isPublic?: boolean;
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
    total?: number;
    page?: number;
    limit?: number;
    totalPages?: number;
    pagination?: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
    };
}

export interface MacroValidation {
    errors: ValidationError[];
    warnings: ValidationWarning[];
    suggestions?: string[];
    is_valid: boolean;
}

export interface ValidationError {
    line: number;
    command: string;
    message: string;
    suggestions?: string[];
}

export interface ValidationWarning {
    line: number;
    command: string;
    message: string;
    detail?: string;
}

export interface MacroTemplate {
    type: string;
    name: string;
    description: string;
    useCase: string;
    icon: string;
}

export interface GenerateMacroRequest {
    spell_name: string;
    template_type: string;
    ability_id?: string;
    ability_type?: string;
    wow_class?: string;
    custom_options?: any;
}

export interface GenerateMacroResponse {
    message: string;
    macro_text: string;
    suggested_tags: string[];
    explanation: string;
    ability_type: string;
    suggestions: ConditionalSuggestions;
}

export interface ConditionalSuggestions {
    conditionals: string[];
    explanation: string;
    examples: ConditionalExample[];
}

export interface ConditionalExample {
    type: string;
    macro: string;
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
            if (params.isPublic !== undefined) httpParams = httpParams.set('is_public', params.isPublic.toString());
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
    getMyMacros(page?: number, limit?: number, sortBy?: string, sortOrder?: 'asc' | 'desc'): Observable<MacroResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (page) httpParams = httpParams.set('page', page.toString());
        if (limit) httpParams = httpParams.set('limit', limit.toString());
        if (sortBy) httpParams = httpParams.set('sort_by', sortBy);
        if (sortOrder) httpParams = httpParams.set('sort_order', sortOrder);

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

    /**
     * Validate macro text in real-time
     */
    validateMacroText(macroText: string, wowClass?: string): Observable<{ validation: MacroValidation; suggested_tags: string[] }> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macros/validate`;
        return this.http.post<{ validation: MacroValidation; suggested_tags: string[] }>(url, {
            macro_text: macroText,
            class: wowClass
        });
    }

    /**
     * Get all available macro templates
     */
    getTemplates(): Observable<{ templates: MacroTemplate[] }> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macro-builder/templates`;
        return this.http.get<{ templates: MacroTemplate[] }>(url);
    }

    /**
     * Generate a macro from a template
     */
    generateMacro(request: GenerateMacroRequest): Observable<GenerateMacroResponse> {
        this.getBackendURL();
        const url = `${this.apiUrl}/macro-builder/generate`;
        return this.http.post<GenerateMacroResponse>(url, request);
    }

    /**
     * Get conditional suggestions for an ability type
     */
    getConditionalSuggestions(abilityType?: string, abilityId?: string, wowClass?: string): Observable<{ suggestions: ConditionalSuggestions; ability_type: string }> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (abilityType) httpParams = httpParams.set('ability_type', abilityType);
        if (abilityId) httpParams = httpParams.set('ability_id', abilityId);
        if (wowClass) httpParams = httpParams.set('wow_class', wowClass);

        const url = `${this.apiUrl}/macro-builder/suggestions`;
        return this.http.get<{ suggestions: ConditionalSuggestions; ability_type: string }>(url, { params: httpParams });
    }

    /**
     * Detect ability type from spell name/description
     */
    detectAbilityType(spellName: string, description?: string, abilityId?: string): Observable<{ ability_type: string; suggestions: ConditionalSuggestions }> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (spellName) httpParams = httpParams.set('spell_name', spellName);
        if (description) httpParams = httpParams.set('description', description);
        if (abilityId) httpParams = httpParams.set('ability_id', abilityId);

        const url = `${this.apiUrl}/macro-builder/detect-type`;
        return this.http.get<{ ability_type: string; suggestions: ConditionalSuggestions }>(url, { params: httpParams });
    }
}
