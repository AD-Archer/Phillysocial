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

// Create a more robust parser with better error handling
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

// Cache for RSS feeds to avoid repeated fetches
// Using 'any' here is appropriate as the feed structure is complex and varies by source
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const feedCache = new Map<string, { data: any, timestamp: number }>();
const CACHE_TTL = 15 * 60 * 1000; // 15 minutes in milliseconds

// Define a type for processed news items
interface ProcessedNewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceIcon?: string;
  category: string;
  author: string;
  imageUrl: string;
  isPhillyNews: boolean;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const itemsPerPage = parseInt(searchParams.get('itemsPerPage') || '12');
    const page = parseInt(searchParams.get('page') || '1');
    const phillyOnly = searchParams.get('phillyOnly') !== 'false'; // Default to true if not specified
    
    // Ensure page is at least 1
    const currentPage = page < 1 ? 1 : page;
    
    // Filter sources based on category and phillyOnly flag
    let filteredSources = NEWS_SOURCES;
    
    if (category) {
      filteredSources = filteredSources.filter(source => source.category === category);
    }
    
    if (phillyOnly) {
      filteredSources = filteredSources.filter(source => source.isPhillyNews);
    }

    // Improved fetch with timeout, retries and caching
    const fetchWithTimeout = async (url: string, sourceName: string) => {
      // Check cache first
      const cacheKey = `${url}-${sourceName}`;
      const cachedData = feedCache.get(cacheKey);
      
      if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_TTL) {
        console.log(`Using cached data for ${sourceName}`);
        return cachedData.data;
      }
      
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout
      
      // Retry logic
      const maxRetries = 2;
      let retries = 0;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let lastError: any = null;
      
      while (retries <= maxRetries) {
        try {
          console.log(`Fetching feed from ${sourceName}: ${url}${retries > 0 ? ` (retry ${retries})` : ''}`);
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
            
            // For certain status codes, don't retry
            if (response.status === 404 || response.status === 403) {
              return null;
            }
            
            throw new Error(`HTTP error ${response.status}`);
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
            
            // Store in cache
            feedCache.set(cacheKey, {
              data: feed,
              timestamp: Date.now()
            });
            
            return feed;
          } catch (parseError: unknown) {
            console.warn(`Error parsing feed from ${sourceName} (${url}):`, parseError instanceof Error ? parseError.message : parseError);
            lastError = parseError;
            retries++;
            
            // If we've reached max retries, return null
            if (retries > maxRetries) {
              return null;
            }
            
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
            continue;
          }
        } catch (error: unknown) {
          lastError = error;
          
          if (error instanceof Error) {
            if (error.name === 'AbortError') {
              console.warn(`Timeout fetching ${sourceName} (${url})`);
              return null; // Don't retry on timeout
            } else if ('code' in error && error.code === 'ENOTFOUND') {
              console.warn(`Domain not found for ${sourceName}: ${url}`);
              return null; // Don't retry on domain not found
            } else {
              console.warn(`Error fetching ${sourceName} (${url}):`, error.message);
            }
          } else {
            console.warn(`Unknown error fetching ${sourceName} (${url}):`, error);
          }
          
          retries++;
          
          // If we've reached max retries, return null
          if (retries > maxRetries) {
            return null;
          }
          
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
        } finally {
          clearTimeout(timeout);
        }
      }
      
      console.error(`Failed to fetch ${sourceName} after ${maxRetries} retries:`, lastError);
      return null;
    };

    const feedPromises = filteredSources.map(async source => {
      try {
        const feed = await fetchWithTimeout(source.url, source.name);
        if (!feed?.items) return [];
        
        return feed.items
          .filter((item: CustomItem) => item.title && (item.link || item.guid)) // Filter out invalid items
          .map((item: CustomItem) => {
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
                imageUrl: extractImageUrl(item),
                isPhillyNews: source.isPhillyNews
              };
            } catch (itemError) {
              console.warn(`Error processing item from ${source.name}:`, 
                itemError instanceof Error ? itemError.message : itemError);
              return null;
            }
          })
          .filter((item: ProcessedNewsItem | null) => {
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
      // Using 'any' for these parameters is necessary due to the complex and variable structure of news items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .filter((item: any) => item !== null) // Filter out any null items
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .sort((a: any, b: any) => {
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
    
    // Create response with cache headers
    const response = (data: PaginatedNewsResponse) => {
      return NextResponse.json(data, {
        headers: {
          'Cache-Control': 'public, max-age=300, s-maxage=600', // Cache for 5 minutes on client, 10 minutes on CDN
          'Surrogate-Control': 'max-age=600' // For CDNs that support this header
        }
      });
    };
    
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
          imageUrl: 'https://images.unsplash.com/photo-1569761316261-9a8696fa2ca3?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          isPhillyNews: true
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
          imageUrl: 'https://images.unsplash.com/photo-1601751818941-571144562ff8?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          isPhillyNews: true
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
          imageUrl: 'https://images.unsplash.com/photo-1575916242639-ec79b6a206ff?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1050&q=80',
          isPhillyNews: true
        }
      ];
      
      // Return paginated fallback response
      return response({
        items: fallbackItems,
        pagination: {
          currentPage: 1,
          totalPages: 1,
          totalItems: fallbackItems.length,
          itemsPerPage: fallbackItems.length,
          hasNextPage: false,
          hasPreviousPage: false
        }
      });
    }

    // Return paginated response
    return response({
      items: paginatedItems,
      pagination: {
        currentPage,
        totalPages,
        totalItems,
        itemsPerPage,
        hasNextPage: currentPage < totalPages,
        hasPreviousPage: currentPage > 1
      }
    });
  } catch (error: unknown) {
    console.error('Error in news API:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Failed to fetch news feeds' },
      { status: 500 }
    );
  }
} 