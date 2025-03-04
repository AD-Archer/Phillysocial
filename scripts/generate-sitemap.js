import fs from 'fs';
import path from 'path';

/**
 * Sitemap generator script for Philly Social
 * This script generates a sitemap.xml file during the build process
 * Run with: node scripts/generate-sitemap.js
 */
// Define the base URL for the site
const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://phillysocial.vercel.app';

// Get current date in ISO format for lastmod
const currentDate = new Date().toISOString().split('T')[0];

// Define the main routes of the application
const routes = [
  { path: '/', priority: '1.0', changefreq: 'daily' },
  { path: '/about', priority: '0.8', changefreq: 'monthly' },
  { path: '/contact', priority: '0.7', changefreq: 'monthly' },
  { path: '/login', priority: '0.6', changefreq: 'monthly' },
  { path: '/news', priority: '0.9', changefreq: 'hourly' },
  { path: '/local-business', priority: '0.8', changefreq: 'weekly' },
  { path: '/profile', priority: '0.7', changefreq: 'weekly' },
  // News categories
  { path: '/news/category/general', priority: '0.7', changefreq: 'daily' },
  { path: '/news/category/business', priority: '0.7', changefreq: 'daily' },
  { path: '/news/category/sports', priority: '0.7', changefreq: 'daily' },
  { path: '/news/category/lifestyle', priority: '0.7', changefreq: 'daily' },
  { path: '/news/category/education', priority: '0.7', changefreq: 'daily' },
];

// Generate the XML content
let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
xml += '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n';

// Add each route to the sitemap
routes.forEach(route => {
  xml += '  <url>\n';
  xml += `    <loc>${BASE_URL}${route.path}</loc>\n`;
  xml += `    <lastmod>${currentDate}</lastmod>\n`;
  xml += `    <changefreq>${route.changefreq}</changefreq>\n`;
  xml += `    <priority>${route.priority}</priority>\n`;
  xml += '  </url>\n';
});

xml += '</urlset>';

// Ensure the public directory exists
const publicDir = path.join(process.cwd(), 'public');
if (!fs.existsSync(publicDir)) {
  fs.mkdirSync(publicDir, { recursive: true });
}

// Write the sitemap to the public directory
const sitemapPath = path.join(publicDir, 'sitemap.xml');
fs.writeFileSync(sitemapPath, xml);

console.log(`Sitemap generated at ${sitemapPath}`); 