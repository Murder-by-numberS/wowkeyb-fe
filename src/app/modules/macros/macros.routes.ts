import { Routes } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { ViewAllMacrosComponent } from './view-all-macros/view-all-macros.component';
import { MyMacrosComponent } from './my-macros/my-macros.component';
import { ViewMacroComponent } from './view-macro/view-macro.component';

export default [
    {
        path: '',
        component: ViewAllMacrosComponent,
    },
    {
        path: 'view-all',
        component: ViewAllMacrosComponent,
    },
    {
        path: 'my-macros',
        component: MyMacrosComponent,
        canActivate: [AuthGuard]
    },
    {
        path: 'my-macros/edit/:id',
        component: MyMacrosComponent,
        canActivate: [AuthGuard]
    },
    {
        path: ':id',
        component: ViewMacroComponent,
    },
] as Routes;
