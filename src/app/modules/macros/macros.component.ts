import { Component, ViewEncapsulation, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil, filter } from 'rxjs';
import { ActivatedRoute, Router, NavigationEnd } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'app/core/auth/auth.service';
import { MacrosHomeComponent } from './components/macros-home/macros-home.component';
import { ViewAllMacrosComponent } from './view-all-macros/view-all-macros.component';
import { MyMacrosComponent } from './my-macros/my-macros.component';
import { ViewMacroComponent } from './view-macro/view-macro.component';

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

        ::ng-deep .success-snackbar {
            background-color: #4caf50 !important;
            color: white !important;
        }

        ::ng-deep .error-snackbar {
            background-color: #f44336 !important;
            color: white !important;
        }
    `],
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatTooltipModule,
        MatSidenavModule,
        MatMenuModule,
        MatSnackBarModule,
        FormsModule,
        MacrosHomeComponent,
        ViewAllMacrosComponent,
        MyMacrosComponent,
        ViewMacroComponent
    ],
})
export class MacrosComponent implements OnInit, OnDestroy {
    @ViewChild(MacrosHomeComponent) macrosHomeComponent: MacrosHomeComponent;
    @ViewChild(ViewAllMacrosComponent) viewAllMacrosComponent: ViewAllMacrosComponent;
    @ViewChild(MyMacrosComponent) myMacrosComponent: MyMacrosComponent;
    @ViewChild(ViewMacroComponent) viewMacroComponent: ViewMacroComponent;

    isAuthenticated: boolean = false;
    isMobile: boolean = false;
    refreshMacros$ = new Subject<void>();
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

    // Selected macro state
    selectedMacro: any = null;
    selectedMacroName: string = '';

    private _unsubscribeAll: Subject<any> = new Subject<any>();


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

        // Listen for navigation events to refresh macros when coming from create route
        this.router.events
            .pipe(
                filter(event => event instanceof NavigationEnd),
                takeUntil(this._unsubscribeAll)
            )
            .subscribe((event: NavigationEnd) => {
                // If navigating to my-macros, trigger a refresh to show newly created macros
                if (event.url.includes('/macros/my-macros')) {
                    // Small delay to ensure the drawer component is ready
                    setTimeout(() => {
                        this.triggerMacroRefresh();
                    }, 100);
                }
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
        this.selectedMacro = macro;
        this.selectedMacroName = macro ? macro.name : '';
        this.macroSelected = !!macro;
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

    triggerMacroRefresh(): void {
        // Emit refresh event to trigger child components to refresh
        this.refreshMacros$.next();
    }
}
