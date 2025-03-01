'use client';
import { useState, useEffect } from 'react';
import { NewsItem } from '@/types/News';
import { FaNewspaper, FaExternalLinkAlt } from 'react-icons/fa';
import Image from 'next/image';

interface NewsFeedProps {
  category?: string;
  limit?: number;
}

// Format date relative to now
const formatTimeAgo = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  }
  
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  if (diffInMinutes < 60) {
    return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  }
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) {
    return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  }
  
  const diffInDays = Math.floor(diffInHours / 24);
  if (diffInDays === 1) {
    return 'Yesterday';
  }
  if (diffInDays < 7) {
    return `${diffInDays} days ago`;
  }
  
  // For older dates, return the actual date
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
  });
};

const NewsFeed: React.FC<NewsFeedProps> = ({ category, limit = 50 }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        if (limit) params.append('limit', limit.toString());
        
        const response = await fetch(`/api/news?${params}`);
        if (!response.ok) throw new Error('Failed to fetch news');
        
        const data = await response.json();
        setNews(data);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news feed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [category, limit]);

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-4 animate-pulse">
            <div className="h-48 bg-gray-200 rounded-md mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <FaNewspaper className="mx-auto text-red-500 mb-2" size={24} />
        <p className="text-red-600 font-medium">{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-3 text-sm text-[#004C54] hover:underline"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (news.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-8 text-center">
        <FaNewspaper className="mx-auto text-gray-400 mb-2" size={24} />
        <h3 className="text-lg font-medium text-gray-700">No news available</h3>
        <p className="text-gray-500 mt-2">Try selecting a different category or check back later.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {news.map(item => (
        <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
          <a href={item.link} target="_blank" rel="noopener noreferrer" className="block">
            {item.imageUrl ? (
              <div className="relative h-48 overflow-hidden">
                <Image
                  src={item.imageUrl}
                  alt={item.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
              </div>
            ) : (
              <div className="h-48 bg-gray-100 flex items-center justify-center">
                <FaNewspaper className="text-gray-400" size={48} />
              </div>
            )}
            
            <div className="p-4">
              <div className="flex items-center space-x-2 mb-2">
                {item.sourceIcon && (
                  <Image
                    src={item.sourceIcon}
                    alt={item.source}
                    width={16}
                    height={16}
                    className="rounded-full"
                  />
                )}
                <span className="text-sm text-gray-500">{item.source}</span>
                <span className="text-sm text-gray-400">•</span>
                <time className="text-sm text-gray-500">{formatTimeAgo(item.pubDate)}</time>
              </div>
              
              <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#004C54]">
                {item.title}
              </h3>
              
              <p className="text-gray-600 text-sm line-clamp-3 mb-4">
                {item.description}
              </p>
              
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">{item.author}</span>
                <FaExternalLinkAlt className="text-gray-400" />
              </div>
            </div>
          </a>
        </article>
      ))}
    </div>
  );
};

export default NewsFeed; 