import { Routes } from '@angular/router';
import { KeybindsComponent } from './keybinds.component';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';

export default [
    {
        path: '',
        component: KeybindsComponent,
    },
    {
        path: 'my-keybindings',
        component: KeybindsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: ':id',
        component: KeybindsComponent,
    },
] as Routes;
