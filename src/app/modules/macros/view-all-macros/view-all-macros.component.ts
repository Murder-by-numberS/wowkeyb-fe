import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { takeUntil, map } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { Subject, Observable, of } from 'rxjs';
import { MacroService, Macro, MacroResponse } from '../services/macro.service';

@Component({
    selector: 'view-all-macros',
    templateUrl: './view-all-macros.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatSelectModule,
        MatChipsModule,
        MatProgressSpinnerModule
    ]
})
export class ViewAllMacrosComponent implements OnInit, OnChanges {
    @Input() macroSelected: boolean = false;
    @Input() selectedMacro: Macro | null = null;
    @Input() selectedMacroName: string = '';
    @Input() isAuthenticated: boolean = false;
    @Input() editingName: boolean = false;
    @Input() nameForm: FormGroup = this.fb.group({
        name: ['', [Validators.required, Validators.maxLength(100)]]
    });
    @Input() opened: boolean = true;
    @Input() currentMacroCount: number = 0;
    @Input() maxMacros: number = 50;

    @Output() deleteMacro = new EventEmitter<Macro>();
    @Output() shareMacro = new EventEmitter<void>();
    @Output() editName = new EventEmitter<void>();
    @Output() saveName = new EventEmitter<void>();
    @Output() cancelName = new EventEmitter<void>();
    @Output() togglePublic = new EventEmitter<void>();
    @Output() refreshChildMacros = new EventEmitter<void>();
    @Output() updateMacro = new EventEmitter<Macro>();
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() macroUpdated = new EventEmitter<Macro>();
    @Output() selectMacro = new EventEmitter<Macro>();

    canDuplicate: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Filter and search properties
    searchTerm = '';
    selectedClass = '';
    sortBy = 'name';
    isLoading = false;

    // Macro data
    allMacros: Macro[] = [];
    filteredMacros: Macro[] = [];
    totalMacros: number = 0;
    currentPage: number = 1;
    pageSize: number = 20;

    classes = [
        { name: 'deathknight', displayName: 'Death Knight', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg' },
        { name: 'demonhunter', displayName: 'Demon Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg' },
        { name: 'druid', displayName: 'Druid', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg' },
        { name: 'evoker', displayName: 'Evoker', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg' },
        { name: 'hunter', displayName: 'Hunter', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg' },
        { name: 'mage', displayName: 'Mage', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg' },
        { name: 'monk', displayName: 'Monk', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg' },
        { name: 'paladin', displayName: 'Paladin', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg' },
        { name: 'priest', displayName: 'Priest', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg' },
        { name: 'rogue', displayName: 'Rogue', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg' },
        { name: 'shaman', displayName: 'Shaman', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg' },
        { name: 'warlock', displayName: 'Warlock', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg' },
        { name: 'warrior', displayName: 'Warrior', icon: 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg' },
        { name: 'miscellaneous', displayName: 'Miscellaneous', icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg' }
    ];


    constructor(
        private fb: FormBuilder,
        private router: Router,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private _userService: UserService,
        private macroService: MacroService
    ) { }

    ngOnInit(): void {
        this.loadAllMacros();
        this.canDuplicate = this.currentMacroCount < this.maxMacros;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['currentMacroCount']) {
            this.canDuplicate = this.currentMacroCount < this.maxMacros;
        }
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    loadAllMacros(): void {
        this.isLoading = true;

        const params = {
            page: this.currentPage,
            limit: this.pageSize,
            search: this.searchTerm || undefined,
            class: this.selectedClass || undefined,
            sortBy: this.sortBy,
            sortOrder: 'desc' as const
        };

        this.macroService.getMacros(params)
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe({
                next: (response: MacroResponse) => {
                    this.allMacros = response.macros.map(macro => this.transformMacro(macro));
                    this.totalMacros = response.total;
                    this.filteredMacros = [...this.allMacros];
                    this.isLoading = false;
                },
                error: (error) => {
                    console.error('Error loading macros:', error);
                    this.snackBar.open('Failed to load macros. Please try again.', 'Close', {
                        duration: 3000,
                        panelClass: ['error-snackbar']
                    });
                    this.isLoading = false;
                    // Fallback to empty array
                    this.allMacros = [];
                    this.filteredMacros = [];
                }
            });
    }


    filterMacros(): void {
        // Since we're using server-side filtering, just reload the data
        this.loadAllMacros();
    }

    onSearchChange(): void {
        this.filterMacros();
    }

    onClassChange(): void {
        this.filterMacros();
    }

    onCategoryChange(): void {
        this.filterMacros();
    }

    onSortChange(): void {
        this.filterMacros();
    }

    selectMacroHandler(macro: Macro): void {
        this.selectMacro.emit(macro);
    }

    navigateToMacro(macro: Macro): void {
        console.log('Navigating to macro:', macro);
        if (!macro || !macro.id) {
            console.error('Invalid macro or missing id:', macro);
            return;
        }
        this.router.navigate(['/macros', macro.id]);
    }

    onCreateNewMacro(): void {
        this.router.navigate(['/macros/create']);
    }

    onDeleteMacro(): void {
        if (!this.selectedMacro) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Macro',
                message: `Are you sure you want to delete "${this.selectedMacro.name}"? This action cannot be undone.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.deleteMacro.emit(this.selectedMacro!);
            }
        });
    }

    onDuplicateMacro(): void {
        if (!this.selectedMacro) return;
        // TODO: Implement duplicate functionality
        this.snackBar.open('Duplicate functionality coming soon!', 'Close', { duration: 3000 });
    }

    onShareMacro(): void {
        if (!this.selectedMacro) return;
        this.shareMacro.emit();
    }

    onEditName(): void {
        this.editName.emit();
    }

    onSaveName(): void {
        if (this.nameForm.valid) {
            this.saveName.emit();
        }
    }

    onCancelName(): void {
        this.cancelName.emit();
    }

    onTogglePublic(): void {
        this.togglePublic.emit();
    }

    onRefreshChildMacros(): void {
        this.refreshChildMacros.emit();
    }

    onUpdateMacro(macro: Macro): void {
        this.updateMacro.emit(macro);
    }

    getClassDisplayName(className: string): string {
        const classInfo = this.classes.find(c => c.name === className);
        return classInfo ? classInfo.displayName : className;
    }


    trackByMacroId(index: number, macro: Macro): string {
        return macro.id;
    }

    /**
     * Transform API macro data to match component interface
     */
    private transformMacro(apiMacro: any): Macro {
        return {
            id: apiMacro.id,
            name: apiMacro.name,
            description: apiMacro.description || '',
            text: apiMacro.text || apiMacro.macroText || '',
            macroText: apiMacro.text || apiMacro.macroText || '',
            class: apiMacro.class || 'miscellaneous',
            spec: apiMacro.spec,
            heroTalent: apiMacro.heroTalent,
            icon: apiMacro.icon?.url || apiMacro.icon,
            tags: apiMacro.tags || [],
            isPublic: apiMacro.isPublic || false,
            createdBy: apiMacro.createdBy,
            usageCount: apiMacro.usageCount || 0,
            rating: apiMacro.rating,
            createdAt: apiMacro.createdAt || (apiMacro.created_at ? new Date(apiMacro.created_at) : new Date()),
            updatedAt: apiMacro.updatedAt || (apiMacro.updated_at ? new Date(apiMacro.updated_at) : new Date())
        };
    }
}
