import { Routes } from '@angular/router';
import { AdminDashboardComponent } from './admin-dashboard.component';
import { AdminUsersComponent } from './users/admin-users.component';
import { AdminAbilitiesComponent } from './abilities/admin-abilities.component';
import { AdminKeybindingsComponent } from './keybindings/admin-keybindings.component';
import { AdminMacrosComponent } from './macros/admin-macros.component';
import { AdminSupportComponent } from './support/admin-support.component';

export default [
    {
        path: '',
        component: AdminDashboardComponent
    },
    {
        path: 'users',
        component: AdminUsersComponent
    },
    {
        path: 'abilities',
        component: AdminAbilitiesComponent
    },
    {
        path: 'keybindings',
        component: AdminKeybindingsComponent
    },
    {
        path: 'macros',
        component: AdminMacrosComponent
    },
    {
        path: 'support',
        component: AdminSupportComponent
    }
] as Routes;
