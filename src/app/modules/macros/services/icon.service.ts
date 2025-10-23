import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';

export interface Icon {
    id?: string;
    _id?: string;
    name: string;
    keywords: string[];
    usageCount: number;
    lastUsed?: Date;
    s3Path?: string;
    cloudfrontUrl?: string;
    originalFileName?: string;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GetIconsParams {
    page?: number;
    limit?: number;
}

export interface IconResponse {
    success: boolean;
    icons: Icon[];
    total: number;
    pagination?: {
        page: number;
        limit: number;
        total: number;
        pages: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class IconService {
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
     * Get icons with pagination
     */
    getIcons(params?: GetIconsParams): Observable<IconResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (params) {
            if (params.page) httpParams = httpParams.set('page', params.page.toString());
            if (params.limit) httpParams = httpParams.set('limit', params.limit.toString());
        }

        const url = `${this.apiUrl}/icons`;
        return this.http.get<IconResponse>(url, { params: httpParams });
    }

    /**
     * Get popular icons
     */
    getPopularIcons(limit?: number): Observable<IconResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        if (limit) httpParams = httpParams.set('limit', limit.toString());

        const url = `${this.apiUrl}/icons/popular`;
        return this.http.get<IconResponse>(url, { params: httpParams });
    }

    /**
     * Search icons by name or keywords
     */
    searchIcons(searchTerm: string, limit?: number): Observable<IconResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        httpParams = httpParams.set('search', searchTerm);
        if (limit) httpParams = httpParams.set('limit', limit.toString());

        const url = `${this.apiUrl}/icons/search`;
        return this.http.get<IconResponse>(url, { params: httpParams });
    }

    /**
     * Get icon by ID
     */
    getIcon(id: string): Observable<Icon> {
        this.getBackendURL();
        const url = `${this.apiUrl}/icons/${id}`;
        return this.http.get<Icon>(url);
    }

    /**
     * Get icon by original filename
     */
    getIconByFilename(filename: string): Observable<Icon> {
        this.getBackendURL();
        const url = `${this.apiUrl}/icons/filename/${filename}`;
        return this.http.get<Icon>(url);
    }

    /**
     * Increment icon usage count
     */
    incrementIconUsage(id: string): Observable<Icon> {
        this.getBackendURL();
        const url = `${this.apiUrl}/icons/${id}/usage`;
        return this.http.post<Icon>(url, {});
    }

    /**
     * Get icon URL (S3 or CloudFront)
     */
    getIconUrl(icon: Icon): string {
        if (icon.cloudfrontUrl) {
            return icon.cloudfrontUrl;
        }
        if (icon.s3Path) {
            // Fallback to S3 URL if CloudFront not available
            return `https://wowkeyb-dev-images.s3.amazonaws.com/${icon.s3Path}`;
        }
        return '';
    }

    /**
     * Get icons with infinite scroll support
     */
    getIconsPage(page: number, limit: number = 50): Observable<IconResponse> {
        return this.getIcons({ page, limit });
    }
}
