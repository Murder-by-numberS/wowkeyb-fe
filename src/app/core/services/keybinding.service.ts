import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';

import { environment } from 'environments/environment';

import { Keybinding } from '../types/keybinding';
import { Keybind } from '../types/keybind';
import { formatClassNameForFrontend, formatClassNameForBackend } from '../utils/class-name-utils';

interface KeybindUpdate {
    addedKeybinds: Keybind[];
    removedKeybinds: Keybind[];
}

export interface HomeKeybindingsResponse {
    [className: string]: {
        recent: Keybinding[];
        popular: Keybinding[];
    }
}

@Injectable({
    providedIn: 'root'
})
export class KeybindingService {
    private keybindingsSource = new BehaviorSubject<Keybinding[]>([]);
    currentKeybindings = this.keybindingsSource.asObservable();

    get currentKeybindingsValue(): Keybinding[] {
        return this.keybindingsSource.getValue();
    }

    constructor(private http: HttpClient) { }

    getKeybindingById(id: string): Keybinding | undefined {
        const currentKeybindings = this.keybindingsSource.getValue();
        return currentKeybindings.find(kb => kb.keybindingId === id);
    }

    updateKeybindings(keybindings: Keybinding[]) {
        this.keybindingsSource.next(keybindings);
    }

    addKeybinding(keybinding: Keybinding) {
        const currentKeybindings = this.keybindingsSource.getValue();
        this.keybindingsSource.next([...currentKeybindings, keybinding]);
    }

    removeKeybinding(id: string): Observable<any> {
        console.log('removeKeybinding called with id:', id);

        return this.http.delete<any>(`${environment.apiUrl}/keybindings/${id}`).pipe(
            tap((response) => {
                console.log('Delete response received:', response);
                console.log('Response type:', typeof response);
                console.log('Response keys:', Object.keys(response || {}));

                // Update local state after successful deletion (including already deleted)
                const currentKeybindings = this.keybindingsSource.getValue();
                console.log('Current keybindings before removal:', currentKeybindings.length);
                console.log('Current keybinding IDs:', currentKeybindings.map(kb => kb.keybindingId));
                console.log('Removing keybinding:', id);

                const updatedKeybindings = currentKeybindings.filter(kb => kb.keybindingId !== id);
                console.log('Filtered keybindings:', updatedKeybindings.length);
                console.log('Updated keybinding IDs:', updatedKeybindings.map(kb => kb.keybindingId));

                this.keybindingsSource.next(updatedKeybindings);
                console.log('BehaviorSubject updated with new keybindings');

                console.log('Keybinding removed from local state:', id);
                console.log('Remaining keybindings:', updatedKeybindings.length);
            }),
            catchError((error) => {
                console.error('Error in removeKeybinding:', error);
                // Even if there's an error, try to remove from local state
                const currentKeybindings = this.keybindingsSource.getValue();
                const updatedKeybindings = currentKeybindings.filter(kb => kb.keybindingId !== id);
                this.keybindingsSource.next(updatedKeybindings);
                console.log('Removed keybinding from local state despite error');
                throw error;
            })
        );
    }

    hasKeybindKey(keybindingId: string, key: string): boolean {
        const keybinding = this.getKeybindingById(keybindingId);
        if (!keybinding) return false;
        return keybinding.keybinds.some(keybind => keybind.key === key);
    }

