import { NextResponse } from 'next/server';
import { NEWS_SOURCES } from '@/types/News';

/**
 * Dynamic sitemap generator for Philly Social
 * Generates an XML sitemap with all static routes and dynamic news categories
 */
export async function GET() {
  // Base URL for the site
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://phillysocial.vercel.app';
  
  // Get current date in ISO format for lastmod
  const currentDate = new Date().toISOString().split('T')[0];
  
  // Static routes with their priorities and change frequencies
  const staticRoutes = [
    { path: '/', priority: '1.0', changefreq: 'daily' },
    { path: '/about', priority: '0.8', changefreq: 'monthly' },
    { path: '/contact', priority: '0.7', changefreq: 'monthly' },
    { path: '/login', priority: '0.6', changefreq: 'monthly' },
    { path: '/news', priority: '0.9', changefreq: 'hourly' },
    { path: '/local-business', priority: '0.8', changefreq: 'weekly' },
    { path: '/profile', priority: '0.7', changefreq: 'weekly' },
  ];
  
  // Get unique news categories from NEWS_SOURCES
  const categories = [...new Set(NEWS_SOURCES.map(source => source.category))];
  
  // Start building the XML
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';
  
  // Add static routes
  staticRoutes.forEach(route => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}${route.path}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
    xml += `    <priority>${route.priority}</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Add category routes for news
  categories.forEach(category => {
    xml += '  <url>\n';
    xml += `    <loc>${baseUrl}/news/category/${category}</loc>\n`;
    xml += `    <lastmod>${currentDate}</lastmod>\n`;
    xml += `    <changefreq>daily</changefreq>\n`;
    xml += `    <priority>0.7</priority>\n`;
    xml += '  </url>\n';
  });
  
  // Close the XML
  xml += '</urlset>';
  
  // Return the XML with the correct content type
  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
} 