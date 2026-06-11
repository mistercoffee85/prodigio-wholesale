import { MetadataRoute } from 'next'

const BASE = 'https://b2b.prodigio.ch'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: BASE,                  changeFrequency: 'daily',   priority: 1.0 },
    { url: `${BASE}/products`,    changeFrequency: 'daily',   priority: 0.9 },
    { url: `${BASE}/register`,    changeFrequency: 'monthly', priority: 0.7 },
    { url: `${BASE}/login`,       changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/agb`,         changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/impressum`,   changeFrequency: 'yearly',  priority: 0.3 },
    { url: `${BASE}/datenschutz`, changeFrequency: 'yearly',  priority: 0.3 },
  ]
}
