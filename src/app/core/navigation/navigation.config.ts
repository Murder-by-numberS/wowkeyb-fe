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
                link: '/keybinds'
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
        type: 'group',
        children: [
            {
                id: 'macros.view-all',
                title: 'View All',
                type: 'basic',
                link: '/macros/view-all'
            },
            {
                id: 'macros.my-macros',
                title: 'My Macros',
                type: 'basic',
                link: '/macros/my-macros',
                requiresAuth: true // This item only shows for authenticated users
            }
        ]
    },
    {
        id: 'abilities',
        title: 'Abilities',
        type: 'basic',
        link: '/abilities'
    }
];

export const getNavigationForAuthState = (isAuthenticated: boolean, forHorizontal: boolean = false): FuseNavigationItem[] => {
    return navigationConfig.map(item => {
        // Special handling for Abilities based on navigation type
        if (item.id === 'abilities') {
            if (forHorizontal) {
                // For horizontal navigation, keep it as basic with link
                return item as FuseNavigationItem;
            } else {
                // For vertical navigation, make it a group title
                return {
                    id: 'abilities',
                    title: 'Abilities',
                    type: 'group',
                    children: [
                        {
                            id: 'abilities.view-all',
                            title: 'View All',
                            type: 'basic',
                            link: '/abilities'
                        }
                    ]
                } as FuseNavigationItem;
            }
        }

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
