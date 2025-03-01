import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NEWS_SOURCES } from '@/types/News';

// Create a custom type for the RSS parser
type CustomFeed = {
  title: string;
  description: string;
  link: string;
};

type CustomItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
  creator?: string;
  author?: string;
  'media:content'?: {
    $: {
      url: string;
    };
  };
  'media:thumbnail'?: {
    $: {
      url: string;
    };
  };
  enclosure?: {
    url: string;
  };
  content?: string;
  contentSnippet?: string;
};

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [
      'creator',
      'media:content',
      'media:thumbnail',
      'enclosure',
      'content',
      'contentSnippet'
    ],
  },
  defaultRSS: 2.0,
  xml2js: {
    normalize: true,
    normalizeTags: true,
    trim: true,
    strict: false,
    xmlMode: true,
    tagNameProcessors: [
      (name: string) => name.replace(/[^\w:]/g, '_')
    ],
    attrNameProcessors: [
      (name: string) => name.replace(/[^\w:]/g, '_')
    ]
  }
});

// Helper function to validate URL
const isValidUrl = (url: string): boolean => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

// Helper function to extract image URL from various possible sources
const extractImageUrl = (item: CustomItem): string => {
  const possibleUrls = [
    item['media:content']?.$?.url,
    item['media:thumbnail']?.$?.url,
    item.enclosure?.url,
    item.content?.match(/<img[^>]+src="([^">]+)"/)?.[1]
  ].filter(url => url && isValidUrl(url));

  return possibleUrls[0] || '';
};

// Helper function to clean HTML and get a proper description
const getCleanDescription = (item: CustomItem): string => {
  const description = item.contentSnippet || 
                     item.description?.replace(/<[^>]*>/g, '') || 
                     item.content?.replace(/<[^>]*>/g, '') || 
                     '';
  
  return description.length > 200 ? description.substring(0, 200) + '...' : description;
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    const sources = category 
      ? NEWS_SOURCES.filter(source => source.category === category)
      : NEWS_SOURCES;

    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${url}: ${response.status}`);
          return null;
        }

        const text = await response.text();
        // Enhanced XML cleanup
        const cleanText = text
          .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '')
          .replace(/<!--[\s\S]*?-->/g, '') // Remove comments
          .replace(/<!\[CDATA\[(.*?)\]\]>/g, '$1') // Clean CDATA
          .replace(/[^\x09\x0A\x0D\x20-\uD7FF\uE000-\uFFFD\u10000-\u10FFFF]/g, ''); // Remove invalid XML characters

        const feed = await parser.parseString(cleanText);
        return feed;
      } catch (error) {
        console.warn(`Error fetching ${url}:`, error);
        return null;
      } finally {
        clearTimeout(timeout);
      }
    };

    const feedPromises = sources.map(async source => {
      try {
        const feed = await fetchWithTimeout(source.url);
        if (!feed?.items) return [];
        
        return feed.items
          .filter(item => item.title && item.link && item.pubDate) // Filter out invalid items
          .map(item => {
            const pubDate = new Date(item.pubDate);
            return {
              id: item.link,
              title: item.title?.trim(),
              link: item.link,
              description: getCleanDescription(item),
              pubDate: isNaN(pubDate.getTime()) ? new Date().toISOString() : pubDate.toISOString(),
              source: source.name,
              sourceIcon: source.icon,
              category: source.category,
              author: item.creator || item.author || 'Unknown',
              imageUrl: extractImageUrl(item)
            };
          })
          .filter(item => {
            const itemDate = new Date(item.pubDate);
            const weekAgo = new Date();
            weekAgo.setDate(weekAgo.getDate() - 7);
            return itemDate > weekAgo;
          });
      } catch (error) {
        console.warn(`Error parsing feed from ${source.name}:`, error);
        return [];
      }
    });

    const allItems = (await Promise.all(feedPromises))
      .flat()
      .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime())
      .slice(0, limit);

    if (allItems.length === 0) {
      console.warn('No news items found for the specified criteria');
    }

    return NextResponse.json(allItems);
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news feeds' },
      { status: 500 }
    );
  }
} 