import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { IconPickerComponent } from './components/icon-picker/icon-picker.component';
import { MacroIcon } from './services/macro-icon.service';
import { MacrosHomeComponent } from './components/macros-home/macros-home.component';
import { ViewAllMacrosComponent } from './view-all-macros/view-all-macros.component';
import { MyMacrosComponent } from './my-macros/my-macros.component';
import { ViewMacroComponent } from './view-macro/view-macro.component';
import { MacrosDrawerComponent } from './components/macros-drawer/macros-drawer.component';

@Component({
    selector: 'macros',
    templateUrl: './macros.component.html',
    encapsulation: ViewEncapsulation.None,
    styles: [`
        .no-border {
            border: none !important;
            border-right: none !important;
            border-left: none !important;
            border-top: none !important;
            border-bottom: none !important;
        }
        .no-border.mat-drawer {
            border-right: none !important;
            border-left: none !important;
            border-top: none !important;
            border-bottom: none !important;
        }
        .no-border::before {
            display: none !important;
        }
        .no-border::after {
            display: none !important;
        }
    `],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatChipsModule,
        MatTooltipModule,
        MatSidenavModule,
        MatMenuModule,
        FormsModule,
        IconPickerComponent,
        MacrosHomeComponent,
        ViewAllMacrosComponent,
        MyMacrosComponent,
        ViewMacroComponent,
        MacrosDrawerComponent
    ],
})
export class MacrosComponent implements OnInit, OnDestroy {
    @ViewChild(MacrosHomeComponent) macrosHomeComponent: MacrosHomeComponent;
    @ViewChild(ViewAllMacrosComponent) viewAllMacrosComponent: ViewAllMacrosComponent;
    @ViewChild(MyMacrosComponent) myMacrosComponent: MyMacrosComponent;
    @ViewChild(ViewMacroComponent) viewMacroComponent: ViewMacroComponent;
    @ViewChild(MacrosDrawerComponent) macrosDrawerComponent: MacrosDrawerComponent;

    isAuthenticated: boolean = false;
    isMobile: boolean = false;
    refreshMacros: boolean = false;
    isHomeRoute: boolean = false;
    isViewAllRoute: boolean = false;
    isMyMacrosRoute: boolean = false;
    isCreateRoute: boolean = false;
    isViewMacroRoute: boolean = false;

    // Drawer state
    drawerOpened: boolean = false;
    showDrawer: boolean = false;

    // Action button state
    macroSelected: boolean = false;
    canDuplicate: boolean = true;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    // Create macro form properties
    selectedIcon: MacroIcon | null = null;
    macroName = '';
    macroDescription = '';
    macroText = '';
    selectedClass = '';
    selectedSpec = '';
    tags: string[] = [];

    /**
     * Constructor
     */
    constructor(
        private _authService: AuthService,
        private route: ActivatedRoute,
        private router: Router
    ) { }

    ngOnInit(): void {
        // Check if device is mobile
        this.checkMobile();

        // Subscribe to authentication status
        this._authService.check()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((authenticated) => {
                this.isAuthenticated = authenticated;
                this.updateDrawerState();
            });

        // Subscribe to route changes
        this.route.url
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe(url => {
                const path = url.map(segment => segment.path).join('/');
                this.isHomeRoute = path === '' || path === 'view-all';
                this.isViewAllRoute = path === 'view-all';
                this.isMyMacrosRoute = path === 'my-macros';
                this.isCreateRoute = path === 'create';
                this.isViewMacroRoute = url.length > 0 && url[0].path !== 'view-all' && url[0].path !== 'my-macros' && url[0].path !== 'create';

                // Control drawer visibility and state
                this.updateDrawerState();
            });

        // Initialize drawer state
        this.updateDrawerState();
    }

    ngOnDestroy(): void {
        this._unsubscribeAll.next(null);
        this._unsubscribeAll.complete();
    }

    checkMobile(): void {
        this.isMobile = window.innerWidth < 768;
        window.addEventListener('resize', () => {
            this.isMobile = window.innerWidth < 768;
        });
    }

    onIconSelected(icon: MacroIcon | null) {
        this.selectedIcon = icon;
    }

    addTag(tag: string) {
        if (tag.trim() && !this.tags.includes(tag.trim())) {
            this.tags.push(tag.trim());
        }
    }

    removeTag(tag: string) {
        this.tags = this.tags.filter(t => t !== tag);
    }

    saveMacro() {
        // TODO: Implement macro saving logic
        console.log('Saving macro:', {
            name: this.macroName,
            description: this.macroDescription,
            text: this.macroText,
            class: this.selectedClass,
            spec: this.selectedSpec,
            tags: this.tags,
            icon: this.selectedIcon
        });
    }

    updateDrawerState(): void {
        // Show drawer only on my-macros route and only if authenticated
        this.showDrawer = this.isMyMacrosRoute && this.isAuthenticated;

        // Open drawer automatically when navigating to my-macros (if authenticated)
        if (this.isMyMacrosRoute && this.isAuthenticated) {
            this.drawerOpened = true;
        } else {
            this.drawerOpened = false;
        }
    }

    toggleDrawer(): void {
        this.drawerOpened = !this.drawerOpened;
    }

    onMacroSelected(macro: any): void {
        console.log('Macro selected:', macro);
        // Handle macro selection if needed
    }

    onCreateNewMacro(): void {
        this.router.navigate(['/macros/create']);
    }

    onDeleteMacro(): void {
        // This will be handled by the my-macros component
        if (this.myMacrosComponent) {
            this.myMacrosComponent.onDeleteMacro();
        }
    }

    onDuplicateMacro(): void {
        // This will be handled by the my-macros component
        if (this.myMacrosComponent) {
            this.myMacrosComponent.onDuplicateMacro();
        }
    }

    onShareMacro(): void {
        // This will be handled by the my-macros component
        if (this.myMacrosComponent) {
            this.myMacrosComponent.onShareMacro();
        }
    }
}
