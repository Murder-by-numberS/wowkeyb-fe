# Macro File Upload/Download - Frontend Implementation

## Overview

The frontend implementation provides a complete UI for uploading, generating, and managing WoW macro files. It consists of three main dialog components and integration with the existing macros module.

## Components Created

### 1. **MacroFileService** (`services/macro-file.service.ts`)

Central service for all macro file operations.

#### Methods:

```typescript
// Upload a WoW macro file
uploadMacroFile(request: MacroFileUploadRequest): Observable<MacroFileUploadResponse>

// Generate a macro file from selected macros
generateMacroFile(request: GenerateMacroFileRequest): Observable<GenerateMacroFileResponse>

// Get download history
getDownloadHistory(fileType?, characterClass?, limit, page): Observable<DownloadHistoryResponse>

// Re-download a previously generated file
redownloadFile(downloadId: string): Observable<RedownloadResponse>

// Delete a download record
deleteDownloadRecord(downloadId: string): Observable<{ message: string }>

// Helper to trigger file download
downloadFileFromUrl(url: string, fileName: string): void
```

### 2. **UploadMacroFileDialogComponent**

Dialog for uploading WoW macro cache files.

**Location:** `components/upload-macro-file-dialog/`

**Features:**
- ✅ Drag & drop file upload (or click to select)
- ✅ File validation (.txt only, max 2MB)
- ✅ Select file type (Account-wide or Character-specific)
- ✅ Character class selection (required for character-specific)
- ✅ Option to create macros in database
- ✅ Real-time upload progress
- ✅ Validation error/warning display
- ✅ Success confirmation with stats

**Usage:**
```typescript
const dialogRef = this.dialog.open(UploadMacroFileDialogComponent, {
    width: '600px'
});

dialogRef.afterClosed().subscribe(result => {
    if (result) {
        console.log(`Uploaded ${result.upload.macros_created} macros`);
    }
});
```

### 3. **ExportMacroFileDialogComponent**

Dialog for generating macro files with checkbox selection.

**Location:** `components/export-macro-file-dialog/`

**Features:**
- ✅ Checkbox list of all user's macros
- ✅ Select All / Deselect All buttons
- ✅ File type selection (Account-wide or Character-specific)
- ✅ Character class selection (filters macros automatically)
- ✅ Optional character name (for filename)
- ✅ Save to download history option
- ✅ Live count of selected macros
- ✅ Automatic file download on success
- ✅ Smart filtering (character-specific only shows class macros + generic)

**Usage:**
```typescript
const dialogRef = this.dialog.open(ExportMacroFileDialogComponent, {
    width: '800px',
    data: {
        macros: this.macros  // Array of user's macros
    }
});

dialogRef.afterClosed().subscribe(result => {
    if (result) {
        console.log(`Exported ${result.file.macro_count} macros`);
    }
});
```

**Smart Filtering:**
- When "Character-Specific" + class selected → shows only macros for that class OR generic macros (no class)
- When "Account-Wide" → shows all macros

### 4. **DownloadHistoryDialogComponent**

Dialog for viewing and managing download history.

**Location:** `components/download-history-dialog/`

**Features:**
- ✅ Paginated list of downloads
- ✅ Filter by file type (Account/Character)
- ✅ Filter by character class
- ✅ Re-download button (generates new presigned URL)
- ✅ Delete record button
- ✅ Expandable macro list per download
- ✅ Download count and dates
- ✅ Relative time formatting ("2 hours ago")
- ✅ Confirm before delete

**Usage:**
```typescript
this.dialog.open(DownloadHistoryDialogComponent, {
    width: '900px',
    maxWidth: '95vw',
    maxHeight: '90vh'
});
```

## Integration with My Macros Component

### Added Buttons

Three new buttons added to the header (shown when not editing/creating):

```html
<!-- Import File Button -->
<button mat-stroked-button (click)="openUploadDialog()">
    <mat-icon class="mr-2">upload_file</mat-icon>
    Import File
</button>

<!-- Export File Button -->
<button mat-stroked-button (click)="openExportDialog()" [disabled]="macros.length === 0">
    <mat-icon class="mr-2">download</mat-icon>
    Export File
</button>

<!-- Download History Button -->
<button mat-icon-button (click)="openDownloadHistory()" matTooltip="Download History">
    <mat-icon>history</mat-icon>
</button>
```

### Methods Added

```typescript
openUploadDialog(): void
openExportDialog(): void
openDownloadHistory(): void
```

## User Workflows

### Workflow 1: Import Macros from WoW

1. User clicks "Import File" button
2. Upload dialog opens
3. User selects/drags their `macros-cache.txt` file from WoW
4. User selects file type:
   - **Account-wide**: For macros that work on any character
   - **Character-specific**: For class-specific macros (requires class selection)
5. User checks "Create macros in database" if they want to import them
6. Click "Upload"
7. File is parsed, validated, and macros are created
8. Success message shows: "Imported 15 macro(s) successfully!"
9. Macro list refreshes automatically

### Workflow 2: Export Macros to WoW

1. User clicks "Export File" button
2. Export dialog opens showing all macros with checkboxes
3. User selects desired macros (or clicks "Select All")
4. User chooses file type and class (if character-specific)
5. Optionally enters character name
6. Checks "Save to download history" to keep a record
7. Click "Export (15)" button
8. File is generated and downloaded automatically
9. Success message: "Exported 15 macro(s) successfully!"
10. File can be placed in WoW's WTF folder

### Workflow 3: Re-download Previous Export

1. User clicks download history button (history icon)
2. Download history dialog opens
3. User can filter by type/class
4. User clicks download button on any previous export
5. Fresh download link is generated
6. File downloads automatically
7. Download count increments

