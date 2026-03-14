import { Component, ViewEncapsulation, Inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogActions, MatDialogContent } from '@angular/material/dialog';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { KeybindingService } from 'app/core/services/keybinding.service';
import { Macro, MacroService } from 'app/modules/macros/services/macro.service';

@Component({
    selector: 'ability-dialog',
    templateUrl: './ability-dialog.component.html',
    encapsulation: ViewEncapsulation.None,
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        MatDialogContent,
        MatDialogActions,
        MatCheckboxModule,
        MatSelectModule,
        MatFormFieldModule,
        MatButtonModule,
        MatIconModule
    ],
})
export class AbilityDialogComponent implements OnInit, OnDestroy {
    isOpen = false;

    keybindings: string[] = [];
    originalKeybindings: string[] = [];
    newKeybinding: string | null = null;
    isKeybindingActive = false;
    useManualMode = false; // Toggle between press-keys and manual mode
    errorMessage: string | null = null;
    warningMessage: string | null = null;
    availableMacros: Macro[] = [];
    loadingMacros = false;
    applySelectedMacro = false;
    selectedMacroId = '';
    private readonly spellNameAliases: Record<string, string[]> = {
        'eternalflame': ['wordofglory'],
        'wordofglory': ['eternalflame'],
        'judgment': ['judgement'],
        'judgement': ['judgment'],
        'blessingoffreedom': ['handoffreedom', 'bof', 'freedom'],
        'handoffreedom': ['blessingoffreedom', 'bof', 'freedom'],
        'blessingofsacrifice': ['handofsacrifice', 'bos', 'sacrifice', 'sac'],
        'handofsacrifice': ['blessingofsacrifice', 'bos', 'sacrifice', 'sac'],
    };
    private readonly ERROR_TIMEOUT = 3000; // 3 seconds
    private keydownHandler: (event: KeyboardEvent) => boolean;

    // Manual keybinding builder state
    manualCtrl = false;
    manualShift = false;
    manualAlt = false;
    manualKey = '';

    // Common keys for dropdown
    commonKeys = [
        '1', '2', '3', '4', '5', '6', '7', '8', '9', '0',
        '-', '=', '[', ']', '\\', ';', '\'', ',', '.', '/',
        'Q', 'W', 'E', 'R', 'T', 'Y', 'U', 'I', 'O', 'P',
        'A', 'S', 'D', 'F', 'G', 'H', 'J', 'K', 'L',
        'Z', 'X', 'C', 'V', 'B', 'N', 'M',
        'F1', 'F2', 'F3', 'F4', 'F5', 'F6', 'F7', 'F8', 'F9', 'F10', 'F11', 'F12',
        'Esc', 'Tab', 'Space', 'Enter', 'Backspace',
        '~', '◄', '►', '▲', '▼'
    ];

    // Known protected browser shortcuts
    private readonly PROTECTED_SHORTCUTS = [
        'Ctrl+Shift+T', // Reopen closed tab
        'Ctrl+T', // New tab
        'Ctrl+N', // New window
        'Ctrl+W', // Close tab
        'Ctrl+Shift+N', // New incognito window
        'Ctrl+Tab', // Next tab
        'Ctrl+Shift+Tab', // Previous tab
        'Ctrl+L', // Focus address bar
        'Alt+F4', // Close window
        'F11', // Fullscreen
    ];

    constructor(
        @Inject(MAT_DIALOG_DATA) public data: AbilityDialogData,
        private dialogRef: MatDialogRef<AbilityDialogComponent>,
        private keybindingService: KeybindingService,
        private macroService: MacroService
    ) {
        // Initialize keybindings from data with deep copies
        this.originalKeybindings = [...(data.ability.keybindings || [])];
        this.keybindings = [...(data.ability.keybindings || [])];

        // Bind the event handler to maintain proper 'this' context
        this.keydownHandler = this.onKeyDown.bind(this);
    }

