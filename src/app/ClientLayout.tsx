'use client'; // This component will be a client component 

import { useEffect } from 'react';

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

  return <>{children}</>; // Render children
} 