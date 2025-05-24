import { Route } from '@angular/router';
import { initialDataResolver } from 'app/app.resolvers';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { NoAuthGuard } from 'app/core/auth/guards/noAuth.guard';
import { LayoutComponent } from 'app/layout/layout.component';

// prettier-ignore
/* eslint-disable max-len */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const appRoutes: Route[] = [

    // Redirect empty path to '/home'
    { path: '', pathMatch: 'full', redirectTo: 'home' },

    // Redirect signed-in user to the '/home'
    //
    // After the user signs in, the sign-in page will redirect the user to the 'signed-in-redirect'
    // path. Below is another redirection for that path to redirect the user to the desired
    // location. This is a small convenience to keep all main routes together here on this file.
    {
        path: 'signed-in-redirect',
        pathMatch: 'full',
        redirectTo: 'home'
    },

    // Auth routes for guests
    {
        path: '',
        canActivate: [NoAuthGuard],
        canActivateChild: [NoAuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'confirmation', loadChildren: () => import('app/modules/auth/confirmation/confirmation.routes') },
            { path: 'confirmation-required', loadChildren: () => import('app/modules/auth/confirmation-required/confirmation-required.routes') },
            { path: 'forgot-password', loadChildren: () => import('app/modules/auth/forgot-password/forgot-password.routes') },
            { path: 'reset-password', loadChildren: () => import('app/modules/auth/reset-password/reset-password.routes') },
            { path: 'sign-in', loadChildren: () => import('app/modules/auth/sign-in/sign-in.routes') },
            { path: 'sign-up', loadChildren: () => import('app/modules/auth/sign-up/sign-up.routes') }
        ]
    },

    // Auth routes for authenticated users
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        data: {
            layout: 'empty'
        },
        children: [
            { path: 'sign-out', loadChildren: () => import('app/modules/auth/sign-out/sign-out.routes') },
            { path: 'unlock-session', loadChildren: () => import('app/modules/auth/unlock-session/unlock-session.routes') }
        ]
    },

    // Landing routes
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'modern'
        },
        children: [
            { path: 'home', loadChildren: () => import('app/modules/landing/home/home.routes') },
        ]
    },
    // Maintenance
    { path: 'maintenance', loadChildren: () => import('app/modules/admin/pages/maintenance/maintenance.routes') },

    // Keybinds
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'modern'
        },
        children: [{ path: 'keybinds', loadChildren: () => import('app/modules/keybinds/keybinds.routes') },
        ]
    },
    // Macros
    {
        path: '',
        component: LayoutComponent,
        data: {
            layout: 'modern'
        },
        // Coming Soon
        children: [
            { path: 'macros', loadChildren: () => import('app/modules/macros/macros.routes') },
        ]
    },

    // Admin routes
    {
        path: '',
        canActivate: [AuthGuard],
        canActivateChild: [AuthGuard],
        component: LayoutComponent,
        resolve: {
            initialData: initialDataResolver
        },
        children: [

            // Dashboards
            // {
            //     path: 'dashboards', children: [
            //         { path: 'project', loadChildren: () => import('app/modules/admin/dashboards/project/project.routes') },
            //         { path: 'analytics', loadChildren: () => import('app/modules/admin/dashboards/analytics/analytics.routes') },
            //         { path: 'finance', loadChildren: () => import('app/modules/admin/dashboards/finance/finance.routes') },
            //         { path: 'crypto', loadChildren: () => import('app/modules/admin/dashboards/crypto/crypto.routes') },
            //     ]
            // },

            // Apps
            // {
            //     path: 'apps', children: [
            //         { path: 'academy', loadChildren: () => import('app/modules/admin/apps/academy/academy.routes') },
            //         { path: 'chat', loadChildren: () => import('app/modules/admin/apps/chat/chat.routes') },
            //         { path: 'contacts', loadChildren: () => import('app/modules/admin/apps/contacts/contacts.routes') },
            //         { path: 'ecommerce', loadChildren: () => import('app/modules/admin/apps/ecommerce/ecommerce.routes') },
            //         { path: 'file-manager', loadChildren: () => import('app/modules/admin/apps/file-manager/file-manager.routes') },
            //         { path: 'help-center', loadChildren: () => import('app/modules/admin/apps/help-center/help-center.routes') },
            //         { path: 'mailbox', loadChildren: () => import('app/modules/admin/apps/mailbox/mailbox.routes') },
            //         { path: 'notes', loadChildren: () => import('app/modules/admin/apps/notes/notes.routes') },
            //         { path: 'scrumboard', loadChildren: () => import('app/modules/admin/apps/scrumboard/scrumboard.routes') },
            //         { path: 'tasks', loadChildren: () => import('app/modules/admin/apps/tasks/tasks.routes') },
            //     ]
            // },

            // Pages
            {
                path: 'pages', children: [

                    // Authentication
                    { path: 'authentication', loadChildren: () => import('app/modules/admin/pages/authentication/authentication.routes') },

                    // Coming Soon
                    { path: 'coming-soon', loadChildren: () => import('app/modules/admin/pages/coming-soon/coming-soon.routes') },

                    // Error
                    {
                        path: 'error', children: [
                            { path: '404', loadChildren: () => import('app/modules/admin/pages/error/error-404/error-404.routes') },
                            { path: '500', loadChildren: () => import('app/modules/admin/pages/error/error-500/error-500.routes') }
                        ]
                    },

                    // Invoice
                    // {
                    //     path: 'invoice', children: [
                    //         {
                    //             path: 'printable', children: [
                    //                 { path: 'compact', loadChildren: () => import('app/modules/admin/pages/invoice/printable/compact/compact.routes') },
                    //                 { path: 'modern', loadChildren: () => import('app/modules/admin/pages/invoice/printable/modern/modern.routes') }
                    //             ]
                    //         }
                    //     ]
                    // },

                    // Pricing
                    // {
                    //     path: 'pricing', children: [
                    //         { path: 'modern', loadChildren: () => import('app/modules/admin/pages/pricing/modern/modern.routes') },
                    //         { path: 'simple', loadChildren: () => import('app/modules/admin/pages/pricing/simple/simple.routes') },
                    //         { path: 'single', loadChildren: () => import('app/modules/admin/pages/pricing/single/single.routes') },
                    //         { path: 'table', loadChildren: () => import('app/modules/admin/pages/pricing/table/table.routes') }
                    //     ]
                    // },
                    //TODO: fix these pages
                    // Welcome
                    { path: 'welcome', loadChildren: () => import('app/modules/admin/pages/welcome/welcome.routes') },

                    // Profile
                    { path: 'profile', loadChildren: () => import('app/modules/admin/pages/profile/profile.routes') },

                    // Settings
                    { path: 'settings', loadChildren: () => import('app/modules/admin/pages/settings/settings.routes') },
                ]
            },

            // // Documentation
            // {
            //     path: 'docs', children: [

            //         // Changelog
            //         { path: 'changelog', loadChildren: () => import('app/modules/admin/docs/changelog/changelog.routes') },

            //         // Guides
            //         { path: 'guides', loadChildren: () => import('app/modules/admin/docs/guides/guides.routes') }
            //     ]
            // },

            // 404 & Catch all
            { path: '404-not-found', pathMatch: 'full', loadChildren: () => import('app/modules/admin/pages/error/error-404/error-404.routes') },
            { path: '**', redirectTo: '404-not-found' }
        ]
    }
];
