import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild } from '@angular/core';
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
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { IconPickerComponent } from '../../icons/components/icon-picker/icon-picker.component';
import { AbilityPickerComponent, AbilitySelection } from '../components/ability-picker/ability-picker.component';
import { MacroBuilderComponent } from '../components/macro-builder/macro-builder.component';
import { MacroValidatorComponent } from '../components/macro-validator/macro-validator.component';
import { MacrosDrawerComponent } from '../components/macros-drawer/macros-drawer.component';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { takeUntil, map } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/auth/auth.service';
import { Subject, Observable, of } from 'rxjs';
import { MacroService, Macro, MacroResponse, MacroTemplate, GenerateMacroResponse } from '../services/macro.service';
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
        MatCheckboxModule,
        MatStepperModule,
        IconPickerComponent,
        AbilityPickerComponent,
        MacroValidatorComponent,
        MacrosDrawerComponent
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

    @ViewChild('stepper') stepper!: MatStepper;

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
    createMacroValidationPassed: boolean = true; // Track validation status

    // Integrated macro builder properties
    useMacroBuilder: boolean = false;
    useManualMode: boolean = false;
    macroBuilderTemplates: MacroTemplate[] = [];
    selectedMacroBuilderTemplate: MacroTemplate | null = null;
    macroBuilderSpellName: string = '';
    macroBuilderClass: string = '';
    macroBuilderSpec: string = '';
    macroBuilderHeroTalent: string = '';
    macroBuilderModifierKey: string = '';
    macroBuilderTargetModifier: string = '';
    macroBuilderKeyModifiers: string[] = [];
    macroBuilderAvailableSpecs: string[] = [];
    macroBuilderAvailableHeroTalents: string[] = [];
    macroBuilderConditionals: string[] = [];
    macroBuilderIncludeTooltip: boolean = true;
    isGeneratingMacro: boolean = false;
    showManualValidation: boolean = false; // For manual mode validation step

    // Target modifiers for macro builder
    availableTargetModifiers = [
        { value: 'player', label: 'Player (@player)', description: 'Targets yourself' },
        { value: 'target', label: 'Target (@target)', description: 'Targets your current target' },
        { value: 'mouseover', label: 'Mouseover (@mouseover)', description: 'Targets the unit your mouse is over' },
        { value: 'focus', label: 'Focus (@focus)', description: 'Targets your focus target' },
        { value: 'pet', label: 'Pet (@pet)', description: 'Targets your pet' },
        { value: 'targettarget', label: 'Target\'s Target (@targettarget)', description: 'Targets your target\'s target' },
        { value: 'cursor', label: 'Cursor (@cursor)', description: 'Targets the terrain at cursor (for ground-target spells)' },
        { value: 'arena1', label: 'Arena 1 (@arena1)', description: 'Targets arena enemy 1 (PvP)' },
        { value: 'arena2', label: 'Arena 2 (@arena2)', description: 'Targets arena enemy 2 (PvP)' },
        { value: 'arena3', label: 'Arena 3 (@arena3)', description: 'Targets arena enemy 3 (PvP)' },
        { value: 'boss1', label: 'Boss 1 (@boss1)', description: 'Targets boss 1 (PvE)' },
        { value: 'boss2', label: 'Boss 2 (@boss2)', description: 'Targets boss 2 (PvE)' },
        { value: 'boss3', label: 'Boss 3 (@boss3)', description: 'Targets boss 3 (PvE)' }
    ];

    // Conditionals for macro builder
    availableConditionals = [
        { value: 'combat', label: 'In Combat', description: 'True if you\'re in combat' },
        { value: 'nocombat', label: 'Not In Combat', description: 'True if you\'re not in combat' },
        { value: 'harm', label: 'Enemy Target', description: 'True if target is an enemy' },
        { value: 'help', label: 'Friendly Target', description: 'True if you can aid the target' },
        { value: 'dead', label: 'Dead Target', description: 'True if target is dead' },
        { value: 'nodead', label: 'Alive Target', description: 'True if target is alive' },
        { value: 'exists', label: 'Target Exists', description: 'True if target exists' },
        { value: 'mounted', label: 'Mounted', description: 'True if you are mounted' },
        { value: 'flying', label: 'Flying', description: 'True if you are flying' },
        { value: 'flyable', label: 'Flyable Area', description: 'True if you can fly here' },
        { value: 'advflyable', label: 'Skyride Area', description: 'True if you can skyride here' },
        { value: 'swimming', label: 'Swimming', description: 'True if you are swimming' },
        { value: 'indoors', label: 'Indoors', description: 'True if you are indoors' },
        { value: 'outdoors', label: 'Outdoors', description: 'True if you are outdoors' },
        { value: 'channeling', label: 'Channeling', description: 'True if channeling a spell' },
        { value: 'resting', label: 'Resting', description: 'True if in a rested area' },
        { value: 'pet', label: 'Has Pet', description: 'True if you have a pet' },
        { value: 'group', label: 'In Group', description: 'True if in a party or raid' },
        { value: 'group:party', label: 'In Party', description: 'True if in a party' },
        { value: 'group:raid', label: 'In Raid', description: 'True if in a raid' },
        { value: 'pvpcombat', label: 'PvP Combat', description: 'True if you can use PvP talents' },
        { value: 'petbattle', label: 'Pet Battle', description: 'True if in a pet battle' }
    ];

    // Key modifiers for macro builder
    availableKeyModifiers = [
        { value: 'shift', label: 'Shift Key', description: 'Hold Shift when pressing the macro' },
        { value: 'alt', label: 'Alt Key', description: 'Hold Alt when pressing the macro' },
        { value: 'ctrl', label: 'Ctrl Key', description: 'Hold Ctrl when pressing the macro' }
    ];

    // Classes for macro builder
    classes = [
        { value: 'deathknight', label: 'Death Knight' },
        { value: 'demonhunter', label: 'Demon Hunter' },
        { value: 'druid', label: 'Druid' },
        { value: 'evoker', label: 'Evoker' },
        { value: 'hunter', label: 'Hunter' },
        { value: 'mage', label: 'Mage' },
        { value: 'monk', label: 'Monk' },
        { value: 'paladin', label: 'Paladin' },
        { value: 'priest', label: 'Priest' },
        { value: 'rogue', label: 'Rogue' },
        { value: 'shaman', label: 'Shaman' },
        { value: 'warlock', label: 'Warlock' },
        { value: 'warrior', label: 'Warrior' }
    ];

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
                this.loadMacroBuilderTemplates();

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

    onMacroSelectedFromDrawer(macro: ExpandableMacro): void {
        this.selectMacro(macro);
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

                // Emit event to notify parent components (like macro drawer) to refresh
                this.macroCreated.emit(createdMacro);

                // Reload the list and then auto-select the newly created macro
                this.macroService.getMyMacros().subscribe({
                    next: (macrosResponse) => {
                        this.macros = (macrosResponse.macros || []).map(macro => ({
                            ...macro,
                            isExpanded: false,
                            isEditing: false,
                            selectedIcon: this.getIconFromMacro(macro)
                        }));

                        // Auto-select the newly created macro
                        if (createdMacro) {
                            const newMacro = this.macros.find(m => m.id === createdMacro.id);
                            if (newMacro) {
                                this.selectMacro(newMacro);
                            }
                        }
                    },
                    error: (error) => {
                        console.error('Error reloading macros after create:', error);
                    }
                });
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
        this.createMacroValidationPassed = true;

        // Reset macro builder state
        this.useMacroBuilder = false;
        this.useManualMode = false;
        this.selectedMacroBuilderTemplate = null;
        this.macroBuilderSpellName = '';
        this.macroBuilderClass = '';
        this.macroBuilderSpec = '';
        this.macroBuilderHeroTalent = '';
        this.macroBuilderModifierKey = '';
        this.macroBuilderTargetModifier = '';
        this.macroBuilderKeyModifiers = [];
        this.macroBuilderConditionals = [];
        this.macroBuilderIncludeTooltip = true;
        this.macroBuilderAvailableSpecs = [];
        this.macroBuilderAvailableHeroTalents = [];
        this.isGeneratingMacro = false;
        this.showManualValidation = false;
    }

    selectManualMode(): void {
        this.useManualMode = true;
        this.useMacroBuilder = false;
    }

    selectGenerateMode(): void {
        this.useMacroBuilder = true;
        this.useManualMode = false;
        // Clear any existing macro text from previous attempts
        this.createForm.patchValue({ macro_text: '' });
    }

    getConditionalLabel(value: string): string {
        return this.availableConditionals.find(c => c.value === value)?.label || value;
    }

    getKeyModifierLabel(value: string): string {
        return this.availableKeyModifiers.find(m => m.value === value)?.label || value;
    }

    getTargetModifierLabel(value: string): string {
        return this.availableTargetModifiers.find(t => t.value === value)?.label || value;
    }

    onCreateValidationChange(validation: { isValid: boolean; hasErrors: boolean }): void {
        this.createMacroValidationPassed = validation.isValid;
    }

    // Macro builder methods
    loadMacroBuilderTemplates(): void {
        this.macroService.getTemplates().subscribe({
            next: (response) => {
                this.macroBuilderTemplates = response.templates;
            },
            error: (error) => {
                console.error('Error loading macro builder templates:', error);
            }
        });
    }

    selectMacroBuilderTemplate(template: MacroTemplate): void {
        this.selectedMacroBuilderTemplate = template;

        // Automatically advance to the next step
        if (this.stepper) {
            setTimeout(() => {
                this.stepper.next();
            }, 300); // Small delay for visual feedback
        }
    }

    onMacroBuilderClassChange(): void {
        // Clear spec and hero talent when class changes
        this.macroBuilderSpec = '';
        this.macroBuilderHeroTalent = '';

        if (this.macroBuilderClass) {
            const classData = fullClasses[this.macroBuilderClass];
            if (classData && classData.specs) {
                this.macroBuilderAvailableSpecs = Object.keys(classData.specs);
            } else {
                this.macroBuilderAvailableSpecs = [];
            }
        } else {
            this.macroBuilderAvailableSpecs = [];
        }
        this.macroBuilderAvailableHeroTalents = [];
    }

    onMacroBuilderSpecChange(): void {
        // Clear hero talent when spec changes
        this.macroBuilderHeroTalent = '';

        if (this.macroBuilderClass && this.macroBuilderSpec) {
            const classData = fullClasses[this.macroBuilderClass];
            if (classData && classData.specs && classData.specs[this.macroBuilderSpec]) {
                this.macroBuilderAvailableHeroTalents = classData.specs[this.macroBuilderSpec];
            } else {
                this.macroBuilderAvailableHeroTalents = [];
            }
        } else {
            this.macroBuilderAvailableHeroTalents = [];
        }
    }

    generateMacroFromBuilder(): void {
        if (!this.createSelectedAbility?.ability) {
            return;
        }

        this.isGeneratingMacro = true;

        const customOptions: any = {
            includeTooltip: this.macroBuilderIncludeTooltip
        };

        if (this.macroBuilderTargetModifier) {
            customOptions.targetModifier = this.macroBuilderTargetModifier;
        }

        if (this.macroBuilderConditionals && this.macroBuilderConditionals.length > 0) {
            customOptions.conditionals = this.macroBuilderConditionals;
        }

        if (this.macroBuilderKeyModifiers && this.macroBuilderKeyModifiers.length > 0) {
            customOptions.keyModifiers = this.macroBuilderKeyModifiers;
        }

        const ability = this.createSelectedAbility.ability;
        const request = {
            spell_name: ability.name,
            template_type: 'custom', // Use custom template since we're building from scratch
            wow_class: this.createSelectedAbility.class || undefined,
            spec: this.createSelectedAbility.spec || undefined,
            hero_talent: this.createSelectedAbility.heroTalent || undefined,
            custom_options: customOptions
        };

        console.log('Sending macro generation request:', request);

        this.macroService.generateMacro(request).subscribe({
            next: (response) => {
                // Generate a title based on the spell name
                let generatedTitle = ability.name;

                // Add target modifier context if selected
                if (this.macroBuilderTargetModifier) {
                    const targetLabel = this.availableTargetModifiers.find(t => t.value === this.macroBuilderTargetModifier)?.label || this.macroBuilderTargetModifier;
                    generatedTitle += ` ${targetLabel}`;
                }

                // Add class/spec if available
                if (this.createSelectedAbility.spec && this.createSelectedAbility.class) {
                    const classLabel = this.classes.find(c => c.value === this.createSelectedAbility.class)?.label || this.createSelectedAbility.class;
                    generatedTitle += ` (${classLabel} - ${this.createSelectedAbility.spec})`;
                } else if (this.createSelectedAbility.class) {
                    const classLabel = this.classes.find(c => c.value === this.createSelectedAbility.class)?.label || this.createSelectedAbility.class;
                    generatedTitle += ` (${classLabel})`;
                }

                // Update the form with generated macro data
                this.createForm.patchValue({
                    name: generatedTitle,
                    macro_text: response.macro_text
                });

                // Add suggested tags if none exist
                const currentTags = this.createForm.get('tags')?.value || [];
                if (currentTags.length === 0 && response.suggested_tags) {
                    this.createForm.patchValue({
                        tags: response.suggested_tags
                    });
                }

                this.isGeneratingMacro = false;
                this.snackBar.open('Macro generated successfully!', 'Close', { duration: 3000 });

                // Automatically advance to the next step
                if (this.stepper) {
                    this.stepper.next();
                }
            },
            error: (error) => {
                console.error('Error generating macro:', error);
                this.snackBar.open('Failed to generate macro', 'Close', { duration: 3000 });
                this.isGeneratingMacro = false;
            }
        });
    }

    private generateMacroTitle(spellName: string, templateType: string, wowClass?: string, spec?: string): string {
        // Start with the spell name
        let title = spellName;

        // Add template type context
        const templateContext = this.getTemplateContext(templateType);
        if (templateContext) {
            title += ` ${templateContext}`;
        }

        // Add class/spec context if available
        if (spec && wowClass) {
            const classLabel = this.classes.find(c => c.value === wowClass)?.label || wowClass;
            title += ` (${classLabel} - ${spec})`;
        } else if (wowClass) {
            const classLabel = this.classes.find(c => c.value === wowClass)?.label || wowClass;
            title += ` (${classLabel})`;
        }

        return title;
    }

    private getTemplateContext(templateType: string): string {
        const templateContexts: { [key: string]: string } = {
            'mouseover': 'Mouseover',
            'focus': 'Focus',
            'target': 'Target',
            'self': 'Self',
            'party': 'Party',
            'raid': 'Raid',
            'arena': 'Arena',
            'pvp': 'PvP',
            'pve': 'PvE',
            'dps': 'DPS',
            'heal': 'Heal',
            'tank': 'Tank',
            'utility': 'Utility',
            'interrupt': 'Interrupt',
            'cc': 'CC',
            'buff': 'Buff',
            'debuff': 'Debuff'
        };

        return templateContexts[templateType] || '';
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
     * Open the Macro Builder dialog (for edit mode)
     */
    openMacroBuilderForEdit(): void {
        if (!this.currentSelectedMacro) return;

        const dialogRef = this.dialog.open(MacroBuilderComponent, {
            width: '900px',
            data: {
                class: this.editForm.get('class')?.value,
                selectedAbility: this.editSelectedAbility
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
