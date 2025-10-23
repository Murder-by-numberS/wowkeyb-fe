import { Component, ViewEncapsulation, OnInit, EventEmitter, Output, Input, SimpleChanges } from '@angular/core';

//Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

//Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';

//Components
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog.component';
import { AbilityDialogComponent } from './ability-dialog/ability-dialog.component';

//Data
import { classes, fullClasses } from 'app/core/data/classes';

//Interfaces
import { Keybinding } from 'app/core/types/keybinding';
import { Ability } from 'app/core/types/ability';

@Component({
    selector: 'abilities',
    templateUrl: './abilities.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatSelectModule,
        MatDialogModule,
        MatTooltipModule
    ],
})
export class AbilitiesComponent implements OnInit {

    isDisabled = true;

    @Input()
    keybindingSelected: boolean;

    @Input()
    selectedKeybinding: Keybinding;
    selectedKeybindingClass: string;
    selectedKeybindingSpec: string;
    selectedKeybindingHeroTalent: string;

    abilities: Ability[];
    private isFetchingAbilities: boolean = false;
    private currentFetchKeybindingId: string | null = null;

    classes = classes;
    specs = [];
    heroTalents = [];

    @Output() selectionClassChanged = new EventEmitter<string>();
    @Output() keybindingUpdated = new EventEmitter<any>();

    currentPage = 0;
    abilitiesPerPage = 12; // Set the number of abilities per page

    /**
     * Constructor
     */
    constructor(
        private keybindingService: KeybindingService,
        private abilitiesService: AbilitiesService,
        private versionCompare: VersionCompareService,
        private dialog: MatDialog
    ) {
        this.keybindingSelected = false;
    }

    /**
     * Convert display class name to lowercase key for fullClasses access
     * @param className - Display class name (e.g., "Death Knight", "Hunter")
     * @returns Lowercase key (e.g., "deathknight", "hunter")
     */
    private getClassKey(className: string): string {
        return className.toLowerCase().replace(/\s+/g, '');
    }

