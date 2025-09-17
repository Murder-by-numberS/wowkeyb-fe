import { FuseNavigationItem } from '@fuse/components/navigation';

interface NavigationItemWithAuth extends FuseNavigationItem {
    requiresAuth?: boolean;
    children?: NavigationItemWithAuth[];
}

export const navigationConfig: NavigationItemWithAuth[] = [
    {
        id: 'keybinds',
        title: 'Keybinds',
        type: 'group',
        children: [
            {
                id: 'keybinds.view-all',
                title: 'View All',
                type: 'basic',
                link: '/keybinds/view-all'
            },
            {
                id: 'keybinds.my-keybindings',
                title: 'My Keybindings',
                type: 'basic',
                link: '/keybinds/my-keybindings',
                requiresAuth: true // This item only shows for authenticated users
            }
        ]
    },
    {
        id: 'macros',
        title: 'Macros',
        type: 'basic',
        link: '/macros'
    },
    {
        id: 'abilities',
        title: 'Abilities',
        type: 'basic',
        link: '/abilities'
    }
];

export const getNavigationForAuthState = (isAuthenticated: boolean): FuseNavigationItem[] => {
    return navigationConfig.map(item => {
        if (item.type === 'group' && item.children) {
            const filteredChildren = item.children.filter(child =>
                !child.requiresAuth || isAuthenticated
            );

            // If only one child remains, convert group to basic link
            if (filteredChildren.length === 1) {
                return {
                    id: item.id,
                    title: item.title,
                    type: 'basic',
                    link: filteredChildren[0].link
                } as FuseNavigationItem;
            }

            // If no children remain, don't show the group
            if (filteredChildren.length === 0) {
                return null;
            }

            // Return group with filtered children
            return {
                ...item,
                children: filteredChildren
            } as FuseNavigationItem;
        }
        return item as FuseNavigationItem;
    }).filter(item => item !== null) as FuseNavigationItem[];
};
