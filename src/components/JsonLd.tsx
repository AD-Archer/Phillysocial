"use client";

import { useEffect, useState } from "react";

/**
 * JSON-LD Component for adding structured data to pages
 * This helps search engines better understand the content of your pages
 *
 * @param data - The structured data object to be rendered as JSON-LD
 * @returns A script element with the JSON-LD data
 */
export default function JsonLd({ data }: { data: Record<string, unknown> }) {
  // Use state to handle client-side rendering
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  // Only render on client-side to avoid hydration issues
  if (!isClient) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

/**
 * Generate website structured data
 * @returns JSON-LD data for the website
 */
export function generateWebsiteData() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "Philly Social",
    url: "https://phillysocial.adarcher.app",
    potentialAction: {
      "@type": "SearchAction",
      target: "https://phillysocial.adarcher.app/search?q={search_term_string}",
      "query-input": "required name=search_term_string",
    },
  };
}

/**
 * Generate organization structured data
 * @returns JSON-LD data for the organization
 */
export function generateOrganizationData() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Philly Social",
    url: "https://phillysocial.adarcher.app",
    logo: "https://phillysocial.adarcher.app/Logo.png",
    founders: [
      {
        "@type": "Person",
        name: "Antonio Archer",
      },
      {
        "@type": "Person",
        name: "Mohamed Souare",
      },
      {
        "@type": "Person",
        name: "Sianni Strickland",
      },
      {
        "@type": "Person",
        name: "Bryan Gunawan",
      },
    ],
    sameAs: [
      "https://twitter.com/phillysocial",
      "https://facebook.com/phillysocial",
      "https://instagram.com/phillysocial",
    ],
  };
}

/**
 * Generate news article structured data
 * @param article - The news article data
 * @returns JSON-LD data for a news article
 */
export function generateNewsArticleData(article: {
  headline: string;
  description: string;
  image: string;
  datePublished: string;
  author: string;
  publisher: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.headline,
    description: article.description,
    image: article.image,
    datePublished: article.datePublished,
    author: {
      "@type": "Person",
      name: article.author,
    },
    publisher: {
      "@type": "Organization",
      name: article.publisher,
      logo: {
        "@type": "ImageObject",
        url: "https://phillysocial.adarcher.app/Logo.png",
      },
    },
    url: article.url,
  };
}

/**
 * Generate local business structured data
 * @param business - The local business data
 * @returns JSON-LD data for a local business
 */
export function generateLocalBusinessData(business: {
  name: string;
  description: string;
  image: string;
  address: string;
  telephone: string;
  priceRange: string;
  url: string;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: business.name,
    description: business.description,
    image: business.image,
    address: {
      "@type": "PostalAddress",
      addressLocality: "Philadelphia",
      addressRegion: "PA",
      streetAddress: business.address,
    },
    telephone: business.telephone,
    priceRange: business.priceRange,
    url: business.url,
  };
}
