import type { Metadata } from "next";

type BrandColors = {
    background: string;
    foreground: string;
    primary: string;
    secondary: string;
    muted: string;
    accent: string;
    destructive: string;
};

export const brandColors: Record<"light" | "dark", BrandColors> = {
    light: {
        background: "#f8f6ff",
        foreground: "#453676",
        primary: "#a494c4",
        secondary: "#fdeae3",
        muted: "#eae8f1",
        accent: "#e9fbe4",
        destructive: "#ff3434",
    },
    dark: {
        background: "#1c1723",
        foreground: "#f8f6ff",
        primary: "#a494c4",
        secondary: "#7cb36d",
        muted: "#3a3145",
        accent: "#48405c",
        destructive: "#930909",
    },
};

// Company configuration
export const companyConfig = {
    name: "COMPANY_NAME",
    tagline: "COMPANY_TAGLINE",
    description: "COMPANY_DESCRIPTION",
    shortDescription: "COMPANY_SHORT_DESCRIPTION",
    domain: "example.com",
    url: "https://example.com",
    githubUrl: "https://github.com/Reodor-Studios/create-reodor-app",
    supportEmail: "support@example.com",
    supportPhone: "+47 000 00 000",
    address: {
        company: "COMPANY_NAME AS",
        street: "Street Address 1",
        postalCode: "0000",
        city: "City",
        country: "Country",
    },
    hours: {
        weekdays: "09:00 - 17:00",
        saturday: "10:00 - 15:00",
        sunday: "Closed",
        phoneHours: "Mon-Fri 09:00-17:00",
    },
    responseTime: "24 hours",

    // Page-specific content
    pages: {
        home: {
            title: "COMPANY_NAME - COMPANY_TAGLINE",
            description: "COMPANY_DESCRIPTION",
            ogTitle: "COMPANY_NAME",
            ogSubtitle: "COMPANY_TAGLINE",
            ogDescription: "COMPANY_SHORT_DESCRIPTION",
        },
        kontakt: {
            title: "Contact us - COMPANY_NAME",
            description: "PAGE_CONTACT_DESCRIPTION",
            ogTitle: "Contact us",
            ogSubtitle: "PAGE_CONTACT_SUBTITLE",
            ogDescription: "PAGE_CONTACT_OG_DESCRIPTION",
        },
        omOss: {
            title: "About us - COMPANY_NAME",
            description: "PAGE_ABOUT_DESCRIPTION",
            ogTitle: "About us",
            ogSubtitle: "PAGE_ABOUT_SUBTITLE",
            ogDescription: "PAGE_ABOUT_OG_DESCRIPTION",
        },
        faq: {
            title: "FAQ - COMPANY_NAME",
            description: "PAGE_FAQ_DESCRIPTION",
        },
        privacy: {
            title: "Privacy Policy - COMPANY_NAME",
            description: "PAGE_PRIVACY_DESCRIPTION",
        },
        termsOfService: {
            title: "Terms of Service - COMPANY_NAME",
            description: "PAGE_TERMS_DESCRIPTION",
        },
    },
} as const;

// Helper function to create complete metadata for a page
export function createPageMetadata(
    pageKey: keyof typeof companyConfig.pages,
    customMetadata?: Partial<{
        title: string;
        description: string;
        url: string;
        type: string;
    }>,
): Metadata {
    const pageConfig = companyConfig.pages[pageKey];
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || companyConfig.url;

    return {
        title: customMetadata?.title || pageConfig.title,
        description: customMetadata?.description || pageConfig.description,
        applicationName: companyConfig.name,
        openGraph: {
            title: customMetadata?.title || pageConfig.title,
            description: customMetadata?.description || pageConfig.description,
            type: "website" as const,
            url: customMetadata?.url
                ? `${baseUrl}${customMetadata.url}`
                : baseUrl,
            siteName: companyConfig.name,
        },
        twitter: {
            card: "summary_large_image" as const,
            title: customMetadata?.title || pageConfig.title,
            description: customMetadata?.description || pageConfig.description,
        },
    };
}
