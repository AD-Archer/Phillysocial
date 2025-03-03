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

// Make sure to export the GET function properly for Next.js App Router
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
            
            // Cache the successful result
            feedCache.set(cacheKey, {
              data: feed,
              timestamp: Date.now()
            });
            
            clearTimeout(timeout);
            return feed;
          } catch (parseError) {
            console.error(`Error parsing feed from ${sourceName}:`, parseError);
            retries++;
            continue;
          }
        } catch (fetchError) {
          console.error(`Error fetching feed from ${sourceName} (attempt ${retries}):`, fetchError);
          retries++;
          
          if (retries <= maxRetries) {
            // Wait before retrying (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries)));
          }
        } finally {
          clearTimeout(timeout);
        }
      }
      
      console.warn(`Failed to fetch ${sourceName} after ${maxRetries} retries`);
      return null;
    };

    // Fetch all feeds in parallel
    const feedPromises = filteredSources.map(source => 
      fetchWithTimeout(source.url, source.name)
        .then(feed => ({ feed, source }))
        .catch(error => {
          console.error(`Error processing ${source.name}:`, error);
          return { feed: null, source };
        })
    );
    
    const results = await Promise.all(feedPromises);
    
    // Process all items from all feeds
    const allItems: ProcessedNewsItem[] = [];
    
    results.forEach(({ feed, source }) => {
      if (!feed || !feed.items) {
        console.warn(`No items found for ${source.name}`);
        return;
      }
      
      feed.items.forEach((item: CustomItem) => {
        try {
          if (!item.title || !item.link) {
            console.warn(`Skipping item with missing title or link from ${source.name}`);
            return;
          }
          
          const imageUrl = extractImageUrl(item);
          const description = getCleanDescription(item);
          const author = getAuthor(item);
          const pubDate = getValidPubDate(item);
          
          // Create a unique ID based on title and link
          const id = Buffer.from(`${item.title}-${item.link}`).toString('base64');
          
          allItems.push({
            id,
            title: item.title,
            link: item.link,
            description,
            pubDate,
            source: source.name,
            sourceIcon: source.icon,
            category: source.category,
            author,
            imageUrl,
            isPhillyNews: source.isPhillyNews
          });
        } catch (error) {
          console.error(`Error processing item from ${source.name}:`, error);
        }
      });
    });
    
    // Sort all items by publication date (newest first)
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
    
    // Paginate the results
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = allItems.slice(startIndex, endIndex);
    
    // Prepare the response
    const response: PaginatedNewsResponse = {
      items: paginatedItems,
      pagination: {
        currentPage,
        totalPages: Math.ceil(allItems.length / itemsPerPage),
        totalItems: allItems.length,
        itemsPerPage,
        hasNextPage: endIndex < allItems.length,
        hasPreviousPage: startIndex > 0
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error in news API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch news' },
      { status: 500 }
    );
  }
} 