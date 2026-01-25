import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

// Interfaces
export interface BackendStatus {
    dbStatus: 'UP' | 'DOWN';
    version: string;
    environment: string;
    timestamp: string;
}

export interface DashboardStats {
    users: { total: number; admins: number };
    abilities: { total: number; active: number; inactive: number };
    keybindings: { total: number; active: number; deleted: number };
    macros: { total: number; active: number; deleted: number };
}

export interface AdminUser {
    id: string;
    username: string;
    email: string;
    confirmed: boolean;
    access_level: number;
    description?: string;
    favorite_class?: string;
    created_at: string;
    updated_at: string;
    stats?: {
        keybindings: number;
        macros: number;
    };
}

export interface AdminAbility {
    id: string;
    spell_id: string;
    name: string;
    description: string;
    icon: string;
    class: string;
    spec?: string;
    hero_talent?: string;
    ability_type: string;
    is_active: boolean;
    level_required?: number;
    cooldown?: number;
    range?: number;
    cost?: string;
    cost_amount?: number;
    game_version?: string;
}

export interface AdminKeybinding {
    id: string;
    name: string;
    class: string;
    spec?: string;
    hero_talent?: string;
    is_public: boolean;
    keybind_count: number;
    duplication_count: number;
    deleted_at?: string;
    is_deleted: boolean;
    user?: {
        id: string;
        username: string;
        email: string;
    };
    version?: string;
    created_at: string;
    updated_at: string;
}

export interface AdminMacro {
    id: string;
    name: string;
    description?: string;
    class?: string;
    spec?: string;
    hero_talent?: string;
    macro_text: string;
    is_active: boolean;
    is_public: boolean;
    usage_count: number;
    tags: string[];
    deleted_at?: string;
    is_deleted: boolean;
    user?: {
        id: string;
        username: string;
        email: string;
    };
    ability?: {
        id: string;
        name: string;
        icon: string;
    };
    game_version?: string;
    created_at: string;
    updated_at: string;
}

export interface SupportTicket {
    id: string;
    key: string;
    summary: string;
    status: string;
    priority: string;
    created: string;
    updated: string;
    assignee: string;
    reporter: string;
    labels: string[];
    url: string;
    description?: string;
    comments?: Array<{
        id: string;
        author: string;
        body: string;
        created: string;
        updated: string;
    }>;
}

export interface PaginatedResponse<T> {
    pagination: {
        current_page: number;
        total_pages: number;
        total_count: number;
        per_page: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private apiUrl: string;
    private baseUrl: string;

    constructor(private http: HttpClient) {
        this.apiUrl = environment.apiUrl;
        // Derive base URL by removing /api from apiUrl
        this.baseUrl = this.apiUrl.replace(/\/api$/, '');
    }

    private getAuthHeaders(): HttpHeaders {
        const token = localStorage.getItem('accessToken');
        return new HttpHeaders({
            'Authorization': `Bearer ${token}`
        });
    }

    // ==================== DASHBOARD ====================

    getBackendStatus(): Observable<BackendStatus> {
        // Status endpoint doesn't require auth
        return this.http.get<BackendStatus>(`${this.baseUrl}/status`);
    }

    getDashboardStats(): Observable<DashboardStats> {
        return this.http.get<DashboardStats>(
            `${this.apiUrl}/admin/dashboard/stats`,
            { headers: this.getAuthHeaders() }
        );
    }

    // ==================== USERS ====================

    getUsers(params: {
        page?: number;
        limit?: number;
        search?: string;
        sortBy?: string;
        sortOrder?: string;
    } = {}): Observable<{ users: AdminUser[] } & PaginatedResponse<AdminUser>> {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.sortBy) httpParams = httpParams.set('sortBy', params.sortBy);
        if (params.sortOrder) httpParams = httpParams.set('sortOrder', params.sortOrder);

        return this.http.get<{ users: AdminUser[] } & PaginatedResponse<AdminUser>>(
            `${this.apiUrl}/admin/users`,
            { headers: this.getAuthHeaders(), params: httpParams }
        );
    }

    getUserById(userId: string): Observable<{ user: AdminUser }> {
        return this.http.get<{ user: AdminUser }>(
            `${this.apiUrl}/admin/users/${userId}`,
            { headers: this.getAuthHeaders() }
        );
    }

