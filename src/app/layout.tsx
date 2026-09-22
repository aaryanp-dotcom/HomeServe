import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, JetBrains_Mono } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { JsonLd, organizationJsonLd, siteUrl } from '@/lib/seo'

// Body + display: Bricolage Grotesque (variable: weight, optical size, width).
const body = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-body',
  axes: ['opsz', 'wdth'],
  display: 'swap',
})
// Labels, numerals and annotations.
const mono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
  display: 'swap',
})

// viewport-fit=cover lets the layout use the whole screen on notched iPhones (safe-area insets are respected
// where content meets an edge); colorScheme keeps native controls light like the rest of the UI.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#EEEAE1',
  colorScheme: 'light',
}

export const metadata: Metadata = {
  // Lets every page below use a relative path for openGraph.images / alternates.canonical and have Next
  // resolve it against the real domain. Still reads from NEXT_PUBLIC_APP_URL, so it's localhost until
  // that env var is set to the production domain (see lib/seo.ts).
  metadataBase: new URL(siteUrl()),
  title: { default: 'HomeServe — Home Renovation & Maintenance, Delhi NCR', template: '%s — HomeServe' },
  description: 'HomeServe is a trusted home renovation company serving Delhi NCR. We manage your renovation from consultation and quotation to execution and handover.',
  keywords: ['home renovation Delhi NCR', 'home renovation Delhi', 'kitchen renovation Noida', 'bathroom renovation Gurugram', 'home renovation company Delhi NCR', 'home maintenance Delhi NCR'],
  authors: [{ name: 'HomeServe' }],
  creator: 'HomeServe',
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: '/',
    siteName: 'HomeServe',
    title: 'HomeServe — Home Renovation Services in Delhi NCR',
    description: 'HomeServe manages your home renovation from planning to handover across Delhi, Noida, Gurugram, Ghaziabad, Greater Noida and Faridabad.',
  },
  twitter: { card: 'summary_large_image', title: 'HomeServe', description: 'Home renovation services in Delhi NCR' },
  robots: { index: true, follow: true },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className="h-full">
      <body className={`${body.variable} ${mono.variable} font-sans antialiased min-h-full`}>
        <JsonLd data={organizationJsonLd()} />
        <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false} disableTransitionOnChange>
          {children}
        </ThemeProvider>
      </body>
    </html>
  )
}
