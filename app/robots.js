// Crawl policy: public pages open to all crawlers, including AI crawlers.
// Member-only surfaces are disallowed; they render nothing useful logged out.
export default function robots() {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
          '/api/',
          '/onboarding',
          '/notifications',
          '/my-studios',
          '/matching',
          '/discover',
          '/briefs',
          '/studio/',
          '/terms-review/',
          '/profile/',
          '/update-password',
        ],
      },
    ],
    sitemap: 'https://collectiveloft.com/sitemap.xml',
  }
}
