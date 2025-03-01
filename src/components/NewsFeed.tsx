'use client';
import { useState, useEffect } from 'react';
import { NewsItem } from '@/types/News';
import { FaNewspaper, FaExternalLinkAlt, FaFilter } from 'react-icons/fa';
import Image from 'next/image';

interface NewsFeedProps {
  category?: string;
  limit?: number;
}

interface APINewsItem {
  id: string;
  title: string;
  link: string;
  description: string;
  pubDate: string;
  source: string;
  sourceIcon?: string;
  category?: string;
  author?: string;
  imageUrl?: string;
}

// Simple date formatter function
const formatTimeAgo = (date: Date): string => {
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return `${diffInSeconds} seconds ago`;
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays < 30) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
  
  const diffInMonths = Math.floor(diffInDays / 30);
  if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
  
  const diffInYears = Math.floor(diffInMonths / 12);
  return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
};

const NewsFeed: React.FC<NewsFeedProps> = ({ category, limit = 50 }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(category || null);

  const categories = [
    { id: null, name: 'All' },
    { id: 'general', name: 'General' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'education', name: 'Education' },
    { id: 'lifestyle', name: 'Lifestyle' }
  ];

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (selectedCategory) params.append('category', selectedCategory);
        if (limit) params.append('limit', limit.toString());
        
        const response = await fetch(`/api/news?${params}`);
        if (!response.ok) throw new Error('Failed to fetch news');
        
        const data: APINewsItem[] = await response.json();
        setNews(data.map((item: APINewsItem) => ({
          ...item,
          pubDate: new Date(item.pubDate)
        })));
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news feed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [selectedCategory, limit]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[200px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#004C54]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-center">
        <p className="text-red-600">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 text-sm text-[#004C54] hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Category Filter */}
      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
        <FaFilter className="text-gray-500 flex-shrink-0" />
        {categories.map(cat => (
          <button
            key={cat.id || 'all'}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-1 rounded-full text-sm whitespace-nowrap ${
              selectedCategory === cat.id
                ? 'bg-[#004C54] text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cat.name}
          </button>
        ))}
      </div>

      {/* News Items */}
      {news.length === 0 ? (
        <div className="text-center py-8">
          <FaNewspaper className="mx-auto text-gray-400 mb-2" size={32} />
          <p className="text-gray-500">No news articles found</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map(item => (
            <article
              key={item.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              {item.imageUrl && (
                <div className="relative h-48 overflow-hidden">
                  <Image
                    src={item.imageUrl}
                    alt={item.title}
                    width={300}
                    height={200}
                    className="w-full h-48 object-cover rounded-t-lg"
                  />
                  {item.sourceIcon && (
                    <Image
                      src={item.sourceIcon}
                      alt={item.source}
                      width={24}
                      height={24}
                      className="absolute top-2 left-2 h-6 w-6 rounded-full bg-white p-1"
                    />
                  )}
                </div>
              )}
              
              <div className="p-4">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-2">
                    {item.title}
                  </h3>
                  <a
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-2 text-gray-500 hover:text-[#004C54] flex-shrink-0"
                  >
                    <FaExternalLinkAlt size={14} />
                  </a>
                </div>
                
                <p className="mt-2 text-gray-600 text-sm line-clamp-3">
                  {item.description}
                </p>
                
                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <span>{item.source}</span>
                  <time dateTime={item.pubDate.toISOString()}>
                    {formatTimeAgo(item.pubDate)}
                  </time>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewsFeed; 