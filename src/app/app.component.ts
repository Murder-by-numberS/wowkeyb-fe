import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { AuthService } from './core/auth/auth.service';
import { BackendService } from './core/services/backend.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    standalone: true,
    imports: [RouterOutlet],
})
export class AppComponent implements OnInit {
    /**
     * Constructor
     */
    constructor(private _authService: AuthService, private _backendService: BackendService) {
    }

    ngOnInit(): void {
    }

}
