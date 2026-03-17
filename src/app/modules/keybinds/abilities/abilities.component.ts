import { Component, ViewEncapsulation, OnInit, EventEmitter, Output, Input, SimpleChanges, ViewChild, ElementRef, AfterViewInit, OnDestroy, NgZone, ChangeDetectorRef, HostListener } from '@angular/core';

// Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';

// Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AbilitiesService } from 'app/core/services/abilities.service';
import { VersionCompareService } from 'app/core/services/version-compare.service';

// Components
import { ConfirmDialogComponent } from '../../../core/components/confirm-dialog.component';
import { AbilityDialogComponent } from './ability-dialog/ability-dialog.component';

// Data
import { classes, fullClasses } from 'app/core/data/classes';

// Interfaces
import { Keybinding } from 'app/core/types/keybinding';
import { Ability } from 'app/core/types/ability';
import { Keybind } from 'app/core/types/keybind';

@Component({
    selector: 'abilities',
    templateUrl: './abilities.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    host: {
        class: 'block w-full min-w-0',
    },
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
export class AbilitiesComponent implements OnInit, AfterViewInit, OnDestroy {

    isDisabled = true;

    @Input() keybindingSelected: boolean = false;
    @Input() selectedKeybinding: Keybinding;
    @Input() drawerOpen: boolean = true;

    selectedKeybindingClass: string;
    selectedKeybindingSpec: string;
    selectedKeybindingHeroTalent: string;
    selectedKeybindingRace: string;

    abilities: Ability[] = [];
    private isFetchingAbilities = false;
    private currentFetchKeybindingId: string | null = null;

    classes = classes;
    specs: string[] = [];
    heroTalents: string[] = [];
    races: string[] = [
        'Human',
        'Dwarf',
        'Night Elf',
        'Gnome',
        'Draenei',
        'Worgen',
        'Pandaren',
        'Void Elf',
        'Lightforged Draenei',
        'Dark Iron Dwarf',
        'Kul Tiran',
        'Mechagnome',
        'Orc',
        'Undead',
        'Tauren',
        'Troll',
        'Blood Elf',
        'Goblin',
        'Highmountain Tauren',
        'Nightborne',
        'Mag\'har Orc',
        'Zandalari Troll',
        'Vulpera',
        'Dracthyr',
    ];
    private readonly RACIAL_PLACEHOLDER_ID_1 = 'racial:placeholder:1';
    private readonly RACIAL_PLACEHOLDER_ID_2 = 'racial:placeholder:2';
    private readonly professionIconByName: Record<string, string> = {
        alchemy: 'https://wow.zamimg.com/images/wow/icons/large/trade_alchemy.jpg',
        blacksmithing: 'https://wow.zamimg.com/images/wow/icons/large/trade_blacksmithing.jpg',
        enchanting: 'https://wow.zamimg.com/images/wow/icons/large/trade_engraving.jpg',
        engineering: 'https://wow.zamimg.com/images/wow/icons/large/trade_engineering.jpg',
        herbalism: 'https://wow.zamimg.com/images/wow/icons/large/trade_herbalism.jpg',
        inscription: 'https://wow.zamimg.com/images/wow/icons/large/inv_inscription_tradeskill01.jpg',
        jewelcrafting: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_gem_01.jpg',
        leatherworking: 'https://wow.zamimg.com/images/wow/icons/large/trade_leatherworking.jpg',
        mining: 'https://wow.zamimg.com/images/wow/icons/large/trade_mining.jpg',
        skinning: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_pelt_wolf_01.jpg',
        tailoring: 'https://wow.zamimg.com/images/wow/icons/large/trade_tailoring.jpg',
        cooking: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_food_15.jpg',
        fishing: 'https://wow.zamimg.com/images/wow/icons/large/trade_fishing.jpg',
        archaeology: 'https://wow.zamimg.com/images/wow/icons/large/trade_archaeology.jpg',
    };

    @Output() selectionClassChanged = new EventEmitter<string>();
    @Output() keybindingUpdated = new EventEmitter<any>();
    @Output() abilitiesLoaded = new EventEmitter<Ability[]>();

    // ─────────────────────────────────────────────────────────────────────────
    // Pagination State
    // ─────────────────────────────────────────────────────────────────────────
    currentPage = 0;
    iconsPerPage = 1;

    @ViewChild('iconRowContainer') set iconRowContainerRef(el: ElementRef<HTMLDivElement> | undefined) {
        if (el?.nativeElement) {
            this._iconRowContainer = el.nativeElement;
            this.setupResizeObserver();
        } else {
            this._iconRowContainer = null;
            this.resizeObserver?.disconnect();
            this.resizeObserver = null;
        }
    }
    private _iconRowContainer: HTMLDivElement | null = null;

    private readonly ICON_WIDTH = 48;
    private resizeObserver: ResizeObserver | null = null;
    private readonly spellNameAliases: Record<string, string[]> = {
        eternalflame: ['wordofglory'],
        wordofglory: ['eternalflame'],
        judgment: ['judgement'],
        judgement: ['judgment'],
        blessingoffreedom: ['handoffreedom', 'bof', 'freedom'],
        handoffreedom: ['blessingoffreedom', 'bof', 'freedom'],
        blessingofsacrifice: ['handofsacrifice', 'bos', 'sacrifice', 'sac'],
        handofsacrifice: ['blessingofsacrifice', 'bos', 'sacrifice', 'sac'],
    };

    /** Drawer width (Tailwind w-80 = 20rem = 320px) – used for viewport cap when drawer is open. */
    private static readonly DRAWER_WIDTH_PX = 320;

    /** sm breakpoint (600px): desktop abilities row appears; recalc so it resizes correctly. */
    private static readonly SM_BREAKPOINT_PX = 600;
    private smMediaQuery: MediaQueryList | null = null;
    private smMediaQueryListener: (() => void) | null = null;

    constructor(
        private keybindingService: KeybindingService,
        private abilitiesService: AbilitiesService,
        private versionCompare: VersionCompareService,
        private dialog: MatDialog,
        private ngZone: NgZone,
        private cdr: ChangeDetectorRef
    ) {}

    // ─────────────────────────────────────────────────────────────────────────
    // Lifecycle Hooks
    // ─────────────────────────────────────────────────────────────────────────

    ngOnInit(): void {
        // Pagination calculation happens after view init
    }

    ngAfterViewInit(): void {
        this.setupSmBreakpointListener();
    }

    ngOnDestroy(): void {
        this.resizeObserver?.disconnect();
        this.resizeObserver = null;
        if (this.smMediaQuery && this.smMediaQueryListener) {
            this.smMediaQuery.removeEventListener('change', this.smMediaQueryListener);
        }
        this.smMediaQuery = null;
        this.smMediaQueryListener = null;
    }

    /** When crossing 600px (sm), recalc so desktop abilities row resizes (e.g. from mobile back to desktop). */
    private setupSmBreakpointListener(): void {
        const bp = AbilitiesComponent.SM_BREAKPOINT_PX;
        this.smMediaQuery = window.matchMedia(`(min-width: ${bp}px)`);
        this.smMediaQueryListener = () => {
            setTimeout(() => {
                this.recalculateIconsPerPage();
                this.cdr.detectChanges();
            }, 100);
        };
        this.smMediaQuery.addEventListener('change', this.smMediaQueryListener);
    }

    @HostListener('window:resize')
    onWindowResize(): void {
        // Only recalc when desktop abilities row is visible (>= sm 600px); mobile uses horizontal scroll.
        if (window.innerWidth < AbilitiesComponent.SM_BREAKPOINT_PX) return;
        const runRecalc = () => {
            this.recalculateIconsPerPage();
            this.cdr.detectChanges();
        };
        // Run after layout settles so the arrow doesn't disappear during resize.
        setTimeout(runRecalc, 0);
        setTimeout(runRecalc, 150);
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Resize Observer & Pagination
    // ─────────────────────────────────────────────────────────────────────────

    private setupResizeObserver(): void {
        const container = this._iconRowContainer;
        if (!container) return;

        if (this.resizeObserver) {
            this.resizeObserver.disconnect();
        }

        this.resizeObserver = new ResizeObserver(() => {
            this.ngZone.run(() => {
                this.recalculateIconsPerPage();
                this.cdr.detectChanges();
            });
        });
        this.resizeObserver.observe(container);
    }

    private recalculateIconsPerPage(): void {
        // Only recalc when desktop abilities row is visible (>= sm 600px); mobile uses horizontal scroll.
        if (window.innerWidth < AbilitiesComponent.SM_BREAKPOINT_PX) return;

        const container = this._iconRowContainer;
        if (!container || !this.abilities?.length) return;

        const row = container.parentElement;
        if (!row) return;

        const rowWidth = row.getBoundingClientRect().width;
        const viewportPx = window.innerWidth;
        // Cap by viewport so we recalc on resize; when drawer is open, content area = viewport - drawer.
        const paddingEtc = 80;
        let viewportCap = this.drawerOpen
            ? Math.max(0, viewportPx - AbilitiesComponent.DRAWER_WIDTH_PX - paddingEtc)
            : Math.max(0, viewportPx - 100);
        // Stricter cap when viewport is small; at 600px (mobile/sm) show a lot fewer abilities.
        const tooSmallThresholdPx = 1100;
        const mobileThresholdPx = 700; // sm breakpoint is 600px; desktop row appears there but show fewer abilities
        let extraOffset = 0;
        if (viewportPx < mobileThresholdPx) {
            extraOffset = 280; // show a lot fewer abilities on mobile (600px range)
        } else if (viewportPx < tooSmallThresholdPx) {
            extraOffset = 120;
        }
        if (extraOffset > 0) {
            viewportCap = Math.min(viewportCap, Math.max(0, viewportPx - extraOffset));
        }
        const effectiveRowWidth = rowWidth > 0 ? Math.min(rowWidth, viewportCap) : viewportCap;

        const buttonsAndGaps = 32 + 8 + 32 + 8;
        const roundingBuffer = viewportPx < tooSmallThresholdPx ? 8 : 0;
        const arrowReserve = viewportPx < tooSmallThresholdPx ? this.ICON_WIDTH : 0;
        const availableWidth = Math.max(0, effectiveRowWidth - buttonsAndGaps - roundingBuffer - arrowReserve);
        if (availableWidth <= 0) return;

        const firstVisibleIndex = this.currentPage * this.iconsPerPage;
        const renderedIcons = container.querySelectorAll('img');
        let iconWidth = this.ICON_WIDTH;
        if (renderedIcons.length >= 2) {
            const first = renderedIcons[0].getBoundingClientRect();
            const second = renderedIcons[1].getBoundingClientRect();
            iconWidth = second.left - first.left;
        }

        const maxPossible = Math.floor(availableWidth / iconWidth);
        let newIconsPerPage = Math.max(1, maxPossible);
        // Cap abilities per page on mobile (600px) so we don't overcrowd.
        if (viewportPx < mobileThresholdPx) {
            newIconsPerPage = Math.min(newIconsPerPage, 5);
        }

        // Only update when value actually changes.
        // This avoids resize loops and the count "resetting" when the container size flickers.
        if (newIconsPerPage !== this.iconsPerPage) {
            this.iconsPerPage = newIconsPerPage;
            this.currentPage = Math.min(
                Math.floor(firstVisibleIndex / this.iconsPerPage),
                this.maxPage
            );
            this.cdr.detectChanges();
        }
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Pagination Computed Properties & Methods
    // ─────────────────────────────────────────────────────────────────────────

    get totalPages(): number {
        if (!this.abilities?.length || !this.iconsPerPage) return 1;
        return Math.ceil(this.abilities.length / this.iconsPerPage);
    }

    get maxPage(): number {
        return Math.max(0, this.totalPages - 1);
    }

    get showPagination(): boolean {
        return this.abilities?.length > this.iconsPerPage;
    }

    get visibleAbilities(): Ability[] {
        if (!this.abilities?.length) return [];

        const startIndex = this.currentPage * this.iconsPerPage;
        const endIndex = startIndex + this.iconsPerPage;

        this.syncKeybindingsToAbilities();
        return this.abilities.slice(startIndex, endIndex);
    }

    get startIndex(): number {
        return this.currentPage * this.iconsPerPage;
    }

    get endIndex(): number {
        return Math.min((this.currentPage + 1) * this.iconsPerPage, this.abilities?.length || 0);
    }

    goToPreviousPage(): void {
        if (this.currentPage > 0) {
            this.currentPage--;
        }
    }

    goToNextPage(): void {
        if (this.currentPage < this.maxPage) {
            this.currentPage++;
        }
    }

    private syncKeybindingsToAbilities(): void {
        if (!this.selectedKeybinding?.keybinds?.length) return;

        this.selectedKeybinding.keybinds.forEach(keybind => {
            const keybindSpellId = String(keybind?.spell?.spellId || keybind?.spell?.sourceSpellId || '');
            const keybindSpellName = this.normalizeSpellName(String(keybind?.spell?.name || keybind?.spell?.sourceSpellName || ''));
            const ability = this.abilities.find((a) => {
                const abilitySpellId = String(a?.spellId || '');
                const abilityName = this.normalizeSpellName(String(a?.name || ''));
                return (abilitySpellId !== '' && keybindSpellId !== '' && abilitySpellId === keybindSpellId)
                    || (abilityName !== '' && keybindSpellName !== '' && abilityName === keybindSpellName);
            });
            if (ability) {
                ability.keybindings = ability.keybindings || [];
                if (!ability.keybindings.includes(keybind.key)) {
                    ability.keybindings.push(keybind.key);
                }
            }
        });
    }

    // ─────────────────────────────────────────────────────────────────────────
    // Helper Methods
    // ─────────────────────────────────────────────────────────────────────────

    private getClassKey(className: string): string {
        return className.toLowerCase().replace(/\s+/g, '');
    }

    private triggerPaginationRecalculation(): void {
        this.cdr.detectChanges();
        // Container is inside @if (abilities?.length > 0); after detectChanges() the view
        // updates and ViewChild setter runs with the new element, which calls setupResizeObserver().
        // Run recalculate after a tick so the container is measured.
        setTimeout(() => {
            this.recalculateIconsPerPage();
            this.cdr.detectChanges();
        }, 50);
    }

    ngOnChanges(changes: SimpleChanges) {
        if (changes['drawerOpen'] && this.abilities?.length) {
            setTimeout(() => {
                this.recalculateIconsPerPage();
                this.cdr.detectChanges();
            }, 100);
        }
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
                    this.selectedKeybindingRace = (this.selectedKeybinding as any).race || '';
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
                    this.selectedKeybindingRace = (this.selectedKeybinding as any).race || '';

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
                    this.selectedKeybindingRace = '';
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
                this.selectedKeybindingRace = '';
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

    onRaceChange(event: any) {
        const selectedOption = event.value;
        this.selectedKeybindingRace = selectedOption;
        // Keep local state in selected keybinding for future racial filtering support.
        if (this.selectedKeybinding) {
            (this.selectedKeybinding as any).race = selectedOption || undefined;
        }
        this.abilities = this.ensureRacialPlaceholderAbilityForSelectedKeybinding(this.abilities || []);
        this.triggerPaginationRecalculation();
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
            const fetchedAbilities = Array.isArray(data) ? data : [];
            console.log('Abilities fetched from backend:', fetchedAbilities.length, 'abilities');

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
            fetchedAbilities.forEach((ability: Ability) => {
                const matchedKeybinds = this.selectedKeybinding.keybinds.filter((keybind) =>
                    this.spellReferencesAbility((keybind as any)?.spell || {}, ability)
                );
                ability.keybindings = matchedKeybinds.map((keybind) => keybind.key);
                ability.macroKeybindings = matchedKeybinds
                    .filter((keybind) =>
                        this.getSpellReferenceType((keybind as any)?.spell || {}, ability) === 'macro'
                    )
                    .map((keybind) => keybind.key);
            });
            const mergedAbilities = this.mergeSupplementalKeyboundAbilities(fetchedAbilities);
            this.abilities = this.ensureRacialPlaceholderAbilityForSelectedKeybinding(mergedAbilities);
            this.abilitiesLoaded.emit(this.abilities);
            console.log('Abilities set in component:', this.abilities.length);
            this.isFetchingAbilities = false;

            // Recalculate pagination after abilities are loaded
            this.currentPage = 0; // Reset to first page for new abilities
            this.triggerPaginationRecalculation();
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
                const selectedMacro = result?.macro || null;
                const buildSpellPayload = (key: string): Keybind['spell'] => {
                    if (selectedMacro) {
                        const macroId = selectedMacro.macroId || (selectedMacro.macroName || 'macro');
                        return {
                            key: selectedMacro.macroName || `${ability.name} Macro`,
                            description: selectedMacro.macroText || ability.description,
                            icon: selectedMacro.icon || ability.icon,
                            id: macroId,
                            keybinding: key,
                            name: selectedMacro.macroName || `${ability.name} Macro`,
                            spellId: `macro:${macroId}`,
                            actionType: 'macro' as const,
                            isMacro: true,
                            macroId,
                            macroText: selectedMacro.macroText || '',
                            sourceSpellId: ability.spellId,
                            sourceSpellName: ability.name,
                        };
                    }
                    return {
                        key: ability.name,
                        description: ability.description,
                        icon: ability.icon,
                        id: ability.id,
                        keybinding: key,
                        name: ability.name,
                        spellId: ability.spellId,
                        actionType: 'spell' as const,
                        isMacro: false,
                        sourceSpellId: ability.spellId,
                        sourceSpellName: ability.name,
                    };
                };

                // Handle removed keybindings
                const removedKeybinds: { key: string; spell: Keybind['spell'] }[] = oldKeybindings
                    .filter(key => !newKeybindings.includes(key))
                    .map(key => ({
                        key,
                        spell: buildSpellPayload(key)
                    }));

                // Handle added keybindings
                const addedKeybinds: { key: string; spell: Keybind['spell'] }[] = newKeybindings
                    .filter(key => !oldKeybindings.includes(key))
                    .map(key => ({
                        key,
                        spell: buildSpellPayload(key)
                    }));

                // If key remains but action type changed (spell <-> macro), treat it as remove+add.
                const unchangedKeys = newKeybindings.filter((key) => oldKeybindings.includes(key));
                unchangedKeys.forEach((key) => {
                    const existing = this.selectedKeybinding?.keybinds?.find((kb) =>
                        kb.key === key && this.spellReferencesAbility((kb as any)?.spell || {}, ability)
                    );
                    if (!existing) return;
                    const existingIsMacro = existing.spell?.isMacro === true
                        || existing.spell?.actionType === 'macro'
                        || String(existing.spell?.spellId || '').startsWith('macro:');
                    const desiredIsMacro = !!selectedMacro;
                    if (existingIsMacro !== desiredIsMacro) {
                        removedKeybinds.push({ key, spell: existing.spell as Keybind['spell'] });
                        addedKeybinds.push({ key, spell: buildSpellPayload(key) });
                    }
                });

                ability.keybindings = newKeybindings;

                this.keybindingUpdated.emit({
                    addedKeybinds,
                    removedKeybinds
                });
            }
        });
    }

    private normalizeSpellName(value: string): string {
        return String(value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }

    private getSpellNameCandidates(name: string): Set<string> {
        const normalized = this.normalizeSpellName(name);
        const out = new Set<string>();
        if (!normalized) return out;
        out.add(normalized);
        (this.spellNameAliases[normalized] || []).forEach((alias) => out.add(alias));
        return out;
    }

    private getSpellReferenceType(spell: any, ability: Ability): 'none' | 'direct' | 'macro' {
        const directSpellId = String(spell?.spellId || spell?.spell_id || '');
        const sourceSpellId = String(spell?.sourceSpellId || spell?.source_spell_id || '');
        const sourceSpellName = this.normalizeSpellName(String(spell?.sourceSpellName || spell?.source_spell_name || ''));
        const abilitySpellId = String((ability as any)?.spellId || '');
        const abilityNameCandidates = this.getSpellNameCandidates(String((ability as any)?.name || ''));

        const actionType = String(spell?.actionType || spell?.action_type || '').toLowerCase();
        const isMacro = spell?.isMacro === true || actionType === 'macro' || directSpellId.startsWith('macro:');
        const directMatch = (directSpellId !== '' && directSpellId === abilitySpellId)
            || (sourceSpellId !== '' && sourceSpellId === abilitySpellId)
            || (sourceSpellName !== '' && abilityNameCandidates.has(sourceSpellName));

        if (!isMacro) {
            return directMatch ? 'direct' : 'none';
        }

        const macroTextRaw = String(spell?.macroText || spell?.macro_text || spell?.text || spell?.body || '');
        const macroTextNormalized = this.normalizeSpellName(macroTextRaw);
        const macroDisplayNameNormalized = this.normalizeSpellName(String(spell?.name || ''));
        const macroIdMatch = abilitySpellId !== '' && macroTextRaw.includes(String(abilitySpellId));
        let macroNameMatch = false;
        for (const candidate of abilityNameCandidates) {
            if (
                candidate !== ''
                && (macroTextNormalized.includes(candidate) || macroDisplayNameNormalized.includes(candidate))
            ) {
                macroNameMatch = true;
                break;
            }
        }
        if (directMatch || macroIdMatch || macroNameMatch) return 'macro';
        return 'none';
    }

    private spellReferencesAbility(spell: any, ability: Ability): boolean {
        return this.getSpellReferenceType(spell, ability) !== 'none';
    }

    private mergeSupplementalKeyboundAbilities(baseAbilities: Ability[]): Ability[] {
        const merged = [...baseAbilities];
        const isAddonImported = this.isSelectedKeybindingFromAddonImport();
        const existingBySpellId = new Set(
            merged
                .map((ability) => String(ability?.spellId || ''))
                .filter((spellId) => spellId !== '')
        );
        const existingByName = new Set(
            merged
                .map((ability) => this.normalizeSpellName(String(ability?.name || '')))
                .filter((name) => name !== '')
        );
        const supplementalById = new Map<string, Ability>();

        const keybinds = Array.isArray(this.selectedKeybinding?.keybinds)
            ? this.selectedKeybinding.keybinds
            : [];

        keybinds.forEach((keybind) => {
            const spell = (keybind as any)?.spell || {};
            const actionType = String(spell?.actionType || spell?.action_type || 'spell').toLowerCase();
            const isMacro = spell?.isMacro === true || actionType === 'macro' || String(spell?.spellId || '').startsWith('macro:');
            if (isMacro) return;

            const rawSpellId = String(spell?.spellId || spell?.sourceSpellId || spell?.spell_id || spell?.source_spell_id || '').trim();
            const normalizedName = this.normalizeSpellName(String(spell?.sourceSpellName || spell?.name || ''));
            if (rawSpellId.startsWith('item:') || rawSpellId.startsWith('mount:') || rawSpellId.startsWith('toy:')) return;
            if (this.isProfessionName(normalizedName) && !isAddonImported) return;
            if (!rawSpellId && !normalizedName) return;
            if (rawSpellId && existingBySpellId.has(rawSpellId)) return;
            if (normalizedName && existingByName.has(normalizedName)) return;

            const candidateId = rawSpellId || `supplemental:${normalizedName}`;
            const displayName = String(spell?.name || spell?.sourceSpellName || 'Unknown Ability');
            const resolvedIcon = this.resolveSupplementalIcon(spell, normalizedName);
            const description = this.getSupplementalDescription(normalizedName);

            const existing = supplementalById.get(candidateId);
            if (!existing) {
                supplementalById.set(candidateId, {
                    id: `supplemental-${candidateId}`,
                    spellId: candidateId,
                    name: displayName,
                    description,
                    power: 0,
                    icon: resolvedIcon,
                    keybindings: keybind?.key ? [keybind.key] : [],
                    macroKeybindings: [],
                    class: this.selectedKeybindingClass,
                    spec: this.selectedKeybindingSpec,
                    heroTalent: this.selectedKeybindingHeroTalent,
                    abilityType: 'supplemental',
                });
                return;
            }

            if (keybind?.key && !existing.keybindings.includes(keybind.key)) {
                existing.keybindings.push(keybind.key);
            }
        });

        supplementalById.forEach((ability) => merged.push(ability));
        return merged;
    }

    private ensureRacialPlaceholderAbility(abilities: Ability[]): Ability[] {
        const list = Array.isArray(abilities) ? [...abilities] : [];
        const hasSelectedRace = String(this.selectedKeybindingRace || '').trim() !== '';
        const isPlaceholder = (ability: Ability) => {
            const spellId = String(ability?.spellId || '');
            return spellId === this.RACIAL_PLACEHOLDER_ID_1 || spellId === this.RACIAL_PLACEHOLDER_ID_2;
        };

        if (hasSelectedRace) {
            return list.filter((ability) => !isPlaceholder(ability));
        }

        const baseList = list.filter((ability) => !isPlaceholder(ability));
        const selectedKeybinds = Array.isArray(this.selectedKeybinding?.keybinds) ? this.selectedKeybinding.keybinds : [];
        const buildPlaceholder = (spellId: string, label: string): Ability => {
            const keys = selectedKeybinds
                .filter((kb) => String((kb as any)?.spell?.spellId || '') === spellId)
                .map((kb) => kb.key)
                .filter((key) => !!key);
            return {
                id: `supplemental-${spellId}`,
                spellId,
                name: label,
                description: 'Generic racial ability placeholder when race is not selected.',
                power: 0,
                icon: 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg',
                keybindings: keys,
                macroKeybindings: [],
                class: this.selectedKeybindingClass,
                spec: this.selectedKeybindingSpec,
                heroTalent: this.selectedKeybindingHeroTalent,
                abilityType: 'racial',
            };
        };

        baseList.push(buildPlaceholder(this.RACIAL_PLACEHOLDER_ID_1, 'Racial Ability 1'));
        baseList.push(buildPlaceholder(this.RACIAL_PLACEHOLDER_ID_2, 'Racial Ability 2'));
        return baseList;
    }

    private ensureLegacySingleRacialPlaceholderMigration(keybinds: Keybind[]): void {
        if (!Array.isArray(keybinds)) return;
        keybinds.forEach((kb) => {
            const spellId = String((kb as any)?.spell?.spellId || '');
            if (spellId === 'racial:placeholder') {
                (kb as any).spell.spellId = this.RACIAL_PLACEHOLDER_ID_1;
                if (!(kb as any).spell.name || (kb as any).spell.name === 'Racial Ability') {
                    (kb as any).spell.name = 'Racial Ability 1';
                }
            }
        });
    }

    private ensureRacialPlaceholderAbilityForSelectedKeybinding(abilities: Ability[]): Ability[] {
        const keybinds = Array.isArray(this.selectedKeybinding?.keybinds) ? this.selectedKeybinding.keybinds : [];
        this.ensureLegacySingleRacialPlaceholderMigration(keybinds);
        return this.ensureRacialPlaceholderAbility(abilities);
    }

    private isRenderableIcon(icon: string): boolean {
        const value = String(icon || '').trim();
        if (!value) return false;
        return value.startsWith('http://')
            || value.startsWith('https://')
            || value.startsWith('assets/')
            || value.startsWith('/')
            || value.startsWith('data:');
    }

    private isProfessionName(normalizedName: string): boolean {
        return !!this.professionIconByName[normalizedName];
    }

    private resolveSupplementalIcon(spell: any, normalizedName: string): string {
        const rawIcon = String(spell?.icon || '').trim();
        if (this.isRenderableIcon(rawIcon)) {
            return rawIcon;
        }

        // Addon exports often send numeric WoW fileData IDs for icons.
        if (/^\d+$/.test(rawIcon)) {
            return `https://render.worldofwarcraft.com/us/icons/56/${rawIcon}.jpg`;
        }

        if (this.professionIconByName[normalizedName]) {
            return this.professionIconByName[normalizedName];
        }

        return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
    }

    private getSupplementalDescription(normalizedName: string): string {
        if (this.isProfessionName(normalizedName)) {
            return 'Profession ability';
        }
        return 'Imported keybound ability';
    }

    private isSelectedKeybindingFromAddonImport(): boolean {
        const keybinding = this.selectedKeybinding as any;
        if (keybinding?.__fromAddonImport === true) {
            return true;
        }
        const keybindingId = String(this.selectedKeybinding?.keybindingId || '');
        if (!keybindingId || typeof localStorage === 'undefined') {
            return false;
        }
        try {
            const raw = localStorage.getItem('wowkeybAddonImportedKeybindings');
            if (!raw) return false;
            const ids = JSON.parse(raw);
            return Array.isArray(ids) && ids.includes(keybindingId);
        } catch {
            return false;
        }
    }

}
