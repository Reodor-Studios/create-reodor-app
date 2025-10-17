export interface NavigationItem {
    title: string;
    href?: string;
    description?: string;
    items?: {
        title: string;
        href: string;
        description?: string;
    }[];
}

export const navigationItems: NavigationItem[] = [
    {
        title: "Oppgaver",
        href: "/oppgaver",
        description: "Se og administrer dine oppgaver",
    },
];
