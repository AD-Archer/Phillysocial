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
  enclosure?: {
    url: string;
  };
};

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [
      'creator',
      'media:content',
      'enclosure'
    ],
  },
  defaultRSS: 2.0,
  xml2js: {
    normalize: true,
    normalizeTags: true,
    trim: true,
    // Clean up problematic characters
    tagNameProcessors: [
      (name: string) => name.replace(/&/g, 'and').replace(/[^ -]/g, '_')
    ],
    attrNameProcessors: [
      (name: string) => name.replace(/&/g, 'and').replace(/[^ -]/g, '_')
    ]
  }
});

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    
    // Filter sources by category if specified
    const sources = category 
      ? NEWS_SOURCES.filter(source => source.category === category)
      : NEWS_SOURCES;

    // Fetch RSS feeds with timeout
    const fetchWithTimeout = async (url: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000); // Increased timeout to 10s
      
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
          }
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const text = await response.text();
        // Clean up problematic characters before parsing
        const cleanText = text
          .replace(/&(?![a-zA-Z0-9#]+;)/g, '&amp;')
          .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, ''); // Remove control characters

        return await parser.parseString(cleanText);
      } catch (error) {
        console.error(`Error fetching ${url}:`, error);
        return null;
      } finally {
        clearTimeout(timeout);
      }
    };

    // Fetch all feeds in parallel with error handling for each feed
    const feedPromises = sources.map(async source => {
      try {
        const feed = await fetchWithTimeout(source.url);
        if (!feed?.items) return [];
        
        return feed.items
          .filter(item => item.title && item.link) // Filter out invalid items
          .map(item => ({
            id: item.link,
            title: item.title?.trim(),
            link: item.link,
            description: item.description
              ? item.description.replace(/<[^>]*>/g, '').substring(0, 200) + '...'
              : '',
            pubDate: new Date(item.pubDate || Date.now()),
            source: source.name,
            sourceIcon: source.icon,
            category: source.category,
            author: item.creator || item.author || 'Unknown',
            imageUrl: item['media:content']?.$?.url || item.enclosure?.url
          }));
      } catch (error) {
        console.error(`Error parsing feed from ${source.name}:`, error);
        return [];
      }
    });

    const allItems = (await Promise.all(feedPromises))
      .flat()
      .filter(item => item.title && item.link) // Additional validation
      .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
      .slice(0, limit);

    return NextResponse.json(allItems);
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news feeds' },
      { status: 500 }
    );
  }
} 