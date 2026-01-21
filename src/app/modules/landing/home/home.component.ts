import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { AppFooterComponent } from 'app/shared/app-footer/app-footer.component';

@Component({
    selector: 'landing-home',
    templateUrl: './home.component.html',
    standalone: true,
    imports: [
        MatButtonModule,
        MatIconModule,
        RouterLink,
        AppFooterComponent
    ]
})
export class HomeComponent implements OnInit {
    isAuthenticated = false;

    constructor(private _authService: AuthService) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });
    }
}
