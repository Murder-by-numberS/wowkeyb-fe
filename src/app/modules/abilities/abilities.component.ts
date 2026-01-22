import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSelect } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

//Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatSortModule } from '@angular/material/sort';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

//Services
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';
import { UserService } from 'app/core/user/user.service';

//Data
import { fullClasses } from 'app/core/data/classes';

//Interfaces
import { Ability } from 'app/core/types/ability';
import { User, ADMIN_ACCESS_LEVEL } from 'app/core/user/user.types';

// Components
import { EditAbilityDialogComponent, EditAbilityDialogData } from './components/edit-ability-dialog/edit-ability-dialog.component';

@Component({
    selector: 'abilities',
    templateUrl: './abilities.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDialogModule,
        MatTooltipModule,
        MatTableModule,
        MatPaginatorModule,
        MatSortModule,
        MatInputModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatSlideToggleModule,
        MatSnackBarModule
    ],
})
export class AbilitiesComponent implements OnInit, OnDestroy {

    // Admin mode properties
    isAdmin = false;
    adminModeEnabled = false;
    currentUser: User | null = null;

    // Filter properties
    selectedClass: string;
    selectedSpec: string;
    selectedHeroTalent: string;
    selectedGameVersion: string;

    // Column filter properties
    activeColumnFilters: string[] = [];
    columnFilters = {
        name: '',
        class: '',
        spec: '',
        heroTalent: '',
        description: ''
    };

    // Debounce subjects for text inputs
    private nameFilterSubject = new Subject<string>();
    private descriptionFilterSubject = new Subject<string>();

    // Available options for column filters
    availableClasses: string[] = [];
    availableSpecs: string[] = [];
    availableHeroTalents: string[] = [];

    // Data properties
    abilities: Ability[] = [];
    filteredAbilities: Ability[] = [];
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
    specs = [];
    heroTalents = [];
    gameVersions: string[] = [];
    totalAbilities: number = 0;

    // Table properties
    displayedColumns: string[] = ['icon', 'name', 'class', 'spec', 'heroTalent', 'description'];
    dataSource: Ability[] = [];

    // Pagination
    currentPage = 1; // 1-based indexing for backend compatibility
    abilitiesPerPage = 100; // 100 abilities per page

    // Infinite scroll
    displayedAbilities: Ability[] = [];
    isLoadingMore = false;
    hasMoreData = true;
    infiniteScrollPage = 1;
    infiniteScrollPageSize = 50; // Larger page size for infinite scroll

    // Mobile filters
    filtersExpanded = false;

    // Mobile detection
    isMobile = false;

    // ViewChild references for dropdowns
    @ViewChild('classSelect') classSelect: MatSelect;
    @ViewChild('specSelect') specSelect: MatSelect;
    @ViewChild('heroTalentSelect') heroTalentSelect: MatSelect;
    @ViewChild('gameVersionSelect') gameVersionSelect: MatSelect;

    /**
     * Constructor
     */
    constructor(
        private abilitiesService: AbilitiesService,
        private versionCompare: VersionCompareService,
        private dialog: MatDialog,
        private router: Router,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private userService: UserService,
        private snackBar: MatSnackBar
    ) { }

    ngOnInit(): void {
        // Check if we're on mobile
        this.checkMobile();

        // Listen for window resize to update mobile detection
        window.addEventListener('resize', () => this.checkMobile());

        // Set up debounce subscriptions for text inputs
        this.setupDebounceSubscriptions();

        // Check for admin status
        this.checkAdminStatus();

        // Check for URL parameters first
        this.route.queryParams.subscribe(params => {
            if (params['class'] || params['spec'] || params['heroTalent'] || params['gameVersion']) {
                // Load filters from URL
                this.loadFiltersFromUrl(params);
            } else {
                // Load all abilities initially
                this.loadAllAbilities();
            }
        });
    }

    /**
     * Check if current user has admin privileges
     */
    private checkAdminStatus(): void {
        // First check localStorage for current user
        const storedUser = localStorage.getItem('currentUser');
        if (storedUser) {
            try {
                this.currentUser = JSON.parse(storedUser);
                this.isAdmin = (this.currentUser?.access_level || 0) >= ADMIN_ACCESS_LEVEL;
                console.log('Admin status from localStorage:', this.isAdmin, 'access_level:', this.currentUser?.access_level);
            } catch (e) {
                console.error('Error parsing stored user:', e);
            }
        }

        // Also subscribe to user service for updates
        this.userService.user$.subscribe(user => {
            if (user) {
                this.currentUser = user;
                this.isAdmin = (user.access_level || 0) >= ADMIN_ACCESS_LEVEL;
                console.log('Admin status from user service:', this.isAdmin, 'access_level:', user.access_level);
            }
        });
    }

    /**
     * Toggle admin mode
     */
    toggleAdminMode(): void {
        if (!this.isAdmin) {
            this.snackBar.open('You do not have admin privileges', 'OK', { duration: 3000 });
            return;
        }
        this.adminModeEnabled = !this.adminModeEnabled;
        this.updateDisplayedColumns();

        const message = this.adminModeEnabled
            ? 'Admin mode enabled - you can now edit abilities'
            : 'Admin mode disabled';
        this.snackBar.open(message, 'OK', { duration: 2000 });
    }

    /**
     * Update displayed columns based on admin mode
     */
    private updateDisplayedColumns(): void {
        if (this.adminModeEnabled) {
            // Add actions column if not already present
            if (!this.displayedColumns.includes('actions')) {
                this.displayedColumns = [...this.displayedColumns, 'actions'];
            }
        } else {
            // Remove actions column
            this.displayedColumns = this.displayedColumns.filter(col => col !== 'actions');
        }
    }

