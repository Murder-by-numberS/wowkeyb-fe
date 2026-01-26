import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatChipsModule } from '@angular/material/chips';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

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
        MatInputModule,
        MatSelectModule,
        MatProgressSpinnerModule,
        MatSnackBarModule,
        MatChipsModule,
        MatExpansionModule,
        MatTooltipModule,
        MatDialogModule,
        MatMenuModule,
        MatDatepickerModule,
        MatNativeDateModule
    ]
})
export class AdminSupportComponent implements OnInit, OnDestroy {
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
    statusFilter = 'active';
    priorityFilter = 'all';
    searchTerm = '';
    selectedDateRange = '';
    customStartDate: Date | null = null;
    customEndDate: Date | null = null;
    sortBy = 'priority';

    // Search debounce
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    // Selected ticket for actions
    selectedTicket: SupportTicket | null = null;
    availableTransitions: { id: string; name: string; to?: string }[] = [];
    newComment = '';
    isAddingComment = false;
    isTransitioning = false;
    showTicketDetail = false;

    statusOptions = [
        { value: 'active', label: 'Active (Not Done)' },
        { value: 'all', label: 'All Statuses' },
        { value: 'Open', label: 'Open' },
        { value: 'In Progress', label: 'In Progress' },
        { value: 'Done', label: 'Done' },
        { value: 'Closed', label: 'Closed' }
    ];

    priorityOptions = [
        { value: 'all', label: 'All Priorities' },
        { value: 'Highest', label: 'Highest' },
        { value: 'High', label: 'High' },
        { value: 'Medium', label: 'Medium' },
        { value: 'Low', label: 'Low' },
        { value: 'Lowest', label: 'Lowest' }
    ];

    dateRangeOptions = [
        { value: '', label: 'All Time' },
        { value: 'today', label: 'Today' },
        { value: 'yesterday', label: 'Yesterday' },
        { value: 'last7days', label: 'Last 7 Days' },
        { value: 'last30days', label: 'Last 30 Days' },
        { value: 'last90days', label: 'Last 90 Days' },
        { value: 'custom', label: 'Custom Range' }
    ];

    sortOptions = [
        { value: 'priority', label: 'Priority (High to Low)' },
        { value: 'created_desc', label: 'Newest First' },
        { value: 'created_asc', label: 'Oldest First' },
        { value: 'updated_desc', label: 'Recently Updated' },
        { value: 'status', label: 'Status' }
    ];

    constructor(
        private adminService: AdminService,
        private snackBar: MatSnackBar
    ) {}

