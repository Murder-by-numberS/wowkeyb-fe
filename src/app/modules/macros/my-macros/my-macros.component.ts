import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { IconPickerComponent } from '../../icons/components/icon-picker/icon-picker.component';
import { AbilityPickerComponent, AbilitySelection } from '../components/ability-picker/ability-picker.component';
import { MacroBuilderComponent } from '../components/macro-builder/macro-builder.component';
import { MacroValidatorComponent } from '../components/macro-validator/macro-validator.component';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { takeUntil, map } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/auth/auth.service';
import { Subject, Observable, of } from 'rxjs';
import { MacroService, Macro, MacroResponse } from '../services/macro.service';
import { IconService } from '../../icons/services/icon.service';
import { Icon } from '../../icons/services/icon.service';
import { fullClasses } from 'app/core/data/classes';

// Extended Macro interface to support expandable list functionality
interface ExpandableMacro extends Macro {
    isExpanded?: boolean;
    isEditing?: boolean;
    selectedIcon?: Icon;
}

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
        MatTooltipModule,
        MatInputModule,
        MatFormFieldModule,
        MatCardModule,
        MatSelectModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatCheckboxModule,
        IconPickerComponent,
        AbilityPickerComponent,
        MacroValidatorComponent
    ]
})
export class MyMacrosComponent implements OnInit, OnChanges {
    @Input() isAuthenticated: boolean = false;
    @Input() refreshMacros: Observable<any> | null = null;
    @Input() macroSelected: boolean = false;
    @Input() selectedMacro: Macro | null = null;
    @Input() selectedMacroName: string = '';

    @Output() macroSelectedChange = new EventEmitter<Macro>();
    @Output() macroDeleted = new EventEmitter<Macro>();
    @Output() macroCreated = new EventEmitter<Macro>();

    // Component state
    macros: ExpandableMacro[] = [];
    isLoading: boolean = false;
    editForm: FormGroup;
    hasChanges: boolean = false;
    originalMacroData: any = null;
    selectedIcon: Icon | null = null;
    currentSelectedMacro: ExpandableMacro | null = null;
    isEditing: boolean = false;
    isCreating: boolean = false; // New state for create mode
    drawerOpen: boolean = true; // Drawer is open by default

    // Create macro form properties
    createForm: FormGroup;
    createSelectedIcon: Icon | null = null;
    createSelectedAbility: AbilitySelection | null = null;
    createAddTooltip: boolean = false;

    // Edit macro form properties
    editSelectedAbility: AbilitySelection | null = null;
    editAddTooltip: boolean = false;

    private destroy$ = new Subject<void>();

