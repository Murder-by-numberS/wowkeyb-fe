import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, debounceTime, distinctUntilChanged, catchError } from 'rxjs/operators';
import { MacroFileService, MacroDownload } from '../macros/services/macro-file.service';
import { MacroService, Macro, MacroResponse } from '../macros/services/macro.service';
import { UploadMacroFileDialogComponent } from '../macros/components/upload-macro-file-dialog/upload-macro-file-dialog.component';
import { DownloadHistoryDialogComponent } from '../macros/components/download-history-dialog/download-history-dialog.component';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';
import { FileDetailsDialogComponent } from './components/file-details-dialog/file-details-dialog.component';
import { FileViewerDialogComponent } from './components/file-viewer-dialog/file-viewer-dialog.component';
import { UserService } from 'app/core/user/user.service';

@Component({
    selector: 'files',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatIconModule,
        MatCardModule,
        MatChipsModule,
        MatProgressSpinnerModule,
        MatPaginatorModule,
        MatSelectModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,
        MatCheckboxModule
    ],
    templateUrl: './files.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            height: 100%;
        }
    `]
})
export class FilesComponent implements OnInit, OnDestroy {
    uploads: any[] = [];
    downloads: MacroDownload[] = [];
    allFiles: any[] = []; // Combined uploads and downloads
    currentSelectedFile: any = null;
    loadingUploads = false;
    loadingDownloads = false;
    deletingUploadId: string | null = null;
    drawerOpen = true;
    isMobile = false;

    // File creation properties
    isCreatingFile = false;
    selectedMacrosForFile: Set<string> = new Set();
    fileCreationClass: string | null = null;
    availableMacrosForFile: Macro[] = [];
    allMacros: Macro[] = []; // All macros (public + user's)
    loadingMacros = false;
    isGeneratingFile = false;
    macroSearchQuery = '';
    currentUserId: string | null = null;

    // File editing properties
    isEditingFile = false;
    editingFileMacros: Set<string> = new Set(); // Macros currently in the file being edited
    editingFileAvailableMacros: Macro[] = []; // Available macros for editing
    editingFileSearchQuery = '';
    editingFileClass: string | null = null;
    editingFileName = ''; // File name being edited
    isSavingFile = false;

    private destroy$ = new Subject<void>();

    classes = [
        { value: 'deathknight', label: 'Death Knight' },
        { value: 'demonhunter', label: 'Demon Hunter' },
        { value: 'druid', label: 'Druid' },
        { value: 'evoker', label: 'Evoker' },
        { value: 'hunter', label: 'Hunter' },
        { value: 'mage', label: 'Mage' },
        { value: 'monk', label: 'Monk' },
        { value: 'paladin', label: 'Paladin' },
        { value: 'priest', label: 'Priest' },
        { value: 'rogue', label: 'Rogue' },
        { value: 'shaman', label: 'Shaman' },
        { value: 'warlock', label: 'Warlock' },
        { value: 'warrior', label: 'Warrior' }
    ];

    constructor(
        private macroFileService: MacroFileService,
        private macroService: MacroService,
        private dialog: MatDialog,
        private snackBar: MatSnackBar,
        private router: Router,
        private route: ActivatedRoute,
        private userService: UserService,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        // Check if device is mobile
        this.checkMobile();
        window.addEventListener('resize', () => this.checkMobile());

        // Get current user ID
        this.userService.user$.pipe(
            takeUntil(this.destroy$)
        ).subscribe(user => {
            this.currentUserId = user?._id || null;
        });

        // Check for query parameters to trigger file creation
        this.route.queryParams.pipe(
            takeUntil(this.destroy$)
        ).subscribe(params => {
            if (params['create'] === 'true' || params['createFile'] === 'true') {
                this.onCreateFile();
                // Clear the query parameter
                this.router.navigate([], {
                    relativeTo: this.route,
                    queryParams: {},
                    replaceUrl: true
                });
            }
        });

        // Set up search debounce
        // Note: We'll handle search in the template with (ngModelChange) for simplicity

        this.loadUploads();
        this.loadDownloads();
        this.loadAllFiles();
    }

    ngOnDestroy(): void {
        window.removeEventListener('resize', () => this.checkMobile());
        this.destroy$.next();
        this.destroy$.complete();
    }

    checkMobile(): void {
        this.isMobile = window.innerWidth < 1024;
        if (this.isMobile) {
            this.drawerOpen = false;
        } else {
            this.drawerOpen = true;
        }
    }

    toggleDrawer(): void {
        this.drawerOpen = !this.drawerOpen;
    }

    loadAllFiles(): void {
        // Combine uploads and downloads for unified file list
        const combined = [...this.uploads, ...this.downloads];
        this.allFiles = combined.sort((a, b) => {
            const dateA = new Date(a.downloaded_at || a.last_downloaded_at || 0);
            const dateB = new Date(b.downloaded_at || b.last_downloaded_at || 0);
            return dateB.getTime() - dateA.getTime(); // Newest first
        });
        console.log('loadAllFiles - uploads:', this.uploads.length, 'downloads:', this.downloads.length, 'allFiles:', this.allFiles.length);
    }

    selectFile(file: any): void {
        if (this.isCreatingFile) {
            // Allow selecting files even during creation, but clear creation mode
            this.onCancelCreateFile();
        }
        this.currentSelectedFile = file;
        
        // Log for debugging
        console.log('Selected file:', {
            id: file.id,
            fileName: file.file_name,
            macroCount: file.macro_count || file.item_count,
            hasMacros: !!(file.macros && file.macros.length > 0),
            macros: file.macros ? file.macros.map((m: any) => ({
                id: m.id,
                name: m.name,
                class: m.class
            })) : [],
            macroIds: file.macro_ids,
            fullMacroData: file.macros
        });
    }

    loadUploads(): void {
        this.loadingUploads = true;
        // Get upload history (source: 'upload')
        this.macroFileService.getDownloadHistory(undefined, undefined, 50, 1).subscribe({
            next: (response) => {
                // Filter to only show uploads (source: 'upload')
                const allFiles = response.downloads || [];
                this.uploads = allFiles.filter((d: any) => d.source === 'upload');
                console.log('Loaded uploads:', {
                    totalFiles: allFiles.length,
                    uploadFiles: this.uploads.length,
                    files: allFiles.map((f: any) => ({ name: f.file_name, source: f.source }))
                });
                this.loadingUploads = false;
                this.loadAllFiles();
            },
            error: (error) => {
                console.error('Error loading uploads:', error);
                this.loadingUploads = false;
                this.snackBar.open('Failed to load upload history', 'Close', { duration: 3000 });
            }
        });
    }

    loadDownloads(): void {
        this.loadingDownloads = true;
        this.macroFileService.getDownloadHistory(undefined, undefined, 100, 1).subscribe({
            next: (response) => {
                // Filter to only show generated files (source: 'generated')
                const serverDownloads = response.downloads.filter((d: any) => d.source === 'generated' || !d.source);

                // Merge with any manually added files (in case server hasn't updated yet)
                const existingFileIds = new Set(serverDownloads.map((d: any) => d.id || d._serverId).filter(Boolean));
                const existingFileNames = new Set(serverDownloads.map((d: any) => d.file_name).filter(Boolean));

                // Keep manually added files that aren't in server response
                const manuallyAddedFiles = this.downloads.filter((d: any) => {
                    const fileId = d.id || d._serverId;
                    const fileName = d.file_name;
                    // Keep if it has a temp ID or if it's not in server response by ID or name
                    return (d._tempId && !existingFileIds.has(fileId)) ||
                        (!existingFileIds.has(fileId) && !existingFileNames.has(fileName));
                });

                this.downloads = [...serverDownloads, ...manuallyAddedFiles].sort((a, b) => {
                    const dateA = new Date(a.last_downloaded_at || a.downloaded_at || 0);
                    const dateB = new Date(b.last_downloaded_at || b.downloaded_at || 0);
                    return dateB.getTime() - dateA.getTime(); // Newest first
                });

                this.loadingDownloads = false;
                this.loadAllFiles();
            },
            error: (error) => {
                console.error('Error loading downloads:', error);
                this.loadingDownloads = false;
                this.snackBar.open('Failed to load download history', 'Close', { duration: 3000 });
            }
        });
    }

    openUploadDialog(): void {
        const dialogRef = this.dialog.open(UploadMacroFileDialogComponent, {
            width: '600px',
            disableClose: false
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.snackBar.open(
                    `Imported ${result.upload.macros_created} macro(s) successfully!`,
                    'Close',
                    { duration: 3000 }
                );
                this.loadUploads();
            }
        });
    }

    openDownloadHistory(): void {
        this.dialog.open(DownloadHistoryDialogComponent, {
            width: '900px',
            maxWidth: '95vw',
            maxHeight: '90vh'
        });
    }

    viewUploadDetails(upload: any): void {
        const dialogRef = this.dialog.open(FileDetailsDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            data: {
                file: upload,
                isUpload: true
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'view') {
                this.openFileViewer(result.content, result.fileName);
            }
        });
    }

    viewDownloadDetails(download: MacroDownload): void {
        const dialogRef = this.dialog.open(FileDetailsDialogComponent, {
            width: '700px',
            maxWidth: '95vw',
            data: {
                file: download,
                isUpload: false
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result && result.action === 'view') {
                this.openFileViewer(result.content, result.fileName);
            }
        });
    }

    viewFile(file: any, isUpload: boolean): void {
        console.log('Viewing file:', {
            id: file.id,
            fileName: file.file_name,
            hasMacros: !!(file.macros && file.macros.length > 0),
            macroCount: file.macro_count || file.item_count,
            macroIds: file.macro_ids
        });
        
        this.macroFileService.viewFile(file.id).subscribe({
            next: (response) => {
                console.log('File content received:', {
                    fileName: response.file.file_name,
                    contentLength: response.file.content?.length || 0,
                    contentPreview: response.file.content?.substring(0, 100)
                });
                this.openFileViewer(response.file.content, response.file.file_name);
            },
            error: (error) => {
                console.error('Error viewing file:', error);
                const errorMessage = error.error?.message || error.message || 'Failed to load file content';
                this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
            }
        });
    }

    openFileViewer(content: string, fileName: string): void {
        this.dialog.open(FileViewerDialogComponent, {
            width: '800px',
            maxWidth: '95vw',
            maxHeight: '90vh',
            data: {
                content,
                fileName
            }
        });
    }

    deleteUpload(upload: any): void {
        const uploadId = upload.id || upload._id;
        if (!uploadId) {
            console.error('Upload object missing id:', upload);
            this.snackBar.open('Error: Upload ID not found', 'Close', { duration: 3000 });
            return;
        }

        if (this.deletingUploadId === uploadId) {
            console.log('Delete already in progress for this upload');
            return;
        }

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            width: '400px',
            data: {
                title: 'Delete Upload',
                message: `Are you sure you want to delete "${upload.file_name}"? This will not delete the macros created from this file.`,
                confirmText: 'Delete',
                cancelText: 'Cancel'
            }
        });

        dialogRef.afterClosed().subscribe(confirmed => {
            if (confirmed === true) {
                this.deletingUploadId = uploadId;
                console.log('Deleting upload:', { id: uploadId, fileName: upload.file_name });

                this.macroFileService.deleteDownloadRecord(uploadId).subscribe({
                    next: (response) => {
                        console.log('Upload deleted successfully:', response);
                        this.deletingUploadId = null;
                        this.snackBar.open('Upload deleted successfully', 'Close', { duration: 3000 });
                        this.loadUploads();
                    },
                    error: (error) => {
                        console.error('Error deleting upload:', error);
                        this.deletingUploadId = null;

                        // Self-heal: If record not found (404), just remove it from the list
                        if (error.status === 404 || error.error?.message?.includes('not found')) {
                            console.log('Upload record not found, removing from list (self-healing)');
                            this.uploads = this.uploads.filter(u => (u.id || u._id) !== uploadId);
                            this.snackBar.open('Upload removed', 'Close', { duration: 2000 });
                        } else {
                            const errorMessage = error.error?.message || error.message || 'Failed to delete upload';
                            this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
                        }
                    }
                });
            } else {
                console.log('Delete cancelled by user, confirmed value:', confirmed);
            }
        });
    }

    redownloadFile(download: MacroDownload): void {
        this.macroFileService.redownloadFile(download.id).subscribe({
            next: (response) => {
                this.macroFileService.downloadFileFromUrl(response.file.download_url, response.file.file_name);
                this.snackBar.open('File download started', 'Close', { duration: 2000 });
                this.loadDownloads();
            },
            error: (error) => {
                console.error('Error re-downloading file:', error);
                this.snackBar.open('Failed to download file', 'Close', { duration: 3000 });
            }
        });
    }

    getClassName(classValue: string): string {
        const cls = this.classes.find(c => c.value === classValue);
        return cls ? cls.label : classValue;
    }

    formatDate(date: string | Date): string {
        if (!date) return 'Unknown';
        const d = new Date(date);
        const now = new Date();
        const diffMs = now.getTime() - d.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
        return d.toLocaleDateString();
    }

    // File creation methods
    onCreateFile(): void {
        // Create a file in the database (persistent, like keybindings)
        this.macroFileService.createMacroFile({
            file_type: 'account',
            character_class: null
        }).subscribe({
            next: (response) => {
                // Create file object from response
                const newFile: any = {
                    id: response.file.id,
                    file_name: response.file.file_name,
                    file_type: response.file.file_type,
                    character_class: response.file.character_class,
                    macro_count: response.file.macro_count,
                    download_count: 0,
                    created_at: response.file.created_at,
                    updated_at: response.file.updated_at,
                    source: 'generated',
                    macros: response.file.macros || []
                };

                // Add to downloads array
                this.downloads.unshift(newFile);
                this.loadAllFiles();
                this.cdr.detectChanges();

                // Select the new file and enter edit mode
                this.currentSelectedFile = newFile;
                this.onEditFile();

                // Close drawer on mobile
                if (this.isMobile) {
                    this.drawerOpen = false;
                }
            },
            error: (error) => {
                console.error('Error creating file:', error);
                this.snackBar.open('Failed to create file', 'Close', { duration: 3000 });
            }
        });
    }

    onCancelCreateFile(): void {
        this.isCreatingFile = false;
        this.fileCreationClass = null;
        this.selectedMacrosForFile.clear();
        this.availableMacrosForFile = [];
        this.macroSearchQuery = '';
    }

    onFileCreationClassChange(): void {
        this.selectedMacrosForFile.clear(); // Clear selection when class changes
        this.updateAvailableMacrosForFile();
    }

    onMacroSearchChange(): void {
        // Debounced search will be handled in the update method
        this.updateAvailableMacrosForFile();
    }

    loadMacros(): void {
        this.loadingMacros = true;
        this.allMacros = [];

        // Load user's own macros first (this always works)
        // Note: Backend limit is 100, so we'll need to paginate if needed
        const userMacros$ = this.macroService.getMyMacros(1, 100);

        // Try to load public macros, but handle errors gracefully
        // Note: Backend limit is 100, so we'll need to paginate if needed
        const publicMacros$ = this.macroService.getMacros({
            page: 1,
            limit: 100,
            isPublic: true
        }).pipe(
            // If public macros fail, return empty array
            catchError((error) => {
                console.warn('Could not load public macros, continuing with user macros only:', error);
                return of({ macros: [] } as MacroResponse);
            })
        );

        // Combine both requests
        forkJoin([publicMacros$, userMacros$]).subscribe({
            next: ([publicResponse, userResponse]) => {
                const publicMacros = publicResponse.macros || [];
                const userMacros = userResponse.macros || [];

                // Combine and deduplicate macros by ID
                const macroMap = new Map<string, Macro>();

                // Add public macros first
                publicMacros.forEach(macro => {
                    if (macro.id && (macro.is_public || macro.isPublic)) {
                        macroMap.set(macro.id, macro);
                    }
                });

                // Add user macros (will overwrite public ones if same ID, but user's own are more important)
                // Include both public and private user macros
                userMacros.forEach(macro => {
                    if (macro.id) {
                        macroMap.set(macro.id, macro);
                    }
                });

                this.allMacros = Array.from(macroMap.values());
                this.loadingMacros = false;
                this.updateAvailableMacrosForFile();
                // Also update editing macros if in edit mode
                if (this.isEditingFile) {
                    this.updateEditingFileAvailableMacros();
                }
            },
            error: (error) => {
                console.error('Error loading macros:', error);
                this.loadingMacros = false;
                this.snackBar.open('Failed to load macros', 'Close', { duration: 3000 });
            }
        });
    }

    updateAvailableMacrosForFile(): void {
        let filtered = [...this.allMacros];

        // Check if there are already class-specific macros selected
        const selectedMacros = this.allMacros.filter(m => m.id && this.selectedMacrosForFile.has(m.id));
        const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

        // If there are class-specific macros already selected, restrict to that class + account-wide
        if (selectedClasses.size > 0) {
            // Only allow macros from the selected class(es) or non-class-specific macros
            const allowedClasses = Array.from(selectedClasses);
            filtered = filtered.filter(m => {
                // Allow non-class-specific macros (account-wide)
                if (!m.class) return true;
                // Allow macros that match one of the already selected classes
                return allowedClasses.includes(m.class);
            });
        } else {
            // If no class-specific macros are selected, filter by the class dropdown if set
            if (this.fileCreationClass === null) {
                // Show only non-class-specific macros (class is null or undefined)
                filtered = filtered.filter(m => !m.class);
            } else if (this.fileCreationClass) {
                // Show only macros of the selected class (or null class)
                filtered = filtered.filter(m => !m.class || m.class === this.fileCreationClass);
            }
            // If no class filter and no selected class-specific macros, show all macros
        }

        // Filter by search query
        if (this.macroSearchQuery && this.macroSearchQuery.trim()) {
            const query = this.macroSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(m => {
                const name = (m.name || '').toLowerCase();
                const description = (m.description || '').toLowerCase();
                const macroText = ((m.macro_text || m.text || m.macroText) || '').toLowerCase();
                return name.includes(query) || description.includes(query) || macroText.includes(query);
            });
        }

        this.availableMacrosForFile = filtered;
    }

    toggleMacroForFile(macro: Macro): void {
        if (!macro.id) return;

        if (this.selectedMacrosForFile.has(macro.id)) {
            // Removing a macro - just remove it
            this.selectedMacrosForFile.delete(macro.id);
            // Update available macros since the class restriction may have changed
            this.updateAvailableMacrosForFile();
        } else {
            // Adding a macro - check if it conflicts with existing class-specific macros
            const selectedMacros = this.allMacros.filter(m => m.id && this.selectedMacrosForFile.has(m.id));
            const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

            // If there are already class-specific macros selected
            if (selectedClasses.size > 0 && macro.class) {
                // Check if this macro's class matches any of the selected classes
                if (!selectedClasses.has(macro.class)) {
                    // Different class - don't allow it
                    const classNames = Array.from(selectedClasses).map(c => this.getClassDisplayName(c)).join(', ');
                    this.snackBar.open(
                        `Cannot add ${this.getClassDisplayName(macro.class)} macro. File already contains ${classNames} macro(s). Only macros from the same class or account-wide macros can be added.`,
                        'Close',
                        { duration: 5000 }
                    );
                    return;
                }
            }

            // Allow the macro to be added
            this.selectedMacrosForFile.add(macro.id);
            // Update available macros since the class restriction may have changed
            this.updateAvailableMacrosForFile();
        }
    }

    isMacroSelectedForFile(macro: Macro): boolean {
        return macro.id ? this.selectedMacrosForFile.has(macro.id) : false;
    }

    canSelectMacroForFile(macro: Macro): boolean {
        if (!macro.id) return false;

        // If already selected, can always deselect
        if (this.selectedMacrosForFile.has(macro.id)) return true;

        // Check if there are already class-specific macros selected
        const selectedMacros = this.allMacros.filter(m => m.id && this.selectedMacrosForFile.has(m.id));
        const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

        // If no class-specific macros are selected, can select any macro
        if (selectedClasses.size === 0) return true;

        // If macro is account-wide (no class), can always select it
        if (!macro.class) return true;

        // Can only select if macro's class matches one of the already selected classes
        return selectedClasses.has(macro.class);
    }

    getSelectedMacrosCount(): number {
        return this.selectedMacrosForFile.size;
    }

    selectAllMacrosForFile(): void {
        this.availableMacrosForFile.forEach(macro => {
            if (macro.id && this.canSelectMacroForFile(macro)) {
                this.selectedMacrosForFile.add(macro.id);
            }
        });
        // Update available macros after selection
        this.updateAvailableMacrosForFile();
    }

    deselectAllMacrosForFile(): void {
        this.selectedMacrosForFile.clear();
    }

    onGenerateFile(): void {
        // Allow generating files with no macros (blank files are valid)

        this.isGeneratingFile = true;

        const selectedMacroIds = Array.from(this.selectedMacrosForFile);
        const fileType = this.fileCreationClass ? 'character' : 'account';

        // If we have an existing file, save macros to DB only (no S3)
        // If we don't have a file yet, create one and save macros
        if (this.currentSelectedFile?.id) {
            // Save macros to database only (no S3 generation)
            this.macroFileService.saveMacroFile({
                file_id: this.currentSelectedFile.id,
                macro_ids: selectedMacroIds,
                file_type: fileType,
                character_class: this.fileCreationClass || undefined
            }).subscribe({
                next: (saveResponse) => {
                    // Update current file with saved data
                    this.currentSelectedFile.macro_count = saveResponse.file.macro_count;
                    this.currentSelectedFile.macros = saveResponse.file.macros;

                    // Update in downloads array
                    const downloadIndex = this.downloads.findIndex(d => d.id === this.currentSelectedFile.id);
                    if (downloadIndex !== -1) {
                        this.downloads[downloadIndex] = { ...this.currentSelectedFile };
                    }

                    // Refresh and reset creation mode
                    this.loadAllFiles();
                    this.cdr.detectChanges();
                    this.onCancelCreateFile();

                    // Select the file
                    this.selectFile(this.currentSelectedFile);

                    this.isGeneratingFile = false;

                    this.snackBar.open(
                        `File saved with ${saveResponse.file.macro_count} macro(s). S3 file will be created when you download.`,
                        'Close',
                        { duration: 3000 }
                    );

                    // Reload downloads to sync with server
                    setTimeout(() => {
                        this.loadDownloads();
                    }, 1000);
                },
                error: (error) => {
                    this.onGenerateFileError(error);
                }
            });
        } else {
            // No file exists yet, create one and save macros (no S3)
            this.macroFileService.createMacroFile({
                file_type: fileType,
                character_class: this.fileCreationClass || undefined
            }).subscribe({
                next: (createResponse) => {
                    // Update current file with new file data
                    this.currentSelectedFile = {
                        id: createResponse.file.id,
                        file_name: createResponse.file.file_name,
                        file_type: createResponse.file.file_type,
                        character_class: createResponse.file.character_class,
                        macro_count: 0,
                        macros: [],
                        download_count: 0,
                        source: 'generated'
                    };

                    // Save macros to DB only (no S3 generation)
                    this.macroFileService.saveMacroFile({
                        file_id: createResponse.file.id,
                        macro_ids: selectedMacroIds,
                        file_type: fileType,
                        character_class: this.fileCreationClass || undefined
                    }).subscribe({
                        next: (saveResponse) => {
                            // Update current file with saved data
                            this.currentSelectedFile.macro_count = saveResponse.file.macro_count;
                            this.currentSelectedFile.macros = saveResponse.file.macros;

                            // Add to downloads array
                            this.downloads.unshift(this.currentSelectedFile);

                            // Refresh and reset creation mode
                            this.loadAllFiles();
                            this.cdr.detectChanges();
                            this.onCancelCreateFile();

                            // Select the file
                            this.selectFile(this.currentSelectedFile);

                            this.isGeneratingFile = false;

                            this.snackBar.open(
                                `File created with ${saveResponse.file.macro_count} macro(s). S3 file will be created when you download.`,
                                'Close',
                                { duration: 3000 }
                            );

                            // Reload downloads to sync with server
                            setTimeout(() => {
                                this.loadDownloads();
                            }, 1000);
                        },
                        error: (error) => {
                            this.onGenerateFileError(error);
                        }
                    });
                },
                error: (error) => {
                    this.onGenerateFileError(error);
                }
            });
        }
    }

    private onGenerateFileSuccess(response: any): void {
        if (!response || !response.file) {
            this.isGeneratingFile = false;
            this.snackBar.open('Invalid response from server', 'Close', { duration: 3000 });
            return;
        }

        this.isGeneratingFile = false;

        // Download the file
        if (response.file.download_url && response.file.file_name) {
            this.macroFileService.downloadFileFromUrl(
                response.file.download_url,
                response.file.file_name
            );
        }

        // Update the current file with response data
        if (this.currentSelectedFile && response.file) {
            if (response.file.file_name) {
                this.currentSelectedFile.file_name = response.file.file_name;
            }
            this.currentSelectedFile.macro_count = response.file.macro_count || 0;
            this.currentSelectedFile.macros = response.file.macros || [];
            this.currentSelectedFile.download_count = (this.currentSelectedFile.download_count || 0) + 1;
            this.currentSelectedFile.last_downloaded_at = new Date().toISOString();
            if (!this.currentSelectedFile.downloaded_at) {
                this.currentSelectedFile.downloaded_at = new Date().toISOString();
            }
        }

        // Update or add to downloads array
        const existingIndex = this.downloads.findIndex(d => d.id === this.currentSelectedFile?.id);
        if (existingIndex !== -1 && this.currentSelectedFile) {
            this.downloads[existingIndex] = this.currentSelectedFile;
        } else if (this.currentSelectedFile) {
            this.downloads.unshift(this.currentSelectedFile);
        }

        // Refresh the combined file list
        this.loadAllFiles();
        this.cdr.detectChanges();

        // Reset file creation mode
        this.onCancelCreateFile();

        // Select the file
        if (this.currentSelectedFile) {
            this.selectFile(this.currentSelectedFile);
        }

        this.snackBar.open(
            `Generated file with ${response.file.macro_count} macro(s) successfully!`,
            'Close',
            { duration: 3000 }
        );

        // Reload downloads in the background to sync with server
        setTimeout(() => {
            this.loadDownloads();
        }, 1000);
    }

    private onGenerateFileError(error: any): void {
        this.isGeneratingFile = false;
        console.error('Error generating file:', error);

        let errorMessage = 'Failed to generate macro file';
        if (error.error?.message) {
            errorMessage = error.error.message;
        }

        this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
    }

    getClassesForFileCreation(): Array<{ value: string; label: string }> {
        return this.classes;
    }

    getMacroIcon(macro: Macro): string | null {
        // Try icon from macro.icon object
        if (macro.icon && typeof macro.icon === 'object' && macro.icon !== null) {
            const icon = macro.icon as any;
            if (icon.cloudfrontUrl) {
                return icon.cloudfrontUrl;
            }
            if (icon.s3Path) {
                return `https://wowkeyb-dev-images.s3.amazonaws.com/${icon.s3Path}`;
            }
        }
        // Fallback to class icon
        const classInfo = this.classes.find(c => {
            const className = c.value?.toLowerCase();
            const macroClass = macro.class?.toLowerCase();
            return className === macroClass;
        });
        // Note: classes array doesn't have icons, so we'll return null
        return null;
    }

    getClassDisplayName(className: string | null | undefined): string {
        if (!className) return 'Generic';
        const classNames: { [key: string]: string } = {
            'deathknight': 'Death Knight',
            'demonhunter': 'Demon Hunter',
            'druid': 'Druid',
            'evoker': 'Evoker',
            'hunter': 'Hunter',
            'mage': 'Mage',
            'monk': 'Monk',
            'paladin': 'Paladin',
            'priest': 'Priest',
            'rogue': 'Rogue',
            'shaman': 'Shaman',
            'warlock': 'Warlock',
            'warrior': 'Warrior',
            'miscellaneous': 'Miscellaneous'
        };
        return classNames[className] || className;
    }

    // File editing methods
    onEditFile(): void {
        if (!this.currentSelectedFile) return;

        this.isEditingFile = true;
        // Don't restrict to file's class - allow selecting from all classes
        // Set to null to show all macros by default
        this.editingFileClass = null;
        this.editingFileSearchQuery = '';
        // Strip .txt extension for editing (will be added back on save)
        const fileName = this.currentSelectedFile.file_name || '';
        this.editingFileName = fileName.endsWith('.txt') ? fileName.slice(0, -4) : fileName;

        // Debug: Log the file data before processing
        console.log('onEditFile - currentSelectedFile:', {
            id: this.currentSelectedFile.id,
            file_name: this.currentSelectedFile.file_name,
            macro_count: this.currentSelectedFile.macro_count,
            item_count: this.currentSelectedFile.item_count,
            hasMacrosArray: !!this.currentSelectedFile.macros,
            macrosLength: this.currentSelectedFile.macros?.length || 0,
            macroIds: this.currentSelectedFile.macro_ids,
            macros: this.currentSelectedFile.macros
        });

        // Initialize with current file's macros
        this.editingFileMacros.clear();
        if (this.currentSelectedFile.macros && this.currentSelectedFile.macros.length > 0) {
            this.currentSelectedFile.macros.forEach((macro: any) => {
                // Try multiple ID fields since backend might return _id or id
                const macroId = macro.id || macro._id;
                console.log('Processing macro for edit:', { 
                    macroId, 
                    id: macro.id, 
                    _id: macro._id,
                    name: macro.name 
                });
                if (macroId) {
                    this.editingFileMacros.add(macroId);
                }
            });
        } else if (this.currentSelectedFile.macro_ids && this.currentSelectedFile.macro_ids.length > 0) {
            // Fallback: use macro_ids if macros array is not populated
            console.log('Using macro_ids fallback:', this.currentSelectedFile.macro_ids);
            this.currentSelectedFile.macro_ids.forEach((macroId: any) => {
                const id = typeof macroId === 'string' ? macroId : (macroId.id || macroId._id || macroId);
                if (id) {
                    this.editingFileMacros.add(id);
                }
            });
        }

        console.log('editingFileMacros after initialization:', Array.from(this.editingFileMacros));

        // Load macros for editing
        this.loadMacros();
        this.updateEditingFileAvailableMacros();
    }

    onCancelEditFile(): void {
        this.isEditingFile = false;
        this.editingFileMacros.clear();
        this.editingFileAvailableMacros = [];
        this.editingFileSearchQuery = '';
        this.editingFileClass = null;
        this.editingFileName = '';
    }

    onEditingFileSearchChange(): void {
        this.updateEditingFileAvailableMacros();
    }

    onEditingFileClassChange(): void {
        this.updateEditingFileAvailableMacros();
    }

    updateEditingFileAvailableMacros(): void {
        console.log('updateEditingFileAvailableMacros called:', {
            allMacrosCount: this.allMacros.length,
            editingFileMacrosCount: this.editingFileMacros.size,
            editingFileMacros: Array.from(this.editingFileMacros)
        });

        let filtered = [...this.allMacros];

        // Check if there are already class-specific macros selected
        const selectedMacros = this.allMacros.filter(m => m.id && this.editingFileMacros.has(m.id));
        console.log('Selected macros found in allMacros:', selectedMacros.map(m => ({ id: m.id, name: m.name, class: m.class })));
        
        const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

        // If there are class-specific macros already selected, restrict to that class + account-wide
        if (selectedClasses.size > 0) {
            // Only allow macros from the selected class(es) or non-class-specific macros
            const allowedClasses = Array.from(selectedClasses);
            filtered = filtered.filter(m => {
                // Allow non-class-specific macros (account-wide)
                if (!m.class) return true;
                // Allow macros that match one of the already selected classes
                return allowedClasses.includes(m.class);
            });
        } else {
            // If no class-specific macros are selected, filter by the class dropdown if set
            if (this.editingFileClass !== null && this.editingFileClass !== undefined) {
                // Show only the selected class OR non-class-specific macros
                filtered = filtered.filter(m => !m.class || m.class === this.editingFileClass);
            }
            // If no class filter and no selected class-specific macros, show all macros
        }

        // Filter by search query
        if (this.editingFileSearchQuery && this.editingFileSearchQuery.trim()) {
            const query = this.editingFileSearchQuery.toLowerCase().trim();
            filtered = filtered.filter(m => {
                const name = (m.name || '').toLowerCase();
                const description = (m.description || '').toLowerCase();
                const macroText = ((m.macro_text || m.text || m.macroText) || '').toLowerCase();
                return name.includes(query) || description.includes(query) || macroText.includes(query);
            });
        }

        this.editingFileAvailableMacros = filtered;
    }

    toggleMacroForEditing(macro: Macro): void {
        if (!macro.id) return;

        if (this.editingFileMacros.has(macro.id)) {
            // Removing a macro - just remove it
            this.editingFileMacros.delete(macro.id);
            // Update available macros since the class restriction may have changed
            this.updateEditingFileAvailableMacros();
        } else {
            // Adding a macro - check if it conflicts with existing class-specific macros
            const selectedMacros = this.allMacros.filter(m => m.id && this.editingFileMacros.has(m.id));
            const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

            // If there are already class-specific macros selected
            if (selectedClasses.size > 0 && macro.class) {
                // Check if this macro's class matches any of the selected classes
                if (!selectedClasses.has(macro.class)) {
                    // Different class - don't allow it
                    const classNames = Array.from(selectedClasses).map(c => this.getClassDisplayName(c)).join(', ');
                    this.snackBar.open(
                        `Cannot add ${this.getClassDisplayName(macro.class)} macro. File already contains ${classNames} macro(s). Only macros from the same class or account-wide macros can be added.`,
                        'Close',
                        { duration: 5000 }
                    );
                    return;
                }
            }

            // Allow the macro to be added
            this.editingFileMacros.add(macro.id);
            // Update available macros since the class restriction may have changed
            this.updateEditingFileAvailableMacros();
        }
    }

    isMacroSelectedForEditing(macro: Macro): boolean {
        return macro.id ? this.editingFileMacros.has(macro.id) : false;
    }

    canSelectMacroForEditing(macro: Macro): boolean {
        if (!macro.id) return false;

        // If already selected, can always deselect
        if (this.editingFileMacros.has(macro.id)) return true;

        // Check if there are already class-specific macros selected
        const selectedMacros = this.allMacros.filter(m => m.id && this.editingFileMacros.has(m.id));
        const selectedClasses = new Set(selectedMacros.map(m => m.class).filter(Boolean));

        // If no class-specific macros are selected, can select any macro
        if (selectedClasses.size === 0) return true;

        // If macro is account-wide (no class), can always select it
        if (!macro.class) return true;

        // Can only select if macro's class matches one of the already selected classes
        return selectedClasses.has(macro.class);
    }

    selectAllMacrosForEditing(): void {
        this.editingFileAvailableMacros.forEach(macro => {
            if (macro.id) {
                this.editingFileMacros.add(macro.id);
            }
        });
    }

    deselectAllMacrosForEditing(): void {
        this.editingFileMacros.clear();
    }

    onSaveEditedFile(): void {
        if (!this.currentSelectedFile) {
            this.snackBar.open('No file selected', 'Close', { duration: 3000 });
            return;
        }
        // Allow saving files with no macros (blank files are valid)

        this.isSavingFile = true;

        const selectedMacroIds = Array.from(this.editingFileMacros);
        const currentFile = this.currentSelectedFile; // Store reference for use in callbacks

        // Determine file class based on selected macros
        // Get the selected macros to check their classes
        const selectedMacros = this.allMacros.filter(m => m.id && this.editingFileMacros.has(m.id));
        const classesInFile = new Set(selectedMacros.map(m => m.class).filter(Boolean));

        // If all macros are from the same class (and it's not empty), use that class
        // Otherwise, use account-wide (no character_class)
        let fileClass: string | undefined = undefined;
        if (classesInFile.size === 1) {
            fileClass = Array.from(classesInFile)[0];
        }

        // Determine file type: character if there's a class, account otherwise
        const fileType = fileClass ? 'character' : 'account';
        const isNewFile = (currentFile as any)._isNew;

        // Add .txt extension if not present
        let finalFileName = this.editingFileName?.trim() || undefined;
        if (finalFileName && !finalFileName.endsWith('.txt')) {
            finalFileName = `${finalFileName}.txt`;
        }

        // Save macros to database only (no S3 file generation)
        this.macroFileService.saveMacroFile({
            file_id: currentFile.id,
            macro_ids: selectedMacroIds,
            file_type: fileType as 'account' | 'character',
            character_class: fileClass,
            file_name: finalFileName
        }).subscribe({
            next: (saveResponse) => {
                // Update current file with saved data
                if (this.currentSelectedFile) {
                    this.currentSelectedFile.macro_count = saveResponse.file.macro_count;
                    this.currentSelectedFile.macros = saveResponse.file.macros;
                    this.currentSelectedFile.file_type = saveResponse.file.file_type;
                    this.currentSelectedFile.character_class = saveResponse.file.character_class;
                    this.currentSelectedFile.file_name = saveResponse.file.file_name;
                    if (saveResponse.file.created_at) {
                        this.currentSelectedFile.created_at = saveResponse.file.created_at;
                    }
                    if (saveResponse.file.updated_at) {
                        this.currentSelectedFile.updated_at = saveResponse.file.updated_at;
                    }

                    // Update the file in downloads array
                    const downloadIndex = this.downloads.findIndex(d => d.id === this.currentSelectedFile?.id);
                    if (downloadIndex !== -1 && this.currentSelectedFile) {
                        this.downloads[downloadIndex] = { ...this.currentSelectedFile };
                    }

                    // Refresh and exit edit mode
                    this.loadAllFiles();
                    this.cdr.detectChanges();
                    this.onCancelEditFile();

                    this.isSavingFile = false;

                    const message = `File saved with ${saveResponse.file.macro_count} macro(s). S3 file will be created when you download.`;
                    this.snackBar.open(message, 'Close', { duration: 3000 });

                    // Reload downloads to sync with server
                    setTimeout(() => {
                        this.loadDownloads();
                    }, 1000);
                }
            },
            error: (error) => {
                this.isSavingFile = false;
                console.error('Error saving file:', error);

                let errorMessage = 'Failed to save file';
                if (error.error?.message) {
                    errorMessage = error.error.message;
                }

                this.snackBar.open(errorMessage, 'Close', { duration: 5000 });
            }
        });
    }

}

