import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FuseConfigService, Scheme } from '@fuse/services/config';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'app-scheme-toggle',
    standalone: true,
    imports: [MatButtonModule, MatIconModule, MatTooltipModule],
    template: `
        <button
            mat-icon-button
            [matTooltip]="currentScheme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'"
            (click)="toggleScheme()"
            class="text-hint"
        >
            @if (currentScheme === 'dark') {
                <mat-icon [svgIcon]="'heroicons_outline:sun'"></mat-icon>
            } @else {
                <mat-icon [svgIcon]="'heroicons_outline:moon'"></mat-icon>
            }
        </button>
    `,
})
export class SchemeToggleComponent implements OnInit, OnDestroy {
    currentScheme: 'dark' | 'light' = 'light';
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    constructor(private _fuseConfigService: FuseConfigService) {}

    ngOnInit(): void {
        this._fuseConfigService.config$
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((config) => {
                this.currentScheme = config.scheme === 'dark' ? 'dark' : 'light';
            });
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    toggleScheme(): void {
        const newScheme: Scheme = this.currentScheme === 'dark' ? 'light' : 'dark';
        this._fuseConfigService.config = { scheme: newScheme };
    }
}
