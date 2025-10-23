import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, shareReplay, switchMap } from 'rxjs/operators';
import { environment } from 'environments/environment';

@Injectable({
    providedIn: 'root'
})
export class VersionCompareService {
    private latestVersion$: Observable<string>;
    private latestVersionSubject = new BehaviorSubject<string | null>(null);

    constructor(private http: HttpClient) { }

    /**
     * Fetches the latest game version from the backend, caches the result.
     */
    getLatestVersion(): Observable<string> {
        if (this.latestVersionSubject.value) {
            return of(this.latestVersionSubject.value);
        }
        if (!this.latestVersion$) {
            this.latestVersion$ = this.http.get<{ game_version: string }>(`${environment.apiUrl}/versions/latest`).pipe(
                map(res => res.game_version),
                shareReplay(1)
            );
            this.latestVersion$.subscribe(version => this.latestVersionSubject.next(version));
        }
        return this.latestVersion$;
    }

    /**
     * Fetches the latest game version object (with ID) from the backend.
     */
    getLatestVersionWithId(): Observable<any> {
        return this.http.get<any>(`${environment.apiUrl}/versions/latest`);
    }

    /**
     * Fetches all available game versions from the backend.
     */
    getAllVersions(): Observable<string[]> {
        return this.http.get<Array<{ _id: string; game_version: string; createdAt: string; updatedAt: string; __v: number }>>(`${environment.apiUrl}/versions`).pipe(
            map(versions => versions.map(v => v.game_version))
        );
    }

    /**
     * Compares two version strings (e.g., '11.1.0' and '11.0.5')
     * Returns:
     *   0 if equal,
     *   1 if v1 > v2,
     *  -1 if v1 < v2
     */
    compareVersions(v1: string, v2: string): number {
        const a = v1.split('.').map(Number);
        const b = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(a.length, b.length); i++) {
            const num1 = a[i] || 0;
            const num2 = b[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }

    /**
     * Compares a keybinding's game_version to the latest version from the backend.
     * Returns an observable of:
     *   0 if equal,
     *   1 if keybinding is ahead,
     *  -1 if keybinding is behind
     */
    compareToLatest(keybindingVersion: string): Observable<number> {
        return this.getLatestVersion().pipe(
            map(latest => this.compareVersions(keybindingVersion, latest))
        );
    }

    /**
     * Returns an observable of true if the keybinding is up to date with the latest version.
     */
    isLatestVersion(keybindingVersion: string): Observable<boolean> {
        return this.compareToLatest(keybindingVersion).pipe(
            map(result => result === 0)
        );
    }
}
