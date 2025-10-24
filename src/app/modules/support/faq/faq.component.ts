import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';
import { RouterLink } from '@angular/router';

interface FaqItem {
    question: string;
    answer: string;
    category: string;
}

@Component({
    selector: 'app-faq',
    templateUrl: './faq.component.html',
    standalone: true,
    imports: [
        CommonModule,
        MatButtonModule,
        MatIconModule,
        MatExpansionModule,
        RouterLink
    ]
})
export class FaqComponent {
    faqCategories = ['General', 'Keybinds', 'Macros', 'Account', 'Technical'];
    selectedCategory = 'General';

    faqItems: FaqItem[] = [
        // General
        {
            category: 'General',
            question: 'What is WowKeyb?',
            answer: 'WowKeyb is a comprehensive tool for managing World of Warcraft keybindings and macros. It allows you to create, share, and discover optimized keybind setups and macros for all classes and specs.'
        },
        {
            category: 'General',
            question: 'Is WowKeyb free to use?',
            answer: 'Yes, WowKeyb is completely free to use. You can create an account, save your keybinds and macros, and access all features without any cost.'
        },
        {
            category: 'General',
            question: 'How do I get started?',
            answer: 'Simply create an account, browse the keybind library or macro library, and start customizing your setup. You can also create your own keybinds and macros from scratch.'
        },

        // Keybinds
        {
            category: 'Keybinds',
            question: 'How do I import keybinds into WoW?',
            answer: 'After creating or selecting a keybind setup, click the "Export" button to download the keybind file. Place this file in your WoW folder: World of Warcraft/_retail_/WTF/Account/[ACCOUNT_NAME]/. Then use the in-game command "/console cvar_default" to load them.'
        },
        {
            category: 'Keybinds',
            question: 'Can I share my keybinds with others?',
            answer: 'Yes! All keybind setups can be shared using the share button. This generates a unique link that others can use to view and copy your setup.'
        },
        {
            category: 'Keybinds',
            question: 'How do I filter keybinds by class?',
            answer: 'Use the filter dropdown on the keybinds page to select your class and spec. This will show you optimized setups specifically designed for your character.'
        },
        // {
        //     category: 'Keybinds',
        //     question: 'Can I customize existing keybind setups?',
        //     answer: 'Absolutely! You can clone any existing setup and modify it to fit your preferences. Your customized version will be saved to your account.'
        // },

        // Macros
        {
            category: 'Macros',
            question: 'What types of macros can I create?',
            answer: 'WowKeyb supports all World of Warcraft macro types including general macros, class-specific macros, and spec-specific macros. You can use the macro builder to create complex macros with conditions.'
        },
        {
            category: 'Macros',
            question: 'How long can a macro be?',
            answer: 'Following WoW\'s limitations, macros can be up to 255 characters. The macro builder will show you the character count as you create your macro.'
        },
        {
            category: 'Macros',
            question: 'Can I test my macros before exporting?',
            answer: 'Yes, the macro validator will check your macro for common errors and syntax issues before you save or export it.'
        },
        // {
        //     category: 'Macros',
        //     question: 'How do I import macros into WoW?',
        //     answer: 'Copy the macro text from WowKeyb, then in WoW, open the macro panel (press Esc > Macros), click "New", paste the text, and save.'
        // },

        // Account
        {
            category: 'Account',
            question: 'How do I reset my password?',
            answer: 'You can change your password from your Profile page when logged in. If you\'ve forgotten your password, click "Forgot Password" on the login page and we\'ll send you instructions to reset it.'
        },
        {
            category: 'Account',
            question: 'Can I delete my account?',
            answer: 'Yes, to delete your account, please submit a support ticket. Please note that this action is permanent and will delete all your saved keybinds and macros.'
        },
        {
            category: 'Account',
            question: 'How do I change my email address?',
            answer: 'Go to Settings > Account Settings to update your email address. You\'ll need to verify the new email address before the change takes effect.'
        },

        // Technical
        {
            category: 'Technical',
            question: 'Which browsers are supported?',
            answer: 'WowKeyb works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser up to date for the best experience.'
        },
        {
            category: 'Technical',
            question: 'Is my data secure?',
            answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties.'
        },
        {
            category: 'Technical',
            question: 'Can I use WowKeyb on mobile?',
            answer: 'Yes, WowKeyb is fully responsive and works on mobile devices. However, for the best experience creating and editing keybinds, we recommend using a desktop browser.'
        },
        {
            category: 'Technical',
            question: 'I found a bug, how do I report it?',
            answer: 'Please submit a support ticket with details about the bug including what you were doing when it occurred, your browser version, and any error messages you saw.'
        }
    ];

    get filteredFaqs(): FaqItem[] {
        return this.faqItems.filter(item => item.category === this.selectedCategory);
    }

    selectCategory(category: string): void {
        this.selectedCategory = category;
    }
}

