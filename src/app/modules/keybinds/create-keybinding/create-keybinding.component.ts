import { Component, OnInit, EventEmitter, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { Keybinding } from 'app/core/types/keybinding';
import { Router, ActivatedRoute } from '@angular/router';
import { classNames, fullClasses } from 'app/core/data/classes';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'create-keybinding',
    templateUrl: './create-keybinding.component.html',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        MatFormFieldModule,
        MatInputModule,
        MatSelectModule,
        MatButtonModule,
        MatIconModule
    ]
})
export class CreateKeybindingComponent implements OnInit {
    @Output() toggleDrawer = new EventEmitter<void>();
    @Output() keybindingCreated = new EventEmitter<Keybinding>();
    opened: boolean = true;

    keybindingForm: FormGroup;
    classes: string[] = classNames;
    specs: string[] = [];
    heroTalents: string[] = [];

    constructor(
        private fb: FormBuilder,
        private keybindingService: KeybindingService,
        private router: Router,
        private route: ActivatedRoute
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
                next: (newKeybinding) => {
                    this.keybindingCreated.emit(newKeybinding);
                    this.router.navigate(['/keybinds/view']);
                },
                error: (error) => {
                    console.error('Error creating keybinding:', error);
                }
            });
        }
    }

    onCancel(): void {
        this.router.navigate(['view'], { relativeTo: this.route.parent });
    }
}
