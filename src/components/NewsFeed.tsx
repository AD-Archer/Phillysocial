'use client';
import { useState, useEffect } from 'react';
import { NewsItem, PaginatedNewsResponse, PaginationInfo } from '@/types/News';
import { FaNewspaper, FaExternalLinkAlt, FaExclamationTriangle, FaChevronLeft, FaChevronRight, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import Image from 'next/image';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';

interface NewsFeedProps {
  category?: string;
  itemsPerPage?: number;
  hidePhillyToggle?: boolean;
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

const NewsFeed: React.FC<NewsFeedProps> = ({ 
  category, 
  itemsPerPage = 12,
  hidePhillyToggle = false
}) => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { } = useAuth();
  
  const [news, setNews] = useState<NewsItem[]>([]);
  const [pagination, setPagination] = useState<PaginationInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFallbackData, setIsFallbackData] = useState(false);
  const [phillyNewsOnly, setPhillyNewsOnly] = useState(true);
  
  // Get current page from URL or default to 1
  const currentPage = parseInt(searchParams.get('page') || '1');

  // Function to update URL with current filters
  const updateUrlParams = (params: { [key: string]: string }) => {
    const newParams = new URLSearchParams(searchParams);
    Object.entries(params).forEach(([key, value]) => {
      newParams.set(key, value);
    });
    router.push(`?${newParams.toString()}`);
  };

  useEffect(() => {
    // Check if phillyNewsOnly param exists in URL
    const phillyParam = searchParams.get('phillyOnly');
    if (phillyParam !== null) {
      setPhillyNewsOnly(phillyParam === 'true');
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchNews = async () => {
      setIsLoading(true);
      setError(null);
      setIsFallbackData(false);
      
      try {
        const params = new URLSearchParams();
        if (category) params.append('category', category);
        params.append('itemsPerPage', itemsPerPage.toString());
        params.append('page', currentPage.toString());
        params.append('phillyOnly', phillyNewsOnly.toString());
        
        const response = await fetch(`/api/news?${params}`);
        if (!response.ok) throw new Error('Failed to fetch news');
        
        const data: PaginatedNewsResponse = await response.json();
        
        // Check if we're getting fallback data
        if (data.items.length > 0 && data.items[0].id?.startsWith('fallback-')) {
          setIsFallbackData(true);
        }
        
        setNews(data.items);
        setPagination(data.pagination);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError('Failed to load news feed. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, [category, itemsPerPage, currentPage, phillyNewsOnly]);

  // Function to toggle Philly news filter
  const togglePhillyNewsFilter = () => {
    const newValue = !phillyNewsOnly;
    setPhillyNewsOnly(newValue);
    updateUrlParams({ phillyOnly: newValue.toString(), page: '1' });
  };

  // Function to navigate to a specific page
  const goToPage = (page: number) => {
    updateUrlParams({ page: page.toString() });
  };

  // Pagination UI component
  const PaginationControls = () => {
    if (!pagination || pagination.totalPages <= 1) return null;
    
    return (
      <div className="flex justify-center items-center mt-8 space-x-2">
        <button
          onClick={() => goToPage(pagination.currentPage - 1)}
          disabled={!pagination.hasPreviousPage}
          className={`px-3 py-2 rounded-md flex items-center ${
            pagination.hasPreviousPage 
              ? 'bg-[#004C54] text-white hover:bg-[#003A40]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Previous page"
        >
          <FaChevronLeft className="mr-1" />
          <span>Previous</span>
        </button>
        
        <div className="flex items-center space-x-1">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1)
            .filter(page => {
              // Show first page, last page, current page, and pages around current page
              return (
                page === 1 || 
                page === pagination.totalPages || 
                Math.abs(page - pagination.currentPage) <= 1
              );
            })
            .map((page, index, array) => {
              // Add ellipsis if there are gaps
              const showEllipsisBefore = index > 0 && page - array[index - 1] > 1;
              
              return (
                <div key={page} className="flex items-center">
                  {showEllipsisBefore && (
                    <span className="px-3 py-2 text-gray-500">...</span>
                  )}
                  <button
                    onClick={() => goToPage(page)}
                    className={`w-10 h-10 flex items-center justify-center rounded-md ${
                      page === pagination.currentPage
                        ? 'bg-[#004C54] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                    aria-label={`Page ${page}`}
                    aria-current={page === pagination.currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                </div>
              );
            })}
        </div>
        
        <button
          onClick={() => goToPage(pagination.currentPage + 1)}
          disabled={!pagination.hasNextPage}
          className={`px-3 py-2 rounded-md flex items-center ${
            pagination.hasNextPage 
              ? 'bg-[#004C54] text-white hover:bg-[#003A40]' 
              : 'bg-gray-200 text-gray-400 cursor-not-allowed'
          }`}
          aria-label="Next page"
        >
          <span>Next</span>
          <FaChevronRight className="ml-1" />
        </button>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {[...Array(itemsPerPage)].map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-md p-0 animate-pulse overflow-hidden flex flex-col h-full">
            {/* Skeleton for image and source badge */}
            <div className="relative">
              <div className="absolute top-3 left-3 z-10 flex items-center bg-white bg-opacity-90 rounded-full px-2 py-1">
                <div className="w-6 h-6 bg-gray-200 rounded-full mr-2"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              <div className="h-48 bg-gray-200 rounded-t-lg"></div>
            </div>
            
            {/* Skeleton for content */}
            <div className="p-4 flex-grow flex flex-col">
              <div className="flex items-center justify-between mb-2">
                <div className="h-3 bg-gray-200 rounded w-20"></div>
                <div className="h-3 bg-gray-200 rounded w-16"></div>
              </div>
              
              <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-5 bg-gray-200 rounded w-1/2 mb-4"></div>
              
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3 mb-4"></div>
              
              <div className="flex items-center justify-between mt-auto">
                <div className="h-3 bg-gray-200 rounded w-1/3"></div>
                <div className="h-3 bg-gray-200 rounded w-1/4"></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 p-6 rounded-lg text-center">
        <FaExclamationTriangle className="mx-auto text-red-500 mb-2" size={24} />
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
    <>
      {/* News Filter Controls */}
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center">
        {!hidePhillyToggle && (
          <div className="flex items-center mb-4 sm:mb-0">
            <button 
              onClick={togglePhillyNewsFilter}
              className="flex items-center text-gray-700 hover:text-[#004C54] transition-colors"
              aria-label={phillyNewsOnly ? "Show all news" : "Show only Philadelphia news"}
            >
              {phillyNewsOnly ? (
                <FaCheckSquare className="w-5 h-5 mr-2 text-[#004C54]" />
              ) : (
                <FaRegSquare className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">Philadelphia News Only</span>
            </button>
          </div>
        )}
        
        {pagination && pagination.totalItems > 0 && (
          <div className={`text-sm text-gray-500 ${!hidePhillyToggle ? '' : 'ml-auto'}`}>
            Showing {(pagination.currentPage - 1) * pagination.itemsPerPage + 1} to {Math.min(pagination.currentPage * pagination.itemsPerPage, pagination.totalItems)} of {pagination.totalItems} news items
          </div>
        )}
      </div>
      
      {isFallbackData && (
        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
          <p className="text-yellow-700 text-sm">
            <FaExclamationTriangle className="inline-block mr-2" />
            We&apos;re currently experiencing issues with our news feeds. Showing placeholder content until our feeds are back online.
          </p>
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
        {news.map(item => (
          <article key={item.id} className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300 flex flex-col h-full">
            <a href={item.link} target="_blank" rel="noopener noreferrer" className="block flex-grow flex flex-col">
              <div className="relative">
                {/* Source badge - always visible on top of the image but below the header */}
                <div className="absolute top-3 left-3 z-[5] flex items-center bg-white bg-opacity-90 rounded-full px-2 py-1 shadow-sm">
                  {/* Source Icon with better error handling */}
                  <div className="relative w-6 h-6 mr-2 flex-shrink-0 overflow-hidden">
                    {item.sourceIcon ? (
                      <div className="w-6 h-6 flex items-center justify-center">
                        <Image
                          src={item.sourceIcon}
                          alt={item.source}
                          width={24}
                          height={24}
                          className="rounded-full object-contain"
                          onError={(e) => {
                            // If source icon fails to load, replace with a source initial
                            const target = e.target as HTMLImageElement;
                            target.style.display = 'none';
                            
                            // Find the parent element and add a fallback
                            const parent = target.parentElement;
                            if (parent) {
                              // Clear any existing content first
                              while (parent.firstChild) {
                                parent.removeChild(parent.firstChild);
                              }
                              
                              // Create the fallback element
                              const fallback = document.createElement('div');
                              fallback.className = 'w-6 h-6 flex items-center justify-center bg-[#004C54] rounded-full text-white text-xs font-bold';
                              fallback.textContent = item.source.charAt(0).toUpperCase();
                              parent.appendChild(fallback);
                            }
                          }}
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 flex items-center justify-center bg-[#004C54] rounded-full text-white text-xs font-bold">
                        {item.source.charAt(0).toUpperCase()}
                      </div>
                    )}
                  </div>
                  <span className="text-xs font-medium text-gray-800 truncate max-w-[100px]">{item.source}</span>
                  {item.isPhillyNews && (
                    <span className="ml-1 inline-flex items-center justify-center w-4 h-4 bg-[#046A38] rounded-full flex-shrink-0">
                      <span className="text-white text-[8px] font-bold">P</span>
                    </span>
                  )}
                </div>
                
                {/* Article Image with improved error handling */}
                <div className="relative h-48 overflow-hidden bg-gray-100">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.title}
                      fill
                      className="object-cover transition-opacity duration-300"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                      onError={(e) => {
                        // If image fails to load, replace with a fallback
                        const target = e.target as HTMLImageElement;
                        target.style.display = 'none';
                        
                        // Find the parent element and add a fallback
                        const parent = target.parentElement;
                        if (parent) {
                          // Create a fallback container
                          const fallbackContainer = document.createElement('div');
                          fallbackContainer.className = 'h-full w-full flex flex-col items-center justify-center bg-gray-100 p-4';
                          
                          // Add an icon
                          const icon = document.createElement('div');
                          icon.className = 'text-gray-400 mb-2';
                          icon.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19V5C21 3.9 20.1 3 19 3ZM19 19H5V5H19V19ZM13.96 12.29L11.21 15.83L9.25 13.47L6.5 17H17.5L13.96 12.29Z" fill="currentColor"/></svg>';
                          
                          // Add source name
                          const sourceName = document.createElement('div');
                          sourceName.className = 'text-sm text-gray-500 font-medium text-center';
                          sourceName.textContent = item.source;
                          
                          // Append elements
                          fallbackContainer.appendChild(icon);
                          fallbackContainer.appendChild(sourceName);
                          parent.appendChild(fallbackContainer);
                        }
                      }}
                      placeholder="blur"
                      blurDataURL="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+P+/HgAFdQIQX8Fo/QAAAABJRU5ErkJggg=="
                    />
                  ) : (
                    <div className="h-full w-full flex flex-col items-center justify-center">
                      <FaNewspaper className="text-gray-400 mb-2" size={48} />
                      <span className="text-sm text-gray-500 font-medium px-4 text-center">{item.source}</span>
                    </div>
                  )}
                </div>
              </div>
              
              <div className="p-4 flex-grow flex flex-col">
                <div className="flex items-center justify-between mb-2">
                  <time className="text-xs text-gray-500">{formatTimeAgo(item.pubDate)}</time>
                  {item.category && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                      {item.category}
                    </span>
                  )}
                </div>
                
                <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-[#004C54]">
                  {item.title}
                </h3>
                
                <p className="text-gray-600 text-sm line-clamp-3 mb-4 flex-grow">
                  {item.description}
                </p>
                
                <div className="flex items-center justify-between text-sm mt-auto">
                  <span className="text-gray-500 text-xs truncate max-w-[70%]">{item.author || 'Staff Reporter'}</span>
                  <span className="text-[#004C54] flex items-center text-xs font-medium">
                    Read more <FaExternalLinkAlt className="ml-1" size={10} />
                  </span>
                </div>
              </div>
            </a>
          </article>
        ))}
      </div>
      
      <PaginationControls />
    </>
  );
};

export default NewsFeed; 