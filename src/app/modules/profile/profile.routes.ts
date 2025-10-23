import { Routes } from '@angular/router';
import { ViewProfileComponent } from './view-profile/view-profile.component';

export default [
    {
        path: ':username',
        component: ViewProfileComponent
    }
] as Routes;