    ngOnInit(): void {
        // Setup search debounce
        this.searchSubject.pipe(
            debounceTime(300),
            distinctUntilChanged(),
            takeUntil(this.destroy$)
        ).subscribe(() => {
            this.currentPage = 1;
            this.loadTickets();
        });

        this.loadTickets();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    loadTickets(): void {
        this.isLoading = true;
        this.error = null;

        const { startDate, endDate } = this.getDateRange();

        this.adminService.getSupportTickets({
            page: this.currentPage,
            limit: this.perPage,
            status: this.statusFilter,
            priority: this.priorityFilter,
            search: this.searchTerm,
            startDate,
            endDate,
            sortBy: this.sortBy
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

    onPriorityChange(priority: string): void {
        this.priorityFilter = priority;
        this.currentPage = 1;
        this.loadTickets();
    }

    onSortChange(sort: string): void {
        this.sortBy = sort;
        this.currentPage = 1;
        this.loadTickets();
    }

    onSearchChange(): void {
        this.searchSubject.next(this.searchTerm);
    }

    onDateRangeChange(): void {
        if (this.selectedDateRange !== 'custom') {
            this.customStartDate = null;
            this.customEndDate = null;
            this.currentPage = 1;
            this.loadTickets();
        }
    }

    onCustomDateChange(): void {
        if (this.customStartDate || this.customEndDate) {
            this.currentPage = 1;
            this.loadTickets();
        }
    }

    isCustomRange(): boolean {
        return this.selectedDateRange === 'custom';
    }

    getDateRange(): { startDate?: string; endDate?: string } {
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (this.selectedDateRange) {
            case 'today':
                return { startDate: this.formatDateForJira(today) };
            case 'yesterday':
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                return {
                    startDate: this.formatDateForJira(yesterday),
                    endDate: this.formatDateForJira(yesterday)
                };
            case 'last7days':
                const last7 = new Date(today);
                last7.setDate(last7.getDate() - 7);
                return { startDate: this.formatDateForJira(last7) };
            case 'last30days':
                const last30 = new Date(today);
                last30.setDate(last30.getDate() - 30);
                return { startDate: this.formatDateForJira(last30) };
            case 'last90days':
                const last90 = new Date(today);
                last90.setDate(last90.getDate() - 90);
                return { startDate: this.formatDateForJira(last90) };
            case 'custom':
                return {
                    startDate: this.customStartDate ? this.formatDateForJira(this.customStartDate) : undefined,
                    endDate: this.customEndDate ? this.formatDateForJira(this.customEndDate) : undefined
                };
            default:
                return {};
        }
    }

    formatDateForJira(date: Date): string {
        // Jira expects dates in YYYY-MM-DD format
        return date.toISOString().split('T')[0];
    }

    clearFilters(): void {
        this.statusFilter = 'all';
        this.priorityFilter = 'all';
        this.searchTerm = '';
        this.selectedDateRange = '';
        this.customStartDate = null;
        this.customEndDate = null;
        this.currentPage = 1;
        this.loadTickets();
    }

    hasActiveFilters(): boolean {
        return this.statusFilter !== 'all' ||
            this.priorityFilter !== 'all' ||
            this.searchTerm !== '' ||
            this.selectedDateRange !== '';
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

    viewTicket(ticket: SupportTicket): void {
        this.selectedTicket = ticket;
        this.showTicketDetail = true;
        this.newComment = '';
        this.loadTransitions(ticket.key);
    }

    closeTicketDetail(): void {
        this.showTicketDetail = false;
        this.selectedTicket = null;
        this.availableTransitions = [];
    }

    loadTransitions(ticketId: string): void {
        this.adminService.getTicketTransitions(ticketId).subscribe({
            next: (response) => {
                this.availableTransitions = response.transitions;
            },
            error: (err) => {
                console.error('Error loading transitions:', err);
            }
        });
    }

    addComment(): void {
        if (!this.selectedTicket || !this.newComment.trim()) return;

        this.isAddingComment = true;

        this.adminService.addTicketComment(this.selectedTicket.key, this.newComment).subscribe({
            next: () => {
                this.snackBar.open('Comment added successfully', 'OK', { duration: 3000 });
                this.newComment = '';
                this.isAddingComment = false;
                // Refresh ticket to show new comment
                if (this.selectedTicket) {
                    this.adminService.getSupportTicketById(this.selectedTicket.key).subscribe({
                        next: (ticket) => {
                            this.selectedTicket = ticket;
                        }
                    });
                }
            },
            error: (err) => {
                console.error('Error adding comment:', err);
                this.snackBar.open(err.error?.message || 'Failed to add comment', 'OK', { duration: 5000 });
                this.isAddingComment = false;
            }
        });
    }

    transitionTicket(transitionId: string, transitionName: string): void {
        if (!this.selectedTicket) return;

        this.isTransitioning = true;

        this.adminService.transitionTicket(this.selectedTicket.key, transitionId).subscribe({
            next: () => {
                this.snackBar.open(`Ticket status changed to "${transitionName}"`, 'OK', { duration: 3000 });
                this.isTransitioning = false;
                // Refresh both the ticket detail and the list
                this.loadTickets();
                if (this.selectedTicket) {
                    this.adminService.getSupportTicketById(this.selectedTicket.key).subscribe({
                        next: (ticket) => {
                            this.selectedTicket = ticket;
                            this.loadTransitions(ticket.key);
                        }
                    });
                }
            },
            error: (err) => {
                console.error('Error transitioning ticket:', err);
                this.snackBar.open(err.error?.message || 'Failed to update status', 'OK', { duration: 5000 });
                this.isTransitioning = false;
            }
        });
    }
}
