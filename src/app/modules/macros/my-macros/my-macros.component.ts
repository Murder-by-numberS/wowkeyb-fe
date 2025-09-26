import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Macro } from '../components/macros-home/macros-home.component';
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

@Component({
    selector: 'my-macros',
    templateUrl: './my-macros.component.html',
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
export class MyMacrosComponent implements OnInit, OnChanges {
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
    @Output() macroUpdated = new EventEmitter<Macro>();
    @Output() selectMacro = new EventEmitter<Macro>();

    canDuplicate: boolean = false;
    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Filter and search properties
    searchTerm = '';
    selectedClass = '';
    sortBy = 'name';
    isLoading = false;

    // User's personal macros
    myMacros: Macro[] = [];
    filteredMacros: Macro[] = [];

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
        private _userService: UserService
    ) { }

    ngOnInit(): void {
        this.loadMyMacros();
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

    loadMyMacros(): void {
        this.isLoading = true;

        // TODO: Replace with actual service call to fetch user's macros from database
        // For now, initialize with empty array
        this.myMacros = [];
        this.filterMacros();
        this.isLoading = false;
    }

    filterMacros(): void {
        let filtered = [...this.myMacros];

        // Filter by search term
        if (this.searchTerm.trim()) {
            const searchLower = this.searchTerm.toLowerCase();
            filtered = filtered.filter(macro =>
                macro.name.toLowerCase().includes(searchLower) ||
                macro.description.toLowerCase().includes(searchLower) ||
                macro.tags.some(tag => tag.toLowerCase().includes(searchLower))
            );
        }

        // Filter by class
        if (this.selectedClass) {
            filtered = filtered.filter(macro => macro.class === this.selectedClass);
        }


        // Sort
        filtered.sort((a, b) => {
            switch (this.sortBy) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'createdAt':
                    return b.createdAt.getTime() - a.createdAt.getTime();
                case 'usageCount':
                    return b.usageCount - a.usageCount;
                case 'rating':
                    return (b.rating || 0) - (a.rating || 0);
                default:
                    return 0;
            }
        });

        this.filteredMacros = filtered;
    }

    onSearchChange(): void {
        this.filterMacros();
    }

    onClassChange(): void {
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
                // Remove from local array
                this.myMacros = this.myMacros.filter(m => m.id !== this.selectedMacro!.id);
                this.filterMacros();
                this.selectedMacro = null;
                this.macroSelected = false;
            }
        });
    }

    onDuplicateMacro(): void {
        if (!this.selectedMacro) return;

        // Create a duplicate with a new name
        const duplicate: Macro = {
            ...this.selectedMacro,
            id: `my_macro_${Date.now()}`,
            name: `${this.selectedMacro.name} (Copy)`,
            createdAt: new Date(),
            updatedAt: new Date()
        };

        this.myMacros.unshift(duplicate);
        this.filterMacros();
        this.snackBar.open('Macro duplicated successfully!', 'Close', { duration: 3000 });
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
}
