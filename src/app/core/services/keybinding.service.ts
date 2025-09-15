import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { tap, map } from 'rxjs/operators';

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

    removeKeybinding(id: string): Observable<void> {
        return this.http.delete<void>(`${environment.apiUrl}/keybindings/${id}`).pipe(
            tap(() => {
                // Update local state after successful deletion
                const currentKeybindings = this.keybindingsSource.getValue();
                const updatedKeybindings = currentKeybindings.filter(kb => kb.keybindingId !== id);
                this.keybindingsSource.next(updatedKeybindings);
                localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
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
                    localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
                    console.log('updateKeybinding - localStorage updated');
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
                localStorage.setItem('keybindings', JSON.stringify([...currentKeybindings, newKeybinding]));
            })
        );
    }

    getKeybindings(): Observable<Keybinding[]> {
        console.log('getting keybindings');
        return this.http.get<Keybinding[]>(`${environment.apiUrl}/keybindings`).pipe(
            tap((keybindings: Keybinding[]) => {
                console.log('getKeybindings - keybindings', keybindings);
                this.keybindingsSource.next(keybindings);
                console.log('getKeybindings - this.keybindingsSource', this.keybindingsSource.getValue());
                localStorage.setItem('keybindings', JSON.stringify(keybindings));
            })
        );
    }

    getHomeKeybindings(): Observable<HomeKeybindingsResponse> {
        console.log('getting home keybindings');
        return this.http.get<HomeKeybindingsResponse>(`${environment.apiUrl}/keybindings/home`);
    }

    clearKeybindings() {
        this.keybindingsSource.next([]);
        localStorage.removeItem('keybindings');
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
                localStorage.setItem('keybindings', JSON.stringify([...currentKeybindings, newKeybinding]));
            })
        );
    }

    migrateToLatest(keybindingId: string): Observable<Keybinding> {
        return this.http.post<Keybinding>(`${environment.apiUrl}/keybindings/${keybindingId}/migrate-to-latest`, {}).pipe(
            tap((migratedKeybinding: Keybinding) => {
                // Update the local state with the migrated keybinding
                const currentKeybindings = this.keybindingsSource.getValue();
                const updatedKeybindings = currentKeybindings.map(kb =>
                    kb.keybindingId === keybindingId ? migratedKeybinding : kb
                );
                this.keybindingsSource.next(updatedKeybindings);
                localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
            })
        );
    }

}
