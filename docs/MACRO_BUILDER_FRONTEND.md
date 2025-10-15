# Frontend Implementation Guide - Macro Builder

## Overview

This guide explains how to integrate the new Macro Builder and Validation components into your WoW Keybindings frontend application.

## New Components

### 1. MacroBuilderComponent
**Location**: `src/app/modules/macros/components/macro-builder/`

A dialog component that provides an interactive macro builder interface with:
- Template selection (8 different macro patterns)
- Spell/ability configuration
- Smart conditional suggestions
- Generated macro preview
- Copy to clipboard functionality

**Usage**:
```typescript
import { MatDialog } from '@angular/material/dialog';
import { MacroBuilderComponent } from './components/macro-builder/macro-builder.component';

// In your component
constructor(private dialog: MatDialog) {}

openMacroBuilder() {
  const dialogRef = this.dialog.open(MacroBuilderComponent, {
    width: '900px',
    data: {
      spellName: 'Flash Heal',  // Optional: pre-fill
      class: 'priest',           // Optional: pre-fill
      abilityId: 'abc123'        // Optional: pre-fill
    }
  });

  dialogRef.afterClosed().subscribe(result => {
    if (result) {
      // result contains: macroText, tags, explanation
      this.macroForm.patchValue({
        macro_text: result.macroText,
        tags: result.tags
      });
    }
  });
}
```

### 2. MacroValidatorComponent
**Location**: `src/app/modules/macros/components/macro-validator/`

A component that provides real-time macro validation with:
- Syntax error detection
- Command warnings
- Quality scoring (A-F grades)
- Improvement suggestions
- Auto-generated tags

**Usage**:
```html
<!-- In your macro form template -->
<textarea [(ngModel)]="macroText"></textarea>

<app-macro-validator
  [macroText]="macroText"
  [wowClass]="selectedClass"
  [autoValidate]="true">
</app-macro-validator>
```

## Updated Services

### MacroService Enhancements

Added new methods to `macro.service.ts`:

```typescript
// Validate macro in real-time
validateMacroText(macroText: string, wowClass?: string): Observable<ValidationResponse>

// Get available templates
getTemplates(): Observable<{ templates: MacroTemplate[] }>

// Generate macro from template
generateMacro(request: GenerateMacroRequest): Observable<GenerateMacroResponse>

// Get conditional suggestions
getConditionalSuggestions(abilityType?: string, abilityId?: string): Observable<SuggestionsResponse>

// Detect ability type
detectAbilityType(spellName: string): Observable<DetectionResponse>
```

## Integration Steps

### Step 1: Add to Your Create/Edit Macro Page

```typescript
// In your-create-macro.component.ts
import { MacroBuilderComponent } from '../components/macro-builder/macro-builder.component';
import { MatDialog } from '@angular/material/dialog';

export class CreateMacroComponent {
  macroForm: FormGroup;
  
  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog
  ) {
    this.macroForm = this.fb.group({
      name: [''],
      macro_text: [''],
      class: [''],
      tags: [[]]
    });
  }

  openBuilder() {
    const dialogRef = this.dialog.open(MacroBuilderComponent, {
      width: '900px',
      data: {
        class: this.macroForm.get('class')?.value
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.macroForm.patchValue({
          macro_text: result.macroText,
          tags: result.tags
        });
      }
    });
  }
}
```

```html
<!-- In your-create-macro.component.html -->
<form [formGroup]="macroForm">
  <mat-form-field>
    <mat-label>Macro Name</mat-label>
    <input matInput formControlName="name">
  </mat-form-field>

  <div class="macro-text-section">
    <div class="header">
      <mat-label>Macro Text</mat-label>
      <button mat-raised-button color="accent" (click)="openBuilder()">
        <mat-icon>construction</mat-icon>
        Use Macro Builder
      </button>
    </div>
    
    <textarea
      formControlName="macro_text"
      rows="8"
      placeholder="Enter your macro commands...">
    </textarea>

    <!-- Real-time validation -->
    <app-macro-validator
      [macroText]="macroForm.get('macro_text')?.value"
      [wowClass]="macroForm.get('class')?.value">
    </app-macro-validator>
  </div>

  <!-- Rest of your form -->
</form>
```

