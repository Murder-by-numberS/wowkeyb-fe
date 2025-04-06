//Angular
import { Component, ViewEncapsulation, OnInit, ViewChild } from '@angular/core';

import { ReactiveFormsModule, FormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { Subject, takeUntil } from 'rxjs';

//Angular Material
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';

//Components
import { KeyboardComponent } from './keyboard/keyboard.component';
import { AbilitiesComponent } from './abilities/abilities.component';
import { KeybindsDrawerComponent } from './keybinds-drawer/keybinds-drawer.component';
import { ConfirmDialogComponent } from 'app/core/components/confirm-dialog.component';


//Services
import { KeybindingService } from 'app/core/services/keybinding.service';
import { AuthService } from 'app/core/auth/auth.service';

@Component({
    selector: 'keybinds',
    templateUrl: './keybinds.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        FormsModule,
        ReactiveFormsModule,

        MatButtonModule,
        MatIconModule,
        MatMenuModule,
        MatSidenavModule,
        MatFormFieldModule,
        MatInputModule,
        MatTooltipModule,

        KeyboardComponent,
        AbilitiesComponent,
        KeybindsDrawerComponent
    ],
})
export class KeybindsComponent implements OnInit {

    @ViewChild(KeybindsDrawerComponent) keybindsDrawerComponent: KeybindsDrawerComponent;
    @ViewChild(AbilitiesComponent) abilitiesComponent: AbilitiesComponent;
    @ViewChild(KeyboardComponent) keyboard: KeyboardComponent;

    isAuthenticated: boolean;

    nameForm: FormGroup;

    opened: boolean;

    selectedKeybinding: any = null;
    selectedKeybindingName: string;
    keybindingSelected: boolean;
    selectedClass: any = null;

    refresh: boolean = false;

    editingName: boolean = false;

    private _unsubscribeAll: Subject<any> = new Subject<any>();

    /**
     * Constructor
     */
    constructor(
        private keybindingService: KeybindingService,
        private _formBuilder: FormBuilder,
        private _authService: AuthService,
        private dialog: MatDialog) {

        this.keybindingSelected = false;

    }

    ngOnInit(): void {

        this._authService.check()
            .pipe(takeUntil(this._unsubscribeAll))
            .subscribe((authenticated) => {
                this.isAuthenticated = authenticated;
            })

        this.opened = true;

        this.nameForm = this._formBuilder.group({
            name: ['', [Validators.required, Validators.maxLength(32)]]
        });

    }

    // refreshChildKeybindings() {
    //     this.refresh = !this.refresh; // Toggle the value to trigger ngOnChanges in the child
    // }

    getKeybindings(authenticated: boolean = false) {
        //check local storage for keybindings
        const keybindings = localStorage.getItem('keybindings');
        if (keybindings) {
            this.keybindingService.updateKeybindings(JSON.parse(keybindings));
            if (this.keybindsDrawerComponent) {
                this.keybindsDrawerComponent.loadKeybindings();
            }
        }
    }

    onKeybindingSelected(keybinding: any) {
        console.log('onKeybindingSelected', keybinding)
        if (keybinding) {
            this.selectedKeybinding = keybinding; // Handle the emitted keybind from the child component
            this.selectedKeybindingName = this.selectedKeybinding.name;
            this.keybindingSelected = true;
            this.nameForm.get('name')?.setValue(this.selectedKeybindingName);
        }
        else {
            this.selectedKeybinding = null;
            this.selectedKeybindingName = null;
            this.keybindingSelected = false;
            this.nameForm.get('name')?.setValue('');
            if (this.abilitiesComponent) {
                this.abilitiesComponent.abilities = [];
                this.abilitiesComponent.fetchAbilities();
            }

        }
    }

    onSelectionClassChanged(value: string) {
        this.selectedClass = value;
        // You can also perform other actions here
    }

    deleteKeybinding() {

        const dialogRef = this.dialog.open(ConfirmDialogComponent, {
            data: { text: `Are you sure you want to delete "${this.selectedKeybindingName}"?` }
        });

        dialogRef.afterClosed().subscribe(result => {
            if (result) {
                console.log('deleting keybinding', this.selectedKeybinding);
                this.keybindingService.removeKeybinding(this.selectedKeybinding.keybinding_id);
                this.selectedKeybinding = null;
                this.keybindingSelected = false;
                this.refreshChildKeybindings();
            } else {
                console.log('Selection cancelled');
            }
        });
    }

