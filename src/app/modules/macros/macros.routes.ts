import { Routes } from '@angular/router';
import { MacrosComponent } from './macros.component';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { MacrosHomeComponent } from './components/macros-home/macros-home.component';
import { ViewMacroComponent } from './view-macro/view-macro.component';

export default [
    {
        path: '',
        component: MacrosHomeComponent,
    },
    {
        path: 'view-all',
        component: MacrosHomeComponent,
    },
    {
        path: 'my-macros',
        component: MacrosComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'create',
        component: MacrosComponent,
        canActivate: [AuthGuard]
    },
    {
        path: ':id',
        component: ViewMacroComponent,
    },
] as Routes;
