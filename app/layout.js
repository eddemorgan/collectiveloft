import './globals.css'

export const metadata = {
  title: 'Collective Loft — Make Something Together',
  description: 'A professional network built for artists, musicians, writers, poets, designers, and makers.',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}