    ngOnInit(): void {
        // Multi-layered approach to prevent browser shortcuts
        // Add listeners to both window and document with capture phase

        const options = { capture: true, passive: false };

        // Window level (first line of defense)
        window.addEventListener('keydown', this.keydownHandler, options);
        window.addEventListener('keypress', this.preventDefaultEvent, options);
        window.addEventListener('keyup', this.preventDefaultEvent, options);

        // Document level (second line of defense)
        document.addEventListener('keydown', this.keydownHandler, options);
        document.addEventListener('keypress', this.preventDefaultEvent, options);
        document.addEventListener('keyup', this.preventDefaultEvent, options);

        // Body level (third line of defense)
        document.body.addEventListener('keydown', this.keydownHandler, options);
        document.body.addEventListener('keypress', this.preventDefaultEvent, options);
        document.body.addEventListener('keyup', this.preventDefaultEvent, options);

        this.loadAbilityMacros();
        console.log('AbilityDialog: Multi-layered event listeners attached');
    }

    ngOnDestroy(): void {
        // Clean up all event listeners
        const removeOptions = { capture: true };

        // Remove from window
        window.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        window.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        window.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        // Remove from document
        document.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        document.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        document.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        // Remove from body
        document.body.removeEventListener('keydown', this.keydownHandler, removeOptions as any);
        document.body.removeEventListener('keypress', this.preventDefaultEvent, removeOptions as any);
        document.body.removeEventListener('keyup', this.preventDefaultEvent, removeOptions as any);

        console.log('AbilityDialog: All event listeners removed');
    }

    private preventDefaultEvent = (event: KeyboardEvent): boolean => {
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();
        return false;
    }

    toggleKeybinding(): void {
        if (this.isKeybindingActive) {
            // Add the new keybinding if it exists
            if (this.newKeybinding) {
                if (this.keybindingService.hasKeybindKey(this.data.keybinding.keybindingId, this.newKeybinding)) {
                    this.errorMessage = `The key "${this.newKeybinding}" is already in use`;
                    setTimeout(() => {
                        this.errorMessage = null;
                    }, this.ERROR_TIMEOUT);
                    return;
                }
                this.keybindings.push(this.newKeybinding);
                this.errorMessage = null;
                this.warningMessage = null;
            }
            this.newKeybinding = null;
        }
        this.isKeybindingActive = !this.isKeybindingActive;
        this.useManualMode = false; // Reset to press-keys mode by default
    }

    toggleManualMode(): void {
        this.useManualMode = !this.useManualMode;
        if (this.useManualMode) {
            // Reset manual inputs
            this.manualCtrl = false;
            this.manualShift = false;
            this.manualAlt = false;
            this.manualKey = '';
            this.updateManualKeybinding();
        }
    }

    updateManualKeybinding(): void {
        if (!this.manualKey) {
            this.newKeybinding = null;
            return;
        }

        const modifiers = [];
        if (this.manualCtrl) modifiers.push('Ctrl');
        if (this.manualShift) modifiers.push('Shift');
        if (this.manualAlt) modifiers.push('Alt');

        this.newKeybinding = [...modifiers, this.manualKey].join('+');

        // Check if this is a protected shortcut
        if (this.isProtectedShortcut(this.newKeybinding)) {
            this.warningMessage = `Warning: "${this.newKeybinding}" is a browser shortcut and may not work as expected. Using manual mode is recommended for this combination.`;
        } else {
            this.warningMessage = null;
        }
    }

    isProtectedShortcut(keybinding: string): boolean {
        return this.PROTECTED_SHORTCUTS.includes(keybinding);
    }

    confirmManualKeybinding(): void {
        if (this.newKeybinding) {
            if (this.keybindingService.hasKeybindKey(this.data.keybinding.keybindingId, this.newKeybinding)) {
                this.errorMessage = `The key "${this.newKeybinding}" is already in use`;
                setTimeout(() => {
                    this.errorMessage = null;
                }, this.ERROR_TIMEOUT);
                return;
            }
            this.keybindings.push(this.newKeybinding);
            this.errorMessage = null;
            this.warningMessage = null;
            this.newKeybinding = null;
            this.isKeybindingActive = false;
            this.useManualMode = false;
            // Reset manual inputs
            this.manualCtrl = false;
            this.manualShift = false;
            this.manualAlt = false;
            this.manualKey = '';
        }
    }

