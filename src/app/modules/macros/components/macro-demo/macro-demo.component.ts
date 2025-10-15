import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MacroBuilderComponent } from '../macro-builder/macro-builder.component';
import { MacroValidatorComponent } from '../macro-validator/macro-validator.component';

@Component({
    selector: 'app-macro-demo',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatIconModule,
        MacroValidatorComponent
    ],
    template: `
        <div class="macro-demo-container">
            <div class="header">
                <h1>
                    <mat-icon>science</mat-icon>
                    Macro Builder Demo
                </h1>
                <p class="subtitle">Test the intelligent macro creation and validation system</p>
            </div>

            <div class="demo-section">
                <h2>1. Macro Builder</h2>
                <p>Click the button below to open the interactive macro builder dialog:</p>
                <button mat-raised-button color="primary" (click)="openMacroBuilder()">
                    <mat-icon>construction</mat-icon>
                    Open Macro Builder
                </button>
            </div>

            <div class="demo-section">
                <h2>2. Real-Time Validation</h2>
                <p>Type a macro below to see real-time validation in action:</p>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Select Class (Optional)</mat-label>
                    <mat-select [(ngModel)]="selectedClass">
                        <mat-option value="">None</mat-option>
                        <mat-option value="deathknight">Death Knight</mat-option>
                        <mat-option value="demonhunter">Demon Hunter</mat-option>
                        <mat-option value="druid">Druid</mat-option>
                        <mat-option value="evoker">Evoker</mat-option>
                        <mat-option value="hunter">Hunter</mat-option>
                        <mat-option value="mage">Mage</mat-option>
                        <mat-option value="monk">Monk</mat-option>
                        <mat-option value="paladin">Paladin</mat-option>
                        <mat-option value="priest">Priest</mat-option>
                        <mat-option value="rogue">Rogue</mat-option>
                        <mat-option value="shaman">Shaman</mat-option>
                        <mat-option value="warlock">Warlock</mat-option>
                        <mat-option value="warrior">Warrior</mat-option>
                    </mat-select>
                </mat-form-field>

                <mat-form-field appearance="outline" class="full-width">
                    <mat-label>Macro Text</mat-label>
                    <textarea
                        matInput
                        [(ngModel)]="macroText"
                        rows="8"
                        placeholder="Try typing: #showtooltip&#10;/cast Fireball">
                    </textarea>
                    <mat-hint>Type or paste a macro to see validation</mat-hint>
                </mat-form-field>

                <!-- Real-time validator -->
                <app-macro-validator
                    [macroText]="macroText"
                    [wowClass]="selectedClass"
                    [autoValidate]="true">
                </app-macro-validator>
            </div>

            <div class="demo-section">
                <h2>3. Example Macros</h2>
                <p>Click an example to load it:</p>
                <div class="examples-grid">
                    <button mat-stroked-button (click)="loadExample('valid')">
                        ✅ Valid Macro
                    </button>
                    <button mat-stroked-button (click)="loadExample('invalid')">
                        ❌ Invalid Commands
                    </button>
                    <button mat-stroked-button (click)="loadExample('warning')">
                        ⚠️ With Warnings
                    </button>
                    <button mat-stroked-button (click)="loadExample('pet')">
                        🐾 Pet Macro
                    </button>
                </div>
            </div>

            <div class="demo-section result-section" *ngIf="generatedMacro">
                <h2>Generated Macro Result</h2>
                <div class="result-box">
                    <div class="result-header">
                        <mat-icon>check_circle</mat-icon>
                        <span>Macro Generated Successfully!</span>
                    </div>
                    <pre class="macro-code">{{ generatedMacro }}</pre>
                    <div class="result-tags" *ngIf="generatedTags.length > 0">
                        <strong>Tags:</strong> {{ generatedTags.join(', ') }}
                    </div>
                    <div class="result-explanation" *ngIf="generatedExplanation">
                        <strong>Explanation:</strong> {{ generatedExplanation }}
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [`
        .macro-demo-container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 24px;
        }

        .header {
            text-align: center;
            margin-bottom: 48px;

            h1 {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 12px;
                font-size: 32px;
                margin: 0 0 8px 0;

                mat-icon {
                    font-size: 36px;
                    width: 36px;
                    height: 36px;
                    color: #2196f3;
                }
            }

            .subtitle {
                color: rgba(0, 0, 0, 0.6);
                font-size: 16px;
            }
        }

        .demo-section {
            background: white;
            border-radius: 8px;
            padding: 24px;
            margin-bottom: 24px;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);

            h2 {
                font-size: 20px;
                margin-top: 0;
                margin-bottom: 16px;
                color: rgba(0, 0, 0, 0.87);
            }

            p {
                margin-bottom: 16px;
                color: rgba(0, 0, 0, 0.6);
            }

            .full-width {
                width: 100%;
                margin-bottom: 16px;
            }
        }

        .examples-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 12px;
        }

        .result-section {
            border-left: 4px solid #4caf50;
        }

        .result-box {
            .result-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 16px;
                color: #2e7d32;
                font-weight: 500;

                mat-icon {
                    color: #4caf50;
                }
            }

            .macro-code {
                background: #263238;
                color: #4fc3f7;
                padding: 16px;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                overflow-x: auto;
                margin-bottom: 16px;
            }

            .result-tags,
            .result-explanation {
                padding: 12px;
                background: #f5f5f5;
                border-radius: 4px;
                margin-bottom: 12px;

                strong {
                    color: rgba(0, 0, 0, 0.87);
                }
            }
        }
    `]
})
export class MacroDemoComponent {
    macroText: string = '';
    selectedClass: string = '';
    generatedMacro: string = '';
    generatedTags: string[] = [];
    generatedExplanation: string = '';

    constructor(private dialog: MatDialog) { }

    openMacroBuilder(): void {
        const dialogRef = this.dialog.open(MacroBuilderComponent, {
            width: '900px',
            data: {
                class: this.selectedClass
            }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                this.generatedMacro = result.macroText;
                this.generatedTags = result.tags || [];
                this.generatedExplanation = result.explanation || '';
                this.macroText = result.macroText;
            }
        });
    }

    loadExample(type: string): void {
        switch (type) {
            case 'valid':
                this.macroText = `#showtooltip Fireball\n/cast Fireball\n/startattack`;
                this.selectedClass = 'mage';
                break;
            case 'invalid':
                this.macroText = `#showwtooltip\n/csat Fireball\n/targetenemy`;
                this.selectedClass = 'mage';
                break;
            case 'warning':
                this.macroText = `#showtooltip\n/cast Fireball\n/usetalents`;
                this.selectedClass = 'mage';
                break;
            case 'pet':
                this.macroText = `#showtooltip\n/petattack\n/cast Kill Command\n/startattack`;
                this.selectedClass = 'hunter';
                break;
        }
    }
}

