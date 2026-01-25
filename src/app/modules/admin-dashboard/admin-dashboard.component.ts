import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

import { AdminService, DashboardStats, BackendStatus } from 'app/core/services/admin.service';
import { environment } from 'environments/environment';

@Component({
    selector: 'admin-dashboard',
    templateUrl: './admin-dashboard.component.html',
    standalone: true,
    imports: [
        CommonModule,
        RouterLink,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatProgressSpinnerModule
    ]
})
export class AdminDashboardComponent implements OnInit {
    stats: DashboardStats | null = null;
    backendStatus: BackendStatus | null = null;
    isLoading = true;
    error: string | null = null;
    
    // Frontend environment info
    frontendEnv = environment.envName || 'unknown';
    frontendProduction = environment.production;
    frontendVersion = environment.version || 'unknown';

    // Dashboard menu items
    menuItems = [
        {
            title: 'Users',
            description: 'Manage users and access levels',
            icon: 'people',
            link: '/admin-dashboard/users',
            color: 'bg-blue-500'
        },
        {
            title: 'Abilities',
            description: 'Manage game abilities',
            icon: 'auto_awesome',
            link: '/admin-dashboard/abilities',
            color: 'bg-purple-500'
        },
        {
            title: 'Keybindings',
            description: 'View and restore keybindings',
            icon: 'keyboard',
            link: '/admin-dashboard/keybindings',
            color: 'bg-green-500'
        },
        {
            title: 'Macros',
            description: 'View and restore macros',
            icon: 'code',
            link: '/admin-dashboard/macros',
            color: 'bg-orange-500'
        },
        {
            title: 'Support Tickets',
            description: 'View support tickets from Jira',
            icon: 'support_agent',
            link: '/admin-dashboard/support',
            color: 'bg-red-500'
        }
    ];

    constructor(private adminService: AdminService) {}

    ngOnInit(): void {
        this.loadStats();
        this.loadBackendStatus();
    }

    loadStats(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getDashboardStats().subscribe({
            next: (stats) => {
                this.stats = stats;
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading dashboard stats:', err);
                this.error = err.error?.message || 'Failed to load dashboard statistics';
                this.isLoading = false;
            }
        });
    }

    loadBackendStatus(): void {
        this.adminService.getBackendStatus().subscribe({
            next: (status) => {
                this.backendStatus = status;
            },
            error: (err) => {
                console.error('Error loading backend status:', err);
                this.backendStatus = null;
            }
        });
    }

    getEnvColor(env: string): string {
        switch (env?.toLowerCase()) {
            case 'production':
            case 'prod':
                return 'bg-red-100 text-red-800';
            case 'staging':
                return 'bg-yellow-100 text-yellow-800';
            case 'develop':
            case 'development':
            case 'dev':
            default:
                return 'bg-green-100 text-green-800';
        }
    }
}
