import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import packageJson from '../../../../package.json';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex items-center justify-center py-6 text-sm text-gray-400">
            <span>WOWKEYB © {{ currentYear }} - {{ version }}</span>
        </div>
    `
})
export class AppFooterComponent {
    currentYear = new Date().getFullYear();
    version: string = packageJson.version;
}
