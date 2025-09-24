import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';

import { environment } from 'environments/environment';

import { Keybinding } from '../types/keybinding';
import { Keybind } from '../types/keybind';

interface KeybindUpdate {
    addedKeybinds: Keybind[];
    removedKeybinds: Keybind[];
}

interface HomeKeybindingsResponse {
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
            keybinds = keybinds.filter(existing =>
                !update.removedKeybinds.some(remove =>
                    String(remove.spell.spellId) === String(existing.spell.spellId)
                )
            );
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
        return this.http.put<Keybinding>(`${environment.apiUrl}/keybindings/${id}`, updatedKeybinding)
            .pipe(
                tap((response: Keybinding) => {
                    console.log('updateKeybinding - backend response:', response);
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
        return this.http.post<Keybinding>(`${environment.apiUrl}/keybindings`, keybinding || {}).pipe(
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

    getHomeKeybindings(): Observable<HomeKeybindingsResponse> {
        console.log('getting home keybindings');
        return this.http.get<HomeKeybindingsResponse>(`${environment.apiUrl}/keybindings/home`);
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
            tap((keybinding: Keybinding) => {
                return keybinding;
            })
        );
    }

    duplicateKeybinding(keybindingId: string): Observable<Keybinding> {
        return this.http.post<Keybinding>(`${environment.apiUrl}/keybindings/${keybindingId}/duplicate`, {}).pipe(
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
        keybindingToUpdate.class = updatedKeybinding.class;
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