### Workflow 4: Clean Up History

1. User opens download history
2. User clicks delete button on old records
3. Confirmation dialog appears
4. After confirmation, record is deleted
5. History refreshes

## File Format Details

### WoW Macro File Structure

```
VER 3 [hex_id] "[macro_name]" "[icon_fdid]"
[macro_line_1]
[macro_line_2]
...
END
```

**Example:**
```
VER 3 0100000000000001 "Auto Judgement" "135959"
#showtooltip Judgment
/cast [harm] Judgment
/stopmacro [harm]
/targetenemy
/cast Judgment
/targetlasttarget
END
```

### File Locations in WoW

- **Account macros:** `World of Warcraft\_retail_\WTF\Account\[ACCOUNT]\macros-cache.txt`
- **Character macros:** `World of Warcraft\_retail_\WTF\Account\[ACCOUNT]\[SERVER]\[CHARACTER]\macros-cache.txt`

## UI/UX Highlights

### Upload Dialog
- **Drag & drop zone** - Large, obvious drop target
- **File preview** - Shows selected file name and size
- **Validation feedback** - Real-time errors and warnings
- **Progress indication** - Shows upload in progress
- **Success state** - Green box with statistics

### Export Dialog
- **Checkbox selection** - Easy to select multiple macros
- **Smart filtering** - Auto-filters when class selected
- **Selection counter** - "Selected: 5 / 20 macros"
- **Macro preview** - Shows first 60 characters of each macro
- **Class badges** - Visual indicators for macro classes

### Download History
- **Card-based layout** - Each download in its own card
- **Expandable details** - Click to see macro list
- **Chip indicators** - File type, class, macro count
- **Relative dates** - "2 hours ago" vs "Jan 15, 2024"
- **Pagination** - Handle large history lists

## Validation & Error Handling

### Upload Validation

✅ **File type check** - Only .txt files accepted  
✅ **File size limit** - Max 2MB  
✅ **Class validation** - Character files must match class  
✅ **Format validation** - Must be valid WoW macro format  

### Export Validation

✅ **At least one macro selected**  
✅ **Valid form fields**  
✅ **Class required for character-specific**  
✅ **Macros match selected class**  

### Error Messages

```typescript
// File too large
"File size must be less than 2MB"

// Wrong class
"Macro file contains macros for wrong class"

// No macros selected
"Please select at least one macro to export"

// API error
"Failed to upload macro file" (with details)
```

## Styling

All components use:
- **Material Design** components
- **Tailwind CSS** utility classes
- **Dark mode support**
- **Responsive design** (mobile-friendly)
- **Consistent spacing** with Fuse theme

## Dependencies

```json
{
  "@angular/material": "^17.x",
  "@angular/cdk": "^17.x",
  "rxjs": "^7.x"
}
```

## Testing Checklist

### Upload Flow
- [ ] Can select .txt file
- [ ] Rejects non-.txt files
- [ ] Rejects files > 2MB
- [ ] Character-specific requires class
- [ ] Validates class matches macros
- [ ] Creates macros when checked
- [ ] Refreshes macro list after upload
- [ ] Shows validation errors clearly

### Export Flow
- [ ] Shows all user's macros
- [ ] Select All works
- [ ] Deselect All works
- [ ] Character-specific filters correctly
- [ ] Generic macros included for all classes
- [ ] File downloads on success
- [ ] Saves to history when checked
- [ ] Counter updates correctly

### Download History
- [ ] Shows paginated downloads
- [ ] Filters work correctly
- [ ] Re-download generates new link
- [ ] Delete requires confirmation
- [ ] Expandable macro list works
- [ ] Pagination works
- [ ] Relative dates format correctly

## Future Enhancements

- 📋 **Bulk operations** - Delete multiple history records at once
- 🔍 **Search** - Search macros within export dialog
- 📊 **Statistics** - Show upload/download stats
- 🏷️ **Tags** - Filter macros by tags in export
- 📱 **Mobile optimization** - Better mobile layouts
- 🎨 **Themes** - Match WoW class colors
- 💾 **Auto-save** - Remember last export settings
- 🔗 **Share links** - Share exported files with others

## Troubleshooting

### "No macros available to export"
- User has no macros created yet
- Need to create macros first

### "Failed to upload macro file"
- Check file format is correct WoW macro cache
- Verify backend API is running
- Check authentication token is valid

### "Class validation failed"
- Macro file contains wrong class spells
- Double-check file is for correct class

### Downloads don't start
- Check browser popup blocker
- Verify S3 presigned URLs are valid
- Check CORS settings on S3 bucket

## Developer Notes

### Adding New Features

To add a new field to the export:

1. **Update the service interface:**
```typescript
export interface GenerateMacroFileRequest {
    // ... existing fields
    new_field?: string;
}
```

2. **Add to the form in export dialog:**
```typescript
this.exportForm = this.fb.group({
    // ... existing controls
    new_field: ['']
});
```

3. **Include in API call:**
```typescript
this.macroFileService.generateMacroFile({
    // ... existing fields
    new_field: formValue.new_field
});
```

### Extending Download History

To add a new filter:

1. Add filter property
2. Add form field in template
3. Update `applyFilters()` method
4. Pass to `getDownloadHistory()` call

## Summary

The macro file system provides a seamless way for users to:
- ✅ Import their existing WoW macros into WowKeyb
- ✅ Export selected macros to use in WoW
- ✅ Maintain a history of exports for re-downloading
- ✅ Validate macros match the correct class
- ✅ Handle both account-wide and character-specific files

All components are fully typed, responsive, accessible, and follow Angular and Material Design best practices.

