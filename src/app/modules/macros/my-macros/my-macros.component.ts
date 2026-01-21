import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges, ViewChild, ViewEncapsulation } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatAccordion } from '@angular/material/expansion';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatStepperModule, MatStepper } from '@angular/material/stepper';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { IconPickerComponent } from '../../icons/components/icon-picker/icon-picker.component';
import { AbilityPickerComponent, AbilitySelection } from '../components/ability-picker/ability-picker.component';
import { MacroBuilderComponent } from '../components/macro-builder/macro-builder.component';
import { MacroValidatorComponent } from '../components/macro-validator/macro-validator.component';
import { MacrosDrawerComponent } from '../components/macros-drawer/macros-drawer.component';
import { UploadMacroFileDialogComponent } from '../components/upload-macro-file-dialog/upload-macro-file-dialog.component';
import { ExportMacroFileDialogComponent } from '../components/export-macro-file-dialog/export-macro-file-dialog.component';
import { DownloadHistoryDialogComponent } from '../components/download-history-dialog/download-history-dialog.component';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { takeUntil, map } from 'rxjs/operators';
import { UserService } from 'app/core/user/user.service';
import { AuthService } from 'app/core/auth/auth.service';
import { Subject, Observable, of, forkJoin } from 'rxjs';
import { MacroService, Macro, MacroResponse, MacroTemplate, GenerateMacroResponse } from '../services/macro.service';
import { IconService } from '../../icons/services/icon.service';
import { Icon } from '../../icons/services/icon.service';
import { classes, fullClasses, classNames } from 'app/core/data/classes';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';
import { Ability } from 'app/core/types/ability';

// Extended Macro interface to support expandable list functionality
interface ExpandableMacro extends Macro {
    isExpanded?: boolean;
    isEditing?: boolean;
    selectedIcon?: Icon;
}

