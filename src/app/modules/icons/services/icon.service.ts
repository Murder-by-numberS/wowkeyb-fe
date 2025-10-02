import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { AuthService } from 'app/core/auth/auth.service';

export interface Icon {
    id?: string;
    _id?: string; // MongoDB _id field
    name: string;
    keywords: string[];
    usageCount: number;
    lastUsed?: Date;
    s3Path?: string;
    cloudfrontUrl?: string;
    originalFileName?: string;
    fdid?: number;
    createdAt?: Date;
    updatedAt?: Date;
}

export interface GetIconsParams {
    page?: number;
    limit?: number;
    search?: string;
}

export interface IconResponse {
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
            if (params.search) httpParams = httpParams.set('search', params.search);
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
     * Get icons by class (using search endpoint)
     */
    getIconsByClass(className: string, limit?: number): Observable<IconResponse> {
        this.getBackendURL();
        let httpParams = new HttpParams();

        httpParams = httpParams.set('search', className);
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
     * Get icon URL (CloudFront or S3)
     */
    getIconUrl(icon: Icon): string {
        // Use CloudFront URL if available (preferred for performance)
        if (icon.cloudfrontUrl) {
            return icon.cloudfrontUrl;
        }

        // Fallback to S3 URL if CloudFront not available
        if (icon.s3Path) {
            // Generate CloudFront URL from S3 path
            const cloudfrontUrl = `https://d10lzq0xgj2wa0.cloudfront.net/${icon.s3Path}`;
            console.warn('Using generated CloudFront URL:', cloudfrontUrl);
            return cloudfrontUrl;
        }

        console.error('No valid URL found for icon:', icon);
        return '';
    }

    /**
     * Search icons by name, keywords, filename, or FDID
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
     * Get icons with infinite scroll support
     */
    getIconsPage(page: number, limit: number = 50): Observable<IconResponse> {
        return this.getIcons({ page, limit });
    }
}