    updateKeybindsInKeybinding(id: string, update: KeybindUpdate): Observable<Keybinding> {
        const currentKeybindings = this.keybindingsSource.getValue();
        console.log('updateKeybindsInKeybinding - currentKeybindings - update:', update);

        // Find the current keybinding
        const currentKeybinding = currentKeybindings.find(kb => kb.keybindingId === id);
        if (!currentKeybinding) {
            throw new Error('Keybinding not found');
        }

        // Calculate the new keybinds array
        let keybinds = [...currentKeybinding.keybinds];
        if (update.removedKeybinds?.length) {
            console.log('removing keybinds - before:', keybinds.length);
            console.log('update.removedKeybinds', update.removedKeybinds);
            keybinds = keybinds.filter(existing => {
                const existingSpellId = existing.spell?.spellId;
                const shouldRemove = update.removedKeybinds.some(remove => {
                    const removeSpellId = remove.spell?.spellId;
                    return String(removeSpellId) === String(existingSpellId);
                });
                console.log('Checking keybind for removal:', {
                    existingSpellId,
                    existingSpellName: existing.spell?.name,
                    shouldRemove
                });
                return !shouldRemove;
            });
            console.log('removing keybinds - after:', keybinds.length);
        }
        if (update.addedKeybinds?.length) {
            console.log('adding keybinds - before:', keybinds.length);
            keybinds.push(...update.addedKeybinds);
            console.log('adding keybinds - after:', keybinds.length);
        }

        console.log('after updateKeybindsInKeybinding - keybinds', keybinds);

        // Only send the keybinds field to avoid triggering other field clearing logic
        return this.updateKeybinding(id, { keybinds });
    }

    updateKeybinding(id: string, updatedKeybinding: Partial<Keybinding>): Observable<Keybinding> {
        console.log('updateKeybinding - sending to backend:', { id, updatedKeybinding });
        console.log('updateKeybinding - keybinds being sent:', updatedKeybinding.keybinds?.length);
        console.log('updateKeybinding - keybinds details:', updatedKeybinding.keybinds?.map(kb => ({
            key: kb.key,
            spellName: kb.spell?.name,
            spellId: kb.spell?.spellId
        })));

        // Transform frontend class name to backend format before sending
        const backendUpdatedKeybinding = {
            ...updatedKeybinding,
            ...(updatedKeybinding.class && { class: formatClassNameForBackend(updatedKeybinding.class) })
        };

        return this.http.put<Keybinding>(`${environment.apiUrl}/keybindings/${id}`, backendUpdatedKeybinding)
            .pipe(
                map((response: Keybinding) => ({
                    ...response,
                    class: formatClassNameForFrontend(response.class)
                })),
                tap((response: Keybinding) => {
                    console.log('updateKeybinding - backend response:', response);
                    console.log('updateKeybinding - response keybinds:', response.keybinds?.length);
                    console.log('updateKeybinding - response keybinds details:', response.keybinds?.map(kb => ({
                        key: kb.key,
                        spellName: kb.spell?.name,
                        spellId: kb.spell?.spellId
                    })));

                    const currentKeybindings = this.keybindingsSource.getValue();
                    const updatedKeybindings = currentKeybindings.map(kb =>
                        kb.keybindingId === id ? response : kb
                    );
                    console.log('updateKeybinding - updating local state:', updatedKeybindings);
                    this.keybindingsSource.next(updatedKeybindings);
                })
            );
    }

    updateKeybindingName(id: string, name: string) {
        const currentKeybindings = this.keybindingsSource.getValue();
        const updatedKeybindings = currentKeybindings.map(kb =>
            kb.keybindingId === id ? { ...kb, name } : kb
        );

        this.keybindingsSource.next(updatedKeybindings);
    }

    // clearKeybinds(keybindingId: string) {
    //     const currentKeybindings = this.keybindingsSource.getValue();
    //     const updatedKeybindings = currentKeybindings.map(kb =>
    //         kb.keybindingId === keybindingId ? { ...kb, keybinds: [] } : kb
    //     );
    //     this.keybindingsSource.next(updatedKeybindings);
    // }

    createKeybinding(keybinding?: Keybinding): Observable<Keybinding> {
        console.log('creating keybinding');

        // Transform frontend class name to backend format before sending
        const backendKeybinding = keybinding ? {
            ...keybinding,
            class: formatClassNameForBackend(keybinding.class)
        } : {};

        return this.http.post<Keybinding>(`${environment.apiUrl}/keybindings`, backendKeybinding).pipe(
            map((newKeybinding: Keybinding) => ({
                ...newKeybinding,
                class: formatClassNameForFrontend(newKeybinding.class)
            })),
            tap((newKeybinding: Keybinding) => {
                console.log('after created - newKeybinding', newKeybinding);
                const currentKeybindings = this.keybindingsSource.getValue();
                this.keybindingsSource.next([...currentKeybindings, newKeybinding]);
                console.log('this.keybindingsSource', this.keybindingsSource.getValue());
            })
        );
    }

