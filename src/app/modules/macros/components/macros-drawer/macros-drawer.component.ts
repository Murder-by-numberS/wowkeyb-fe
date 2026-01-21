//Angular
import { Component, ViewEncapsulation, OnInit, OnDestroy, EventEmitter, Output, Input, SimpleChanges, inject, ViewChild } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { CommonModule, NgClass } from '@angular/common';

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
import { MatSnackBar } from '@angular/material/snack-bar';
import { MacroService } from '../../services/macro.service';
// import { IconService } from '../../services/icon.service';
import { takeUntil, Subject } from 'rxjs';

//Types
import { Macro } from '../../services/macro.service';
import { classes } from 'app/core/data/classes';

@Component({
    selector: 'macros-drawer',
    templateUrl: './macros-drawer.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
            min-height: 0;
        }
    `],
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
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
    ]
})
export class MacrosDrawerComponent implements OnInit, OnDestroy {
    @ViewChild(MatAccordion) accordion: MatAccordion;

    @Input() refreshMacros: boolean = false;
    @Input() isAuthenticated: boolean = false;
    @Input() macros: Macro[] = [];
    @Input() sortBy: string = 'created_at';
    @Input() sortOrder: 'asc' | 'desc' = 'desc';

    filteredMacros: Macro[] = [];
    selectedMacroId: string | null = null; // To keep track of the selected macro
    @Output() macroSelected = new EventEmitter<any>();
    @Output() createNewMacro = new EventEmitter<void>();
    @Output() sortChange = new EventEmitter<{ sortBy: string; sortOrder: 'asc' | 'desc' }>();
    MAX_SIZE = 100;

    selectedClasses = new FormControl<any[]>([]);
    sortByControl = new FormControl<'name' | 'created_at'>('created_at');
    sortOrderControl = new FormControl<'asc' | 'desc'>('desc');

    classList = classes;  // Use the full class data instead of just names


    filterApplied: boolean = false;
    preventAutoSelection: boolean = false;
    isLoading: boolean = false;
    favoriteClass: string | null = null;
    private destroy$ = new Subject<void>();

    snackBar = inject(MatSnackBar);

    constructor(
        private macroService: MacroService
        // private iconService: IconService
    ) { }

    ngOnInit(): void {
        // Load favorite class from settings
        const settings = localStorage.getItem('settings');
        if (settings) {
            const parsedSettings = JSON.parse(settings);
            this.favoriteClass = parsedSettings.favoriteClass || null;
        }

        this.filteredMacros = this.sortMacros(this.macros);

        this.selectedClasses.valueChanges.subscribe(() => {
            this.filterMacros();
        });

        this.sortByControl.valueChanges.subscribe((sortBy) => {
            if (sortBy) {
                this.onSortChange(sortBy, this.sortOrderControl.value || 'desc');
            }
        });

        this.sortOrderControl.valueChanges.subscribe((sortOrder) => {
            if (sortOrder) {
                this.onSortChange(this.sortByControl.value || 'created_at', sortOrder);
            }
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Update filtered macros when macros input changes
        if (changes['macros'] && changes['macros'].currentValue) {
            this.applyFilter();
        }
        // Update sort order control when input changes
        if (changes['sortOrder'] && changes['sortOrder'].currentValue !== changes['sortOrder'].previousValue) {
            this.sortOrderControl.setValue(this.sortOrder, { emitEvent: false });
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    sortMacros(macros: Macro[]): Macro[] {
        const sortBy = this.sortByControl.value || 'created_at';
        const sortOrder = this.sortOrderControl.value || 'desc';
        
        let sorted = [...macros];
        
        // First, sort by the selected criteria
        sorted.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                const comparison = nameA.localeCompare(nameB);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                // Sort by creation date
                const dateA = new Date((a as any).createdAt || 0).getTime();
                const dateB = new Date((b as any).createdAt || 0).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        // Then, if there's a favorite class, bring those to the top while preserving the sort within each group
        if (this.favoriteClass) {
            const favoriteClassLower = this.favoriteClass.toLowerCase().replace(/\s+/g, '');
            sorted.sort((a, b) => {
                const aIsFavorite = a.class && a.class.toLowerCase().replace(/\s+/g, '') === favoriteClassLower;
                const bIsFavorite = b.class && b.class.toLowerCase().replace(/\s+/g, '') === favoriteClassLower;

                if (aIsFavorite && !bIsFavorite) return -1;
                if (!aIsFavorite && bIsFavorite) return 1;
                return 0;
            });
        }
        
        return sorted;
    }

    filterMacros(): void {
        const selected = this.selectedClasses.value;
        if (!selected || selected.length === 0) {
            this.filteredMacros = this.sortMacros(this.macros);
            this.filterApplied = false;
            return;
        }
        this.filterApplied = true;
        const filtered = this.macros.filter(m =>
            m.class && selected.some(selectedClass =>
                selectedClass.name && selectedClass.name.toLowerCase().replace(/\s+/g, '') === m.class.toLowerCase().replace(/\s+/g, '')
            )
        );
        this.filteredMacros = this.sortMacros(filtered);
    }

    selectMacro(macro: any): void {
        console.log('macro selected', macro);
        console.log('macro details:', {
            id: macro.id,
            name: macro.name,
            class: macro.class,
            spec: macro.spec,
            heroTalent: macro.heroTalent
        });
        this.selectedMacroId = macro.id;
        this.macroSelected.emit(macro);
    }

    clearFilters() {
        this.selectedClasses.setValue([]);
        this.filterApplied = false;
    }

    // Add a method to set the selected macro from outside
    setSelectedMacro(macro: Macro): void {
        console.log('MacrosDrawerComponent - setSelectedMacro called with:', macro);
        if (macro) {
            // Prevent auto-selection while we're setting the macro
            this.preventAutoSelection = true;

            this.selectedMacroId = macro.id;
            console.log('MacrosDrawerComponent - set selectedMacroId to:', this.selectedMacroId);

            // Ensure the macro is in the filtered list
            if (!this.filteredMacros.some(m => m.id === macro.id)) {
                console.log('MacrosDrawerComponent - adding macro to filtered list');
                this.filteredMacros = [...this.filteredMacros, macro];
            }

            // Reset the flag after a short delay to allow normal auto-selection in the future
            setTimeout(() => {
                this.preventAutoSelection = false;
            }, 1000);
        }
    }

    clearSelection(): void {
        this.selectedMacroId = null;
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
            this.filteredMacros = this.macros;
        }
    }


    isSelected(macroId: string): boolean {
        return this.selectedMacroId === macroId;
    }

    getClassIcon(className: string): string {
        const classInfo = this.classList.find(c => c.name === className);
        return classInfo ? classInfo.icon : '';
    }

    getMacroIcon(macro: Macro): string {
        // If macro has a custom icon, use it
        if (macro.icon && typeof macro.icon === 'object' && macro.icon !== null) {
            const icon = macro.icon as any;
            // Use cloudfrontUrl directly if available
            if (icon.cloudfrontUrl) {
                return icon.cloudfrontUrl;
            }
            // Fallback to S3 URL if CloudFront not available
            if (icon.s3Path) {
                return `https://wowkeyb-dev-images.s3.amazonaws.com/${icon.s3Path}`;
            }
        }

        // Fallback to class icon
        return this.getClassIcon(macro.class);
    }

    applyFilter() {
        console.log('MacrosDrawerComponent - applyFilter called');
        console.log('MacrosDrawerComponent - filterApplied:', this.filterApplied);
        console.log('MacrosDrawerComponent - selectedClasses.value:', this.selectedClasses.value);
        console.log('MacrosDrawerComponent - macros length:', this.macros.length);

        if (this.filterApplied && this.selectedClasses.value?.length > 0) {
            const filtered = this.macros.filter(macro =>
                macro.class && this.selectedClasses.value.some(selectedClass =>
                    selectedClass.name && selectedClass.name.toLowerCase().replace(/\s+/g, '') === macro.class.toLowerCase().replace(/\s+/g, '')
                )
            );
            this.filteredMacros = this.sortMacros(filtered);
            console.log('MacrosDrawerComponent - filtered macros length:', this.filteredMacros.length);
            if (!this.filteredMacros.some(macro => macro.id === this.selectedMacroId)) {
                this.selectedMacroId = null;
                this.macroSelected.emit(null);
            }
        } else {
            this.filteredMacros = this.sortMacros(this.macros);
            console.log('MacrosDrawerComponent - no filter applied, filtered macros length:', this.filteredMacros.length);
        }
    }

    createMacro() {
        // Emit event to parent component to handle macro creation
        this.macroSelected.emit({ action: 'create' });
    }

    getClassDisplayName(className: string): string {
        const classNames: { [key: string]: string } = {
            'deathknight': 'Death Knight',
            'demonhunter': 'Demon Hunter',
            'druid': 'Druid',
            'evoker': 'Evoker',
            'hunter': 'Hunter',
            'mage': 'Mage',
            'monk': 'Monk',
            'paladin': 'Paladin',
            'priest': 'Priest',
            'rogue': 'Rogue',
            'shaman': 'Shaman',
            'warlock': 'Warlock',
            'warrior': 'Warrior',
            'miscellaneous': 'Miscellaneous'
        };
        return classNames[className] || className;
    }

    onSortChange(sortBy: string, sortOrder: 'asc' | 'desc'): void {
        this.sortChange.emit({ sortBy, sortOrder });
    }


    onCreateNewMacro(): void {
        this.createNewMacro.emit();
    }

    trackByMacroId(index: number, macro: Macro): string {
        return `${index}-${macro.id}`;
    }
}
