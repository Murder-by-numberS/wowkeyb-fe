import { Component, ViewEncapsulation, OnInit } from '@angular/core';
import { Router, RouterLink, ActivatedRoute } from '@angular/router';
import { fuseAnimations } from '@fuse/animations';
import { AuthService } from 'app/core/auth/auth.service';
import { AuthBackgroundComponent } from 'app/shared/auth-background/auth-background.component';

@Component({
    selector: 'auth-confirmation',
    templateUrl: './confirmation.component.html',
    encapsulation: ViewEncapsulation.None,
    animations: fuseAnimations,
    standalone: true,
    imports: [RouterLink, AuthBackgroundComponent],
})
export class AuthConfirmationComponent implements OnInit {

    confirmCode: string;

    message: string;

    constructor(
        private _router: Router,
        private _route: ActivatedRoute,
        private _authService: AuthService,
    ) { }

    ngOnInit() {
        this._route.queryParams
            .subscribe(params => {
                console.log(params);
                this.confirmCode = params.confirmCode;
                console.log('confirmCode', this.confirmCode);
                this.confirmUser();
            }
            );
    }

    confirmUser(): void {

        this._authService.confirmUser(this.confirmCode).subscribe(
            () => {

                console.log('confirmed');
                this.message = 'Success! Your account has been successfully confirmed. You can now log in and start using all the features available.';
            },
            (response) => {

                const errorCode = response.error.code;

                switch (errorCode) {
                    case 'USER010':
                        this.message = 'It seems like your account has already been confirmed. If you\'re having trouble accessing your account, please contact our support team for help.'
                        break;
                    case 'USER003':
                        this.message = 'Oops! It looks like the confirm code link is invalid. If you continue to experience issues, contact our support team for assistance.'
                        break;
                    default:
                        this.message = 'Invalid Code';
                }
            }
        );

    }
}