    getKeybindings(): Observable<Keybinding[]> {
        console.log('getting keybindings');
        return this.http.get<Keybinding[]>(`${environment.apiUrl}/keybindings`).pipe(
            map((keybindings: Keybinding[]) => {
                // Transform backend class names (lowercase) to frontend format (capitalized)
                return keybindings.map(keybinding => ({
                    ...keybinding,
                    class: formatClassNameForFrontend(keybinding.class)
                }));
            }),
            tap((keybindings: Keybinding[]) => {
                console.log('getKeybindings - raw keybindings from server:', keybindings.length);
                console.log('getKeybindings - keybinding IDs from server:', keybindings.map(kb => kb.keybindingId));

                // Filter out any soft-deleted keybindings that might slip through
                // This is a safety net in case the backend middleware isn't working properly
                const filteredKeybindings = keybindings.filter(kb => !kb.deleted_at);

                if (filteredKeybindings.length !== keybindings.length) {
                    console.warn(`Filtered out ${keybindings.length - filteredKeybindings.length} soft-deleted keybindings on frontend`);
                }

                console.log('getKeybindings - filtered keybindings:', filteredKeybindings.length);
                this.keybindingsSource.next(filteredKeybindings);
                console.log('getKeybindings - this.keybindingsSource', this.keybindingsSource.getValue());
            })
        );
    }

    getPopularKeybindings(page?: number, limit?: number): Observable<Keybinding[]> {
        console.log('getting popular keybindings');
        let params = new HttpParams();
        if (page) params = params.set('page', page.toString());
        if (limit) params = params.set('limit', limit.toString());

        return this.http.get<Keybinding[]>(`${environment.apiUrl}/keybindings/popular`, { params }).pipe(
            map((keybindings: Keybinding[]) => {
                // Transform backend class names (lowercase) to frontend format (capitalized)
                return keybindings.map(keybinding => ({
                    ...keybinding,
                    class: formatClassNameForFrontend(keybinding.class)
                }));
            })
        );
    }

    getHomeKeybindings(): Observable<HomeKeybindingsResponse> {
        console.log('getting home keybindings');
        return this.http.get<HomeKeybindingsResponse>(`${environment.apiUrl}/keybindings/home`).pipe(
            map((response: HomeKeybindingsResponse) => {
                // Transform backend class names (lowercase) to frontend format (capitalized)
                // Keep group keys in lowercase to match component expectations
                const transformedResponse: HomeKeybindingsResponse = {};

                Object.entries(response).forEach(([backendClassName, classData]) => {
                    // Keep the group key in lowercase (backend format) to match component expectations
                    transformedResponse[backendClassName] = {
                        recent: classData.recent.map(keybinding => ({
                            ...keybinding,
                            class: formatClassNameForFrontend(keybinding.class)
                        })),
                        popular: classData.popular.map(keybinding => ({
                            ...keybinding,
                            class: formatClassNameForFrontend(keybinding.class)
                        }))
                    };
                });

                console.log('Transformed home keybindings response:', transformedResponse);
                return transformedResponse;
            })
        );
    }

    clearKeybindings() {
        this.keybindingsSource.next([]);
    }

