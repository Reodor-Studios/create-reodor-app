import { getPublicUrl } from "@/lib/utils";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: [
        "/",
        "/privacy",
        "/terms-of-service",
        "/faq",
        "/auth/*",
      ],
      disallow: [
        "/api/*",
      ],
    },
    sitemap: `${getPublicUrl()}/sitemap.xml`,
  };
}