    removeKeybinding(binding: string): void {
        this.keybindings = this.keybindings.filter(kb => kb !== binding);
    }

    cancelKeybinding(): void {
        this.newKeybinding = null;
        this.isKeybindingActive = false;
        this.useManualMode = false;
        this.errorMessage = null;
        this.warningMessage = null;
        // Reset manual inputs
        this.manualCtrl = false;
        this.manualShift = false;
        this.manualAlt = false;
        this.manualKey = '';
    }

    private onKeyDown(event: KeyboardEvent): boolean {
        console.log('AbilityDialog: Keydown captured:', {
            key: event.key,
            code: event.code,
            ctrlKey: event.ctrlKey,
            shiftKey: event.shiftKey,
            altKey: event.altKey,
            isKeybindingActive: this.isKeybindingActive
        });

        // CRITICAL: Always prevent default behavior when dialog is open
        // This is our primary defense against browser shortcuts
        event.preventDefault();
        event.stopPropagation();
        event.stopImmediatePropagation();

        if (!this.isKeybindingActive) {
            console.log('AbilityDialog: Ignoring keydown - keybinding mode not active');
            return false; // Still prevent default even when not actively capturing
        }

        const key = event.key.toLowerCase();
        if (key === 'escape') {
            this.cancelKeybinding();
            return false;
        }

        // Create keybinding string
        const modifiers = [];
        if (event.ctrlKey) modifiers.push('Ctrl');
        if (event.shiftKey) modifiers.push('Shift');
        if (event.altKey) modifiers.push('Alt');

        // Handle numbers specifically to prevent shift+number becoming special characters
        let keyString;
        if (event.code.startsWith('Digit')) {
            keyString = event.code.replace('Digit', '');
        } else {
            // Don't use the key directly if it's a modifier key
            if (['shift', 'control', 'alt'].includes(key)) {
                return false; // Skip if it's just a modifier key press
            }
            keyString = key === ' ' ? 'Space' : event.key;
        }

        this.newKeybinding = [...modifiers, keyString].join('+');

        // Check if this is a protected shortcut
        if (this.isProtectedShortcut(this.newKeybinding)) {
            this.warningMessage = `Warning: "${this.newKeybinding}" is a browser shortcut. Please use Manual Mode if this keybind doesn't work.`;
        } else {
            this.warningMessage = null;
        }

        return false; // Always return false to prevent default
    }

    hasKeybindingChanged(): boolean {
        if (this.originalKeybindings.length === 0 && this.keybindings.length === 0) return false;
        if (this.originalKeybindings.length !== this.keybindings.length) return true;
        return this.originalKeybindings[0] !== this.keybindings[0];
    }

    canSave(): boolean {
        if (this.isKeybindingActive) return false;
        if (this.hasKeybindingChanged()) return true;
        return this.applySelectedMacro && !!this.getSelectedMacro();
    }

    confirm(): void {
        console.log('confirming keybindings', this.keybindings);
        const selectedMacro = this.getSelectedMacro();
        this.dialogRef.close({
            keybindings: this.keybindings,
            macro: this.applySelectedMacro && selectedMacro ? {
                macroId: this.getMacroId(selectedMacro),
                macroName: selectedMacro.name || 'Macro',
                macroText: selectedMacro.macro_text || selectedMacro.macroText || selectedMacro.text || '',
                icon: this.resolveMacroIcon(selectedMacro),
            } : null,
        });
    }

    close(): void {
        this.dialogRef.close();
    }

