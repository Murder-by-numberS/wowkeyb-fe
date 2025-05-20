//Angular
import { Component, ViewEncapsulation, OnInit, signal, ViewChild, EventEmitter, Output, Input, SimpleChanges, inject } from '@angular/core';
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
export class KeybindsDrawerComponent implements OnInit {
    @ViewChild(MatAccordion) accordion: MatAccordion;

    readonly panelOpenState = signal(false);

    @Input() refreshKeybindings: boolean;

    keybindings: Keybinding[];
    filteredKeybindings: Keybinding[];
    selectedKeybindingId: string | null = null; // To keep track of the selected keybind
    @Output() keybindingSelected = new EventEmitter<any>();
    MAX_SIZE = 10;

    selectedClasses = new FormControl<string[]>([]);

    classList = classes.map(obj => obj.name);

    filterApplied: boolean = false;

    keybindingService = inject(KeybindingService);
    snackBar = inject(MatSnackBar);

    /**
     * Constructor
     */
    constructor() {

    }

    ngOnInit(): void {
        this.loadKeybindings();
        this.filteredKeybindings = this.keybindings;

        const savedKeybindings = localStorage.getItem('keybindings');
        if (savedKeybindings) {
            try {
                const parsedKeybindings = JSON.parse(savedKeybindings);
                this.keybindings = parsedKeybindings;
                // Update the KeybindingService with the saved keybindings
                this.keybindingService.updateKeybindings(parsedKeybindings);
                this.applyFilter();
            } catch (error) {
                console.error('Failed to parse keybindings from localStorage:', error);
            }
        }

        // Subscribe to the keybinding service to update when keybindings change
        this.keybindingService.currentKeybindings.subscribe(keybindings => {
            this.keybindings = keybindings;
            this.applyFilter();
        });

        this.selectedClasses.valueChanges.subscribe(() => {
            this.filterKeybindings();
        });
    }

    loadKeybindings() {
        console.log('KeybindsDrawerComponent - loadKeybindings');
        this.keybindingService.currentKeybindings.subscribe(keybindings => {
            this.keybindings = keybindings;
            this.applyFilter();

            // If we're on the view-all page and no keybinding is selected, select the last one
            if (window.location.pathname === '/keybinds/view' && !this.selectedKeybindingId && this.filteredKeybindings.length > 0) {
                const lastKeybinding = this.filteredKeybindings[this.filteredKeybindings.length - 1];
                this.selectedKeybindingId = lastKeybinding.keybinding_id;
                this.keybindingSelected.emit(lastKeybinding);
            }
        });
    }

    selectKeybinding(keybinding: any): void {
        console.log('keybinding selected', keybinding);
        this.selectedKeybindingId = keybinding.keybinding_id;
        this.keybindingSelected.emit(keybinding);
    }

    // Add a method to set the selected keybinding from outside
    setSelectedKeybinding(keybinding: Keybinding): void {
        if (keybinding) {
            this.selectedKeybindingId = keybinding.keybinding_id;
            // Ensure the keybinding is in the filtered list
            if (!this.filteredKeybindings.some(kb => kb.keybinding_id === keybinding.keybinding_id)) {
                this.filteredKeybindings = [...this.filteredKeybindings, keybinding];
            }
        }
    }

    closeAccordion() {
        this.accordion.closeAll();

        console.log('apply filter')
        console.log('filter:', this.selectedClasses.value);
        if (this.selectedClasses.value.length > 0) {
            this.filterApplied = true;
            console.log('this.selectedClasses.value', typeof this.selectedClasses.value);
            this.applyFilter();
        }
        else {
            this.filterApplied = false;
            this.filteredKeybindings = this.keybindings;
        }

        this.selectedClasses.setValue([]);
    }

    isSelected(keybindingId: string): boolean {
        return this.selectedKeybindingId === keybindingId;
    }

    trackByKeybindingId(index: number, keybinding: Keybinding): string {
        return `${index}-${keybinding.keybinding_id}`;
    }

    createKeybinding() {
        this.keybindingService.createKeybinding().subscribe({
            next: (createdKeybinding) => {
                console.log('Keybinding created:', createdKeybinding);
                // Update selected keybinding and emit it
                this.selectedKeybindingId = createdKeybinding.keybinding_id;
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

    applyFilter() {
        if (this.filterApplied) {
            this.filteredKeybindings = this.keybindings.filter(keybinding => this.selectedClasses.value.includes(keybinding.class));
            if (!this.filteredKeybindings.some(keybinding => keybinding.keybinding_id === this.selectedKeybindingId)) {
                this.selectedKeybindingId = null;
                this.keybindingSelected.emit(null);
            }
        } else {
            this.filteredKeybindings = this.keybindings;
            // Don't automatically select the first keybinding
        }
    }

    filterKeybindings(): void {
        const selected = this.selectedClasses.value;
        if (!selected || selected.length === 0) {
            this.filteredKeybindings = this.keybindings;
            return;
        }
        this.filteredKeybindings = this.keybindings.filter(k => selected.includes(k.class));
    }

    togglePublic(keybinding: Keybinding): void {
        this.keybindingService.updateKeybinding(keybinding.keybinding_id, { is_public: !keybinding.is_public })
            .subscribe({
                next: () => {
                    // Update local storage
                    const savedKeybindings = localStorage.getItem('keybindings');
                    if (savedKeybindings) {
                        try {
                            const parsedKeybindings = JSON.parse(savedKeybindings);
                            const updatedKeybindings = parsedKeybindings.map((kb: Keybinding) => {
                                if (kb.keybinding_id === keybinding.keybinding_id) {
                                    return { ...kb, is_public: !keybinding.is_public };
                                }
                                return kb;
                            });
                            localStorage.setItem('keybindings', JSON.stringify(updatedKeybindings));
                        } catch (error) {
                            console.error('Failed to update keybindings in localStorage:', error);
                        }
                    }

                    this.loadKeybindings(); // Reload to update the UI
                    this.snackBar.open(
                        keybinding.is_public ? 'Keybinding is now private' : 'Keybinding is now public',
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
}