    refreshChildKeybindings() {
        console.log('refreshChildKeybindings');

        //check if loggedin
        this._authService.check().subscribe((authenticated) => {
            if (authenticated) {
                //refetch the keybindings from server
                this.keybindingService.getKeybindings().subscribe((keybindings) => {
                    console.log('refreshChildKeybindings - keybindings', keybindings);

                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }

                    if (this.abilitiesComponent) {
                        this.abilitiesComponent.abilities = [];
                        this.abilitiesComponent.fetchAbilities();
                    }

                    if (!this.selectedKeybinding.spec || !this.selectedKeybinding.heroTalent) {
                        console.log('reseting keyboard')
                        this.keyboard.resetKeyboard();
                    }

                });
            } else {
                console.log('not authenticated');
                //check local storage for keybindings
                const keybindings = localStorage.getItem('keybindings');
                if (keybindings) {
                    this.keybindingService.updateKeybindings(JSON.parse(keybindings));
                    if (this.keybindsDrawerComponent) {
                        this.keybindsDrawerComponent.loadKeybindings();
                    }

                    if (this.abilitiesComponent) {
                        this.abilitiesComponent.abilities = [];
                        this.abilitiesComponent.fetchAbilities();
                    }
                }
            }
        });

    }

    updateKeybinding(update) {
        console.log('updated keybinding?', update);

        this.keybindingService.updateKeybindsInKeybinding(this.selectedKeybinding.keybinding_id, update)
            .subscribe({
                next: (updatedKeybinding) => {
                    this.selectedKeybinding = this.keybindingService.getKeybindingById(this.selectedKeybinding.keybinding_id);
                    this.keyboard.updateKeyboardBindings();

                },
                error: (error) => {
                    console.error('Error updating keybinding:', error);
                }
            });
    }

    // saveKeybinding() {
    //     console.log('save keybinding');
    // }

    shareKeybinding() {
        console.log('share keybinding');
    }

    // updateKeybindings() {
    // const newKeybindings = [
    //     { id: '1', name: 'Default', class: 'Paladin', keybinds: [{ key: 'Ctrl+C', spell: 'Copy' }, { key: 'Ctrl+V', spell: 'Paste' }] },
    //     { id: '2', name: 'Editing', class: 'Mage', keybinds: [{ key: 'Ctrl+X', spell: 'Cut' }, { key: 'Ctrl+Z', spell: 'Undo' }] }
    // ];
    // this.keybindingService.updateKeybindings(newKeybindings);
    // }

    // updateKeybindsInKeybinding() {
    //     const updatedKeybinds = [{ key: 'Ctrl+P', spell: 'Print' }];
    //     this.keybindingService.updateKeybindsInKeybinding('Default', updatedKeybinds);

    // }

    // onNameChange(newValue: string) {
    //     console.log('Updated Value:', newValue);
    //     this.keybindingService.updateKeybindingName(this.selectedKeybinding.keybinding_id, newValue);
    // }

    editName() {
        this.editingName = true;
    }

    saveName() {

        if (this.nameForm.valid) {
            console.log('Form Submitted', this.nameForm.value);
            this.selectedKeybindingName = this.nameForm.value.name;
            this.selectedKeybinding.name = this.selectedKeybindingName;
            this.keybindingService.updateKeybinding(this.selectedKeybinding.keybinding_id, { name: this.nameForm.value.name }).subscribe({
                next: (updatedKeybinding) => {
                    console.log('updatedKeybinding', updatedKeybinding);
                    this.editingName = false;

                    console.log('this.selectedKeybindingName', this.selectedKeybindingName)
                },
                error: (error) => {
                    console.error('Error updating keybinding:', error);
                }
            });
        } else {
            console.log('Form is invalid');
        }

    }

    cancelName() {
        this.editingName = false;
        console.log('this.nameForm.get(name).value', this.nameForm.get('name').value);
        this.nameForm.reset(); // Resets the form to its initial state
        this.nameForm.get('name')?.setValue(this.selectedKeybindingName);
        console.log('Form reset');
    }

}
