import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import packageJson from '../../../../package.json';

@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="flex flex-col items-center justify-center py-6 text-center">
            <span class="text-sm text-gray-400">WOWKEYB &copy; {{ currentYear }} &mdash; v{{ version }}</span>
            <p class="mt-2 max-w-2xl text-xs leading-relaxed text-gray-500">
                World of Warcraft&reg; and Warcraft&reg; are trademarks or registered trademarks of
                Blizzard Entertainment, Inc., in the U.S. and/or other countries. WoWKeyb is not
                affiliated with or endorsed by Blizzard Entertainment.
            </p>
        </div>
    `
})
export class AppFooterComponent {
    currentYear = new Date().getFullYear();
    version: string = packageJson.version;
}
