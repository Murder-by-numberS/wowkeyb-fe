import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';

import { AdminService, SupportTicket } from 'app/core/services/admin.service';

@Component({
    selector: 'admin-support',
    templateUrl: './admin-support.component.html',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        RouterLink,
        MatCardModule,
        MatIconModule,
        MatButtonModule,
        MatFormFieldModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatChipsModule,
        MatExpansionModule,
        MatTooltipModule
    ]
})
export class AdminSupportComponent implements OnInit {
    tickets: SupportTicket[] = [];
    isLoading = true;
    error: string | null = null;
    jiraDisabled = false;

    // Pagination
    currentPage = 1;
    totalPages = 1;
    totalCount = 0;
    perPage = 20;

    // Filters
    statusFilter = 'all';

    statusOptions = [
        { value: 'all', label: 'All Statuses' },
        { value: 'Open', label: 'Open' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Done', label: 'Done' },
        { value: 'Closed', label: 'Closed' }
    ];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        this.loadTickets();
    }

    loadTickets(): void {
        this.isLoading = true;
        this.error = null;

        this.adminService.getSupportTickets({
            page: this.currentPage,
            limit: this.perPage,
            status: this.statusFilter
        }).subscribe({
            next: (response: any) => {
                if (response.jira_disabled) {
                    this.jiraDisabled = true;
                    this.tickets = [];
                } else {
                    this.tickets = response.tickets;
                    this.totalPages = response.pagination?.total_pages || 1;
                    this.totalCount = response.pagination?.total_count || 0;
                }
                this.isLoading = false;
            },
            error: (err) => {
                console.error('Error loading tickets:', err);
                this.error = err.error?.message || 'Failed to load support tickets';
                this.isLoading = false;
            }
        });
    }

    onStatusChange(status: string): void {
        this.statusFilter = status;
        this.currentPage = 1;
        this.loadTickets();
    }

    openInJira(ticket: SupportTicket): void {
        if (ticket.url) {
            window.open(ticket.url, '_blank');
        }
    }

    getStatusColor(status: string): string {
        switch (status.toLowerCase()) {
            case 'open':
                return 'bg-blue-100 text-blue-800';
            case 'in progress':
                return 'bg-yellow-100 text-yellow-800';
            case 'done':
            case 'closed':
                return 'bg-green-100 text-green-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    getPriorityColor(priority: string): string {
        switch (priority.toLowerCase()) {
            case 'highest':
            case 'urgent':
                return 'text-red-600';
            case 'high':
                return 'text-orange-600';
            case 'medium':
                return 'text-yellow-600';
            case 'low':
                return 'text-green-600';
            default:
                return 'text-gray-600';
        }
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    goToPage(page: number): void {
        if (page >= 1 && page <= this.totalPages) {
            this.currentPage = page;
            this.loadTickets();
        }
    }
}
