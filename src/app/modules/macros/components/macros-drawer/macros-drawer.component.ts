//Angular
import { Component, ViewEncapsulation, OnInit, OnDestroy, signal, ViewChild, EventEmitter, Output, Input, SimpleChanges, inject } from '@angular/core';
import { FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgClass, TitleCasePipe } from '@angular/common';

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
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        NgClass,
        TitleCasePipe,
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

    readonly panelOpenState = signal(false);

    @Input() refreshMacros: boolean = false;
    @Input() isAuthenticated: boolean = false;

    macros: Macro[] = [];
    filteredMacros: Macro[] = [];
    selectedMacroId: string | null = null; // To keep track of the selected macro
    @Output() macroSelected = new EventEmitter<any>();
    MAX_SIZE = 100;

    selectedClasses = new FormControl<any[]>([]);

    classList = classes;  // Use the full class data instead of just names


    filterApplied: boolean = false;
    preventAutoSelection: boolean = false;
    isLoading: boolean = false;
    private destroy$ = new Subject<void>();

    snackBar = inject(MatSnackBar);

    constructor(
        private macroService: MacroService
        // private iconService: IconService
    ) { }

    ngOnInit(): void {
        // Force refresh macros from server on component initialization
        this.forceRefreshMacros();
        this.filteredMacros = this.macros;

        this.selectedClasses.valueChanges.subscribe(() => {
            this.filterMacros();
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        // Refresh macros when refreshMacros input changes to true
        if (changes['refreshMacros'] && changes['refreshMacros'].currentValue === true) {
            this.forceRefreshMacros();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    forceRefreshMacros() {
        console.log('MacrosDrawerComponent - forceRefreshMacros');
        this.isLoading = true;

        // Load user's macros from the backend
        this.macroService.getMyMacros(1, 100) // Get first 100 macros
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    console.log('Loaded user macros:', response);
                    this.macros = response.macros || [];
                    this.applyFilter();
                    this.isLoading = false;

                    // Auto-select first macro if none selected and macros exist
                    if (this.macros.length > 0 && !this.selectedMacroId && !this.preventAutoSelection) {
                        this.selectMacro(this.macros[0]);
                    }
                },
                error: (error) => {
                    console.error('Error loading user macros:', error);
                    this.macros = [];
                    this.applyFilter();
                    this.isLoading = false;

                    this.snackBar.open('Failed to load your macros. Please try again.', 'Close', {
                        duration: 3000,
                        panelClass: ['error-snackbar']
                    });
                }
            });
    }


    filterMacros(): void {
        const selected = this.selectedClasses.value;
        if (!selected || selected.length === 0) {
            this.filteredMacros = this.macros;
            this.filterApplied = false;
            return;
        }
        this.filterApplied = true;
        this.filteredMacros = this.macros.filter(m =>
            selected.some(selectedClass => selectedClass.name === m.class)
        );
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
            this.filteredMacros = this.macros.filter(macro =>
                this.selectedClasses.value.some(selectedClass => selectedClass.name === macro.class)
            );
            console.log('MacrosDrawerComponent - filtered macros length:', this.filteredMacros.length);
            if (!this.filteredMacros.some(macro => macro.id === this.selectedMacroId)) {
                this.selectedMacroId = null;
                this.macroSelected.emit(null);
            }
        } else {
            this.filteredMacros = this.macros;
            console.log('MacrosDrawerComponent - no filter applied, filtered macros length:', this.filteredMacros.length);
        }
    }

    createMacro() {
        // Emit event to parent component to handle macro creation
        this.macroSelected.emit({ action: 'create' });
    }

    getClassDisplayName(className: string): string {
        const classInfo = this.classList.find(c => c.name === className);
        return classInfo ? classInfo.name : className;
    }


    trackByMacroId(index: number, macro: Macro): string {
        return `${index}-${macro.id}`;
    }
}
