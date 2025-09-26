import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { Subject, debounceTime, distinctUntilChanged, takeUntil } from 'rxjs';
import { MacroIconService, MacroIcon } from '../../services/macro-icon.service';

@Component({
  selector: 'app-icon-picker',
  standalone: true,
  templateUrl: './icon-picker.component.html',
  styleUrls: ['./icon-picker.component.scss'],
  imports: [
    CommonModule,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatDialogModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ]
})
export class IconPickerComponent implements OnInit, OnDestroy {
  @Input() selectedIcon: MacroIcon | null = null;
  @Output() iconSelected = new EventEmitter<MacroIcon | null>();

  showDialog = false;
  isLoading = false;
  searchTerm = '';
  currentPage = 0;
  itemsPerPage = 50;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  allIcons: MacroIcon[] = [];
  filteredIcons: MacroIcon[] = [];

  constructor(private macroIconService: MacroIconService) {
    // Set up search debouncing
    this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      takeUntil(this.destroy$)
    ).subscribe(searchTerm => {
      this.searchTerm = searchTerm;
      this.currentPage = 0;
      this.filterIcons();
    });
  }

  ngOnInit() {
    this.loadIcons();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadIcons() {
    this.isLoading = true;

    // Load icons from service
    this.macroIconService.getIcons().pipe(
      takeUntil(this.destroy$)
    ).subscribe((icons) => {
      this.allIcons = icons;
      this.filterIcons();
      this.isLoading = false;
    });
  }

  onSearchChange(event: any) {
    this.searchSubject.next(event.target.value);
  }


  filterIcons() {
    let filtered = this.allIcons;

    // Filter by search term
    if (this.searchTerm.trim()) {
      const searchLower = this.searchTerm.toLowerCase();
      filtered = filtered.filter(icon =>
        icon.name.toLowerCase().includes(searchLower) ||
        icon.keywords.some(keyword => keyword.includes(searchLower))
      );
    }


    this.filteredIcons = filtered;
  }

  get totalPages(): number {
    return Math.ceil(this.filteredIcons.length / this.itemsPerPage);
  }

  get paginatedIcons(): MacroIcon[] {
    const start = this.currentPage * this.itemsPerPage;
    const end = start + this.itemsPerPage;
    return this.filteredIcons.slice(start, end);
  }

  openIconPicker() {
    this.showDialog = true;
  }

  closeDialog(event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.showDialog = false;
  }

  selectIcon(icon: MacroIcon) {
    this.selectedIcon = icon;
    this.iconSelected.emit(icon);
    this.closeDialog();
  }

  clearSelection() {
    this.selectedIcon = null;
    this.iconSelected.emit(null);
  }

  isIconSelected(icon: MacroIcon): boolean {
    return this.selectedIcon?.id === icon.id;
  }

  previousPage() {
    if (this.currentPage > 0) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages - 1) {
      this.currentPage++;
    }
  }

  trackByIconId(index: number, icon: MacroIcon): string {
    return icon.id;
  }
}
