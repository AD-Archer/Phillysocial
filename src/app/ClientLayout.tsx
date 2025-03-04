'use client'; // This component will be a client component 

import { useEffect } from 'react';
import JsonLd, { generateWebsiteData, generateOrganizationData } from '@/components/JsonLd';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const linkIconSVG = document.createElement('link');
    linkIconSVG.rel = 'icon';
    linkIconSVG.href = '/logo.svg';
    document.head.appendChild(linkIconSVG);

    const linkIconPNG = document.createElement('link');
    linkIconPNG.rel = 'icon';
    linkIconPNG.type = 'image/png';
    linkIconPNG.href = '/icon.png';
    document.head.appendChild(linkIconPNG);
  }, []);

  // Generate structured data for the website and organization
  const websiteData = generateWebsiteData();
  const organizationData = generateOrganizationData();

  return (
    <>
      {/* Add structured data for better SEO */}
      <JsonLd data={websiteData} />
      <JsonLd data={organizationData} />
      {children}
    </>
  ); 
} 