import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { Keybinding } from 'app/core/types/keybinding';
import { Router } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';
import { classNames, fullClasses } from 'app/core/data/classes';

@Component({
    selector: 'create-keybinding',
    templateUrl: './create-keybinding.component.html',
    standalone: true,
    imports: [ReactiveFormsModule]
})
export class CreateKeybindingComponent implements OnInit {
    keybindingForm: FormGroup;
    classes = classNames;
    specs: string[] = [];
    heroTalents: string[] = [];

    constructor(
        private fb: FormBuilder,
        private keybindingService: KeybindingService,
        private router: Router
    ) {
        this.keybindingForm = this.fb.group({
            name: ['', Validators.required],
            class: ['', Validators.required],
            spec: ['', Validators.required],
            heroTalent: ['']
        });
    }

    ngOnInit(): void {
        this.keybindingForm.get('class')?.valueChanges.subscribe(selectedClass => {
            this.updateSpecs(selectedClass);
            this.keybindingForm.get('spec')?.setValue('');
            this.keybindingForm.get('heroTalent')?.setValue('');
        });

        this.keybindingForm.get('spec')?.valueChanges.subscribe(selectedSpec => {
            this.updateHeroTalents(selectedSpec);
            this.keybindingForm.get('heroTalent')?.setValue('');
        });
    }

    updateSpecs(selectedClass: string): void {
        if (selectedClass && fullClasses[selectedClass]) {
            this.specs = Object.keys(fullClasses[selectedClass].specs);
        } else {
            this.specs = [];
        }
    }

    updateHeroTalents(selectedSpec: string): void {
        const selectedClass = this.keybindingForm.get('class')?.value;
        if (selectedClass && selectedSpec && fullClasses[selectedClass]?.specs[selectedSpec]) {
            this.heroTalents = fullClasses[selectedClass].specs[selectedSpec];
        } else {
            this.heroTalents = [];
        }
    }

    onSubmit(): void {
        if (this.keybindingForm.valid) {
            const keybinding: Keybinding = {
                ...this.keybindingForm.value,
                keybindings: []
            };

            this.keybindingService.createKeybinding(keybinding).subscribe({
                next: () => {
                    this.router.navigate(['/keybindings']);
                },
                error: (error) => {
                    console.error('Error creating keybinding:', error);
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['/keybindings']);
    }
}
