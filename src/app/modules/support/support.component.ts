import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { RouterLink } from '@angular/router';
import { AuthService } from 'app/core/auth/auth.service';
import { AppFooterComponent } from 'app/shared/app-footer/app-footer.component';

@Component({
    selector: 'app-support',
    templateUrl: './support.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        RouterLink,
        AppFooterComponent
    ]
})
export class SupportComponent implements OnInit {
    isAuthenticated = false;

    constructor(private _authService: AuthService) { }

    ngOnInit(): void {
        this._authService.check().subscribe(authenticated => {
            this.isAuthenticated = authenticated;
        });
    }
}

