import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/admin', '/dashboard', '/checkout', '/api/'],
    },
    sitemap: 'https://b2b.prodigio.ch/sitemap.xml',
  }
}
