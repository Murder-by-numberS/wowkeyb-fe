import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { Subject, debounceTime, takeUntil } from 'rxjs';
import { IconService, Icon } from '../../services/icon.service';

@Component({
    selector: 'app-icon-picker',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatDialogModule,
        MatTooltipModule,
        MatProgressSpinnerModule,
        MatFormFieldModule,
        MatInputModule
    ],
    providers: [IconService],
    templateUrl: './icon-picker.component.html',
    styleUrls: ['./icon-picker.component.scss']
})
export class IconPickerComponent implements OnInit, OnDestroy {
    @Input() selectedIcon: Icon | null = null;
    @Input() placeholder: string = 'Click to select an icon...';
    @Output() iconSelected = new EventEmitter<Icon>();
    @Output() iconCleared = new EventEmitter<void>();

    showDialog = false;
    isLoading = false;
    currentPage = 1;
    itemsPerPage = 100;
    hasMoreIcons = true;
    isLoadingMore = false;
    totalIcons = 0;
    searchTerm = '';
    isSearching = false;

    private scrollSubject = new Subject<Event>();
    private searchSubject = new Subject<string>();
    private destroy$ = new Subject<void>();

    displayedIcons: Icon[] = [];

    constructor(private iconService: IconService) {
        // Set up scroll debouncing
        this.scrollSubject.pipe(
            debounceTime(100),
            takeUntil(this.destroy$)
        ).subscribe(event => {
            this.onScroll(event);
        });

        // Set up search debouncing
        this.searchSubject.pipe(
            debounceTime(300),
            takeUntil(this.destroy$)
        ).subscribe(searchTerm => {
            this.performSearch(searchTerm);
        });
    }

    ngOnInit() {
        // Don't load icons on init - wait for modal to open
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        // Ensure body scrolling is re-enabled if component is destroyed while modal is open
        if (this.showDialog) {
            document.body.style.overflow = '';
            document.body.classList.remove('modal-open');
        }
    }

    openIconPicker(event?: Event) {
        if (event) {
            event.preventDefault();
            event.stopPropagation();
        }

        this.showDialog = true;

        // Disable body scrolling when modal is open
        document.body.style.overflow = 'hidden';
        document.body.classList.add('modal-open');

        // Reset state and load first page of icons when modal opens
        this.currentPage = 1;
        this.displayedIcons = [];
        this.hasMoreIcons = true;
        this.searchTerm = '';
        this.isSearching = false;
        this.loadIcons();
    }

    closeDialog(event?: Event) {
        if (event) {
            event.stopPropagation();
        }
        this.showDialog = false;
        // Re-enable body scrolling when modal is closed
        document.body.style.overflow = '';
        document.body.classList.remove('modal-open');
    }

    onBackdropClick(event: Event) {
        // Close modal when clicking on backdrop
        if (event.target === event.currentTarget) {
            this.closeDialog();
        }
    }

    selectIcon(icon: Icon) {
        this.selectedIcon = icon;
        this.iconSelected.emit(icon);
        this.closeDialog();

        // Note: Usage count will be incremented when the macro is actually created
        // This prevents unnecessary API calls and errors when icon ID is undefined
    }

    clearSelection() {
        this.selectedIcon = null;
        this.iconCleared.emit();
    }

    getIconUrl(icon: Icon): string {
        return this.iconService.getIconUrl(icon);
    }


    onScrollEvent(event: Event) {
        this.scrollSubject.next(event);
    }

    private onScroll(event: Event) {
        const element = event.target as HTMLElement;
        const threshold = 100; // Load more when 100px from bottom

        const scrollTop = element.scrollTop;
        const scrollHeight = element.scrollHeight;
        const clientHeight = element.clientHeight;

        const distanceFromBottom = scrollHeight - (scrollTop + clientHeight);

        // Check if we're near the bottom and not already loading
        if (distanceFromBottom <= threshold &&
            !this.isLoading &&
            !this.isLoadingMore &&
            this.hasMoreIcons) {
            this.loadMoreIcons();
        }
    }

    trackByIconId(index: number, icon: Icon): string {
        return icon.id || index.toString();
    }

    onImageError(event: Event) {
        const imgElement = event.target as HTMLImageElement;
        // Set a fallback image or hide the broken image
        imgElement.style.display = 'none';
        console.warn('Failed to load icon:', imgElement.src);
    }

    loadIcons() {
        if (this.isLoading) return;

        this.isLoading = true;

        // Use the main getIcons endpoint for both search and regular pagination
        // This supports infinite scroll for both cases
        this.iconService.getIcons({
            page: this.currentPage,
            limit: this.itemsPerPage,
            search: this.searchTerm.trim() || undefined
        }).pipe(
            takeUntil(this.destroy$)
        ).subscribe({
            next: (response) => {
                if (this.currentPage === 1) {
                    // First page - replace all icons
                    this.displayedIcons = response.icons;
                } else {
                    // Subsequent pages - append to existing icons smoothly
                    this.displayedIcons = [...this.displayedIcons, ...response.icons];
                }

                this.totalIcons = response.pagination?.total || response.total;
                this.hasMoreIcons = this.currentPage < (response.pagination?.pages || Math.ceil(response.total / this.itemsPerPage));

                if (this.searchTerm.trim()) {
                    // Search results loaded
                } else {
                    // All icons loaded
                }
            },
            error: (error) => {
                console.error('Error loading icons:', error);
            },
            complete: () => {
                this.isLoading = false;
                this.isLoadingMore = false;
            }
        });
    }

    loadMoreIcons() {
        if (this.isLoadingMore || !this.hasMoreIcons) return;

        this.isLoadingMore = true;
        this.currentPage++;
        this.loadIcons();
    }

    onSearchChange(searchTerm: string) {
        this.searchTerm = searchTerm;
        this.searchSubject.next(searchTerm);
    }

    private performSearch(searchTerm: string) {
        // Always reset to page 1 when search changes
        this.currentPage = 1;
        this.displayedIcons = [];
        this.hasMoreIcons = true;
        this.isSearching = !!searchTerm.trim();
        this.loadIcons();
    }
}