    updateUserAccessLevel(userId: string, accessLevel: number): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/admin/users/${userId}/access-level`,
            { access_level: accessLevel },
            { headers: this.getAuthHeaders() }
        );
    }

    // ==================== ABILITIES ====================

    getAbilities(params: {
        page?: number;
        limit?: number;
        search?: string;
        class?: string;
        includeInactive?: boolean;
    } = {}): Observable<{ abilities: AdminAbility[] } & PaginatedResponse<AdminAbility>> {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.class) httpParams = httpParams.set('class', params.class);
        if (params.includeInactive !== undefined) {
            httpParams = httpParams.set('includeInactive', params.includeInactive.toString());
        }

        return this.http.get<{ abilities: AdminAbility[] } & PaginatedResponse<AdminAbility>>(
            `${this.apiUrl}/admin/abilities`,
            { headers: this.getAuthHeaders(), params: httpParams }
        );
    }

    toggleAbilityActive(abilityId: string): Observable<any> {
        return this.http.put(
            `${this.apiUrl}/admin/abilities/${abilityId}/toggle-active`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    // ==================== KEYBINDINGS ====================

    getKeybindings(params: {
        page?: number;
        limit?: number;
        search?: string;
        includeDeleted?: boolean;
        onlyDeleted?: boolean;
    } = {}): Observable<{ keybindings: AdminKeybinding[] } & PaginatedResponse<AdminKeybinding>> {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.includeDeleted !== undefined) {
            httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
        }
        if (params.onlyDeleted !== undefined) {
            httpParams = httpParams.set('onlyDeleted', params.onlyDeleted.toString());
        }

        return this.http.get<{ keybindings: AdminKeybinding[] } & PaginatedResponse<AdminKeybinding>>(
            `${this.apiUrl}/admin/keybindings`,
            { headers: this.getAuthHeaders(), params: httpParams }
        );
    }

    restoreKeybinding(keybindingId: string): Observable<any> {
        return this.http.post(
            `${this.apiUrl}/admin/keybindings/${keybindingId}/restore`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    permanentDeleteKeybinding(keybindingId: string): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/admin/keybindings/${keybindingId}/permanent`,
            { headers: this.getAuthHeaders() }
        );
    }

    // ==================== MACROS ====================

    getMacros(params: {
        page?: number;
        limit?: number;
        search?: string;
        includeDeleted?: boolean;
        onlyDeleted?: boolean;
    } = {}): Observable<{ macros: AdminMacro[] } & PaginatedResponse<AdminMacro>> {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.search) httpParams = httpParams.set('search', params.search);
        if (params.includeDeleted !== undefined) {
            httpParams = httpParams.set('includeDeleted', params.includeDeleted.toString());
        }
        if (params.onlyDeleted !== undefined) {
            httpParams = httpParams.set('onlyDeleted', params.onlyDeleted.toString());
        }

        return this.http.get<{ macros: AdminMacro[] } & PaginatedResponse<AdminMacro>>(
            `${this.apiUrl}/admin/macros`,
            { headers: this.getAuthHeaders(), params: httpParams }
        );
    }

    restoreMacro(macroId: string): Observable<any> {
        return this.http.post(
            `${this.apiUrl}/admin/macros/${macroId}/restore`,
            {},
            { headers: this.getAuthHeaders() }
        );
    }

    permanentDeleteMacro(macroId: string): Observable<any> {
        return this.http.delete(
            `${this.apiUrl}/admin/macros/${macroId}/permanent`,
            { headers: this.getAuthHeaders() }
        );
    }

    // ==================== SUPPORT TICKETS ====================

    getSupportTickets(params: {
        page?: number;
        limit?: number;
        status?: string;
    } = {}): Observable<{ tickets: SupportTicket[] } & PaginatedResponse<SupportTicket>> {
        let httpParams = new HttpParams();
        if (params.page) httpParams = httpParams.set('page', params.page.toString());
        if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        if (params.status) httpParams = httpParams.set('status', params.status);

        return this.http.get<{ tickets: SupportTicket[] } & PaginatedResponse<SupportTicket>>(
            `${this.apiUrl}/admin/support-tickets`,
            { headers: this.getAuthHeaders(), params: httpParams }
        );
    }

    getSupportTicketById(ticketId: string): Observable<SupportTicket> {
        return this.http.get<SupportTicket>(
            `${this.apiUrl}/admin/support-tickets/${ticketId}`,
            { headers: this.getAuthHeaders() }
        );
    }
}
