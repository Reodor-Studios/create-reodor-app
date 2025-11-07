export interface NavigationItem {
    title: string;
    href?: string;
    description?: string;
    items?: {
        title: string;
        href: string;
        description?: string;
    }[];
    requiresAuth?: boolean; // Indicates if the item requires authentication
}

export const navigationItems: NavigationItem[] = [
    {
        title: "Oppgaver",
        href: "/oppgaver",
        description: "Se og administrer dine oppgaver",
        requiresAuth: true,
    },
    {
        title: "Chat",
        href: "/chat",
        description: "Snakk med AI-assistenten",
        requiresAuth: true,
    },
];
