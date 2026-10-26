import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL || 'https://lmslembagakursuspijaraksara.netlify.app').replace(
    /\/+$/,
    ''
  );

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/admin',
        '/instruktur',
        '/api',
        '/kursus-saya',
        '/belajar',
        '/dashboard',
        '/profil',
        '/sertifikat/*',
      ],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
