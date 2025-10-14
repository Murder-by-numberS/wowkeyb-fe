import { Component, ViewEncapsulation } from '@angular/core';
import { RouterLink } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { AuthBackgroundComponent } from 'app/shared/auth-background/auth-background.component';

@Component({
    selector: 'auth-confirmation-required',
    templateUrl: './confirmation-required.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [RouterLink, AuthBackgroundComponent],
})
export class AuthConfirmationRequiredComponent {
    /**
     * Constructor
     */
    constructor() { }
}