    getSelectedMacro(): Macro | null {
        if (!this.selectedMacroId) return null;
        return this.availableMacros.find((macro) => {
            const id = this.getMacroId(macro);
            const fallback = macro.id || macro.name;
            return id === this.selectedMacroId || String(fallback) === this.selectedMacroId;
        }) || null;
    }

    private loadAbilityMacros(): void {
        const abilityId = this.data.ability?.id ? String(this.data.ability.id) : '';
        this.loadingMacros = true;
        if (abilityId) {
            this.macroService.getMacrosByAbility({ abilityId, page: 1, limit: 50 }).subscribe({
                next: (response) => {
                    const macros = Array.isArray(response?.macros) ? response.macros : [];
                    if (macros.length > 0) {
                        this.availableMacros = macros;
                        this.loadingMacros = false;
                        return;
                    }
                    this.loadFallbackMacros();
                },
                error: () => this.loadFallbackMacros(),
            });
            return;
        }
        this.loadFallbackMacros();
    }

    private getMacroId(macro: Macro): string {
        return macro.id ? String(macro.id) : this.slugify(macro.name || 'macro');
    }

    private resolveMacroIcon(macro: Macro): string {
        const icon = macro.icon;
        if (typeof icon === 'string' && icon.trim()) return icon;
        if (icon && typeof icon === 'object' && 'cloudfrontUrl' in icon && icon.cloudfrontUrl) {
            return icon.cloudfrontUrl;
        }
        return 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
    }

    private slugify(value: string): string {
        return (value || 'macro').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '') || 'macro';
    }

    private loadFallbackMacros(): void {
        this.macroService.getMyMacros(1, 250, 'created_at', 'desc').subscribe({
            next: (response) => {
                const macros = Array.isArray(response?.macros) ? response.macros : [];
                this.availableMacros = this.filterMacrosForAbility(macros);
                this.loadingMacros = false;
            },
            error: () => {
                this.availableMacros = [];
                this.loadingMacros = false;
            },
        });
    }

    private filterMacrosForAbility(macros: Macro[]): Macro[] {
        const abilityId = this.data.ability?.id ? String(this.data.ability.id) : '';
        const spellId = this.data.ability?.spellId ? String(this.data.ability.spellId) : '';
        const spellNameCandidates = this.getSpellNameCandidates([this.data.ability?.name || '']);

        return macros.filter((macro) => {
            const macroAbility = macro.ability;
            const macroAbilityId = typeof macroAbility === 'string'
                ? macroAbility
                : (macroAbility && typeof macroAbility === 'object' && 'id' in macroAbility ? String((macroAbility as any).id) : '');
            if (abilityId && macroAbilityId && macroAbilityId === abilityId) return true;

            const macroAbilitySpellId =
                macroAbility && typeof macroAbility === 'object'
                    ? String((macroAbility as any).spellId || (macroAbility as any).spell_id || '')
                    : '';
            if (spellId && macroAbilitySpellId && macroAbilitySpellId === spellId) return true;

            const macroAbilityName =
                macroAbility && typeof macroAbility === 'object'
                    ? this.normalizeSpellName(String((macroAbility as any).name || ''))
                    : '';
            if (macroAbilityName && spellNameCandidates.has(macroAbilityName)) return true;

            return false;
        });
    }

    private getSpellNameCandidates(names: string[]): Set<string> {
        const candidates = new Set<string>();
        names.forEach((raw) => {
            const normalized = this.normalizeSpellName(raw);
            if (!normalized) return;
            candidates.add(normalized);
            const aliases = this.spellNameAliases[normalized] || [];
            aliases.forEach((alias) => candidates.add(alias));
        });
        return candidates;
    }

    private normalizeSpellName(value: string): string {
        return (value || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    }
}

// Update the interface to support multiple keybindings
interface AbilityDialogData {
    ability: {
        id?: string;
        spellId?: string;
        name: string;
        icon: string;
        description: string;
        keybindings?: string[];
        macroKeybindings?: string[];
    },
    keybinding: {
        keybindingId: string;
        keybinds: {
            key: string;
            spell: string;
        }[];
    }
}
