import type { Metadata } from 'next';

/**
 * Default metadata for the Philly Social application
 * This can be imported and extended in individual page metadata
 */
export const defaultMetadata: Metadata = {
  title: {
    default: "Philly Social - Connect with Philadelphia's Community",
    template: "%s | Philly Social"
  },
  description: "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections. Stay updated with the latest happenings in the city of brotherly love.",
  keywords: "Philadelphia, Philly, social network, news, events, community, local business, Philadelphia news, Philly events",
  authors: [
    { name: "Antonio Archer" },
    { name: "Mohomed Souare" },
    { name: "Sianni Strickland" },
    { name: "Bryan Gunawan" }
  ],
  creator: "Antonio Archer, Mohomed Souare, Sianni Strickland, Bryan Gunawan",
  publisher: "Philly Social",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: "https://phillysocial.vercel.app",
    title: "Philly Social - Connect with Philadelphia's Community",
    description: "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections. Stay updated with the latest happenings in the city of brotherly love.",
    siteName: "Philly Social",
    images: [
      {
        url: "/Logo.png",
        width: 800,
        height: 600,
        alt: "Philly Social Logo",
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Philly Social - Connect with Philadelphia's Community",
    description: "Philly Social is your hub for Philadelphia news, events, local businesses, and community connections.",
    images: ['/Logo.png'],
    creator: '@phillysocial',
    site: '@phillysocial',
  },
  alternates: {
    canonical: 'https://phillysocial.vercel.app',
  },
  metadataBase: new URL("https://phillysocial.vercel.app"),
};

/**
 * Generate metadata for a specific page
 * @param title - The page title
 * @param description - The page description (optional)
 * @param path - The page path (optional)
 * @returns Metadata object for the page
 */
export function generateMetadata(
  title: string,
  description?: string,
  path?: string
): Metadata {
  const pageUrl = path 
    ? `${defaultMetadata.metadataBase}${path}` 
    : defaultMetadata.metadataBase?.toString();
  
  return {
    ...defaultMetadata,
    title,
    description: description || defaultMetadata.description,
    openGraph: {
      ...defaultMetadata.openGraph,
      title,
      description: description || defaultMetadata.openGraph?.description,
      url: pageUrl,
    },
    twitter: {
      ...defaultMetadata.twitter,
      title,
      description: description || defaultMetadata.twitter?.description,
    },
    alternates: {
      ...defaultMetadata.alternates,
      canonical: pageUrl,
    },
  };
} 