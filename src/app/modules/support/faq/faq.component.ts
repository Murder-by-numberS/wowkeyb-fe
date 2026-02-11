import { Component, ElementRef, ViewChild } from '@angular/core';
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
    @ViewChild('faqContent') faqContent: ElementRef;

    faqCategories = ['General', 'Keybinds', 'Macros', 'Account', 'Technical'];
    selectedCategory = 'General';

    faqItems: FaqItem[] = [
        // General
        {
            category: 'General',
            question: 'What is WoWKeyb?',
            answer: 'WoWKeyb is a comprehensive tool for managing World of Warcraft keybindings and macros. It allows you to create, share, and discover optimized keybind setups and macros for all classes and specs.'
        },
        {
            category: 'General',
            question: 'Is WoWKeyb free to use?',
            answer: 'Yes, WoWKeyb is completely free to use. You can create an account, save your keybinds and macros, and access all features without any cost.'
        },
        {
            category: 'General',
            question: 'How do I get started?',
            answer: 'Simply create an account, browse the keybindings or macros pages, and start customizing your setup. You can also create your own keybinds and macros from scratch.'
        },
        {
            category: 'General',
            question: 'What is the Abilities Database?',
            answer: 'The Abilities Database lets you browse all World of Warcraft abilities by class, specialization, and hero talent. You can filter by game version and use it as a reference when setting up your keybindings and macros.'
        },

        // Keybinds
        {
            category: 'Keybinds',
            question: 'Can I share my keybinds with others?',
            answer: 'Yes! Your keybind setups can be shared using the share button. This generates a unique link that others can use to view your setup.'
        },
        {
            category: 'Keybinds',
            question: 'Can I duplicate an existing keybind setup?',
            answer: 'Yes! You can duplicate any of your keybind setups using the "Duplicate" button. This creates a copy that you can modify without affecting the original.'
        },
        {
            category: 'Keybinds',
            question: 'How do I filter keybinds by class?',
            answer: 'On the Keybindings page, use the class icons at the top to jump to a specific class section. You\'ll see both recent and popular setups organized by class.'
        },
        {
            category: 'Keybinds',
            question: 'Can I restore a deleted keybinding?',
            answer: 'Yes! If you accidentally delete a keybinding, you can request restoration by submitting a support ticket. Please include the name of the keybinding and any version information you remember. Our team will do their best to restore your data. Note that permanently deleted items may not be recoverable after an extended period, so please submit your request as soon as possible.'
        },
        {
            category: 'Keybinds',
            question: 'Can I have multiple versions of a keybinding?',
            answer: 'Yes! When you make changes to a keybinding, you can save it as a new version. You can switch between versions using the version dropdown on your keybinding page.'
        },

        // Macros
        {
            category: 'Macros',
            question: 'What types of macros can I create?',
            answer: 'WoWKeyb supports all World of Warcraft macro types including general macros, class-specific macros, and spec-specific macros. You can use the macro builder to create macros from templates or write them from scratch.'
        },
        {
            category: 'Macros',
            question: 'How long can a macro be?',
            answer: 'Following WoW\'s limitations, macros can be up to 255 characters long. Keep this limit in mind when writing your macro text.'
        },
        {
            category: 'Macros',
            question: 'Does WoWKeyb validate my macros?',
            answer: 'Yes! The macro validator checks your macro for common errors and syntax issues, helping you catch problems before you try using the macro in-game.'
        },
        {
            category: 'Macros',
            question: 'Can I restore a deleted macro?',
            answer: 'Yes! If you accidentally delete a macro, you can request restoration by submitting a support ticket. Please include the macro name, the ability it was for (if applicable), and any other details you remember. Our team will attempt to restore your macro. Note that permanently deleted items may not be recoverable after an extended period, so submit your request as soon as possible.'
        },
        {
            category: 'Macros',
            question: 'How do I import macros into WoW?',
            answer: 'Copy the macro text from WoWKeyb, then in WoW open the macro panel (type /macro in chat), click "New", paste the text, and assign an icon. The macro will be ready to drag onto your action bars.'
        },

        // Account
        {
            category: 'Account',
            question: 'How do I change my password?',
            answer: 'Go to Settings > Security to change your password. You\'ll need to enter your current password and then set a new one. If you\'ve forgotten your password, click "Forgot Password" on the sign-in page and we\'ll send you instructions to reset it.'
        },
        {
            category: 'Account',
            question: 'Can I delete my account?',
            answer: 'Yes, to delete your account, please submit a support ticket. Please note that this action is permanent and will delete all your saved keybinds and macros.'
        },
        {
            category: 'Account',
            question: 'How do I change my display settings?',
            answer: 'Go to Settings > App Settings to switch between light and dark mode. You can also toggle dark mode using the moon/sun icon in the navigation bar, even without logging in.'
        },

        // Technical
        {
            category: 'Technical',
            question: 'Which browsers are supported?',
            answer: 'WoWKeyb works best on modern browsers including Chrome, Firefox, Safari, and Edge. We recommend keeping your browser up to date for the best experience.'
        },
        {
            category: 'Technical',
            question: 'Is my data secure?',
            answer: 'Yes, we take security seriously. All data is encrypted in transit and at rest. We never share your personal information with third parties.'
        },
        {
            category: 'Technical',
            question: 'Can I use WoWKeyb on mobile?',
            answer: 'Yes, WoWKeyb is fully responsive and works on mobile devices. However, for the best experience creating and editing keybinds, we recommend using a desktop browser.'
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
        // Scroll the FAQ content area back to top when switching categories
        if (this.faqContent?.nativeElement) {
            this.faqContent.nativeElement.scrollTop = 0;
        }
    }
}

