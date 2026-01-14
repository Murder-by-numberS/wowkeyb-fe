import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';

export interface MacroFileUploadRequest {
    file: File;
    file_type: 'account' | 'character';
    character_class?: string;
    game_version?: string;
    create_macros?: boolean;
}

export interface MacroFileUploadResponse {
    message: string;
    upload: {
        id: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        s3_path: string;
        cloudfront_url?: string;
        macros_parsed: number;
        macros_created: number;
        uploaded_at: string;
    };
    validation: {
        errors: any[];
        warnings: any[];
        isValid: boolean;
    };
    created_macros: Array<{
        id: string;
        name: string;
        class?: string;
        macro_text: string;
    }>;
}

export interface GenerateMacroFileRequest {
    macro_ids: string[];
    file_type: 'account' | 'character';
    character_class?: string;
    character_name?: string;
    save_to_history?: boolean;
}

export interface GenerateMacroFileResponse {
    message: string;
    file: {
        id?: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        download_url: string;
        s3_path: string;
        cloudfront_url?: string;
        macro_count: number;
        macros: Array<{
            id: string;
            name: string;
            class?: string;
        }>;
    };
}

export interface MacroDownload {
    id: string;
    file_name: string;
    file_type: string;
    character_class?: string;
    character_name?: string;
    s3_path: string;
    cloudfront_url?: string;
    macro_count: number;
    download_count: number;
    downloaded_at: string;
    last_downloaded_at: string;
    macros: Array<{
        id: string;
        name: string;
        class?: string;
    }>;
}

export interface DownloadHistoryResponse {
    downloads: MacroDownload[];
    pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
        limit: number;
    };
}

export interface RedownloadResponse {
    message: string;
    file: {
        id: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        character_name?: string;
        download_url: string;
        cloudfront_url?: string;
        macro_count: number;
        download_count: number;
    };
}

@Injectable({
    providedIn: 'root'
})
export class MacroFileService {
    private baseUrl = `${environment.apiUrl}/files`;

    constructor(private http: HttpClient) { }

    /**
     * Upload a WoW macro file
     */
    uploadMacroFile(request: MacroFileUploadRequest): Observable<MacroFileUploadResponse> {
        const formData = new FormData();
        formData.append('file', request.file);
        formData.append('file_type', request.file_type);

        if (request.character_class) {
            formData.append('character_class', request.character_class);
        }

        if (request.game_version) {
            formData.append('game_version', request.game_version);
        }

        if (request.create_macros !== undefined) {
            formData.append('create_macros', request.create_macros.toString());
        }

        return this.http.post<MacroFileUploadResponse>(`${this.baseUrl}/upload`, formData);
    }

    /**
     * Generate a macro file from selected macros
     */
    generateMacroFile(request: GenerateMacroFileRequest): Observable<GenerateMacroFileResponse> {
        return this.http.post<GenerateMacroFileResponse>(`${this.baseUrl}/generate`, request);
    }

    /**
     * Get download history
     */
    getDownloadHistory(
        fileType?: 'account' | 'character',
        characterClass?: string,
        limit: number = 50,
        page: number = 1
    ): Observable<DownloadHistoryResponse> {
        let params = new HttpParams()
            .set('limit', limit.toString())
            .set('page', page.toString());

        if (fileType) {
            params = params.set('file_type', fileType);
        }

        if (characterClass) {
            params = params.set('character_class', characterClass);
        }

        return this.http.get<DownloadHistoryResponse>(`${this.baseUrl}/history`, { params });
    }

    /**
     * Re-download a previously generated file
     */
    redownloadFile(downloadId: string): Observable<RedownloadResponse> {
        return this.http.get<RedownloadResponse>(`${this.baseUrl}/history/${downloadId}/download`);
    }

    /**
     * View file content (returns file content directly)
     */
    viewFile(fileId: string): Observable<{ message: string; file: { id: string; file_name: string; content: string } }> {
        return this.http.get<{ message: string; file: { id: string; file_name: string; content: string } }>(`${this.baseUrl}/history/${fileId}/view`);
    }

    /**
     * Delete a download record from history
     */
    deleteDownloadRecord(downloadId: string): Observable<{ message: string }> {
        return this.http.delete<{ message: string }>(`${this.baseUrl}/history/${downloadId}`);
    }

    /**
     * Download a file from URL (opens in new window)
     */
    downloadFileFromUrl(url: string, fileName: string): void {
        // Create a temporary anchor element to trigger download
        const link = document.createElement('a');
        link.href = url;
        link.download = fileName;
        link.target = '_blank';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