    constructor(
        private macroService: MacroService,
        private iconService: IconService,
        private fb: FormBuilder,
        private router: Router,
        private route: ActivatedRoute,
        private snackBar: MatSnackBar,
        private dialog: MatDialog,
        private userService: UserService,
        private authService: AuthService
    ) {
        this.editForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(500)]],
            macro_text: ['', [Validators.required, Validators.maxLength(255)]],
            class: ['', [Validators.required]],
            tags: [[]]
        });

        this.createForm = this.fb.group({
            name: ['', [Validators.required, Validators.maxLength(100)]],
            description: ['', [Validators.maxLength(500)]],
            macro_text: ['', [Validators.required, Validators.maxLength(255)]]
        });
    }

    ngOnInit(): void {
        // Check authentication status first, then load macros
        this.authService.check().pipe(
            takeUntil(this.destroy$)
        ).subscribe(authenticated => {
            console.log('MyMacrosComponent - Auth check result:', authenticated);
            this.isAuthenticated = authenticated;
            if (authenticated) {
                this.loadMacros();

                // Check if we have a macro ID in the route parameters for editing
                this.route.params.pipe(
                    takeUntil(this.destroy$)
                ).subscribe(params => {
                    if (params['id']) {
                        this.loadMacroForEdit(params['id']);
                    }
                });
            }
        });

        this.setupChangeDetection();

        // Subscribe to refresh trigger if it's an Observable
        if (this.refreshMacros) {
            this.refreshMacros.pipe(
                takeUntil(this.destroy$)
            ).subscribe(() => {
                this.loadMacros();
            });
        }
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['refreshMacros'] && !changes['refreshMacros'].firstChange) {
            this.loadMacros();
        }
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadMacros(): void {
        console.log('MyMacrosComponent - loadMacros called');
        console.log('Authentication status:', this.isAuthenticated);

        if (!this.isAuthenticated) {
            console.log('User not authenticated, skipping macro load');
            return;
        }

        this.isLoading = true;
        this.macroService.getMyMacros().subscribe({
            next: (response) => {
                console.log('MyMacrosComponent - Loaded macros response:', response);
                console.log('Number of macros:', response.macros?.length || 0);
                this.macros = (response.macros || []).map(macro => ({
                    ...macro,
                    isExpanded: false,
                    isEditing: false,
                    selectedIcon: this.getIconFromMacro(macro)
                }));
                console.log('MyMacrosComponent - Final macros array:', this.macros);
                this.isLoading = false;
            },
            error: (error) => {
                console.error('MyMacrosComponent - Error loading macros:', error);
                console.error('Error details:', error.error);
                this.snackBar.open('Failed to load macros', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    selectMacro(macro: ExpandableMacro): void {
        this.currentSelectedMacro = macro;
        this.isEditing = false;
        this.isCreating = false;
        this.editForm.reset();
        this.originalMacroData = null;
        this.hasChanges = false;

        // Reset create form if we were creating
        this.createForm.reset();
        this.createSelectedIcon = null;
        this.createSelectedAbility = null;
        this.createAddTooltip = false;

        // Reset edit ability
        this.editSelectedAbility = null;
        this.editAddTooltip = false;

        // Load icon if not already loaded
        if (!macro.selectedIcon) {
            this.loadIconForMacro(macro);
        }

        this.macroSelectedChange.emit(macro);
    }

    closePanel(): void {
        this.currentSelectedMacro = null;
        this.isEditing = false;
        this.editForm.reset();
        this.originalMacroData = null;
        this.hasChanges = false;
    }

    getIconFromMacro(macro: Macro): Icon | null {
        if (macro.icon && typeof macro.icon === 'object') {
            return macro.icon as Icon;
        }
        return null;
    }

    getMacroIconUrl(macro: ExpandableMacro): string | null {
        if (macro.selectedIcon?.cloudfrontUrl) {
            return macro.selectedIcon.cloudfrontUrl;
        }
        return null;
    }

    getSelectedIconForMacro(macro: ExpandableMacro): Icon | null {
        return macro.selectedIcon || null;
    }

    toggleMacroExpansion(macro: ExpandableMacro): void {
        macro.isExpanded = !macro.isExpanded;
        if (macro.isExpanded && !macro.selectedIcon) {
            // Load icon if not already loaded
            this.loadIconForMacro(macro);
        }
    }

    loadIconForMacro(macro: ExpandableMacro): void {
        if (macro.icon && typeof macro.icon === 'string') {
            // If icon is just an ID, we need to fetch the full icon data
            this.iconService.getIcon(macro.icon).subscribe({
                next: (icon) => {
                    macro.selectedIcon = icon;
                },
                error: (error) => {
                    console.error('Error loading icon:', error);
                }
            });
        } else if (macro.icon && typeof macro.icon === 'object') {
            macro.selectedIcon = macro.icon as Icon;
        }
    }

    onEditMacro(macro: ExpandableMacro): void {
        this.isEditing = true;

        // Load icon if not already loaded
        if (!macro.selectedIcon) {
            this.loadIconForMacro(macro);
        }

        // Load ability data if available
        // Note: ability should be an object, not just an ID string
        const abilityObject = (macro.ability && typeof macro.ability === 'object') ? macro.ability : null;

        if (abilityObject || macro.spec || macro.hero_talent) {
            this.editSelectedAbility = {
                class: macro.class,
                spec: macro.spec || undefined,
                heroTalent: macro.hero_talent || undefined,
                ability: abilityObject
            };
        } else {
            this.editSelectedAbility = null;
        }

        const macroText = macro.macro_text || macro.text || '';

        // Load tooltip preference from macro model
        this.editAddTooltip = macro.show_tooltip || false;

        // Populate form with macro data
        this.editForm.patchValue({
            name: macro.name,
            description: macro.description || '',
            macro_text: macroText,
            class: macro.class,
            tags: macro.tags || []
        });

        // Store original data for change detection
        this.originalMacroData = {
            ...macro,
            editSelectedAbility: this.editSelectedAbility,
            editAddTooltip: this.editAddTooltip
        };
        this.checkForChanges();
    }

    onCancelEdit(macro: ExpandableMacro): void {
        this.isEditing = false;
        this.editForm.reset();
        this.originalMacroData = null;
        this.hasChanges = false;
        this.editSelectedAbility = null;
        this.editAddTooltip = false;
    }

    onSaveEdit(macro: ExpandableMacro): void {
        if (this.editForm.invalid || this.isLoading) return;

        this.isLoading = true;
        const formData = this.editForm.value;

        const updateData = {
            name: formData.name,
            description: formData.description,
            text: formData.macro_text,
            class: this.editSelectedAbility?.class || formData.class,
            spec: this.editSelectedAbility?.spec || undefined,
            hero_talent: this.editSelectedAbility?.heroTalent || undefined,
            ability: this.editSelectedAbility?.ability?.id || undefined,
            show_tooltip: this.editAddTooltip,
            tags: formData.tags,
            is_public: macro.is_public,
            icon: macro.selectedIcon?._id || null
        };

        this.macroService.updateMacro(macro.id, updateData).subscribe({
            next: (response: any) => {
                const updatedMacro = response.macro || response;

                // Update the macro in the list
                const index = this.macros.findIndex(m => m.id === macro.id);
                if (index !== -1) {
                    this.macros[index] = {
                        ...this.macros[index],
                        ...updatedMacro,
                        selectedIcon: updatedMacro.icon || null
                    };
                }

                // Update the selected macro if it's the one being edited
                if (this.currentSelectedMacro && this.currentSelectedMacro.id === macro.id) {
                    this.currentSelectedMacro = {
                        ...this.currentSelectedMacro,
                        ...updatedMacro,
                        selectedIcon: updatedMacro.icon || null
                    };
                }

                this.snackBar.open('Macro updated successfully', 'Close', { duration: 3000 });
                this.isLoading = false;
                this.isEditing = false;
                this.hasChanges = false;
                this.originalMacroData = null;
                this.editSelectedAbility = null;
                this.editAddTooltip = false;
            },
            error: (error) => {
                console.error('Error updating macro:', error);
                this.snackBar.open('Failed to update macro', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    onIconSelected(icon: Icon, macro: ExpandableMacro): void {
        macro.selectedIcon = icon;
        this.checkForChanges();
    }

    onIconCleared(macro: ExpandableMacro): void {
        macro.selectedIcon = null;
        this.checkForChanges();
    }

    onEditAbilitySelected(ability: AbilitySelection): void {
        this.editSelectedAbility = ability;

        // Update class selection based on ability
        if (ability.class) {
            this.editForm.patchValue({ class: ability.class });
        }

        // Auto-add cast command to macro text if ability is selected
        if (ability.ability) {
            this.updateEditMacroTextWithAbility();
        }

        this.checkForChanges();
    }

    onEditTooltipChanged(checked: boolean): void {
        console.log('Edit tooltip changed:', checked);
        this.editAddTooltip = checked;

        // Update macro text based on tooltip checkbox state
        if (this.editSelectedAbility?.ability) {
            this.updateEditMacroTextWithAbility();
            console.log('Updated edit macro text:', this.editForm.get('macro_text')?.value);
        }

        this.checkForChanges();
    }

    private updateEditMacroTextWithAbility(): void {
        if (!this.editSelectedAbility?.ability) return;

        const abilityName = this.editSelectedAbility.ability.name;
        const tooltipCommand = `#showtooltip ${abilityName}`;
        const castCommand = `/cast ${abilityName}`;
        const currentText = this.editForm.get('macro_text')?.value || '';

        // Remove existing tooltip and cast commands for this ability
        let newText = currentText
            .replace(new RegExp(`\\n?${this.escapeRegExp(tooltipCommand)}\\n?`, 'g'), '')
            .replace(new RegExp(`\\n?${this.escapeRegExp(castCommand)}\\n?`, 'g'), '')
            .trim();

        // Add the commands based on tooltip checkbox
        if (this.editAddTooltip) {
            const commands = `${tooltipCommand}\n${castCommand}`;
            newText = newText ? `${newText}\n${commands}` : commands;
        } else {
            newText = newText ? `${newText}\n${castCommand}` : castCommand;
        }

        this.editForm.get('macro_text')?.setValue(newText);
    }

    onEditAbilityCleared(): void {
        // Remove tooltip and cast commands from macro text if ability was previously selected
        if (this.editSelectedAbility?.ability) {
            const abilityName = this.editSelectedAbility.ability.name;
            const tooltipCommand = `#showtooltip ${abilityName}`;
            const castCommand = `/cast ${abilityName}`;
            const currentText = this.editForm.get('macro_text')?.value || '';

            // Remove both tooltip and cast commands if they exist
            const newText = currentText
                .replace(new RegExp(`\\n?${this.escapeRegExp(tooltipCommand)}\\n?`, 'g'), '')
                .replace(new RegExp(`\\n?${this.escapeRegExp(castCommand)}\\n?`, 'g'), '')
                .trim();
            this.editForm.get('macro_text')?.setValue(newText);
        }

        // Clear class selection
        this.editForm.patchValue({ class: '' });

        this.editSelectedAbility = null;
        this.editAddTooltip = false;
        this.checkForChanges();
    }

    private escapeRegExp(string: string): string {
        return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    }

    onTogglePublicInEdit(event: any, macro: ExpandableMacro): void {
        macro.is_public = event.checked;
        this.checkForChanges();
    }

    addTag(tagValue: string): void {
        if (!tagValue.trim()) return;

        const currentTags = this.editForm.get('tags')?.value || [];
        if (!currentTags.includes(tagValue.trim())) {
            const updatedTags = [...currentTags, tagValue.trim()];
            this.editForm.patchValue({ tags: updatedTags });
            this.checkForChanges();
        }
    }

    removeTag(tagToRemove: string): void {
        const currentTags = this.editForm.get('tags')?.value || [];
        const updatedTags = currentTags.filter((tag: string) => tag !== tagToRemove);
        this.editForm.patchValue({ tags: updatedTags });
        this.checkForChanges();
    }

    setupChangeDetection(): void {
        this.editForm.valueChanges.subscribe(() => {
            this.checkForChanges();
        });
    }

    checkForChanges(): void {
        if (!this.originalMacroData) {
            this.hasChanges = false;
            return;
        }

        const currentFormData = this.editForm.value;
        const currentIcon = this.macros.find(m => m.isEditing)?.selectedIcon?._id || null;
        const originalIcon = this.originalMacroData.selectedIcon?._id || null;

        const hasFormChanges = JSON.stringify(currentFormData) !== JSON.stringify({
            name: this.originalMacroData.name,
            description: this.originalMacroData.description || '',
            macro_text: this.originalMacroData.macro_text || this.originalMacroData.text || '',
            class: this.originalMacroData.class,
            tags: this.originalMacroData.tags || []
        });

        const hasIconChanges = currentIcon !== originalIcon;
        const hasPublicChanges = this.currentSelectedMacro?.is_public !== this.originalMacroData.is_public;

        // Check for ability changes
        const hasAbilityChanges = JSON.stringify(this.editSelectedAbility) !==
            JSON.stringify(this.originalMacroData.editSelectedAbility);

        // Check for tooltip changes
        const hasTooltipChanges = this.editAddTooltip !== this.originalMacroData.editAddTooltip;

        this.hasChanges = hasFormChanges || hasIconChanges || hasPublicChanges || hasAbilityChanges || hasTooltipChanges;
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

    formatMacroText(text: string): string {
        return text || 'No macro text provided';
    }

    // Methods for parent component compatibility
    onDeleteMacro(): void {
        if (!this.currentSelectedMacro) return;

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: {
                title: 'Delete Macro',
                message: `Are you sure you want to delete "${this.currentSelectedMacro.name}"?`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.macroService.deleteMacro(this.currentSelectedMacro!.id).subscribe({
                    next: () => {
                        this.snackBar.open('Macro deleted successfully', 'Close', { duration: 3000 });
                        this.closePanel(); // Close the panel
                        this.loadMacros(); // Reload the list
                        this.macroDeleted.emit(this.currentSelectedMacro!);
                    },
                    error: (error) => {
                        console.error('Error deleting macro:', error);
                        this.snackBar.open('Failed to delete macro', 'Close', { duration: 3000 });
                    }
                });
            }
        });
    }

    onDuplicateMacro(): void {
        if (!this.currentSelectedMacro) return;

        const duplicateData = {
            name: `${this.currentSelectedMacro.name} (Copy)`,
            description: this.currentSelectedMacro.description,
            macro_text: this.currentSelectedMacro.macro_text || this.currentSelectedMacro.text,
            class: this.currentSelectedMacro.class,
            spec: this.currentSelectedMacro.spec,
            hero_talent: this.currentSelectedMacro.hero_talent,
            ability: typeof this.currentSelectedMacro.ability === 'object' ?
                (this.currentSelectedMacro.ability as any)?._id :
                this.currentSelectedMacro.ability,
            show_tooltip: this.currentSelectedMacro.show_tooltip || false,
            tags: this.currentSelectedMacro.tags || [],
            is_public: false, // Duplicates are private by default
            icon: this.currentSelectedMacro.selectedIcon?._id || null
        };

        this.macroService.createMacro(duplicateData).subscribe({
            next: (response) => {
                this.snackBar.open('Macro duplicated successfully', 'Close', { duration: 3000 });
                this.loadMacros(); // Reload the list
            },
            error: (error) => {
                console.error('Error duplicating macro:', error);
                this.snackBar.open('Failed to duplicate macro', 'Close', { duration: 3000 });
            }
        });
    }

    onShareMacro(): void {
        if (!this.currentSelectedMacro) return;

        // Make the macro public
        const updateData = {
            is_public: true
        };

        this.macroService.updateMacro(this.currentSelectedMacro.id, updateData).subscribe({
            next: () => {
                this.currentSelectedMacro!.is_public = true;
                // Update in the list as well
                const index = this.macros.findIndex(m => m.id === this.currentSelectedMacro!.id);
                if (index !== -1) {
                    this.macros[index].is_public = true;
                }
                this.snackBar.open('Macro is now public and can be shared!', 'Close', { duration: 3000 });
            },
            error: (error) => {
                console.error('Error sharing macro:', error);
                this.snackBar.open('Failed to share macro', 'Close', { duration: 3000 });
            }
        });
    }

    toggleDrawer(): void {
        this.drawerOpen = !this.drawerOpen;
    }

    // Create macro methods
    onCreateNewMacro(): void {
        this.isCreating = true;
        this.isEditing = false;
        this.currentSelectedMacro = null;
        this.resetCreateForm();
    }

    onCancelCreate(): void {
        this.isCreating = false;
        this.resetCreateForm();
    }

    onSaveCreate(): void {
        if (this.createForm.invalid || this.isLoading) return;

        this.isLoading = true;
        const formData = this.createForm.value;

        const createData = {
            name: formData.name,
            description: formData.description,
            macro_text: formData.macro_text,
            class: this.createSelectedAbility?.class || undefined,
            spec: this.createSelectedAbility?.spec || undefined,
            hero_talent: this.createSelectedAbility?.heroTalent || undefined,
            ability: this.createSelectedAbility?.ability?.id || undefined,
            show_tooltip: this.createAddTooltip,
            icon: this.createSelectedIcon?._id || undefined,
            is_public: false
        };

        this.macroService.createMacro(createData).subscribe({
            next: (response: any) => {
                const createdMacro = response.macro || response;
                this.snackBar.open('Macro created successfully!', 'Close', { duration: 3000 });
                this.isLoading = false;
                this.isCreating = false;
                this.resetCreateForm();
                this.loadMacros(); // Reload the list

                // Emit event to notify parent components (like macro drawer) to refresh
                this.macroCreated.emit(createdMacro);

                // Auto-select the newly created macro
                if (createdMacro) {
                    const newMacro = this.macros.find(m => m.id === createdMacro.id);
                    if (newMacro) {
                        this.selectMacro(newMacro);
                    }
                }
            },
            error: (error) => {
                console.error('Error creating macro:', error);
                this.snackBar.open('Failed to create macro', 'Close', { duration: 3000 });
                this.isLoading = false;
            }
        });
    }

    onCreateIconSelected(icon: Icon): void {
        this.createSelectedIcon = icon;
    }

    onCreateIconCleared(): void {
        this.createSelectedIcon = null;
    }

    onCreateAbilitySelected(ability: AbilitySelection): void {
        this.createSelectedAbility = ability;

        // Auto-add cast command to macro text if ability is selected
        if (ability.ability) {
            this.updateCreateMacroTextWithAbility();
        }
    }

    onCreateTooltipChanged(checked: boolean): void {
        console.log('Create tooltip changed:', checked);
        this.createAddTooltip = checked;

        // Update macro text based on tooltip checkbox state
        if (this.createSelectedAbility?.ability) {
            this.updateCreateMacroTextWithAbility();
            console.log('Updated create macro text:', this.createForm.get('macro_text')?.value);
        }
    }

    private updateCreateMacroTextWithAbility(): void {
        if (!this.createSelectedAbility?.ability) return;

        const abilityName = this.createSelectedAbility.ability.name;
        const tooltipCommand = `#showtooltip ${abilityName}`;
        const castCommand = `/cast ${abilityName}`;
        const currentText = this.createForm.get('macro_text')?.value || '';

        // Remove existing tooltip and cast commands for this ability
        let newText = currentText
            .replace(new RegExp(`\\n?${this.escapeRegExp(tooltipCommand)}\\n?`, 'g'), '')
            .replace(new RegExp(`\\n?${this.escapeRegExp(castCommand)}\\n?`, 'g'), '')
            .trim();

        // Add the commands based on tooltip checkbox
        if (this.createAddTooltip) {
            const commands = `${tooltipCommand}\n${castCommand}`;
            newText = newText ? `${newText}\n${commands}` : commands;
        } else {
            newText = newText ? `${newText}\n${castCommand}` : castCommand;
        }

        this.createForm.get('macro_text')?.setValue(newText);
    }

    onCreateAbilityCleared(): void {
        // Remove cast and tooltip commands from macro text if ability is cleared
        if (this.createSelectedAbility?.ability) {
            const abilityName = this.createSelectedAbility.ability.name;
            const tooltipCommand = `#showtooltip ${abilityName}`;
            const castCommand = `/cast ${abilityName}`;
            const currentText = this.createForm.get('macro_text')?.value || '';

            // Remove both tooltip and cast commands if they exist
            const newText = currentText
                .replace(new RegExp(`\\n?${this.escapeRegExp(tooltipCommand)}\\n?`, 'g'), '')
                .replace(new RegExp(`\\n?${this.escapeRegExp(castCommand)}\\n?`, 'g'), '')
                .trim();
            this.createForm.get('macro_text')?.setValue(newText);
        }

        this.createSelectedAbility = null;
        this.createAddTooltip = false;
    }


    private resetCreateForm(): void {
        this.createForm.reset();
        this.createSelectedIcon = null;
        this.createSelectedAbility = null;
        this.createAddTooltip = false;
    }

    private loadMacroForEdit(macroId: string): void {
        // Find the macro in the loaded macros list
        const macro = this.macros.find(m => m.id === macroId);
        if (macro) {
            this.selectMacro(macro);
            // Automatically enter edit mode
            this.onEditMacro(macro);
        } else {
            // If macro not found in the list, fetch it individually
            this.macroService.getMacro(macroId).subscribe({
                next: (fetchedMacro) => {
                    // Add the macro to the list if it's not already there
                    const existingIndex = this.macros.findIndex(m => m.id === macroId);
                    if (existingIndex === -1) {
                        this.macros.push(fetchedMacro as ExpandableMacro);
                    }
                    this.selectMacro(fetchedMacro as ExpandableMacro);
                    this.onEditMacro(fetchedMacro as ExpandableMacro);
                },
                error: (error) => {
                    console.error('Error loading macro for edit:', error);
                    this.snackBar.open('Error loading macro for editing', 'Close', { duration: 3000 });
                }
            });
        }
    }

    /**
     * Open the Macro Builder dialog (for create mode)
     */
    openMacroBuilderForCreate(): void {
        const dialogRef = this.dialog.open(MacroBuilderComponent, {
            width: '900px',
            data: {
                class: this.createForm.get('class')?.value,
                spellName: this.createSelectedAbility?.ability?.name || ''
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Update the form with generated macro
                this.createForm.patchValue({
                    macro_text: result.macroText
                });

                // Add suggested tags if none exist
                const currentTags = this.createForm.get('tags')?.value || [];
                if (currentTags.length === 0 && result.tags) {
                    this.createForm.patchValue({
                        tags: result.tags
                    });
                }

                this.snackBar.open('Macro generated successfully!', 'Close', { duration: 3000 });
            }
        });
    }

    /**
     * Open the Macro Builder dialog (for edit mode)
     */
    openMacroBuilderForEdit(): void {
        if (!this.currentSelectedMacro) return;

        const dialogRef = this.dialog.open(MacroBuilderComponent, {
            width: '900px',
            data: {
                class: this.editForm.get('class')?.value,
                spellName: this.editSelectedAbility?.ability?.name || ''
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Update the form with generated macro
                this.editForm.patchValue({
                    macro_text: result.macroText
                });

                // Mark form as touched to enable save button
                this.editForm.markAsDirty();
                this.hasChanges = true;

                this.snackBar.open('Macro generated successfully!', 'Close', { duration: 3000 });
            }
        });
    }
}
