import { Routes } from '@angular/router';
import { SupportComponent } from './support.component';

export default [
    {
        path: '',
        component: SupportComponent,
    },
    {
        path: 'faq',
        loadComponent: () => import('./faq/faq.component').then(m => m.FaqComponent),
    },
    {
        path: 'ticket',
        loadComponent: () => import('./ticket/ticket.component').then(m => m.TicketComponent),
    }
] as Routes;

