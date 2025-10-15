import type { MetadataRoute } from "next";
import { createServiceClient } from "@/lib/supabase/service";
import { getPublicUrl } from "@/lib/utils";

const baseUrl = getPublicUrl();

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient();

  // Static routes with their priorities and update frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/om-oss`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];

  try {
    // Fetch user profiles (excluding admin profiles for privacy)
    // Note: Only include profiles if you have public profile pages
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, updated_at")
      .eq("role", "user");

    const profileRoutes: MetadataRoute.Sitemap = profiles?.map((profile) => ({
      url: `${baseUrl}/profiles/${profile.id}`,
      lastModified: profile.updated_at
        ? new Date(profile.updated_at)
        : new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.6,
    })) || [];

    // Note: Todos are typically private user data and should not be included in a public sitemap
    // If you have public todo pages, you can uncomment and adjust the following code:
    /*
    const { data: todos } = await supabase
      .from("todos")
      .select("id, updated_at")
      .eq("is_public", true); // Add this column if you have public todos

    const todoRoutes: MetadataRoute.Sitemap =
      todos?.map((todo) => ({
        url: `${baseUrl}/todos/${todo.id}`,
        lastModified: todo.updated_at
          ? new Date(todo.updated_at)
          : new Date(),
        changeFrequency: "daily" as const,
        priority: 0.4,
      })) || [];
    */

    return [...staticRoutes, ...profileRoutes];
  } catch (error) {
    // If there's an error fetching dynamic content, return static routes only
    console.error("Error generating sitemap:", error);
    return staticRoutes;
  }
}