@Component({
    selector: 'my-macros',
    templateUrl: './my-macros.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    host: {
        class: 'flex flex-col flex-auto w-full h-full'
    },
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
        MatExpansionModule,
        MatAccordion,
        MatProgressSpinnerModule,
        MatCheckboxModule,
        MatStepperModule,
        MatSlideToggleModule,
        IconPickerComponent,
        AbilityPickerComponent,
        MacroValidatorComponent,
        MacrosDrawerComponent,
        RouterLink
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
    @ViewChild(MacrosDrawerComponent) macrosDrawerComponent!: MacrosDrawerComponent;

    // Component state
    macros: ExpandableMacro[] = [];
    filteredMacros: ExpandableMacro[] = [];
    isLoading: boolean = false;
    currentUserId: string | null = null;
    
    // Filtering and Sorting
    classList = classes;
    selectedClasses = new FormControl<any[]>([]);
    selectedSpecs = new FormControl<string[]>([]);
    selectedHeroTalents = new FormControl<string[]>([]);
    availableSpecs: string[] = [];
    availableHeroTalents: string[] = [];
    selectedAbilities = new FormControl<Ability[]>([]);
    availableAbilities: Ability[] = [];
    sortByControl = new FormControl<'name' | 'created_at'>('created_at');
    sortOrderControl = new FormControl<'asc' | 'desc'>('desc');
    latestGameVersion: string = '11.2.0'; // Default fallback
    
    // Sorting state
    sortBy: string = 'created_at';
    sortOrder: 'asc' | 'desc' = 'desc'; // Latest first by default
    editForm: FormGroup;
    hasChanges: boolean = false;
    originalMacroData: any = null;
    selectedIcon: Icon | null = null;
    currentSelectedMacro: ExpandableMacro | null = null;
    isEditing: boolean = false;
    isCreating: boolean = false; // New state for create mode
    drawerOpen: boolean = true; // Drawer is open by default
    isMobile: boolean = false;

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
        private abilitiesService: AbilitiesService,
        private versionCompareService: VersionCompareService,
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
            macro_text: ['', [Validators.required, Validators.maxLength(255)]],
            tags: [[]]
        });
    }

    ngOnInit(): void {
        // Check if device is mobile
        this.checkMobile();

        // Add resize listener for responsive behavior
        window.addEventListener('resize', () => this.checkMobile());

        // Fetch the latest game version
        this.versionCompareService.getLatestVersion().pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (version) => {
                this.latestGameVersion = version;
            },
            error: (err) => {
                console.error('Error fetching latest version, using fallback:', err);
                // Keep the default fallback value
            }
        });

        // Set up filter and sort listeners
        this.selectedClasses.valueChanges.subscribe(() => {
            this.updateAvailableSpecsAndHeroTalents();
            this.loadAbilitiesForSelectedClasses();
            this.applyFilter();
        });

        this.selectedSpecs.valueChanges.subscribe(() => {
            this.updateAvailableHeroTalents();
            this.applyFilter();
        });

        this.selectedHeroTalents.valueChanges.subscribe(() => {
            this.applyFilter();
        });

        this.selectedAbilities.valueChanges.subscribe(() => {
            this.applyFilter();
        });

        this.sortByControl.valueChanges.subscribe(() => {
            this.applyFilter();
        });

        this.sortOrderControl.valueChanges.subscribe(() => {
            this.applyFilter();
        });

        // Subscribe to user service to get current user ID
        this.userService.user$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(user => {
            this.currentUserId = user?._id || null;
        });

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
        // Remove resize listener
        window.removeEventListener('resize', () => this.checkMobile());
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadMacros(selectMacroId?: string, sortBy?: string, sortOrder?: 'asc' | 'desc'): void {
        console.log('MyMacrosComponent - loadMacros called');
        console.log('Authentication status:', this.isAuthenticated);

        if (!this.isAuthenticated) {
            console.log('User not authenticated, skipping macro load');
            return;
        }

        // Update sorting state if provided
        if (sortBy !== undefined) this.sortBy = sortBy;
        if (sortOrder !== undefined) this.sortOrder = sortOrder;

        this.isLoading = true;
        // Load all macros - use limit of 1000 to get everything
        this.macroService.getMyMacros(1, 1000, this.sortBy, this.sortOrder).subscribe({
            next: (response) => {
                console.log('MyMacrosComponent - Loaded macros response:', response);
                console.log('Number of macros:', response.macros?.length || 0);
                this.macros = (response.macros || []).map(macro => ({
                    ...macro,
                    isExpanded: false,
                    isEditing: false,
                    selectedIcon: this.getIconFromMacro(macro)
                }));
                    this.applyFilter();
                
                console.log('MyMacrosComponent - Final macros array:', this.macros);
                this.isLoading = false;

                // Keep current selection reference in sync after reload
                if (this.currentSelectedMacro) {
                    const updatedMacro = this.macros.find(m => m.id === this.currentSelectedMacro?.id);
                    if (updatedMacro) {
                        this.currentSelectedMacro = updatedMacro;
                    } else {
                        this.currentSelectedMacro = null;
                        this.isEditing = false;
                    }
                }

                // Auto-select a specific macro if requested (e.g., after uploads)
                if (selectMacroId) {
                    const macroToSelect = this.macros.find(m => m.id === selectMacroId);
                    if (macroToSelect) {
                        this.selectMacro(macroToSelect);
                        return;
                    }
                }

                // Auto-select first macro if none is selected and not in create mode
                if (this.macros.length > 0 && !this.currentSelectedMacro && !this.isCreating) {
                    // Check if there's a route parameter with macro ID
                    this.route.params.pipe(
                        takeUntil(this.destroy$)
                    ).subscribe(params => {
                        if (!params['id']) {
                            // No specific macro in route, select the first one
                            this.selectMacro(this.macros[0]);

                            // Update drawer selection after a short delay to ensure ViewChild is initialized
                            setTimeout(() => {
                                if (this.macrosDrawerComponent) {
                                    this.macrosDrawerComponent.setSelectedMacro(this.macros[0]);
                                }
                            }, 0);
                        }
                    });
                }
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

        // Update drawer selection
        if (this.macrosDrawerComponent) {
            this.macrosDrawerComponent.setSelectedMacro(macro);
        }

        this.macroSelectedChange.emit(macro);
    }

    onMacroSelectedFromDrawer(macro: ExpandableMacro): void {
        // Handle null case when macro is cleared due to filtering
        if (!macro) {
            this.currentSelectedMacro = null;
            this.isEditing = false;
            this.isCreating = false;
            return;
        }

        this.selectMacro(macro);

        // Close drawer on mobile after selecting a macro
        if (this.isMobile) {
            this.drawerOpen = false;
        }
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

        // Load tooltip preference - check both the model and the macro text
        // This handles cases where show_tooltip might not be set in the DB but exists in the text
        const hasTooltipInText = macroText.includes('#showtooltip');
        this.editAddTooltip = macro.show_tooltip || hasTooltipInText;

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
            icon: macro.selectedIcon?._id || undefined
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
        const currentText = this.editForm.get('macro_text')?.value || '';

        // In edit mode, only manage the #showtooltip line
        // Don't touch /cast commands as they might have modifiers/conditionals
        let lines = currentText.split('\n');

        // Remove any existing #showtooltip lines
        lines = lines.filter(line => !line.trim().startsWith('#showtooltip'));

        // Add #showtooltip at the beginning if checkbox is checked
        if (this.editAddTooltip) {
            lines.unshift(tooltipCommand);
        }

        const newText = lines.join('\n').trim();
        this.editForm.get('macro_text')?.setValue(newText);
    }

    onEditAbilityCleared(): void {
        // Remove tooltip command from macro text if ability was previously selected
        // Don't touch /cast commands as users might have complex macros with modifiers
        if (this.editSelectedAbility?.ability) {
            const currentText = this.editForm.get('macro_text')?.value || '';
            let lines = currentText.split('\n');

            // Remove any existing #showtooltip lines
            lines = lines.filter(line => !line.trim().startsWith('#showtooltip'));

            const newText = lines.join('\n').trim();
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

    onTogglePublicChange(): void {
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

    addCreateTag(tagValue: string): void {
        if (!tagValue.trim()) return;

        const currentTags = this.createForm.get('tags')?.value || [];
        if (!currentTags.includes(tagValue.trim().toLowerCase())) {
            const updatedTags = [...currentTags, tagValue.trim().toLowerCase()];
            this.createForm.patchValue({ tags: updatedTags });
        }
    }

    removeCreateTag(tagToRemove: string): void {
        const currentTags = this.createForm.get('tags')?.value || [];
        const updatedTags = currentTags.filter((tag: string) => tag !== tagToRemove);
        this.createForm.patchValue({ tags: updatedTags });
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


    updateAvailableSpecsAndHeroTalents(): void {
        const selectedClasses = this.selectedClasses.value || [];
        if (selectedClasses.length === 0) {
            this.availableSpecs = [];
            this.availableHeroTalents = [];
            this.selectedSpecs.setValue([], { emitEvent: false });
            this.selectedHeroTalents.setValue([], { emitEvent: false });
            return;
        }

        const allSpecs = new Set<string>();
        const allHeroTalents = new Set<string>();

        selectedClasses.forEach((selectedClass: any) => {
            const className = selectedClass.name?.toLowerCase().replace(/\s+/g, '');
            const classData = fullClasses[className as keyof typeof fullClasses];
            if (classData && classData.specs) {
                Object.keys(classData.specs).forEach(spec => {
                    allSpecs.add(spec);
                    const specKey = spec as keyof typeof classData.specs;
                    const heroTalents = classData.specs[specKey] as string[] | undefined;
                    if (heroTalents && Array.isArray(heroTalents)) {
                        heroTalents.forEach((ht: string) => allHeroTalents.add(ht));
                    }
                });
            }
        });

        this.availableSpecs = Array.from(allSpecs).sort();
        this.availableHeroTalents = Array.from(allHeroTalents).sort();
    }

    updateAvailableHeroTalents(): void {
        const selectedClasses = this.selectedClasses.value || [];
        const selectedSpecs = this.selectedSpecs.value || [];
        
        if (selectedClasses.length === 0) {
            this.availableHeroTalents = [];
            this.selectedHeroTalents.setValue([], { emitEvent: false });
            return;
        }

        const allHeroTalents = new Set<string>();

        selectedClasses.forEach((selectedClass: any) => {
            const className = selectedClass.name?.toLowerCase().replace(/\s+/g, '');
            const classData = fullClasses[className as keyof typeof fullClasses];
            if (classData && classData.specs) {
                // If specs are selected, only include hero talents from those specs
                const specsToCheck = selectedSpecs.length > 0 ? selectedSpecs : Object.keys(classData.specs);
                specsToCheck.forEach(spec => {
                    const specKey = spec as keyof typeof classData.specs;
                    const heroTalents = classData.specs[specKey] as string[] | undefined;
                    if (heroTalents && Array.isArray(heroTalents)) {
                        heroTalents.forEach((ht: string) => allHeroTalents.add(ht));
                    }
                });
            }
        });

        this.availableHeroTalents = Array.from(allHeroTalents).sort();
        
        // Remove selected hero talents that are no longer available
        const currentSelected = this.selectedHeroTalents.value || [];
        const validSelected = currentSelected.filter(ht => allHeroTalents.has(ht));
        if (validSelected.length !== currentSelected.length) {
            this.selectedHeroTalents.setValue(validSelected, { emitEvent: false });
        }
    }

    loadAbilitiesForSelectedClasses(): void {
        const selectedClasses = this.selectedClasses.value || [];
        if (selectedClasses.length === 0) {
            this.availableAbilities = [];
            this.selectedAbilities.setValue([], { emitEvent: false });
            return;
        }

        // Fetch abilities for all selected classes
        const classNames = selectedClasses.map((c: any) => c.name?.toLowerCase().replace(/\s+/g, '')).filter(Boolean);
        if (classNames.length === 0) {
            this.availableAbilities = [];
            return;
        }

        // Fetch abilities for each class and combine
        const abilityObservables = classNames.map((className: string) => {
            const filters: any = {
                class: className,
                gameVersion: this.latestGameVersion,
                filterMode: 'inclusion',
                limit: 100
            };
            return this.abilitiesService.getAbilitiesWithFilters(filters);
        });

        forkJoin(abilityObservables).subscribe({
            next: (results) => {
                const allAbilities: Ability[] = [];
                results.forEach(result => {
                    let abilities = result;
                    if (result && typeof result === 'object' && !Array.isArray(result)) {
                        abilities = result.abilities || result.data || [];
                    }
                    if (Array.isArray(abilities)) {
                        allAbilities.push(...abilities);
                    }
                });

                // Remove duplicates by ID
                const uniqueAbilities = Array.from(new Map(allAbilities.map(a => [a.id, a])).values());
                this.availableAbilities = uniqueAbilities.sort((a, b) => a.name.localeCompare(b.name));
            },
            error: (error) => {
                console.error('Error loading abilities for filter:', error);
                this.availableAbilities = [];
            }
        });
    }

    applyFilter(): void {
        let filtered = [...this.macros];

        // Filter by selected classes (inclusion mode)
        if (this.selectedClasses.value && this.selectedClasses.value.length > 0) {
            filtered = filtered.filter(macro =>
                macro.class && this.selectedClasses.value.some((selectedClass: any) => {
                    const selectedClassName = selectedClass.name?.toLowerCase().replace(/\s+/g, '');
                    const macroClass = macro.class.toLowerCase().replace(/\s+/g, '');
                    return selectedClassName === macroClass;
                })
            );
        }

        // Filter by selected specs (inclusion mode)
        if (this.selectedSpecs.value && this.selectedSpecs.value.length > 0) {
            filtered = filtered.filter(macro =>
                macro.spec && this.selectedSpecs.value.includes(macro.spec)
            );
        }

        // Filter by selected hero talents (inclusion mode)
        if (this.selectedHeroTalents.value && this.selectedHeroTalents.value.length > 0) {
            filtered = filtered.filter(macro => {
                const macroHeroTalent = macro.hero_talent || macro.heroTalent;
                return macroHeroTalent && this.selectedHeroTalents.value.includes(macroHeroTalent);
            });
        }

        // Filter by selected abilities
        if (this.selectedAbilities.value && this.selectedAbilities.value.length > 0) {
            const selectedAbilityIds = this.selectedAbilities.value.map(a => a.id);
            filtered = filtered.filter(macro => {
                if (!macro.ability) return false;
                const macroAbilityId = typeof macro.ability === 'string' ? macro.ability : (macro.ability as any).id;
                return selectedAbilityIds.includes(macroAbilityId);
            });
        }

        // Sort based on sortBy and sortOrder
        const sortBy = this.sortByControl.value || 'created_at';
        const sortOrder = this.sortOrderControl.value || 'desc';
        
        filtered.sort((a, b) => {
            if (sortBy === 'name') {
                const nameA = (a.name || '').toLowerCase();
                const nameB = (b.name || '').toLowerCase();
                const comparison = nameA.localeCompare(nameB);
                return sortOrder === 'asc' ? comparison : -comparison;
            } else {
                // Sort by creation date
                const dateA = new Date(a.createdAt || 0).getTime();
                const dateB = new Date(b.createdAt || 0).getTime();
                return sortOrder === 'asc' ? dateA - dateB : dateB - dateA;
            }
        });

        this.filteredMacros = filtered;
    }

    getMacroIcon(macro: ExpandableMacro): string | null {
        // Check if macro has selectedIcon with cloudfrontUrl
        if (macro.selectedIcon?.cloudfrontUrl) {
            return macro.selectedIcon.cloudfrontUrl;
        }
        // Try icon from macro.icon object
        if (macro.icon && typeof macro.icon === 'object' && macro.icon !== null) {
            const icon = macro.icon as any;
            if (icon.cloudfrontUrl) {
                return icon.cloudfrontUrl;
            }
            if (icon.s3Path) {
                return `https://wowkeyb-dev-images.s3.amazonaws.com/${icon.s3Path}`;
            }
        }
        // Fallback to class icon
        const classInfo = this.classList.find(c => {
            const className = c.name?.toLowerCase().replace(/\s+/g, '');
            const macroClass = macro.class?.toLowerCase().replace(/\s+/g, '');
            return className === macroClass;
        });
        return classInfo?.icon || null;
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

    isImportedAndModified(macro: ExpandableMacro): boolean {
        if (!macro.file) return false;
        
        // Check if the macro has been modified
        // An imported macro is considered modified if:
        // 1. The description doesn't match the "Imported from..." pattern, OR
        // 2. The updatedAt timestamp is different from createdAt (indicating it was edited)
        const isModified = macro.createdAt && macro.updatedAt && 
            new Date(macro.updatedAt).getTime() > new Date(macro.createdAt).getTime();
        
        const descriptionMatchesImportPattern = macro.description && 
            macro.description.startsWith('Imported from ');
        
        return isModified || !descriptionMatchesImportPattern;
    }

    isMacroCreator(macro: ExpandableMacro): boolean {
        if (!macro || !this.currentUserId) return false;
        const macroUserId = macro.userId || (macro as any).user_id;
        return this.currentUserId === macroUserId;
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

        // Close drawer on mobile after creating new macro
        if (this.isMobile) {
            this.drawerOpen = false;
        }
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
            tags: formData.tags || [],
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

    private checkMobile(): void {
        const wasMobile = this.isMobile;
        this.isMobile = window.innerWidth < 1024; // md breakpoint (tablets and below should overlay)

        // Only change drawer state if the mobile status changed
        if (wasMobile !== this.isMobile) {
            if (this.isMobile) {
                this.drawerOpen = false;
            } else {
                this.drawerOpen = true;
            }
        }
    }

    /**
     * Open the upload macro file dialog
     */
    openUploadDialog(triggeredFromCreate: boolean = false): void {
        const dialogRef = this.dialog.open(UploadMacroFileDialogComponent, {
            width: '600px',
            disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const createdMacros = result.created_macros || [];
                const createdMacroId = createdMacros.length > 0 ? createdMacros[0].id : undefined;

                if (triggeredFromCreate && createdMacros.length > 0) {
                    this.isCreating = false;
                    this.resetCreateForm();
                }

                // Refresh macros after successful upload
                this.loadMacros(createdMacroId);
                this.snackBar.open(
                    `Imported ${result.upload.macros_created} macro(s) successfully!`,
                    'Close',
                    { duration: 3000 }
                );
            }
        });
    }

    /**
     * Open the export macro file dialog
     */
    openExportDialog(): void {
        if (this.macros.length === 0) {
            this.snackBar.open('No macros available to export', 'Close', { duration: 3000 });
            return;
        }

        const dialogRef = this.dialog.open(ExportMacroFileDialogComponent, {
            width: '800px',
            data: {
                macros: this.macros
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Export was successful
                console.log('Export completed:', result);
            }
        });
    }

    /**
     * Open the download history dialog
     */
    openDownloadHistory(): void {
        this.dialog.open(DownloadHistoryDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh'
        });
    }
}