### Step 2: Add Builder Button to Existing Macro List

```html
<!-- In my-macros.component.html -->
<div class="macros-header">
  <h2>My Macros</h2>
  <div class="actions">
    <button mat-raised-button color="primary" (click)="createNew()">
      <mat-icon>add</mat-icon>
      Create Macro
    </button>
    <button mat-raised-button color="accent" (click)="openBuilder()">
      <mat-icon>construction</mat-icon>
      Macro Builder
    </button>
  </div>
</div>
```

### Step 3: Enable Validation on Edit

```typescript
// In edit-macro.component.ts
ngOnInit() {
  // Load existing macro
  this.loadMacro(this.macroId);
  
  // Watch for changes to trigger validation
  this.macroForm.get('macro_text')?.valueChanges.subscribe(text => {
    // Validation happens automatically in MacroValidatorComponent
  });
}
```

## Features Showcase

### 1. Template Selection
Users can choose from 8 pre-built templates:
- 🖱️ **Mouseover** - Quick targeting without losing focus
- 🎯 **Focus** - Multi-target scenarios
- ⚔️ **Arena 1-2-3** - PvP quick targeting
- 👤 **Self-Cast** - Personal buffs/heals
- 🔄 **Cast Sequence** - Ability rotations
- ⌨️ **Modified Keys** - Multiple abilities on one key
- ⏹️ **Stop Cast** - Instant ability interrupts
- 🐾 **Pet Assist** - Pet control macros

### 2. Smart Generation

**Example: User wants a healing macro**
1. Select "Mouseover" template
2. Enter "Flash Heal"
3. System detects it's a heal
4. Generates: `[@mouseover,help,nodead][@player]`
5. Explanation: "Heals mouseover target, falls back to self"

**Example: User wants a damage macro**
1. Select "Mouseover" template
2. Enter "Fireball"
3. System detects it's damage
4. Generates: `[@mouseover,harm,nodead][]`
5. Explanation: "Attacks mouseover enemy, falls back to target"

### 3. Real-Time Validation

As users type, the validator shows:
- ❌ **Errors**: Invalid commands with suggestions
- ⚠️ **Warnings**: Deprecated or class-inappropriate commands
- 📊 **Quality Score**: A-F grade based on macro quality
- 💡 **Suggestions**: Tips for improvement
- 🏷️ **Auto-Tags**: Suggested tags based on content

### 4. Quality Grading

| Grade | Score | Description |
|-------|-------|-------------|
| A | 90-100 | Perfect macro with no issues |
| B | 80-89 | Good macro with minor suggestions |
| C | 70-79 | Acceptable with some improvements needed |
| D | 60-69 | Many issues, needs work |
| F | 0-59 | Significant problems |

## API Integration

### Backend Endpoints Used

```typescript
// Macro Builder
GET    /api/macro-builder/templates
POST   /api/macro-builder/generate
GET    /api/macro-builder/suggestions
GET    /api/macro-builder/detect-type

// Validation
POST   /api/macros/validate

// Creating macros now returns validation info
POST   /api/macros
```

### Response Examples

**Generate Macro Response**:
```json
{
  "macro_text": "#showtooltip Flash Heal\n/cast [@mouseover,help,nodead][@player] Flash Heal",
  "suggested_tags": ["mouseover", "targeting", "heal"],
  "explanation": "Mouseover macro for Flash Heal. Casts on mouseover friendly target, falls back to self-cast.",
  "ability_type": "heal",
  "suggestions": {
    "conditionals": ["mouseover,help,nodead", "target,help,nodead", "player"],
    "explanation": "Healing spells should target friendly units that are alive...",
    "examples": [...]
  }
}
```

