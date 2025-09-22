import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { MatSelect } from '@angular/material/select';

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

//Services
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';

//Data
import { classes, fullClasses } from 'app/core/data/classes';

//Interfaces
import { Ability } from 'app/core/types/ability';

@Component({
    selector: 'abilities',
    templateUrl: './abilities.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
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
        MatChipsModule
    ],
})
export class AbilitiesComponent implements OnInit {

    // Filter properties
    selectedClass: string;
    selectedSpec: string;
    selectedHeroTalent: string;
    selectedGameVersion: string;

    // Data properties
    abilities: Ability[] = [];
    filteredAbilities: Ability[] = [];
    classes = classes;
    specs = [];
    heroTalents = [];
    gameVersions: string[] = [];
    totalAbilities: number = 0;

    // Table properties
    displayedColumns: string[] = ['icon', 'name', 'class', 'spec', 'heroTalent', 'description'];
    dataSource: Ability[] = [];

    // Pagination
    currentPage = 1; // Changed to 1-based indexing for backend compatibility
    abilitiesPerPage = 100; // Changed to 100 for server-side pagination

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
        private route: ActivatedRoute
    ) { }

    ngOnInit(): void {
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
            this.specs = Object.keys(fullClasses[this.selectedClass].specs);
            const allHeroTalents = Object.values(fullClasses[this.selectedClass].specs).flat();
            this.heroTalents = [...new Set(allHeroTalents)];
        }

        if (params['spec']) {
            this.selectedSpec = params['spec'];
            // Load hero talents for this spec
            if (this.selectedClass && this.selectedSpec) {
                this.heroTalents = fullClasses[this.selectedClass].specs[this.selectedSpec];
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
            // Show actual specs plus an option to view all hero talents
            this.specs = Object.keys(fullClasses[selectedClass].specs);
            // Get all hero talents for this class (remove duplicates)
            const allHeroTalents = Object.values(fullClasses[selectedClass].specs).flat();
            this.heroTalents = [...new Set(allHeroTalents)];
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
            if (selectedSpec) {
                // Show hero talents for the selected spec
                this.heroTalents = fullClasses[this.selectedClass].specs[selectedSpec];
            } else {
                // Show all hero talents for the class (remove duplicates)
                const allHeroTalents = Object.values(fullClasses[this.selectedClass].specs).flat();
                this.heroTalents = [...new Set(allHeroTalents)];
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

        // Call the abilities endpoint with only game version filter and pagination
        this.abilitiesService.getAbilitiesWithFilters({
            gameVersion,
            page: this.currentPage,
            limit: this.abilitiesPerPage
        }).subscribe({
            next: (data) => {
                console.log('All abilities loaded:', data);

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

                this.abilities = processedAbilities;
                this.filteredAbilities = processedAbilities;
                this.totalAbilities = total;
                this.updateTableData();
            },
            error: (err) => {
                console.error('Error loading all abilities:', err);
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
        // With server-side pagination, the dataSource is the same as filteredAbilities
        // The server returns only the current page's data
        this.dataSource = this.filteredAbilities;
    }

    /**
     * Get abilities for current page
     */
    getAbilitiesForCurrentPage() {
        const startIndex = this.currentPage * this.abilitiesPerPage;
        const endIndex = startIndex + this.abilitiesPerPage;
        return this.filteredAbilities.slice(startIndex, endIndex);
    }

    /**
     * Go to previous page
     */
    goToPreviousPage() {
        if (this.currentPage > 1) {
            this.currentPage--;
            this.fetchAbilities(); // Fetch new data from server
        }
    }

    /**
     * Go to next page
     */
    goToNextPage() {
        if (this.currentPage < this.maxPage()) {
            this.currentPage++;
            this.fetchAbilities(); // Fetch new data from server
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
            const allHeroTalents = Object.values(fullClasses[this.selectedClass].specs).flat();
            this.heroTalents = [...new Set(allHeroTalents)];
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
