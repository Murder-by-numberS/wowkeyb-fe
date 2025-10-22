//Angular
import { Component, ViewEncapsulation, OnInit, OnDestroy, signal, ViewChild, EventEmitter, Output, Input, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass } from '@angular/common';

//Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAccordion } from '@angular/material/expansion';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';

//Directives
import { ClickOutsideDirective } from 'app/core/directives/click-outside/click-outside.directive';

//Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { MatSnackBar } from '@angular/material/snack-bar';

import { Keybinding } from 'app/core/types/keybinding';
import { keybinds } from './data';
import { classes } from 'app/core/data/classes';
import { random } from 'lodash';
import { Subject, takeUntil } from 'rxjs';

@Component({
    selector: 'keybinds-drawer',
    templateUrl: './keybinds-drawer.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        NgClass,
        FormsModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatSelectModule,
        MatExpansionModule,
        MatAccordion,
        ClickOutsideDirective,
        MatInputModule,
        MatTooltipModule
    ],
})
export class KeybindsDrawerComponent implements OnInit, OnDestroy {
    @ViewChild(MatAccordion) accordion: MatAccordion;

    readonly panelOpenState = signal(false);

    @Input() isKeybindingSelected: boolean = false;
    @Input() selectedKeybinding: any = null;

    keybindings: Keybinding[];
    filteredKeybindings: Keybinding[];
    selectedKeybindingId: string | null = null; // To keep track of the selected keybind
    @Output() keybindingSelected = new EventEmitter<any>();
    @Output() refreshKeybindings = new EventEmitter<void>();
    @Output() keybindingUpdated = new EventEmitter<any>();
    MAX_SIZE = 10;

    selectedClasses = new FormControl<any[]>([]);

    classList = classes;  // Use the full class data instead of just names

    filterApplied: boolean = false;
    preventAutoSelection: boolean = false; // Flag to prevent auto-selection
    isLoading: boolean = false;
    favoriteClass: string | null = null;
    private destroy$ = new Subject<void>();

    keybindingService = inject(KeybindingService);
    snackBar = inject(MatSnackBar);

    /**
     * Constructor
     */
    constructor() {

    }