**Validation Response**:
```json
{
  "validation": {
    "errors": [],
    "warnings": [],
    "quality": {
      "total": 95,
      "grade": "A",
      "issues": [],
      "suggestions": ["Consider adding #showtooltip for better action bar integration"]
    },
    "is_valid": true
  },
  "suggested_tags": ["combat", "auto-attack"]
}
```

## UI/UX Enhancements

### 1. Macro Builder Flow
```
User clicks "Use Macro Builder"
  ↓
Dialog opens with template grid
  ↓
User selects template (e.g., Mouseover)
  ↓
Form appears for spell name and options
  ↓
User enters "Flash Heal"
  ↓
Clicks "Generate Macro"
  ↓
Preview shows generated macro with explanation
  ↓
User clicks "Use This Macro"
  ↓
Dialog closes, macro text fills form
```

### 2. Real-Time Validation Flow
```
User types in macro textarea
  ↓
Debounced validation (500ms delay)
  ↓
API call to /api/macros/validate
  ↓
Results display below textarea:
  - Quality score badge (A-F)
  - Error messages with line numbers
  - Warning messages
  - Suggestions
  - Auto-generated tags
```

### 3. Visual Feedback

**Errors**: Red background, error icon, line numbers, suggestions
**Warnings**: Orange background, warning icon, additional details
**Success**: Green badge with checkmark
**Loading**: Progress bar with "Validating..." text

## Styling

Both components use Material Design with:
- Consistent color scheme
- Smooth transitions
- Responsive grid layout
- Clear visual hierarchy
- Accessibility features

### Color Palette
- **Success/A Grade**: Green (#4caf50)
- **Warning/C-D Grade**: Orange (#ff9800)
- **Error/F Grade**: Red (#f44336)
- **Info**: Blue (#2196f3)
- **Primary**: Your theme primary color
- **Accent**: Your theme accent color

## Testing

### Manual Testing Checklist

- [ ] Open Macro Builder dialog
- [ ] Select each template type
- [ ] Generate macro for heal spell
- [ ] Generate macro for damage spell
- [ ] Copy generated macro to clipboard
- [ ] Paste into macro form
- [ ] Type invalid command in textarea
- [ ] Verify error shows with line number
- [ ] Type deprecated command
- [ ] Verify warning shows
- [ ] Type valid macro
- [ ] Verify quality score shows as "A"
- [ ] Check auto-generated tags appear
- [ ] Test on mobile/tablet (responsive)

### E2E Test Example

```typescript
describe('Macro Builder', () => {
  it('should generate a mouseover healing macro', () => {
    // Open builder
    cy.get('[data-test="open-builder"]').click();
    
    // Select mouseover template
    cy.get('[data-template="mouseover"]').click();
    
    // Enter spell name
    cy.get('[formControlName="spellName"]').type('Flash Heal');
    
    // Generate
    cy.get('[data-test="generate"]').click();
    
    // Verify macro generated
    cy.get('.generated-macro pre').should('contain', '@mouseover,help,nodead');
    
    // Use macro
    cy.get('[data-test="use-macro"]').click();
    
    // Verify it populated form
    cy.get('[formControlName="macro_text"]').should('contain', 'Flash Heal');
  });
});
```

## Next Steps

1. **Integrate Builder Button**: Add "Use Macro Builder" button to your create/edit macro pages
2. **Add Validator**: Include `<app-macro-validator>` in macro text areas
3. **Test Thoroughly**: Verify all templates work correctly
4. **Add Analytics** (Optional): Track which templates are most popular
5. **User Feedback**: Gather feedback on macro quality and usefulness

## Support

If you encounter issues:
1. Check browser console for errors
2. Verify API endpoints are accessible
3. Ensure Material Design modules are imported
4. Check that services are properly injected

## Future Enhancements

Potential additions:
- **Visual Macro Builder**: Drag-drop conditional builder
- **Macro Library**: Browse community-shared macros
- **Import/Export**: Copy from in-game addon
- **Macro Testing**: Simulate macro execution
- **Version History**: Track macro changes over time

---

**Status**: ✅ Frontend Components Ready for Integration

