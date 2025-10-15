import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { MacroService, MacroValidation } from '../../services/macro.service';

@Component({
    selector: 'app-macro-validator',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatChipsModule,
        MatProgressBarModule,
        MatTooltipModule
    ],
    templateUrl: './macro-validator.component.html'
})
export class MacroValidatorComponent implements OnChanges {
    @Input() macroText: string = '';
    @Input() wowClass?: string;
    @Input() autoValidate: boolean = true;

    validation: MacroValidation | null = null;
    suggestedTags: string[] = [];
    loading: boolean = false;
    error: string | null = null;

    private validateSubject = new Subject<{ text: string; class?: string }>();

    constructor(private macroService: MacroService) {
        // Debounce validation to avoid excessive API calls
        this.validateSubject.pipe(
            debounceTime(500),
            distinctUntilChanged((prev, curr) =>
                prev.text === curr.text && prev.class === curr.class
            )
        ).subscribe(({ text, class: wowClass }) => {
            this.performValidation(text, wowClass);
        });
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.autoValidate && (changes['macroText'] || changes['wowClass'])) {
            if (this.macroText && this.macroText.trim()) {
                this.validateSubject.next({
                    text: this.macroText,
                    class: this.wowClass
                });
            } else {
                this.validation = null;
                this.suggestedTags = [];
            }
        }
    }

    validateNow(): void {
        if (this.macroText && this.macroText.trim()) {
            this.performValidation(this.macroText, this.wowClass);
        }
    }

    private performValidation(text: string, wowClass?: string): void {
        this.loading = true;
        this.error = null;

        this.macroService.validateMacroText(text, wowClass).subscribe({
            next: (response) => {
                this.validation = response.validation;
                this.suggestedTags = response.suggested_tags;
                this.loading = false;
            },
            error: (error) => {
                console.error('Validation error:', error);
                this.error = 'Failed to validate macro';
                this.loading = false;
            }
        });
    }

    getSeverityIcon(severity: string): string {
        switch (severity.toLowerCase()) {
            case 'error': return 'error';
            case 'warning': return 'warning';
            default: return 'info';
        }
    }

    getSeverityClass(severity: string): string {
        switch (severity.toLowerCase()) {
            case 'error': return 'bg-red-50 text-red-900';
            case 'warning': return 'bg-orange-50 text-orange-900';
            default: return 'bg-blue-50 text-blue-900';
        }
    }
}

