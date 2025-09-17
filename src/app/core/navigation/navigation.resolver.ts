import { inject } from '@angular/core';
import { ResolveFn } from '@angular/router';
import { NavigationService } from './navigation.service';
import { Navigation } from './navigation.types';

export const navigationResolver: ResolveFn<Navigation> = () => {
    const navigationService = inject(NavigationService);
    return navigationService.get();
};
