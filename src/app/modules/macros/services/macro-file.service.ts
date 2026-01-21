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

export interface CreateMacroFileRequest {
    file_type?: 'account' | 'character';
    character_class?: string;
    character_name?: string;
    file_name?: string;
}

export interface CreateMacroFileResponse {
    message: string;
    file: {
        id: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        character_name?: string;
        macro_count: number;
        macros: Array<{
            id: string;
            name: string;
            class?: string;
        }>;
        created_at?: string;
        updated_at?: string;
    };
}

export interface SaveMacroFileRequest {
    file_id?: string; // Optional: ID of existing file to update
    macro_ids: string[];
    file_type: 'account' | 'character';
    character_class?: string;
    character_name?: string;
    file_name?: string;
}

export interface SaveMacroFileResponse {
    message: string;
    file: {
        id: string;
        file_name: string;
        file_type: string;
        character_class?: string;
        character_name?: string;
        macro_count: number;
        macros: Array<{
            id: string;
            name: string;
            class?: string;
        }>;
        created_at?: string;
        updated_at?: string;
    };
}

export interface GenerateMacroFileRequest {
    macro_ids: string[];
    file_type: 'account' | 'character';
    character_class?: string;
    character_name?: string;
    file_id?: string; // Optional: ID of existing file to update
}

export interface PreviewMacroFileResponse {
    message: string;
    preview: {
        file_name: string;
        macros_count: number;
        macros: Array<{
            index: number;
            name: string;
            macro_text: string;
            icon_fdid?: string;
            show_tooltip?: boolean;
        }>;
    };
    user_macro_count: number;
    available_slots: number;
    would_exceed_limit: boolean;
    validation: {
        errors: any[];
        warnings: any[];
        isValid: boolean;
    };
}

export interface ImportSelectedMacrosRequest {
    macros: Array<{
        name: string;
        macro_text: string;
        icon_fdid?: string;
        show_tooltip?: boolean;
    }>;
    file_type: 'account' | 'character';
    character_class?: string;
    game_version?: string;
}

export interface ImportSelectedMacrosResponse {
    message: string;
    imported_count: number;
    requested_count: number;
    created_macros: Array<{
        id: string;
        name: string;
        class?: string;
        macro_text: string;
    }>;
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
    last_downloaded_at?: string;
    created_at?: string;
    updated_at?: string;
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
     * Preview a macro file (parse without creating macros)
     */
    previewMacroFile(file: File, fileType?: string, characterClass?: string): Observable<PreviewMacroFileResponse> {
        const formData = new FormData();
        formData.append('file', file);
        if (fileType) {
            formData.append('file_type', fileType);
        }
        if (characterClass) {
            formData.append('character_class', characterClass);
        }
        return this.http.post<PreviewMacroFileResponse>(`${this.baseUrl}/preview`, formData);
    }

    /**
     * Import selected macros from a previewed file
     */
    importSelectedMacros(request: ImportSelectedMacrosRequest): Observable<ImportSelectedMacrosResponse> {
        return this.http.post<ImportSelectedMacrosResponse>(`${this.baseUrl}/import`, request);
    }

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
     * Create a macro file (persistent, no S3 upload)
     */
    createMacroFile(request: CreateMacroFileRequest = {}): Observable<CreateMacroFileResponse> {
        return this.http.post<CreateMacroFileResponse>(`${this.baseUrl}`, request);
    }

    /**
     * Save/update macro file (update macros in DB without generating S3 file)
     */
    saveMacroFile(request: SaveMacroFileRequest): Observable<SaveMacroFileResponse> {
        return this.http.put<SaveMacroFileResponse>(`${this.baseUrl}`, request);
    }

    /**
     * Generate a macro file from selected macros (creates/updates S3 file)
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
        // For blank files, use fetch to ensure the download works properly
        // Some browsers have issues with anchor download for very small files
        fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to fetch file');
                }
                return response.blob();
            })
            .then(blob => {
                const blobUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = fileName;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(blobUrl);
            })
            .catch(error => {
                console.error('Error downloading file:', error);
                // Fallback to direct link if fetch fails
                const link = document.createElement('a');
                link.href = url;
                link.download = fileName;
                link.target = '_blank';
                link.rel = 'noopener noreferrer';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            });
    }
}