    ngOnInit(): void {
        // Load favorite class from settings
        const settings = localStorage.getItem('settings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            this.favoriteClass = parsedSettings.favoriteClass || null;
        }

        // Force refresh keybindings from server on component initialization
        this.forceRefreshKeybindings();
        this.filteredKeybindings = this.keybindings;

        // Subscribe to the keybinding service to update when keybindings change
        this.keybindingService.currentKeybindings.subscribe(keybindings => {
            console.log('KeybindsDrawerComponent - received keybindings update:', keybindings.length);
            console.log('KeybindsDrawerComponent - keybinding details:', keybindings.map(kb => ({
                id: kb.keybindingId,
                name: kb.name,
                version: kb.version?.game_version
            })));
            this.keybindings = keybindings;
            this.applyFilter();
            console.log('KeybindsDrawerComponent - applied filter, filtered keybindings:', this.filteredKeybindings.length);
            console.log('KeybindsDrawerComponent - filtered keybinding details:', this.filteredKeybindings.map(kb => ({
                id: kb.keybindingId,
                name: kb.name,
                version: kb.version?.game_version
            })));
        });

        this.selectedClasses.valueChanges.subscribe(() => {
            this.filterKeybindings();
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadKeybindings() {
        console.log('KeybindsDrawerComponent - loadKeybindings');
        this.isLoading = true;

        // Load user's keybindings from the backend
        this.keybindingService.getKeybindings()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (keybindings) => {
                    console.log('KeybindsDrawerComponent - loaded keybindings from backend:', keybindings.length);
                    this.keybindings = keybindings;
                    this.applyFilter();
                    this.isLoading = false;

                    // Only auto-select if we're not preventing auto-selection
                    if (!this.preventAutoSelection) {
                        // If we're on the my-keybindings page and no keybinding is selected, select the first one
                        if (window.location.pathname === '/keybinds/my-keybindings' && !this.selectedKeybindingId && this.filteredKeybindings.length > 0) {
                            const firstKeybinding = this.filteredKeybindings[0];
                            this.selectedKeybindingId = firstKeybinding.keybindingId;
                            this.keybindingSelected.emit(firstKeybinding);
                        }
                        // If we're on the home page and no keybinding is selected, select the last one
                        else if (window.location.pathname === '/keybinds' && !this.selectedKeybindingId && this.filteredKeybindings.length > 0) {
                            const lastKeybinding = this.filteredKeybindings[this.filteredKeybindings.length - 1];
                            this.selectedKeybindingId = lastKeybinding.keybindingId;
                            this.keybindingSelected.emit(lastKeybinding);
                        }
                    }
                },
                error: (error) => {
                    console.error('Error loading keybindings:', error);
                    this.isLoading = false;
                }
            });
    }

    forceRefreshKeybindings() {
        console.log('KeybindsDrawerComponent - forceRefreshKeybindings');
        // Force refresh from server
        this.keybindingService.forceRefreshKeybindings().subscribe({
            next: (keybindings) => {
                console.log('Keybindings refreshed from server:', keybindings.length);
                this.keybindings = keybindings;
                this.applyFilter();
            },
            error: (error) => {
                console.error('Error refreshing keybindings:', error);
                // Fallback to current keybindings in service
                this.loadKeybindings();
            }
        });
    }

    selectKeybinding(keybinding: any): void {
        console.log('keybinding selected', keybinding);
        console.log('keybinding details:', {
            id: keybinding.keybindingId,
            name: keybinding.name,
            class: keybinding.class,
            spec: keybinding.spec,
            heroTalent: keybinding.heroTalent
        });
        this.selectedKeybindingId = keybinding.keybindingId;
        this.keybindingSelected.emit(keybinding);
    }

    // Add a method to set the selected keybinding from outside
    setSelectedKeybinding(keybinding: Keybinding): void {
        console.log('KeybindsDrawerComponent - setSelectedKeybinding called with:', keybinding);
        if (keybinding) {
            // Prevent auto-selection while we're setting the keybinding
            this.preventAutoSelection = true;

            this.selectedKeybindingId = keybinding.keybindingId;
            console.log('KeybindsDrawerComponent - set selectedKeybindingId to:', this.selectedKeybindingId);

            // Ensure the keybinding is in the filtered list
            if (!this.filteredKeybindings.some(kb => kb.keybindingId === keybinding.keybindingId)) {
                console.log('KeybindsDrawerComponent - adding keybinding to filtered list');
                this.filteredKeybindings = [...this.filteredKeybindings, keybinding];
            }

            // Reset the flag after a short delay to allow normal auto-selection in the future
            setTimeout(() => {
                this.preventAutoSelection = false;
            }, 1000);
        }
    }

    clearSelection(): void {
        this.selectedKeybindingId = null;
        this.preventAutoSelection = true;

        // Reset the flag after a short delay to allow normal auto-selection in the future
        setTimeout(() => {
            this.preventAutoSelection = false;
        }, 1000);
    }

    closeAccordion() {
        this.accordion.closeAll();

        console.log('apply filter')
        console.log('filter:', this.selectedClasses.value);
        if (this.selectedClasses.value?.length > 0) {
            this.filterApplied = true;
            console.log('this.selectedClasses.value', typeof this.selectedClasses.value);
            this.applyFilter();
        }
        else {
            this.filterApplied = false;
            this.filteredKeybindings = this.sortKeybindings(this.keybindings);
        }
    }

    isSelected(keybindingId: string): boolean {
        return this.selectedKeybindingId === keybindingId;
    }

    trackByKeybindingId(index: number, keybinding: Keybinding): string {
        return `${index}-${keybinding.keybindingId}`;
    }

    createKeybinding() {
        this.keybindingService.createKeybinding().subscribe({
            next: (createdKeybinding) => {
                console.log('Keybinding created:', createdKeybinding);
                // Update selected keybinding and emit it
                this.selectedKeybindingId = createdKeybinding.keybindingId;
                console.log('selectedKeybindingId', this.selectedKeybindingId);
                this.keybindingSelected.emit(createdKeybinding);
                this.loadKeybindings();
            },
            error: (error) => {
                console.error('Error creating keybinding:', error);
                // Handle error appropriately (e.g., show error message to user)
            }
        });
    }

    sortKeybindings(keybindings: Keybinding[]): Keybinding[] {
        if (!this.favoriteClass) {
            return keybindings;
        }

        // Sort keybindings with favorite class first
        return [...keybindings].sort((a, b) => {
            const aIsFavorite = a.class === this.favoriteClass;
            const bIsFavorite = b.class === this.favoriteClass;

            if (aIsFavorite && !bIsFavorite) return -1;
            if (!aIsFavorite && bIsFavorite) return 1;
            return 0;
        });
    }

    applyFilter() {
        console.log('KeybindsDrawerComponent - applyFilter called');
        console.log('KeybindsDrawerComponent - filterApplied:', this.filterApplied);
        console.log('KeybindsDrawerComponent - selectedClasses.value:', this.selectedClasses.value);
        console.log('KeybindsDrawerComponent - keybindings length:', this.keybindings.length);

        if (this.filterApplied && this.selectedClasses.value?.length > 0) {
            const filtered = this.keybindings.filter(keybinding =>
                this.selectedClasses.value.some(selectedClass => selectedClass.name === keybinding.class)
            );
            this.filteredKeybindings = this.sortKeybindings(filtered);
            console.log('KeybindsDrawerComponent - filtered keybindings length:', this.filteredKeybindings.length);
            if (!this.filteredKeybindings.some(keybinding => keybinding.keybindingId === this.selectedKeybindingId)) {
                this.selectedKeybindingId = null;
                this.keybindingSelected.emit(null);
            }
        } else {
            this.filteredKeybindings = this.sortKeybindings(this.keybindings);
            console.log('KeybindsDrawerComponent - no filter applied, filtered keybindings length:', this.filteredKeybindings.length);
        }
    }

    filterKeybindings(): void {
        const selected = this.selectedClasses.value;
        if (!selected || selected.length === 0) {
            this.filteredKeybindings = this.sortKeybindings(this.keybindings);
            this.filterApplied = false;
            return;
        }
        this.filterApplied = true;
        const filtered = this.keybindings.filter(k =>
            selected.some(selectedClass => selectedClass.name === k.class)
        );
        this.filteredKeybindings = this.sortKeybindings(filtered);
    }

    togglePublic(keybinding: Keybinding): void {
        this.keybindingService.updateKeybinding(keybinding.keybindingId, { isPublic: !keybinding.isPublic })
            .subscribe({
                next: () => {

                    this.loadKeybindings(); // Reload to update the UI
                    this.snackBar.open(
                        keybinding.isPublic ? 'Keybinding is now private' : 'Keybinding is now public',
                        'Close',
                        { duration: 3000 }
                    );
                },
                error: (error) => {
                    console.error('Error updating keybinding:', error);
                    this.snackBar.open('Error updating keybinding status', 'Close', { duration: 3000 });
                }
            });
    }

    // Add a method to get the class icon
    getClassIcon(className: string): string {
        const classData = this.classList.find(c => c.name === className);
        return classData?.icon || '';
    }
}