    /**
     * Open edit dialog for an ability
     */
    editAbility(ability: Ability): void {
        if (!this.adminModeEnabled || !this.isAdmin) {
            return;
        }

        const dialogData: EditAbilityDialogData = { ability };

        const dialogRef = this.dialog.open(EditAbilityDialogComponent, {
            width: '600px',
            maxHeight: '90vh',
            data: dialogData
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                // Update the ability in the local arrays
                this.updateAbilityInArrays(result);
                this.snackBar.open('Ability updated successfully!', 'OK', { duration: 3000 });
            }
        });
    }

    /**
     * Update ability in local arrays after edit
     */
    private updateAbilityInArrays(updatedAbility: Ability): void {
        // Update in abilities array
        const abilitiesIndex = this.abilities.findIndex(a => a.id === updatedAbility.id);
        if (abilitiesIndex !== -1) {
            this.abilities[abilitiesIndex] = { ...this.abilities[abilitiesIndex], ...updatedAbility };
        }

        // Update in filteredAbilities array
        const filteredIndex = this.filteredAbilities.findIndex(a => a.id === updatedAbility.id);
        if (filteredIndex !== -1) {
            this.filteredAbilities[filteredIndex] = { ...this.filteredAbilities[filteredIndex], ...updatedAbility };
        }

        // Update in displayedAbilities array (for mobile infinite scroll)
        const displayedIndex = this.displayedAbilities.findIndex(a => a.id === updatedAbility.id);
        if (displayedIndex !== -1) {
            this.displayedAbilities[displayedIndex] = { ...this.displayedAbilities[displayedIndex], ...updatedAbility };
        }

        // Update dataSource
        this.updateTableData();
    }

    /**
     * Check if we're on mobile device
     */
    checkMobile() {
        this.isMobile = window.innerWidth < 1024;
        console.log('Is mobile:', this.isMobile);
    }

    ngOnDestroy(): void {
        // Complete the debounce subjects to prevent memory leaks
        this.nameFilterSubject.complete();
        this.descriptionFilterSubject.complete();

        // Remove resize event listener
        window.removeEventListener('resize', () => this.checkMobile());
    }

    /**
     * Set up debounce subscriptions for text inputs
     */
    private setupDebounceSubscriptions() {
        // Debounce name filter with 300ms delay
        this.nameFilterSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.columnFilters.name = value;
            this.applyColumnFilters();
        });

        // Debounce description filter with 300ms delay
        this.descriptionFilterSubject.pipe(
            debounceTime(300),
            distinctUntilChanged()
        ).subscribe(value => {
            this.columnFilters.description = value;
            this.applyColumnFilters();
        });
    }

    /**
     * Load available game versions
     */
    loadGameVersions(setDefault: boolean = true) {
        // Fetch game versions from the backend
        this.versionCompare.getAllVersions().subscribe({
            next: (versions) => {
                console.log('Available game versions:', versions);
                this.gameVersions = versions;

                // Set the latest version as default only if requested
                if (setDefault && this.gameVersions.length > 0) {
                    this.selectedGameVersion = this.gameVersions[0];
                }
            },
            error: (error) => {
                console.error('Error fetching game versions:', error);
                // Fallback to static list if backend fails
                this.gameVersions = [
                    '11.1.7',
                    '11.1.0',
                    '11.0.5',
                    '11.0.2',
                    '11.0.0'
                ];
                if (setDefault) {
                    this.selectedGameVersion = this.gameVersions[0];
                }
            }
        });
    }

    /**
     * Load filters from URL parameters
     */
    loadFiltersFromUrl(params: any) {
        // Load game versions first without setting default
        this.loadGameVersions(false);

        // Set filters from URL parameters
        if (params['class']) {
            this.selectedClass = params['class'];
            // Load specs for this class
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                this.specs = Object.keys(classData.specs);
                const allHeroTalents = Object.values(classData.specs).flat();
                this.heroTalents = [...new Set(allHeroTalents)];
            } else {
                this.specs = [];
                this.heroTalents = [];
            }
        }

        if (params['spec']) {
            this.selectedSpec = params['spec'];
            // Load hero talents for this spec
            if (this.selectedClass && this.selectedSpec) {
                const classData = fullClasses[this.selectedClass];
                if (classData && classData.specs && classData.specs[this.selectedSpec]) {
                    this.heroTalents = classData.specs[this.selectedSpec];
                } else {
                    this.heroTalents = [];
                }
            }
        }

        if (params['heroTalent']) {
            this.selectedHeroTalent = params['heroTalent'];
        }

        if (params['gameVersion']) {
            this.selectedGameVersion = params['gameVersion'];
        } else {
            // If no gameVersion in URL, set to latest
            this.loadGameVersions(true);
        }

        // Fetch abilities with the loaded filters
        this.fetchAbilities();
    }

    /**
 * Update URL with current filters
 */
    updateUrl() {
        const queryParams: any = {};

        if (this.selectedClass) {
            queryParams.class = this.selectedClass;
        }
        if (this.selectedSpec) {
            queryParams.spec = this.selectedSpec;
        }
        if (this.selectedHeroTalent) {
            queryParams.heroTalent = this.selectedHeroTalent;
        }
        if (this.selectedGameVersion) {
            queryParams.gameVersion = this.selectedGameVersion;
        }

        this.router.navigate([], {
            relativeTo: this.route,
            queryParams: queryParams
        });
    }

    /**
     * Load all abilities without filters
     */
    loadAllAbilities() {
        // Start with no filters to show all abilities
        this.selectedClass = undefined;
        this.selectedSpec = undefined;
        this.selectedHeroTalent = undefined;
        this.selectedGameVersion = undefined;
        this.specs = [];
        this.heroTalents = [];

        // Get available game versions
        this.loadGameVersions();

        // Fetch all abilities
        this.fetchAllAbilities();
    }

    /**
 * Handle class selection change
 */
    onClassChange(event: any) {
        const selectedClass = event.value;
        this.selectedClass = selectedClass;
        this.selectedSpec = undefined;
        this.selectedHeroTalent = undefined;

        if (selectedClass) {
            const classData = fullClasses[selectedClass];
            if (classData && classData.specs) {
                // Show actual specs plus an option to view all hero talents
                this.specs = Object.keys(classData.specs);
                // Get all hero talents for this class (remove duplicates)
                const allHeroTalents = Object.values(classData.specs).flat();
                this.heroTalents = [...new Set(allHeroTalents)];
            } else {
                this.specs = [];
                this.heroTalents = [];
            }
        } else {
            this.specs = [];
            this.heroTalents = [];
        }

        // Update URL and fetch abilities with current filters
        this.updateUrl();
        this.fetchAbilities();
    }

    /**
 * Handle spec selection change
 */
    onSpecChange(event: any) {
        const selectedSpec = event.value;
        this.selectedSpec = selectedSpec;
        this.selectedHeroTalent = undefined;

        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                if (selectedSpec) {
                    // Show hero talents for the selected spec
                    if (classData.specs[selectedSpec]) {
                        this.heroTalents = classData.specs[selectedSpec];
                    } else {
                        this.heroTalents = [];
                    }
                } else {
                    // Show all hero talents for the class (remove duplicates)
                    const allHeroTalents = Object.values(classData.specs).flat();
                    this.heroTalents = [...new Set(allHeroTalents)];
                }
            } else {
                this.heroTalents = [];
            }
        } else {
            this.heroTalents = [];
        }

        // Update URL and fetch abilities with current filters
        this.updateUrl();
        this.fetchAbilities();
    }

    /**
 * Handle hero talent selection change
 */
    onHeroTalentChange(event: any) {
        const selectedHeroTalent = event.value;
        this.selectedHeroTalent = selectedHeroTalent;

        // Update URL and fetch abilities with current filters
        this.updateUrl();
        this.fetchAbilities();
    }

    /**
     * Handle game version selection change
     */
    onGameVersionChange(event: any) {
        const selectedGameVersion = event.value;
        this.selectedGameVersion = selectedGameVersion;

        // Update URL and fetch abilities when game version changes since abilities may differ between versions
        this.updateUrl();
        this.fetchAbilities();
    }

    /**
     * Fetch abilities based on current filters using inclusion logic
     */
    fetchAbilities() {
        console.log('fetchAbilities called with inclusion filters:', {
            class: this.selectedClass,
            spec: this.selectedSpec,
            heroTalent: this.selectedHeroTalent,
            gameVersion: this.selectedGameVersion,
            page: this.currentPage
        });

        // If no main filters are active, use fetchAllAbilities instead
        if (!this.hasActiveMainFilters()) {
            console.log('No main filters active, calling fetchAllAbilities instead');
            this.fetchAllAbilities();
            return;
        }

        // Build filters object for inclusion-based filtering
        const filters: any = {};

        if (this.selectedGameVersion) {
            filters.gameVersion = this.selectedGameVersion;
        }
        if (this.selectedClass) {
            filters.class = this.getBackendClassName(this.selectedClass);
        }
        if (this.selectedSpec && this.selectedSpec !== 'Core' && this.selectedSpec !== 'Hero Talent') {
            filters.spec = this.getBackendSpecName(this.selectedSpec);
        }
        if (this.selectedHeroTalent && this.selectedHeroTalent !== 'Core') {
            filters.heroTalent = this.getBackendHeroTalentName(this.selectedHeroTalent);
        }

        // Set filter mode to inclusion for main filters
        filters.filterMode = 'inclusion';

        // Add pagination parameters
        filters.page = this.currentPage;
        filters.limit = this.abilitiesPerPage;

        // Call the abilities endpoint with inclusion filters and pagination
        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                // Handle response format - could be array or object with data and total
                let abilities = data;
                let total = 0;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    // If response is an object with abilities and pagination properties
                    abilities = data.abilities || data.data || [];
                    total = data.pagination?.totalCount || data.total || data.count || 0;
                } else if (Array.isArray(data)) {
                    // If response is just an array
                    abilities = data;
                    total = data.length;
                }

                // Process abilities for display (no need to remove duplicates as backend handles inclusion)
                const processedAbilities = this.processAbilitiesForDisplay(abilities);

                this.abilities = processedAbilities;
                this.filteredAbilities = processedAbilities;
                this.totalAbilities = total;
                this.updateTableData();

                // Reset infinite scroll for mobile (only if we're on mobile)
                console.log('fetchAbilities completed, isMobile:', this.isMobile, 'will reset infinite scroll:', this.isMobile);
                if (this.isMobile) {
                    this.resetInfiniteScroll();
                }
            },
            error: (err) => {
                console.error('Error loading abilities with inclusion filters:', err);
                this.abilities = [];
                this.filteredAbilities = [];
                this.totalAbilities = 0;
                this.updateTableData();
            }
        });
    }

    /**
 * Fetch all abilities across all classes
 */
    fetchAllAbilities() {
        console.log('fetchAllAbilities called');

        // Use selected game version or fallback to latest
        const gameVersion = this.selectedGameVersion || this.gameVersions[0];
        console.log('Game version for all abilities:', gameVersion);

        // Call the abilities endpoint with only game version filter (no pagination)
        console.log('🔍 AbilitiesComponent - Calling getAbilitiesWithFilters with:', {
            gameVersion,
            filterMode: 'inclusion',
            page: this.currentPage,
            limit: this.abilitiesPerPage
        });

        this.abilitiesService.getAbilitiesWithFilters({
            gameVersion,
            filterMode: 'inclusion',
            page: this.currentPage,
            limit: this.abilitiesPerPage
        }).subscribe({
            next: (data) => {
                console.log('✅ All abilities loaded successfully:', data);

                // Handle response format - could be array or object with data and total
                let abilities = data;
                let total = 0;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    // If response is an object with abilities and pagination properties
                    abilities = data.abilities || data.data || [];
                    total = data.pagination?.totalCount || data.total || data.count || 0;
                } else if (Array.isArray(data)) {
                    // If response is just an array
                    abilities = data;
                    total = data.length;
                }

                // Process abilities for display
                const processedAbilities = this.processAbilitiesForDisplay(abilities);
                console.log('Total processed abilities:', processedAbilities.length);
                console.log('Current page:', this.currentPage);
                console.log('Total abilities:', total);
                console.log('Processed abilities sample:', processedAbilities.slice(0, 3));

                this.abilities = processedAbilities;
                this.filteredAbilities = processedAbilities;
                this.totalAbilities = total;
                this.updateTableData();

                console.log('After updateTableData - dataSource length:', this.dataSource.length);
            },
            error: (err) => {
                console.error('❌ Error loading all abilities:', err);
                console.error('❌ Error details:', {
                    message: err.message,
                    status: err.status,
                    statusText: err.statusText,
                    url: err.url
                });
                this.abilities = [];
                this.filteredAbilities = [];
                this.totalAbilities = 0;
                this.updateTableData();
            }
        });
    }

    /**
     * Process abilities for display with inclusion-based filtering
     */
    private processAbilitiesForDisplay(abilities: Ability[]): Ability[] {
        // Process abilities for display - mark core abilities and format names
        const processedAbilities = abilities.map(ability => {
            const processed = { ...ability };

            // Mark core abilities based on ability type
            processed.isCore = ability.abilityType === 'class';

            // Format spec and hero talent names for display
            if (processed.spec) {
                processed.spec = this.formatSpecName(processed.spec);
            }
            if (processed.heroTalent) {
                processed.heroTalent = this.formatHeroTalentName(processed.heroTalent);
            }

            return processed;
        });

        // Sort alphabetically by name
        return processedAbilities.sort((a, b) =>
            a.name.localeCompare(b.name)
        );
    }

    /**
     * Apply column filters to the current data
     */
    applyColumnFilters() {
        // Update available options based on current column filter selections
        this.updateColumnFilterOptions();

        // If column filters are active, fetch data from backend with those filters
        if (this.hasActiveColumnFilters()) {
            this.fetchAbilitiesWithColumnFilters();
        } else {
            // If no column filters, use current data
            this.applyColumnFiltersInternal();
            this.dataSource = this.filteredAbilities;
        }
    }

    /**
     * Fetch abilities from backend with column filters applied
     */
    private fetchAbilitiesWithColumnFilters() {
        console.log('Fetching abilities with column filters:', this.columnFilters);

        // Build filters object for backend call
        const filters: any = {};

        // Add existing main filters
        if (this.selectedGameVersion) {
            filters.gameVersion = this.selectedGameVersion;
        }
        if (this.selectedClass) {
            filters.class = this.getBackendClassName(this.selectedClass);
        }
        if (this.selectedSpec && this.selectedSpec !== 'Core' && this.selectedSpec !== 'Hero Talent') {
            filters.spec = this.getBackendSpecName(this.selectedSpec);
        }
        if (this.selectedHeroTalent && this.selectedHeroTalent !== 'Core') {
            filters.heroTalent = this.getBackendHeroTalentName(this.selectedHeroTalent);
        }

        // Add column filters (separate from main filters)
        if (this.columnFilters.name) {
            filters.columnName = this.columnFilters.name;
        }
        if (this.columnFilters.class) {
            filters.columnClass = this.getBackendClassName(this.columnFilters.class);
        }
        if (this.columnFilters.spec) {
            filters.columnSpec = this.getBackendSpecName(this.columnFilters.spec);
        }
        if (this.columnFilters.heroTalent) {
            filters.columnHeroTalent = this.getBackendHeroTalentName(this.columnFilters.heroTalent);
        }
        if (this.columnFilters.description) {
            filters.columnDescription = this.columnFilters.description;
        }

        // Set filter mode to exact matching for column filters
        filters.filterMode = 'exact';

        // Add pagination parameters
        filters.page = this.currentPage;
        filters.limit = this.abilitiesPerPage;

        // Call the abilities endpoint with column filters
        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                // Handle response format
                let abilities = data;
                let total = 0;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    abilities = data.abilities || data.data || [];
                    total = data.pagination?.totalCount || data.total || data.count || 0;
                } else if (Array.isArray(data)) {
                    abilities = data;
                    total = data.length;
                }

                // Process abilities for display
                const processedAbilities = this.processAbilitiesForDisplay(abilities);

                this.abilities = processedAbilities;
                this.filteredAbilities = processedAbilities;
                this.totalAbilities = total;
                this.dataSource = this.filteredAbilities;
            },
            error: (err) => {
                console.error('Error loading abilities with column filters:', err);
                this.abilities = [];
                this.filteredAbilities = [];
                this.totalAbilities = 0;
                this.dataSource = this.filteredAbilities;
            }
        });
    }

    /**
     * Internal method to apply column filters without updating table data
     */
    private applyColumnFiltersInternal() {
        if (!this.abilities || this.abilities.length === 0) {
            this.filteredAbilities = [];
            return;
        }


        this.filteredAbilities = this.abilities.filter(ability => {
            // Name filter
            if (this.columnFilters.name &&
                !ability.name.toLowerCase().includes(this.columnFilters.name.toLowerCase())) {
                return false;
            }

            // Class filter
            if (this.columnFilters.class &&
                this.formatClassName(ability.class) !== this.columnFilters.class) {
                return false;
            }

            // Spec filter
            if (this.columnFilters.spec) {
                if (ability.abilityType !== 'spec' ||
                    ability.spec !== this.columnFilters.spec) {
                    return false;
                }
            }

            // Hero Talent filter
            if (this.columnFilters.heroTalent) {
                if (ability.abilityType !== 'hero_talent' ||
                    ability.heroTalent !== this.columnFilters.heroTalent) {
                    return false;
                }
            }

            // Description filter
            if (this.columnFilters.description &&
                !ability.description.toLowerCase().includes(this.columnFilters.description.toLowerCase())) {
                return false;
            }

            return true;
        });
    }

    /**
     * Clear a specific column filter
     */
    clearColumnFilter(column: string) {
        if (column in this.columnFilters) {
            this.columnFilters[column] = '';

            // Update available options after clearing a filter
            this.updateColumnFilterOptions();

            // If no column filters are active, reset to original data
            if (!this.hasActiveColumnFilters()) {
                this.fetchAbilities();
            } else {
                this.applyColumnFilters();
            }
        }
    }

    /**
     * Clear all column filters
     */
    clearAllColumnFilters() {
        this.columnFilters = {
            name: '',
            class: '',
            spec: '',
            heroTalent: '',
            description: ''
        };

        // Clear all active column filters
        this.activeColumnFilters = [];

        // Update available options after clearing all filters
        this.updateColumnFilterOptions();

        // Reset to original data by fetching without column filters
        this.fetchAbilities();
    }

    /**
     * Clear all filters (main filters + column filters)
     */
    clearAllFilters() {
        // Clear main filters
        this.clearFilters();
        // Clear column filters
        this.clearAllColumnFilters();
    }


    /**
     * Check if any filters are active
     */
    hasActiveFilters(): boolean {
        return !!(this.selectedClass || this.selectedSpec || this.selectedHeroTalent || this.selectedGameVersion);
    }

    /**
     * Handle column filter value change
     */
    onColumnFilterChange(column: string, value: string) {
        this.columnFilters[column] = value;

        // Update available options based on the new selection
        this.updateColumnFilterOptions();

        // Apply the filters
        this.applyColumnFilters();
    }

    /**
     * Handle debounced name filter input
     */
    onNameFilterInput(value: string) {
        this.nameFilterSubject.next(value);
    }

    /**
     * Handle debounced description filter input
     */
    onDescriptionFilterInput(value: string) {
        this.descriptionFilterSubject.next(value);
    }

    /**
     * Toggle filters visibility on mobile
     */
    toggleFilters() {
        this.filtersExpanded = !this.filtersExpanded;
    }

    /**
     * Handle click outside filters to close them on desktop
     */
    onOutsideClick(event: Event) {
        // Only close filters on desktop if clicking outside the filter card
        if (this.isMobile) return;

        const target = event.target as HTMLElement;
        const filterCard = target.closest('mat-card');

        // If click is not inside the filter card, close the filters
        if (!filterCard && this.filtersExpanded) {
            this.filtersExpanded = false;
        }
    }

    /**
     * Handle infinite scroll - load more abilities when user scrolls to bottom
     * Only works on mobile devices
     */
    onScroll(event: any) {
        // Only handle infinite scroll on mobile
        if (!this.isMobile) {
            return;
        }

        const element = event.target;
        const atBottom = element.scrollHeight - element.scrollTop === element.clientHeight;

        if (atBottom && !this.isLoadingMore && this.hasMoreData) {
            this.loadMoreAbilities();
        }
    }

    /**
     * Load more abilities for infinite scroll
     */
    loadMoreAbilities() {
        if (this.isLoadingMore || !this.hasMoreData) return;

        this.isLoadingMore = true;
        this.infiniteScrollPage++;

        // Build filters object for inclusion-based filtering
        const filters: any = {};

        if (this.selectedGameVersion) {
            filters.gameVersion = this.selectedGameVersion;
        }
        if (this.selectedClass) {
            filters.class = this.getBackendClassName(this.selectedClass);
        }
        if (this.selectedSpec && this.selectedSpec !== 'Core' && this.selectedSpec !== 'Hero Talent') {
            filters.spec = this.getBackendSpecName(this.selectedSpec);
        }
        if (this.selectedHeroTalent && this.selectedHeroTalent !== 'Core' && this.selectedHeroTalent !== 'Spec') {
            filters.heroTalent = this.getBackendHeroTalentName(this.selectedHeroTalent);
        }

        // Add pagination for infinite scroll
        filters.page = this.infiniteScrollPage;
        filters.limit = this.infiniteScrollPageSize;

        console.log('Loading more abilities with filters:', filters);

        // Call the abilities endpoint with pagination
        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                // Handle response format
                let newAbilities = data;
                let total = 0;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    newAbilities = data.abilities || data.data || [];
                    total = data.pagination?.totalCount || data.total || data.count || 0;
                } else if (Array.isArray(data)) {
                    newAbilities = data;
                    total = data.length;
                }

                // Process abilities for display
                const processedAbilities = this.processAbilitiesForDisplay(newAbilities);

                if (processedAbilities.length > 0) {
                    this.displayedAbilities = [...this.displayedAbilities, ...processedAbilities];
                }

                // Check if we have more data to load
                const totalLoaded = this.displayedAbilities.length;
                this.hasMoreData = totalLoaded < total && processedAbilities.length === this.infiniteScrollPageSize;

                this.isLoadingMore = false;
                console.log('Loaded more abilities. Total displayed:', this.displayedAbilities.length, 'Has more:', this.hasMoreData);
            },
            error: (err) => {
                console.error('Error loading more abilities:', err);
                this.isLoadingMore = false;
                this.hasMoreData = false;
            }
        });
    }

    /**
     * Reset infinite scroll when filters change
     */
    resetInfiniteScroll() {
        console.log('resetInfiniteScroll called, isMobile:', this.isMobile);
        this.infiniteScrollPage = 1;
        this.displayedAbilities = [];
        this.hasMoreData = true;
        this.isLoadingMore = false;

        // Load initial batch
        this.loadInitialAbilities();
    }

    /**
     * Load initial abilities for infinite scroll
     */
    loadInitialAbilities() {
        console.log('loadInitialAbilities called');

        // Build filters object for inclusion-based filtering
        const filters: any = {};

        if (this.selectedGameVersion) {
            filters.gameVersion = this.selectedGameVersion;
        }
        if (this.selectedClass) {
            filters.class = this.getBackendClassName(this.selectedClass);
        }
        if (this.selectedSpec && this.selectedSpec !== 'Core' && this.selectedSpec !== 'Hero Talent') {
            filters.spec = this.getBackendSpecName(this.selectedSpec);
        }
        if (this.selectedHeroTalent && this.selectedHeroTalent !== 'Core' && this.selectedHeroTalent !== 'Spec') {
            filters.heroTalent = this.getBackendHeroTalentName(this.selectedHeroTalent);
        }

        // Add pagination for infinite scroll
        filters.page = 1;
        filters.limit = this.infiniteScrollPageSize;

        console.log('Loading initial abilities with filters:', filters);

        // Call the abilities endpoint with pagination
        this.abilitiesService.getAbilitiesWithFilters(filters).subscribe({
            next: (data) => {
                // Handle response format
                let abilities = data;
                let total = 0;

                if (data && typeof data === 'object' && !Array.isArray(data)) {
                    abilities = data.abilities || data.data || [];
                    total = data.pagination?.totalCount || data.total || data.count || 0;
                } else if (Array.isArray(data)) {
                    abilities = data;
                    total = data.length;
                }

                // Process abilities for display
                const processedAbilities = this.processAbilitiesForDisplay(abilities);

                this.displayedAbilities = processedAbilities;
                this.hasMoreData = processedAbilities.length === this.infiniteScrollPageSize && processedAbilities.length < total;

                console.log('Loaded initial abilities. Count:', processedAbilities.length, 'Total available:', total, 'Has more:', this.hasMoreData);
            },
            error: (err) => {
                console.error('Error loading initial abilities:', err);
                this.displayedAbilities = [];
                this.hasMoreData = false;
            }
        });
    }

    /**
     * Toggle a specific column filter
     */
    toggleColumnFilter(column: string) {
        if (this.activeColumnFilters.includes(column)) {
            // If clicking an active column, hide the filter and clear it
            this.activeColumnFilters = this.activeColumnFilters.filter(c => c !== column);
            this.columnFilters[column] = '';
            // Reset to original data if no other column filters are active
            if (!this.hasActiveColumnFilters()) {
                this.fetchAbilities();
            } else {
                // Update options and apply remaining filters
                this.updateColumnFilterOptions();
                this.applyColumnFilters();
            }
        } else {
            // Show the filter for the clicked column
            this.activeColumnFilters.push(column);
        }
    }

    /**
     * Check if any column filters are active
     */
    hasActiveColumnFilters(): boolean {
        return this.activeColumnFilters.length > 0;
    }

    /**
     * Check if a specific column filter is active
     */
    isColumnFilterActive(column: string): boolean {
        return this.activeColumnFilters.includes(column);
    }

    /**
     * Check if any main filters are active
     */
    hasActiveMainFilters(): boolean {
        return !!(this.selectedClass ||
            (this.selectedSpec && this.selectedSpec !== 'Core' && this.selectedSpec !== 'Hero Talent') ||
            (this.selectedHeroTalent && this.selectedHeroTalent !== 'Core'));
    }

    /**
     * Update available options for column filters based on current data and selected filters
     */
    private updateColumnFilterOptions() {
        // Start with all available options
        const allClasses = Object.keys(fullClasses).map(className => this.formatClassName(className)).sort();

        const allSpecs: string[] = [];
        Object.values(fullClasses).forEach(classData => {
            Object.keys(classData.specs).forEach(spec => {
                allSpecs.push(this.formatSpecName(spec));
            });
        });
        const uniqueSpecs = [...new Set(allSpecs)].sort();

        const allHeroTalents: string[] = [];
        Object.values(fullClasses).forEach(classData => {
            Object.values(classData.specs).forEach(specHeroTalents => {
                if (Array.isArray(specHeroTalents)) {
                    allHeroTalents.push(...specHeroTalents);
                }
            });
        });
        const uniqueHeroTalents = [...new Set(allHeroTalents)].sort();

        // Apply dynamic filtering based on selected column filters
        let filteredClasses = allClasses;
        let filteredSpecs = uniqueSpecs;
        let filteredHeroTalents = uniqueHeroTalents;

        // If a class is selected, filter specs and hero talents to only those available for that class
        if (this.columnFilters.class) {
            // Use the formatted class name directly (not the backend format)
            const selectedClass = this.columnFilters.class;
            const classData = fullClasses[selectedClass];

            if (classData) {
                // Filter specs to only those available for the selected class
                filteredSpecs = Object.keys(classData.specs).map(spec => this.formatSpecName(spec)).sort();

                // Filter hero talents to only those available for the selected class
                const classHeroTalents: string[] = [];
                Object.values(classData.specs).forEach(specHeroTalents => {
                    if (Array.isArray(specHeroTalents)) {
                        classHeroTalents.push(...specHeroTalents);
                    }
                });
                filteredHeroTalents = [...new Set(classHeroTalents)].sort();
            }
        }

        // If a spec is selected, filter classes and hero talents based on that spec
        if (this.columnFilters.spec) {
            // Use the formatted spec name directly (not the backend format)
            const selectedSpec = this.columnFilters.spec;

            // Find all classes that have this spec
            const classesWithSpec: string[] = [];
            const heroTalentsForSpec: string[] = [];

            Object.entries(fullClasses).forEach(([className, classData]) => {
                if (classData.specs[selectedSpec]) {
                    classesWithSpec.push(this.formatClassName(className));
                    // Add hero talents for this spec
                    if (Array.isArray(classData.specs[selectedSpec])) {
                        heroTalentsForSpec.push(...classData.specs[selectedSpec]);
                    }
                }
            });

            // If no class is selected, filter classes to only those with this spec
            if (!this.columnFilters.class) {
                filteredClasses = [...new Set(classesWithSpec)].sort();
            }

            // If a class is also selected, check if it has this spec
            if (this.columnFilters.class) {
                // Use the formatted class name directly (not the backend format)
                const selectedClass = this.columnFilters.class;
                const classData = fullClasses[selectedClass];

                if (classData && classData.specs[selectedSpec]) {
                    // Class has this spec, filter hero talents to only those for this spec
                    filteredHeroTalents = classData.specs[selectedSpec].sort();
                    // Keep the class filter active
                    filteredClasses = [this.columnFilters.class];
                } else {
                    // Class doesn't have this spec, clear the class filter
                    this.columnFilters.class = '';
                    filteredClasses = [...new Set(classesWithSpec)].sort();
                    filteredHeroTalents = [...new Set(heroTalentsForSpec)].sort();
                }
            } else {
                // If no class selected, show all hero talents for this spec across all classes
                filteredHeroTalents = [...new Set(heroTalentsForSpec)].sort();
            }
        }

        // If a hero talent is selected, filter classes and specs to only those that have this hero talent
        if (this.columnFilters.heroTalent) {
            const selectedHeroTalent = this.getBackendHeroTalentName(this.columnFilters.heroTalent);

            const classesWithHeroTalent: string[] = [];
            const specsWithHeroTalent: string[] = [];

            Object.entries(fullClasses).forEach(([className, classData]) => {
                Object.entries(classData.specs).forEach(([specName, heroTalents]) => {
                    if (Array.isArray(heroTalents) && heroTalents.includes(selectedHeroTalent)) {
                        classesWithHeroTalent.push(this.formatClassName(className));
                        specsWithHeroTalent.push(this.formatSpecName(specName));
                    }
                });
            });

            // Check if current class/spec combination has this hero talent
            let currentCombinationValid = false;
            if (this.columnFilters.class && this.columnFilters.spec) {
                // Use the formatted class and spec names directly (not the backend format)
                const selectedClass = this.columnFilters.class;
                const selectedSpec = this.columnFilters.spec;
                const classData = fullClasses[selectedClass];

                if (classData && classData.specs[selectedSpec] &&
                    Array.isArray(classData.specs[selectedSpec]) &&
                    classData.specs[selectedSpec].includes(selectedHeroTalent)) {
                    currentCombinationValid = true;
                }
            }

            // If current combination is invalid, clear the conflicting filters
            if (!currentCombinationValid) {
                if (this.columnFilters.class && !classesWithHeroTalent.includes(this.columnFilters.class)) {
                    this.columnFilters.class = '';
                }
                if (this.columnFilters.spec && !specsWithHeroTalent.includes(this.columnFilters.spec)) {
                    this.columnFilters.spec = '';
                }
            }

            // Only override filtered classes/specs if no other filters are active
            if (!this.columnFilters.class && !this.columnFilters.spec) {
                filteredClasses = [...new Set(classesWithHeroTalent)].sort();
                filteredSpecs = [...new Set(specsWithHeroTalent)].sort();
            } else {
                // If class or spec is already filtered, intersect with hero talent results
                if (this.columnFilters.class) {
                    filteredClasses = filteredClasses.filter(cls => classesWithHeroTalent.includes(cls));
                }
                if (this.columnFilters.spec) {
                    filteredSpecs = filteredSpecs.filter(spec => specsWithHeroTalent.includes(spec));
                }
            }
        }

        // Update the available options
        this.availableClasses = filteredClasses;
        this.availableSpecs = filteredSpecs;
        this.availableHeroTalents = filteredHeroTalents;
    }


    /**
     * Fetch abilities with specific version
     */
    private fetchAbilitiesWithVersion(formattedClass: string, formattedSpec: string, formattedHeroTalent: string, gameVersion: string) {
        console.log('fetchAbilitiesWithVersion called with:', {
            formattedClass,
            formattedSpec,
            formattedHeroTalent,
            gameVersion
        });

        this.abilitiesService.getAbilities(
            formattedClass,
            formattedSpec,
            formattedHeroTalent,
            gameVersion
        ).subscribe((data) => {
            console.log('Abilities loaded successfully:', data);
            // Add class, spec, and hero talent information and sort abilities alphabetically by name
            const abilitiesWithClass = data.map(ability => ({
                ...ability,
                class: this.selectedClass,
                spec: this.selectedSpec,
                heroTalent: this.selectedHeroTalent
            }));
            const sortedData = abilitiesWithClass.sort((a, b) => a.name.localeCompare(b.name));
            this.abilities = sortedData;
            this.filteredAbilities = sortedData;
            this.updateTableData();
        }, (err) => {
            console.error('getAbilities - err', err);
            this.abilities = [];
            this.filteredAbilities = [];
            this.updateTableData();
        });
    }

    /**
     * Update table data source
     */
    updateTableData() {
        // Update available options for column filters based on current abilities
        this.updateColumnFilterOptions();

        // If no column filters are active, use current data directly
        if (!this.hasActiveColumnFilters()) {
            // Don't apply internal filtering when no column filters are active
            // The server already returns the correct data for the current page
            this.filteredAbilities = this.abilities;
        } else {
            // Only apply internal filtering when column filters are active
            this.applyColumnFiltersInternal();
        }

        // With server-side pagination, the dataSource is the same as filteredAbilities
        // The server returns only the current page's data
        this.dataSource = [...this.filteredAbilities]; // Create new array reference to trigger change detection

        console.log('🔍 updateTableData - Final data state:', {
            abilitiesLength: this.abilities.length,
            filteredAbilitiesLength: this.filteredAbilities.length,
            dataSourceLength: this.dataSource.length,
            currentPage: this.currentPage,
            hasActiveColumnFilters: this.hasActiveColumnFilters(),
            dataSourceSample: this.dataSource.slice(0, 3).map(a => ({ name: a.name, class: a.class }))
        });

        // Force change detection to ensure table updates
        this.cdr.detectChanges();
    }

    /**
     * Go to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            console.log('🔍 Going to previous page:', this.currentPage);

            if (this.hasActiveColumnFilters()) {
                this.fetchAbilitiesWithColumnFilters();
            } else if (this.hasActiveMainFilters()) {
                this.fetchAbilities();
            } else {
                this.fetchAllAbilities();
            }
        }
    }

    /**
     * Go to next page
     */
    goToNextPage() {
        if (this.currentPage < this.maxPage()) {
            this.currentPage++;
            console.log('🔍 Going to next page:', this.currentPage);

            if (this.hasActiveColumnFilters()) {
                this.fetchAbilitiesWithColumnFilters();
            } else if (this.hasActiveMainFilters()) {
                this.fetchAbilities();
            } else {
                this.fetchAllAbilities();
            }
        }
    }

    /**
     * Calculate maximum page number
     */
    maxPage() {
        return Math.ceil(this.totalAbilities / this.abilitiesPerPage);
    }

    /**
     * Get start index of current page
     */
    getStartIndex() {
        return (this.currentPage - 1) * this.abilitiesPerPage;
    }

    /**
     * Get end index of current page
     */
    getEndIndex() {
        return Math.min(this.getStartIndex() + this.abilitiesPerPage, this.totalAbilities);
    }

    /**
 * Format class name for display
 */
    formatClassName(className: string): string {
        if (!className) return 'Unknown';

        // Handle special cases
        if (className === 'demonhunter') return 'Demon Hunter';
        if (className === 'deathknight') return 'Death Knight';

        // Capitalize first letter of each word
        return className.split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
 * Format spec name for display
 */
    formatSpecName(specName: string): string {
        if (!specName) return '';

        // Handle special cases
        if (specName === 'beast-mastery') return 'Beast Mastery';
        if (specName === 'windwalker') return 'Windwalker';

        // Capitalize first letter of each word
        return specName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }

    /**
 * Convert formatted class name to backend format
 */
    getBackendClassName(formattedClassName: string): string {
        if (!formattedClassName) return '';

        // Handle special cases
        if (formattedClassName === 'Demon Hunter') return 'demonhunter';
        if (formattedClassName === 'Death Knight') return 'deathknight';

        // Convert to lowercase
        return formattedClassName.toLowerCase();
    }

    /**
 * Convert formatted spec name to backend format
 */
    getBackendSpecName(formattedSpecName: string): string {
        if (!formattedSpecName) return '';

        // Handle special cases first
        if (formattedSpecName === 'Beast Mastery') return 'beast-mastery';

        // Convert to lowercase
        return formattedSpecName.toLowerCase();
    }

    /**
 * Convert formatted hero talent name to backend format
 */
    getBackendHeroTalentName(formattedHeroTalentName: string): string {
        if (!formattedHeroTalentName) return '';

        // Handle special cases first
        if (formattedHeroTalentName === 'Elune\'s Chosen') return 'elunes-chosen';

        // Convert to lowercase, replace spaces with hyphens, and replace apostrophes with hyphens
        return formattedHeroTalentName.toLowerCase()
            .replace(/\s+/g, '-')
            .replace(/'/g, '-');
    }

    /**
     * Format hero talent name for display
     */
    formatHeroTalentName(heroTalentName: string): string {
        if (!heroTalentName) return '';

        // Handle special cases
        if (heroTalentName === 'herald-of-the-sun') return 'Herald of the Sun';
        if (heroTalentName === 'lightsmith') return 'Lightsmith';
        if (heroTalentName === 'templar') return 'Templar';
        if (heroTalentName === 'deathbringer') return 'Deathbringer';
        if (heroTalentName === 'san-layn') return 'San\'layn';
        if (heroTalentName === 'rider-of-the-apocalypse') return 'Rider of the Apocalypse';
        if (heroTalentName === 'aldrachi-reaver') return 'Aldrachi Reaver';
        if (heroTalentName === 'fel-scarred') return 'Fel Scarred';
        if (heroTalentName === 'elunes-chosen') return 'Elune\'s Chosen';
        if (heroTalentName === 'keeper-of-the-grove') return 'Keeper of the Grove';
        if (heroTalentName === 'druid-of-the-claw') return 'Druid of the Claw';
        if (heroTalentName === 'wildstalker') return 'Wildstalker';
        if (heroTalentName === 'chronowarden') return 'Chronowarden';
        if (heroTalentName === 'scalecommander') return 'Scalecommander';
        if (heroTalentName === 'flameshaper') return 'Flameshaper';
        if (heroTalentName === 'dark-ranger') return 'Dark Ranger';
        if (heroTalentName === 'pack-leader') return 'Pack Leader';
        if (heroTalentName === 'sentinel') return 'Sentinel';
        if (heroTalentName === 'spellslinger') return 'Spellslinger';
        if (heroTalentName === 'sunfury') return 'Sunfury';
        if (heroTalentName === 'frostfire') return 'Frostfire';
        if (heroTalentName === 'master-of-harmony') return 'Master of Harmony';
        if (heroTalentName === 'shado-pan') return 'Shado-Pan';
        if (heroTalentName === 'conduit-of-the-celestials') return 'Conduit of the Celestials';
        if (heroTalentName === 'oracle') return 'Oracle';
        if (heroTalentName === 'voidweaver') return 'Voidweaver';
        if (heroTalentName === 'archon') return 'Archon';
        if (heroTalentName === 'deathstalker') return 'Deathstalker';
        if (heroTalentName === 'fatebound') return 'Fatebound';
        if (heroTalentName === 'trickster') return 'Trickster';
        if (heroTalentName === 'farseer') return 'Farseer';
        if (heroTalentName === 'stormbringer') return 'Stormbringer';
        if (heroTalentName === 'totemic') return 'Totemic';
        if (heroTalentName === 'hellcaller') return 'Hellcaller';
        if (heroTalentName === 'soul-harvester') return 'Soul Harvester';
        if (heroTalentName === 'diabolist') return 'Diabolist';
        if (heroTalentName === 'colossus') return 'Colossus';
        if (heroTalentName === 'slayer') return 'Slayer';
        if (heroTalentName === 'mountain-thane') return 'Mountain Thane';

        // Capitalize first letter of each word
        return heroTalentName.split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
    }


    /**
 * Clear class filter only
 */
    clearClassFilter() {
        this.selectedClass = undefined;
        this.selectedSpec = undefined;
        this.selectedHeroTalent = undefined;
        this.specs = [];
        this.heroTalents = [];

        // Update URL and fetch abilities
        this.updateUrl();
        this.fetchAbilities();

        // Close the dropdown
        setTimeout(() => {
            if (this.classSelect) {
                this.classSelect.close();
            }
        }, 0);
    }

    /**
 * Clear spec filter only
 */
    clearSpecFilter() {
        this.selectedSpec = undefined;
        this.selectedHeroTalent = undefined;

        // Reload hero talents for the current class (all hero talents)
        if (this.selectedClass) {
            const classData = fullClasses[this.selectedClass];
            if (classData && classData.specs) {
                const allHeroTalents = Object.values(classData.specs).flat();
                this.heroTalents = [...new Set(allHeroTalents)];
            } else {
                this.heroTalents = [];
            }
        }

        // Update URL and fetch abilities
        this.updateUrl();
        this.fetchAbilities();

        // Close the dropdown
        setTimeout(() => {
            if (this.specSelect) {
                this.specSelect.close();
            }
        }, 0);
    }

    /**
 * Clear hero talent filter only
 */
    clearHeroTalentFilter() {
        this.selectedHeroTalent = undefined;

        // Update URL and fetch abilities
        this.updateUrl();
        this.fetchAbilities();

        // Close the dropdown
        setTimeout(() => {
            if (this.heroTalentSelect) {
                this.heroTalentSelect.close();
            }
        }, 0);
    }

    /**
 * Clear game version filter only
 */
    clearGameVersionFilter() {
        this.selectedGameVersion = this.gameVersions[0]; // Reset to latest version

        // Update URL and fetch abilities
        this.updateUrl();
        this.fetchAbilities();

        // Close the dropdown
        setTimeout(() => {
            if (this.gameVersionSelect) {
                this.gameVersionSelect.close();
            }
        }, 0);
    }

    /**
 * Clear all filters
 */
    clearFilters() {
        this.selectedClass = undefined;
        this.selectedSpec = undefined;
        this.selectedHeroTalent = undefined;
        this.selectedGameVersion = this.gameVersions[0]; // Reset to latest version
        this.specs = [];
        this.heroTalents = [];

        // Update URL and fetch abilities with only game version filter
        this.updateUrl();
        this.fetchAbilities();

        // Remove focus from any active element
        setTimeout(() => {
            const activeElement = document.activeElement as HTMLElement;
            if (activeElement) {
                activeElement.blur();
            }
        }, 0);
    }
}
