import './globals.css'
import { Analytics } from '@vercel/analytics/next'

export const metadata = {
  metadataBase: new URL('https://collectiveloft.com'),
  title: 'Collective Loft — Where Creatives Find Collaborators',
  description: 'A professional network where artists, musicians, writers, designers, and filmmakers find each other, agree on terms, and collaborate.',
  openGraph: {
    title: 'Collective Loft — Where Creatives Find Collaborators',
    description: 'A professional network where artists, musicians, writers, designers, and filmmakers find each other, agree on terms, and collaborate.',
    url: 'https://collectiveloft.com',
    siteName: 'Collective Loft',
    type: 'website',
  },
}

const orgSchema = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Organization',
      '@id': 'https://collectiveloft.com/#organization',
      name: 'Collective Loft',
      url: 'https://collectiveloft.com',
      logo: 'https://collectiveloft.com/icon.png',
      description:
        'A professional network where artists, musicians, writers, designers, and filmmakers find each other, agree on terms, and collaborate.',
      foundingDate: '2026',
      parentOrganization: 'Morgan Collective Group LLC',
      email: 'help@collectiveloft.com',
      sameAs: [
        'https://www.instagram.com/the.collective.loft',
        'https://www.tiktok.com/@the.collective.loft',
        'https://bsky.app/profile/thecollectiveloft.bsky.social',
      ],
    },
    {
      '@type': 'WebSite',
      '@id': 'https://collectiveloft.com/#website',
      url: 'https://collectiveloft.com',
      name: 'Collective Loft',
      publisher: { '@id': 'https://collectiveloft.com/#organization' },
    },
  ],
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=DM+Sans:wght@300;400;500;600&display=swap" rel="stylesheet" />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(orgSchema) }}
        />
      </head>
      <body>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
