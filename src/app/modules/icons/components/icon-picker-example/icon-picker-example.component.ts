import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Icon } from '../../services/icon.service';
import { IconPickerComponent } from '../icon-picker/icon-picker.component';
import { IconService } from '../../services/icon.service';

@Component({
    selector: 'app-icon-picker-example',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        IconPickerComponent
    ],
    providers: [IconService],
    template: `
        <div class="icon-picker-example">
            <h2>Icon Picker Example</h2>

            <div class="form-group">
                <label for="macroName">Macro Name:</label>
                <input
                    id="macroName"
                    type="text"
                    [(ngModel)]="macroName"
                    placeholder="Enter macro name"
                    class="form-input"
                />
            </div>

            <div class="form-group">
                <label for="macroText">Macro Text:</label>
                <textarea
                    id="macroText"
                    [(ngModel)]="macroText"
                    placeholder="Enter macro commands"
                    class="form-textarea"
                    rows="4"
                ></textarea>
            </div>

            <div class="form-group">
                <label>Icon:</label>
                <app-icon-picker
                    [selectedIcon]="selectedIcon"
                    (iconSelected)="onIconSelected($event)"
                    (iconCleared)="onIconCleared()"
                    placeholder="Select an icon for your macro"
                ></app-icon-picker>
            </div>

            <div class="form-actions">
                <button
                    type="button"
                    class="btn btn-primary"
                    (click)="saveMacro()"
                    [disabled]="!macroName || !macroText"
                >
                    Save Macro
                </button>
            </div>

            <!-- Preview -->
            <div class="macro-preview" *ngIf="macroName || macroText || selectedIcon">
                <h3>Preview:</h3>
                <div class="preview-item">
                    <strong>Name:</strong> {{ macroName || 'Untitled Macro' }}
                </div>
                <div class="preview-item">
                    <strong>Icon:</strong>
                    <span *ngIf="selectedIcon; else noIcon">
                        <img
                            [src]="getIconUrl(selectedIcon)"
                            [alt]="selectedIcon.name"
                            class="preview-icon"
                        />
                        {{ selectedIcon.name }}
                    </span>
                    <ng-template #noIcon>No icon selected</ng-template>
                </div>
                <div class="preview-item">
                    <strong>Text:</strong> {{ macroText || 'No macro text' }}
                </div>
            </div>
        </div>
    `,
    styles: [`
        .icon-picker-example {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            font-family: 'Inter', sans-serif;
        }

        h2 {
            color: #1e293b;
            margin-bottom: 24px;
        }

        .form-group {
            margin-bottom: 20px;
        }

        label {
            display: block;
            margin-bottom: 8px;
            font-weight: 500;
            color: #374151;
        }

        .form-input, .form-textarea {
            width: 100%;
            padding: 12px;
            border: 2px solid #e2e8f0;
            border-radius: 6px;
            font-size: 14px;
            transition: border-color 0.2s ease;

            &:focus {
                outline: none;
                border-color: #3b82f6;
                box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
            }
        }

        .form-textarea {
            resize: vertical;
            min-height: 100px;
        }

        .form-actions {
            margin-top: 24px;
        }

        .btn {
            padding: 12px 24px;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;

            &.btn-primary {
                background: #3b82f6;
                color: white;

                &:hover:not(:disabled) {
                    background: #2563eb;
                }

                &:disabled {
                    background: #94a3b8;
                    cursor: not-allowed;
                }
            }
        }

        .macro-preview {
            margin-top: 32px;
            padding: 20px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 8px;

            h3 {
                margin: 0 0 16px 0;
                color: #1e293b;
                font-size: 16px;
            }

            .preview-item {
                margin-bottom: 12px;
                display: flex;
                align-items: center;
                gap: 8px;

                strong {
                    min-width: 60px;
                    color: #374151;
                }

                .preview-icon {
                    width: 20px;
                    height: 20px;
                    object-fit: contain;
                    border-radius: 2px;
                    background: white;
                    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
                    margin-right: 4px;
                }
            }
        }
    `]
})
export class IconPickerExampleComponent {
    macroName: string = '';
    macroText: string = '';
    selectedIcon: Icon | null = null;

    constructor(private iconService: IconService) { }

    onIconSelected(icon: Icon): void {
        this.selectedIcon = icon;
        console.log('Icon selected:', icon);
    }

    onIconCleared(): void {
        this.selectedIcon = null;
        console.log('Icon cleared');
    }

    getIconUrl(icon: Icon): string {
        return this.iconService.getIconUrl(icon);
    }

    saveMacro(): void {
        if (!this.macroName || !this.macroText) return;

        const macro = {
            name: this.macroName,
            text: this.macroText,
            icon: this.selectedIcon ? {
                id: this.selectedIcon.id,
                name: this.selectedIcon.name,
                url: this.getIconUrl(this.selectedIcon)
            } : undefined
        };

        console.log('Saving macro:', macro);

        // Here you would call your macro service to save the macro
        // this.macroService.createMacro(macro).subscribe(...)
    }
}
