import { Routes } from '@angular/router';
import { AuthGuard } from 'app/core/auth/guards/auth.guard';
import { FilesComponent } from './files.component';

export default [
    {
        path: '',
        component: FilesComponent,
        canActivate: [AuthGuard]
    },
] as Routes;