    forceRefreshKeybindings(): Observable<Keybinding[]> {
        console.log('Force refreshing keybindings from server');
        // Clear state first
        this.clearKeybindings();
        console.log('Cleared keybindings from state');

        // Fetch fresh data from server with cache-busting
        const timestamp = Date.now();
        console.log('Fetching keybindings with cache-busting timestamp:', timestamp);
        return this.http.get<Keybinding[]>(`${environment.apiUrl}/keybindings?t=${timestamp}`).pipe(
            map((keybindings: Keybinding[]) => {
                // Transform backend class names (lowercase) to frontend format (capitalized)
                return keybindings.map(keybinding => ({
                    ...keybinding,
                    class: formatClassNameForFrontend(keybinding.class)
                }));
            }),
            tap((keybindings: Keybinding[]) => {
                console.log('Force refresh completed - keybindings updated:', keybindings.length);
                console.log('Force refresh - keybinding versions:', keybindings.map(kb => ({
                    id: kb.keybindingId,
                    name: kb.name,
                    version: kb.version?.game_version
                })));

                // Filter out any soft-deleted keybindings that might slip through
                const filteredKeybindings = keybindings.filter(kb => !kb.deleted_at);

                this.keybindingsSource.next(filteredKeybindings);
            })
        );
    }

    getKeybinding(id: string): Observable<Keybinding> {
        return this.http.get<Keybinding>(`${environment.apiUrl}/keybindings/${id}`).pipe(
            map((keybinding: Keybinding) => ({
                ...keybinding,
                class: formatClassNameForFrontend(keybinding.class)
            }))
        );
    }

    duplicateKeybinding(keybindingId: string): Observable<Keybinding> {
        return this.http.post<Keybinding>(`${environment.apiUrl}/keybindings/${keybindingId}/duplicate`, {}).pipe(
            map((newKeybinding: Keybinding) => ({
                ...newKeybinding,
                class: formatClassNameForFrontend(newKeybinding.class)
            })),
            tap((newKeybinding: Keybinding) => {
                // Update the local state with the new keybinding
                const currentKeybindings = this.keybindingsSource.getValue();
                this.keybindingsSource.next([...currentKeybindings, newKeybinding]);
            })
        );
    }

    migrateToLatest(keybindingId: string): Observable<any> {
        return this.http.post<any>(`${environment.apiUrl}/keybindings/${keybindingId}/migrate-to-latest`, {}).pipe(
            tap((response: any) => {
                console.log('KeybindingService - migrateToLatest - received response:', response);
                console.log('KeybindingService - migration completed, keybinding will be updated separately');
            })
        );
    }

    updateKeybindingInList(updatedKeybinding: Keybinding): void {
        console.log('KeybindingService - updateKeybindingInList called with:', updatedKeybinding.keybindingId);
        console.log('KeybindingService - updated keybinding name:', updatedKeybinding.name);
        console.log('KeybindingService - updated keybinding version:', updatedKeybinding.version?.game_version);

        const currentKeybindings = this.keybindingsSource.getValue();

        // Find the specific keybinding to update
        const keybindingIndex = currentKeybindings.findIndex(kb => kb.keybindingId === updatedKeybinding.keybindingId);

        if (keybindingIndex === -1) {
            console.error('KeybindingService - keybinding not found in list:', updatedKeybinding.keybindingId);
            return;
        }

        console.log('KeybindingService - found keybinding at index:', keybindingIndex);
        console.log('KeybindingService - keybinding before update:', {
            id: currentKeybindings[keybindingIndex].keybindingId,
            name: currentKeybindings[keybindingIndex].name,
            version: currentKeybindings[keybindingIndex].version?.game_version
        });

        // Update only the specific keybinding properties in place
        const keybindingToUpdate = currentKeybindings[keybindingIndex];
        keybindingToUpdate.name = updatedKeybinding.name;
        keybindingToUpdate.class = formatClassNameForFrontend(updatedKeybinding.class); // Ensure frontend format
        keybindingToUpdate.spec = updatedKeybinding.spec;
        keybindingToUpdate.heroTalent = updatedKeybinding.heroTalent;
        keybindingToUpdate.version = updatedKeybinding.version;
        keybindingToUpdate.keybinds = updatedKeybinding.keybinds;
        keybindingToUpdate.isPublic = updatedKeybinding.isPublic;

        console.log('KeybindingService - keybinding after update:', {
            id: keybindingToUpdate.keybindingId,
            name: keybindingToUpdate.name,
            version: keybindingToUpdate.version?.game_version
        });

        // No need to emit - the object reference is the same, just the properties changed
        console.log('KeybindingService - updated keybinding in place, no list emission needed');
    }

}
