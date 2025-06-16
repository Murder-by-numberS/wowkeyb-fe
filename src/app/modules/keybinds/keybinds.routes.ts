import { Routes } from '@angular/router';
import { KeybindsComponent } from './keybinds.component';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { KeybindsHomeComponent } from './keybinds-home/keybinds-home.component';
import { ViewKeybindingComponent } from './view-keybinding/view-keybinding.component';

export default [
    {
        path: '',
        component: KeybindsHomeComponent,
    },
    {
        path: 'view-all',
        component: KeybindsHomeComponent,
    },
    {
        path: 'my-keybindings',
        component: KeybindsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: ':id',
        component: ViewKeybindingComponent,
    },
] as Routes;
