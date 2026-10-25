import type { MetadataRoute } from 'next';
import { createAdminClient } from '@/lib/supabase/admin';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lmslembagakursuspijaraksara.netlify.app').replace(
    /\/+$/,
    ''
  );

  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/kursus`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
  ];

  try {
    const supabase = createAdminClient();
    const { data: courses, error } = await supabase
      .from('kursus')
      .select('slug, diterbitkan_pada')
      .eq('status', 'terbit');

    if (error || !courses) {
      return staticRoutes;
    }

    const courseRoutes: MetadataRoute.Sitemap = courses.map((course) => ({
      url: `${baseUrl}/kursus/${course.slug}`,
      lastModified: course.diterbitkan_pada ? new Date(course.diterbitkan_pada) : new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));

    return [...staticRoutes, ...courseRoutes];
  } catch (err) {
    console.error('Error generating sitemap:', err);
    return staticRoutes;
  }
}
