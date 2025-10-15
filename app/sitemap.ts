import type { MetadataRoute } from 'next'
import { createServiceClient } from '@/lib/supabase/service'

const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://nabostylisten.no'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createServiceClient()
  
  // Static routes with their priorities and update frequencies
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/bli-stylist`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/tjenester`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/kontakt`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/om-oss`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/faq`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/terms-of-service`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${baseUrl}/handlekurv`,
      lastModified: new Date(),
      changeFrequency: 'never',
      priority: 0.4,
    },
  ]

  try {
    // Fetch published services for individual service pages
    const { data: services } = await supabase
      .from('services')
      .select('id, updated_at')
      .eq('is_published', true)

    const serviceRoutes: MetadataRoute.Sitemap = services?.map((service) => ({
      url: `${baseUrl}/tjenester/${service.id}`,
      lastModified: service.updated_at ? new Date(service.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.7,
    })) || []

    // Fetch approved stylist profiles (those with role 'stylist')
    // Note: Approved stylists are those who have completed the application process
    // and have their role set to 'stylist' in the profiles table
    const { data: stylists } = await supabase
      .from('profiles')
      .select('id, updated_at')
      .eq('role', 'stylist')

    const stylistRoutes: MetadataRoute.Sitemap = stylists?.map((stylist) => ({
      url: `${baseUrl}/profiler/${stylist.id}`,
      lastModified: stylist.updated_at ? new Date(stylist.updated_at) : new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })) || []

    return [...staticRoutes, ...serviceRoutes, ...stylistRoutes]
  } catch (error) {
    // If there's an error fetching dynamic content, return static routes only
    console.error('Error generating sitemap:', error)
    return staticRoutes
  }
}