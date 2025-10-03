import { Routes } from '@angular/router';
import { MyKeybindingsComponent } from './my-keybindings/my-keybindings.component';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { ViewKeybindingComponent } from './view-keybinding/view-keybinding.component';
import { ViewAllKeybindingsComponent } from './view-all-keybindings/view-all-keybindings.component';

export default [
    {
        path: '',
        component: ViewAllKeybindingsComponent,
    },
    {
        path: 'view-all',
        component: ViewAllKeybindingsComponent,
    },
    {
        path: 'my-keybindings',
        component: MyKeybindingsComponent,
        canActivate: [AuthGuard]
    },
    {
        path: ':id',
        component: ViewKeybindingComponent,
    },
] as Routes;
