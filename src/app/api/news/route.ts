import { NextResponse } from 'next/server';
import Parser from 'rss-parser';
import { NEWS_SOURCES, PaginatedNewsResponse } from '@/types/News';

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
  'media:group'?: {
    'media:content'?: {
      $: {
        url: string;
      };
    }[];
  };
  enclosure?: {
    url: string;
  };
  content?: string;
  contentSnippet?: string;
  'content:encoded'?: string;
  'dc:creator'?: string;
  guid?: string;
  categories?: string[];
  isoDate?: string;
};

const parser: Parser<CustomFeed, CustomItem> = new Parser({
  customFields: {
    item: [
      'creator',
      'media:content',
      'media:thumbnail',
      'media:group',
      'enclosure',
      'content',
      'contentSnippet',
      'content:encoded',
      'dc:creator',
      'guid',
      'categories',
      'isoDate'
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
  try {
    const possibleUrls = [
      item['media:content']?.$?.url,
      item['media:thumbnail']?.$?.url,
      item['media:group']?.['media:content']?.[0]?.$?.url,
      item.enclosure?.url,
      // Try to extract from content or content:encoded - only if they are strings
      typeof item.content === 'string' ? item.content.match(/<img[^>]+src="([^">]+)"/)?.[1] : undefined,
      typeof item['content:encoded'] === 'string' ? item['content:encoded'].match(/<img[^>]+src="([^">]+)"/)?.[1] : undefined
    ].filter(url => url && isValidUrl(url));

    return possibleUrls[0] || '';
  } catch (error) {
    console.warn('Error extracting image URL:', error);
    return '';
  }
};

// Helper function to clean HTML and get a proper description
const getCleanDescription = (item: CustomItem): string => {
  // Check if properties exist before calling replace
  const contentSnippet = item.contentSnippet || '';
  const description = item.description ? item.description.replace(/<[^>]*>/g, '') : '';
  const contentEncoded = item['content:encoded'] && typeof item['content:encoded'] === 'string' 
    ? item['content:encoded'].replace(/<[^>]*>/g, '') 
    : '';
  const content = item.content && typeof item.content === 'string' 
    ? item.content.replace(/<[^>]*>/g, '') 
    : '';
  
  // Use the first non-empty value
  const text = contentSnippet || description || contentEncoded || content || '';
  
  return text.length > 200 ? text.substring(0, 200) + '...' : text;
};

// Helper function to get the author from various possible sources
const getAuthor = (item: CustomItem): string => {
  return item.creator || 
         item.author || 
         item['dc:creator'] || 
         'Unknown';
};

// Helper function to get a valid publication date
const getValidPubDate = (item: CustomItem): string => {
  const dateStr = item.isoDate || item.pubDate;
  if (!dateStr) return new Date().toISOString();
  
  try {
    const pubDate = new Date(dateStr);
    return isNaN(pubDate.getTime()) ? new Date().toISOString() : pubDate.toISOString();
  } catch {
    return new Date().toISOString();
  }
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '12');
    const page = parseInt(searchParams.get('page') || '1');
    
    // Ensure page is at least 1
    const currentPage = page < 1 ? 1 : page;
    
    const sources = category 
      ? NEWS_SOURCES.filter(source => source.category === category)
      : NEWS_SOURCES;

    const fetchWithTimeout = async (url: string, sourceName: string) => {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      try {
        console.log(`Fetching feed from ${sourceName}: ${url}`);
        const response = await fetch(url, { 
          signal: controller.signal,
          headers: {
            'Accept': 'application/rss+xml, application/xml, text/xml, application/atom+xml',
            'User-Agent': 'Mozilla/5.0 (compatible; RSS Reader Bot/1.0)'
          },
          next: { revalidate: 3600 } // Cache for 1 hour
        });

        if (!response.ok) {
          console.warn(`Failed to fetch ${sourceName} (${url}): ${response.status}`);
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

        try {
          const feed = await parser.parseString(cleanText);
          console.log(`Successfully parsed feed from ${sourceName} with ${feed.items?.length || 0} items`);
          return feed;
        } catch (parseError: unknown) {
          console.warn(`Error parsing feed from ${sourceName} (${url}):`, parseError instanceof Error ? parseError.message : parseError);
          return null;
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            console.warn(`Timeout fetching ${sourceName} (${url})`);
          } else if ('code' in error && error.code === 'ENOTFOUND') {
            console.warn(`Domain not found for ${sourceName}: ${url}`);
          } else {
            console.warn(`Error fetching ${sourceName} (${url}):`, error.message);
          }
        } else {
          console.warn(`Unknown error fetching ${sourceName} (${url}):`, error);
        }
        return null;
      } finally {
        clearTimeout(timeout);
      }
    };

    const feedPromises = sources.map(async source => {
      try {
        const feed = await fetchWithTimeout(source.url, source.name);
        if (!feed?.items) return [];
        
        return feed.items
          .filter(item => item.title && (item.link || item.guid)) // Filter out invalid items
          .map(item => {
            try {
              const link = item.link || item.guid || '';
              return {
                id: link,
                title: item.title?.trim(),
                link: link,
                description: getCleanDescription(item),
                pubDate: getValidPubDate(item),
                source: source.name,
                sourceIcon: source.icon,
                category: source.category,
                author: getAuthor(item),
                imageUrl: extractImageUrl(item)
              };
            } catch (itemError) {
              console.warn(`Error processing item from ${source.name}:`, 
                itemError instanceof Error ? itemError.message : itemError);
              return null;
            }
          })
          .filter(item => {
            if (!item) return false; // Filter out null items from errors
            
            // Filter out items older than a week
            try {
              const itemDate = new Date(item.pubDate);
              const weekAgo = new Date();
              weekAgo.setDate(weekAgo.getDate() - 7);
              return itemDate > weekAgo;
            } catch {
              console.warn(`Error processing date for item from ${source.name}`);
              return false;
            }
          });
      } catch (error: unknown) {
        console.warn(`Error processing feed from ${source.name}:`, 
          error instanceof Error ? error.message : error);
        return [];
      }
    });

    const allNewsItems = (await Promise.all(feedPromises))
      .flat()
      .filter(item => item !== null) // Filter out any null items
      .sort((a, b) => {
        // Handle null cases (shouldn't happen after filtering, but TypeScript needs this)
        if (!a || !b) return 0;
        return new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime();
      });

    // Calculate pagination values
    const totalItems = allNewsItems.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    
    // Get items for current page
    const paginatedItems = allNewsItems.slice(startIndex, endIndex);

    console.log(`Total news items found: ${totalItems}, showing page ${currentPage} of ${totalPages}`);
    
    if (allNewsItems.length === 0) {
      console.warn('No news items found for the specified criteria');
      
      // Return fallback data if no items found
      const fallbackItems = [
        {
          id: 'fallback-1',
          title: 'Welcome to Philly Social News',
          link: 'https://phillysocial.com',
          description: 'Our news feed is currently being updated. Please check back soon for the latest Philadelphia news.',
          pubDate: new Date().toISOString(),
          source: 'Philly Social',
          category: 'general',
          author: 'Philly Social Team',
          imageUrl: 'https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80'
        },
        {
          id: 'fallback-2',
          title: 'Explore Philadelphia\'s Top Attractions',
          link: 'https://phillysocial.com/attractions',
          description: 'Discover the best places to visit in Philadelphia, from historic landmarks to modern attractions.',
          pubDate: new Date().toISOString(),
          source: 'Philly Social',
          category: 'lifestyle',
          author: 'Philly Social Team',
          imageUrl: 'https://images.unsplash.com/photo-1601751818941-571144562ff8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80'
        },
        {
          id: 'fallback-3',
          title: 'Philadelphia Events This Weekend',
          link: 'https://phillysocial.com/events',
          description: 'Find out what\'s happening in Philadelphia this weekend, from concerts to festivals.',
          pubDate: new Date().toISOString(),
          source: 'Philly Social',
          category: 'events',
          author: 'Philly Social Team',
          imageUrl: 'https://images.unsplash.com/photo-1575916242639-ec79b6a206ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80'
        }
      ];
      
      // Return paginated fallback response
      return NextResponse.json({
        items: fallbackItems,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: fallbackItems.length,
          itemsPerPage: fallbackItems.length,
          hasNextPage: false,
          hasPreviousPage: false
        }
      } as PaginatedNewsResponse);
    }

    // Return paginated response
    return NextResponse.json({
      items: paginatedItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    } as PaginatedNewsResponse);
  } catch (error: unknown) {
    console.error('Error in news API:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to fetch news feeds' },
      { status: 500 }
    );
  }
} 