    ngOnInit(): void {

    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['selectedKeybinding']) {
            console.log('abilities - ngOnChanges triggered');
            console.log('abilities - previous value:', changes['selectedKeybinding'].previousValue?.keybindingId);
            console.log('abilities - current value:', changes['selectedKeybinding'].currentValue?.keybindingId);
            console.log('abilities - inputProp changed:', changes['selectedKeybinding'].currentValue);
            console.log('abilities - current keybinding details:', {
                id: changes['selectedKeybinding'].currentValue?.keybindingId,
                name: changes['selectedKeybinding'].currentValue?.name,
                class: changes['selectedKeybinding'].currentValue?.class,
                spec: changes['selectedKeybinding'].currentValue?.spec,
                heroTalent: changes['selectedKeybinding'].currentValue?.heroTalent,
                version: changes['selectedKeybinding'].currentValue?.version?.game_version
            });
            console.log('abilities - randomClassDetails:', changes['selectedKeybinding'].currentValue?.randomClassDetails);

            if (this.selectedKeybinding) {
                // Clear abilities first to prevent showing stale data
                this.abilities = [];
                this.currentFetchKeybindingId = null; // Clear previous fetch ID
                console.log('Cleared abilities for new keybinding');

                // Use keybinding's current class details if available, otherwise use random class details
                if (this.selectedKeybinding.class && this.selectedKeybinding.spec && this.selectedKeybinding.heroTalent) {
                    console.log('Using keybinding class details for abilities:', {
                        class: this.selectedKeybinding.class,
                        spec: this.selectedKeybinding.spec,
                        heroTalent: this.selectedKeybinding.heroTalent
                    });
                    console.log('Abilities component - selectedKeybinding ID:', this.selectedKeybinding.keybindingId);

                    this.selectedKeybindingClass = this.selectedKeybinding.class;
                    this.selectedKeybindingSpec = this.selectedKeybinding.spec;
                    this.selectedKeybindingHeroTalent = this.selectedKeybinding.heroTalent === 'San Layn'
                        ? 'San\'layn'
                        : this.selectedKeybinding.heroTalent === 'Fel Scarred'
                            ? 'Fel-Scarred'
                            : this.selectedKeybinding.heroTalent === 'Elunes Chosen'
                                ? 'Elune\'s Chosen'
                                : this.selectedKeybinding.heroTalent;
                } else if (this.selectedKeybinding.randomClassDetails) {
                    console.log('Using random class details for abilities:', this.selectedKeybinding.randomClassDetails);

                    // Convert lowercase backend values to proper format for fullClasses
                    const classMapping = {
                        'mage': 'Mage',
                        'hunter': 'Hunter',
                        'warrior': 'Warrior',
                        'paladin': 'Paladin',
                        'priest': 'Priest',
                        'rogue': 'Rogue',
                        'shaman': 'Shaman',
                        'warlock': 'Warlock',
                        'monk': 'Monk',
                        'druid': 'Druid',
                        'deathknight': 'Death Knight',
                        'demonhunter': 'Demon Hunter',
                        'evoker': 'Evoker'
                    };

                    const specMapping = {
                        'fire': 'Fire',
                        'frost': 'Frost',
                        'arcane': 'Arcane',
                        'beastmastery': 'Beast Mastery',
                        'marksmanship': 'Marksmanship',
                        'survival': 'Survival',
                        'arms': 'Arms',
                        'fury': 'Fury',
                        'protection': 'Protection',
                        'holy': 'Holy',
                        'retribution': 'Retribution',
                        'discipline': 'Discipline',
                        'shadow': 'Shadow',
                        'assassination': 'Assassination',
                        'outlaw': 'Outlaw',
                        'subtlety': 'Subtlety',
                        'elemental': 'Elemental',
                        'enhancement': 'Enhancement',
                        'restoration': 'Restoration',
                        'affliction': 'Affliction',
                        'demonology': 'Demonology',
                        'destruction': 'Destruction',
                        'brewmaster': 'Brewmaster',
                        'windwalker': 'Windwalker',
                        'mistweaver': 'Mistweaver',
                        'balance': 'Balance',
                        'feral': 'Feral',
                        'guardian': 'Guardian',
                        'havoc': 'Havoc',
                        'vengeance': 'Vengeance',
                        'blood': 'Blood',
                        'unholy': 'Unholy',
                        'devastation': 'Devastation',
                        'preservation': 'Preservation',
                        'augmentation': 'Augmentation'
                    };

                    const heroTalentMapping = {
                        'frostfire': 'Frostfire',
                        'spellweaver': 'Spellweaver',
                        'sunfury': 'Sunfury',
                        'beastmaster': 'Beast Master',
                        'darkranger': 'Dark Ranger',
                        'packleader': 'Pack Leader',
                        'champion': 'Champion',
                        'battlelord': 'Battlelord',
                        'mountainthane': 'Mountain Thane',
                        'lightbringer': 'Lightbringer',
                        'templar': 'Templar',
                        'justicar': 'Justicar',
                        'archon': 'Archon',
                        'oracle': 'Oracle',
                        'mindbender': 'Mindbender',
                        'assassin': 'Assassin',
                        'outlaw': 'Outlaw',
                        'shadowblade': 'Shadowblade',
                        'stormbringer': 'Stormbringer',
                        'earthwarden': 'Earthwarden',
                        'tidecaller': 'Tidecaller',
                        'soulharvester': 'Soul Harvester',
                        'hellcaller': 'Hellcaller',
                        'destruction': 'Destruction',
                        'storm': 'Storm',
                        'iron': 'Iron',
                        'wind': 'Wind',
                        'keeperofthegrove': 'Keeper of the Grove',
                        'eluneschosen': 'Elune\'s Chosen',
                        'druidoftheclaw': 'Druid of the Claw',
                        'wildstalker': 'Wildstalker',
                        'aldrachireaver': 'Aldrachi Reaver',
                        'felscarred': 'Fel-Scarred',
                        'deathbringer': 'Deathbringer',
                        'rideroftheapocalypse': 'Rider of the Apocalypse',
                        'sanlayn': 'San\'layn',
                        'flame': 'Flame',
                        'scalecommander': 'Scale Commander',
                        'weaver': 'Weaver',
                        'slayer': 'Slayer',
                        'colossus': 'Colossus',
                        'spellslinger': 'Spellslinger',
                        'sentinel': 'Sentinel',
                        'masterofharmony': 'Master of Harmony',
                        'shadopan': 'Shado-Pan',
                        'conduitofthecelestials': 'Conduit of the Celestials',
                        'heraldofthesun': 'Herald of the Sun',
                        'lightsmith': 'Lightsmith',
                        'voidweaver': 'Voidweaver',
                        'deathstalker': 'Deathstalker',
                        'fatebound': 'Fatebound',
                        'trickster': 'Trickster',
                        'farseer': 'Farseer',
                        'totemic': 'Totemic',
                        'diabolist': 'Diabolist',
                        'flameshaper': 'Flameshaper',
                        'chronowarden': 'Chronowarden'
                    };

                    this.selectedKeybindingClass = classMapping[this.selectedKeybinding.randomClassDetails.class] || this.selectedKeybinding.randomClassDetails.class;
                    this.selectedKeybindingSpec = specMapping[this.selectedKeybinding.randomClassDetails.spec] || this.selectedKeybinding.randomClassDetails.spec;
                    this.selectedKeybindingHeroTalent = heroTalentMapping[this.selectedKeybinding.randomClassDetails.heroTalent] || this.selectedKeybinding.randomClassDetails.heroTalent;

                    console.log('Converted values:', {
                        class: this.selectedKeybindingClass,
                        spec: this.selectedKeybindingSpec,
                        heroTalent: this.selectedKeybindingHeroTalent
                    });

                    console.log('Hero talent mapping debug:', {
                        originalHeroTalent: this.selectedKeybinding.randomClassDetails.heroTalent,
                        mappedHeroTalent: heroTalentMapping[this.selectedKeybinding.randomClassDetails.heroTalent],
                        finalHeroTalent: this.selectedKeybindingHeroTalent
                    });

                    // Check if the converted values exist in fullClasses
                    const classKey = this.getClassKey(this.selectedKeybindingClass);
                    console.log('Checking fullClasses availability:', {
                        classExists: !!fullClasses[classKey],
                        specExists: !!fullClasses[classKey]?.specs[this.selectedKeybindingSpec],
                        heroTalentExists: !!fullClasses[classKey]?.specs[this.selectedKeybindingSpec]?.includes(this.selectedKeybindingHeroTalent)
                    });

                    // Debug fullClasses structure
                    if (fullClasses[classKey]) {
                        console.log('fullClasses structure for class:', {
                            class: this.selectedKeybindingClass,
                            specs: fullClasses[classKey].specs,
                            allSpecs: Object.keys(fullClasses[classKey].specs)
                        });
                    }
                } else {
                    console.log('No class details available for abilities');
                    this.selectedKeybindingClass = undefined;
                    this.selectedKeybindingSpec = undefined;
                    this.selectedKeybindingHeroTalent = undefined;
                }

                // Abilities already cleared above

                if (this.selectedKeybindingClass) {
                    // Convert display class name to lowercase key for fullClasses access
                    const classKey = this.getClassKey(this.selectedKeybindingClass);
                    const classData = fullClasses[classKey];

                    if (classData && classData.specs) {
                        this.specs = Object.keys(classData.specs);
                        console.log('Populated specs:', this.specs);
                    } else {
                        console.error('Class data not found for:', this.selectedKeybindingClass, 'key:', classKey);
                        this.specs = [];
                    }

                    // Only set hero talents if spec is selected
                    if (this.selectedKeybindingSpec) {
                        console.log('Setting hero talents for:', {
                            class: this.selectedKeybindingClass,
                            spec: this.selectedKeybindingSpec
                        });
                        console.log('Available specs for class:', Object.keys(classData.specs));
                        console.log('Specs object:', classData.specs);

                        this.heroTalents = classData.specs[this.selectedKeybindingSpec];
                        console.log('Populated hero talents:', this.heroTalents);
                        console.log('Hero talents array length:', this.heroTalents?.length);
                    } else {
                        this.heroTalents = [];
                        console.log('No spec selected, cleared hero talents');
                    }

                    // Only fetch abilities if both spec and hero talent are selected
                    if (this.selectedKeybindingSpec && this.selectedKeybindingHeroTalent) {
                        console.log('Both spec and hero talent selected, fetching abilities...');
                        console.log('Final values for abilities fetch:', {
                            class: this.selectedKeybindingClass,
                            spec: this.selectedKeybindingSpec,
                            heroTalent: this.selectedKeybindingHeroTalent
                        });
                        this.fetchAbilities();
                    } else {
                        console.log('Not fetching abilities - missing spec or hero talent:', {
                            hasSpec: !!this.selectedKeybindingSpec,
                            hasHeroTalent: !!this.selectedKeybindingHeroTalent,
                            spec: this.selectedKeybindingSpec,
                            heroTalent: this.selectedKeybindingHeroTalent
                        });
                    }
                } else {
                    this.specs = [];
                    this.heroTalents = [];
                    console.log('No class selected, cleared specs and hero talents');
                }
            } else {
                // Reset all values when no keybinding is selected
                this.selectedKeybindingClass = undefined;
                this.selectedKeybindingSpec = undefined;
                this.selectedKeybindingHeroTalent = undefined;
                this.specs = [];
                this.heroTalents = [];
                this.abilities = [];
            }
        }
    }

    onClassChange(event: any) {

        const selectedOption = event.value;

        if (this.selectedKeybinding.spec) {

            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                data: { text: 'Are you sure you want to select', option: selectedOption }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    console.log('Selection confirmed:', selectedOption);
                    console.log('class changed');
                    this.selectedKeybindingClass = selectedOption;
                    this.selectedKeybinding.class = this.selectedKeybindingClass;
                    this.selectedKeybinding.spec = undefined;
                    this.selectedKeybinding.heroTalent = undefined;
                    this.selectedKeybindingSpec = undefined;
                    this.selectedKeybindingHeroTalent = undefined;
                    this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { class: selectedOption })
                        .subscribe({
                            next: (updatedKeybinding) => {
                                this.selectedKeybinding = updatedKeybinding;
                                const classKey = this.getClassKey(this.selectedKeybindingClass);
                                this.specs = Object.keys(fullClasses[classKey]?.specs || {});
                                this.selectionClassChanged.emit(null);
                                this.abilities = [];
                            },
                            error: (error) => {
                                console.error('Error updating keybinding:', error);
                            }
                        });
                } else {
                    console.log('Selection cancelled', this.selectedKeybinding.class);
                    this.selectedKeybindingClass = this.selectedKeybinding.class;
                    this.selectedKeybindingSpec = this.selectedKeybinding.spec;
                    this.selectedKeybindingHeroTalent = this.selectedKeybinding.heroTalent;
                }
            });

        } else {
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { class: selectedOption });
            this.selectedKeybindingClass = selectedOption;
            this.selectedKeybinding.class = this.selectedKeybindingClass;
            this.selectedKeybinding.spec = undefined;
            this.selectedKeybinding.heroTalent = undefined;
            this.selectedKeybindingSpec = undefined;
            this.selectedKeybindingHeroTalent = undefined;
            console.log('this.selectedKeybindingSpec', this.selectedKeybindingSpec);
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { class: selectedOption })
                .subscribe({
                    next: (updatedKeybinding) => {
                        this.selectedKeybinding = updatedKeybinding;
                        const classKey = this.getClassKey(this.selectedKeybindingClass);
                        this.specs = Object.keys(fullClasses[classKey]?.specs || {});
                        console.log('this.specs', this.specs);
                        this.selectionClassChanged.emit(null);
                        this.abilities = [];
                    },
                    error: (error) => {
                        console.error('Error updating keybinding:', error);
                    }
                });
        }
    }

    onSpecChange(event: any) {

        const selectedOption = event.value;
        console.log('this.selectedKeybinding.spec', this.selectedKeybinding.spec);
        if (this.selectedKeybinding.spec) {

            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                data: { text: 'Are you sure you want to select', option: selectedOption }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    console.log('Selection confirmed:', selectedOption);
                    console.log('spec changed');
                    this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { spec: selectedOption })
                        .subscribe({
                            next: (updatedKeybinding) => {
                                this.selectedKeybinding = updatedKeybinding;
                                this.selectedKeybindingSpec = selectedOption;
                                this.selectedKeybindingHeroTalent = undefined;
                                const classKey = this.getClassKey(this.selectedKeybindingClass);
                                this.heroTalents = fullClasses[classKey]?.specs[this.selectedKeybindingSpec] || [];
                                this.selectionClassChanged.emit(null);
                                this.abilities = [];
                            },
                            error: (error) => {
                                console.error('Error updating keybinding:', error);
                            }
                        });
                } else {
                    console.log('Selection cancelled', this.selectedKeybinding.class);
                    this.selectedKeybindingClass = this.selectedKeybinding.class;
                    this.selectedKeybindingSpec = this.selectedKeybinding.spec;
                    this.selectedKeybindingHeroTalent = this.selectedKeybinding.heroTalent;
                }
            });
        } else {
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { spec: selectedOption })
                .subscribe({
                    next: (updatedKeybinding) => {
                        this.selectedKeybindingSpec = selectedOption;
                        this.selectedKeybinding.spec = this.selectedKeybindingSpec;

                        const classKey = this.getClassKey(this.selectedKeybindingClass);
                        this.heroTalents = fullClasses[classKey]?.specs[this.selectedKeybindingSpec] || [];
                        console.log('this.heroTalents', this.heroTalents);
                    },
                    error: (error) => {
                        console.error('Error updating keybinding:', error);
                    }
                });
        }
    }

    onHeroTalentChange(event: any) {

        const selectedOption = event.value;
        console.log('has heroTalent - this.selectedKeybinding.heroTalent', this.selectedKeybinding.heroTalent);
        if (this.selectedKeybinding.heroTalent) {

            const dialogRef = this.dialog.open(ConfirmDialogComponent, {
                data: { text: 'Are you sure you want to select', option: selectedOption }
            });

            dialogRef.afterClosed().subscribe(result => {
                if (result) {
                    console.log('Selection confirmed:', selectedOption);
                    console.log('hero talent changed');
                    this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { heroTalent: selectedOption })
                        .subscribe({
                            next: (updatedKeybinding) => {
                                this.selectedKeybinding = updatedKeybinding;
                                this.selectedKeybindingHeroTalent = selectedOption;
                                this.selectionClassChanged.emit(null);
                                this.fetchAbilities();
                            },
                            error: (error) => {
                                console.error('Error updating keybinding:', error);
                            }
                        });
                } else {
                    console.log('Selection cancelled', this.selectedKeybinding.class);
                    this.selectedKeybindingClass = this.selectedKeybinding.class;
                    this.selectedKeybindingSpec = this.selectedKeybinding.spec;
                    this.selectedKeybindingHeroTalent = this.selectedKeybinding.heroTalent;
                    this.fetchAbilities();
                }
            });

        } else {
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybindingId, { heroTalent: selectedOption })
                .subscribe({
                    next: (updatedKeybinding) => {
                        this.selectedKeybinding = updatedKeybinding;
                        this.selectedKeybindingHeroTalent = selectedOption;
                        this.selectionClassChanged.emit(null);
                        this.fetchAbilities();
                    },
                    error: (error) => {
                        console.error('Error updating keybinding:', error);
                    }
                });
        }

    }

    fetchAbilities() {
        console.log('fetching abilities for', {
            class: this.selectedKeybindingClass,
            spec: this.selectedKeybindingSpec,
            heroTalent: this.selectedKeybindingHeroTalent,
            selectedKeybinding: this.selectedKeybinding
        });
        console.log('fetchAbilities - selectedKeybinding ID:', this.selectedKeybinding?.keybindingId);

        // Only prevent if we're fetching for the exact same parameters
        if (this.isFetchingAbilities) {
            console.log('Abilities fetch already in progress, but continuing with new request...');
        }

        if (this.selectedKeybindingClass && this.selectedKeybindingSpec && this.selectedKeybindingHeroTalent) {
            console.log('All required fields present, proceeding with fetch...');

            // Set the current fetch keybinding ID to prevent race conditions
            this.currentFetchKeybindingId = this.selectedKeybinding?.keybindingId || null;
            console.log('Set currentFetchKeybindingId to:', this.currentFetchKeybindingId);

            console.log('Values being sent to abilities service:', {
                class: this.selectedKeybindingClass,
                spec: this.selectedKeybindingSpec,
                heroTalent: this.selectedKeybindingHeroTalent
            });

            // Get game version from selected keybinding, fallback to latest version
            const gameVersion = this.selectedKeybinding?.version?.game_version;

            if (gameVersion) {
                // Use keybinding's game version
                console.log('Using keybinding game version:', gameVersion);
                this.fetchAbilitiesWithVersion(this.selectedKeybindingClass, this.selectedKeybindingSpec, this.selectedKeybindingHeroTalent, gameVersion);
            } else {
                // Fallback to latest version
                console.log('Using latest version...');
                this.versionCompare.getLatestVersion().subscribe(latestVersion => {
                    console.log('Latest version:', latestVersion);
                    this.fetchAbilitiesWithVersion(this.selectedKeybindingClass, this.selectedKeybindingSpec, this.selectedKeybindingHeroTalent, latestVersion);
                }, error => {
                    console.error('Error getting latest version:', error);
                });
            }
        } else {
            console.log('Missing required fields for abilities fetch:', {
                hasClass: !!this.selectedKeybindingClass,
                hasSpec: !!this.selectedKeybindingSpec,
                hasHeroTalent: !!this.selectedKeybindingHeroTalent
            });
        }
    }

    private fetchAbilitiesWithVersion(className: string, specName: string, heroTalentName: string, gameVersion: string) {
        console.log('fetchAbilitiesWithVersion called with:', {
            className,
            specName,
            heroTalentName,
            gameVersion
        });

        this.isFetchingAbilities = true;

        this.abilitiesService.getAbilities(
            className,
            specName,
            heroTalentName,
            gameVersion
        ).subscribe((data) => {
            console.log('Abilities fetched from backend:', data.length, 'abilities');

            // Check if this fetch is still relevant (prevent race conditions)
            const currentKeybindingId = this.selectedKeybinding?.keybindingId;
            if (this.currentFetchKeybindingId !== currentKeybindingId) {
                console.log('Abilities fetch result ignored - keybinding changed during fetch:', {
                    fetchKeybindingId: this.currentFetchKeybindingId,
                    currentKeybindingId: currentKeybindingId
                });
                this.isFetchingAbilities = false;
                return;
            }

            console.log('Abilities fetch result applied for keybinding:', currentKeybindingId);

            //loop through abilities and add the keybindings to the abilities from the selectedKeybinding
            data.forEach(ability => {
                ability.keybindings = this.selectedKeybinding.keybinds.filter(keybind => keybind.spell.spellId == ability.spellId).map(keybind => keybind.key);
            });
            this.abilities = data;
            console.log('Abilities set in component:', this.abilities.length);
            this.isFetchingAbilities = false;
        }, (err) => {
            console.log('getAbilities - err', err);
            this.isFetchingAbilities = false;
        });
    }

    selectKey(ability: Ability) {
        console.log('selecting key: open a modal', ability);

        const isMobile = window.innerWidth < 768;
        const dialogRef = this.dialog.open(AbilityDialogComponent, {
            data: { ability, keybinding: this.selectedKeybinding },
            width: isMobile ? '95vw' : '500px',
            maxWidth: isMobile ? '95vw' : '90vw',
            maxHeight: isMobile ? '90vh' : '80vh',
            panelClass: isMobile ? 'mobile-dialog' : ''
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                const oldKeybindings = ability.keybindings || [];
                const newKeybindings = result.keybindings;

                // Handle removed keybindings
                const removedKeybinds = oldKeybindings
                    .filter(key => !newKeybindings.includes(key))
                    .map(key => ({
                        key,
                        spell: {
                            key: ability.name,
                            description: ability.description,
                            icon: ability.icon,
                            id: ability.id,
                            keybinding: key,
                            name: ability.name,
                            spellId: ability.spellId
                        }
                    }));

                // Handle added keybindings
                const addedKeybinds = newKeybindings
                    .filter(key => !oldKeybindings.includes(key))
                    .map(key => ({
                        key,
                        spell: {
                            key: ability.name,
                            description: ability.description,
                            icon: ability.icon,
                            id: ability.id,
                            keybinding: key,
                            name: ability.name,
                            spellId: ability.spellId
                        }
                    }));

                ability.keybindings = newKeybindings;

                this.keybindingUpdated.emit({
                    addedKeybinds,
                    removedKeybinds
                });
            }
        });
    }

    // Get the abilities for the current page
    getAbilitiesForCurrentPage() {
        const startIndex = this.currentPage * this.abilitiesPerPage;
        const endIndex = startIndex + this.abilitiesPerPage;

        if (this.selectedKeybinding?.keybinds.length > 0) {
            // Loop through each keybinding in the selectedKeybinding.keybinds array
            this.selectedKeybinding.keybinds.forEach(keybind => {
                const spellId = keybind.spell.spellId;
                const ability = this.abilities.find(ability => ability.spellId === spellId);

                if (ability) {
                    // Initialize keybindings array if it doesn't exist
                    if (!ability.keybindings) {
                        ability.keybindings = [];
                    }
                    // Add the key if it's not already in the keybindings array
                    if (!ability.keybindings.includes(keybind.key)) {
                        ability.keybindings.push(keybind.key);
                    }
                }
            });
        }

        return this.abilities.slice(startIndex, endIndex);
    }

    // Go to the previous page
    goToPreviousPage() {
        if (this.currentPage > 0) {
            this.currentPage--;
        }
    }

    // Go to the next page
    goToNextPage() {
        if (this.currentPage < this.maxPage()) {
            this.currentPage++;
        }
    }

    // Calculate the maximum page index
    maxPage() {
        return Math.ceil(this.abilities.length / this.abilitiesPerPage) - 1;
    }

    // Get the start index of the current page
    getStartIndex() {
        return this.currentPage * this.abilitiesPerPage;
    }

    // Get the end index of the current page
    getEndIndex() {
        const endIndex = (this.currentPage + 1) * this.abilitiesPerPage;
        return endIndex > this.abilities.length ? this.abilities.length : endIndex;
    }

}
