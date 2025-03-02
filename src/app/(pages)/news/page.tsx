'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';
import { FaNewspaper, FaFilter, FaTags, FaCheckSquare, FaRegSquare } from 'react-icons/fa';
import Link from 'next/link';
import { useAuth } from '@/lib/context/AuthContext';

export default function NewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { } = useAuth();
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    searchParams.get('category') || null
  );
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('itemsPerPage') || '12')
  );
  const [phillyNewsOnly, setPhillyNewsOnly] = useState(
    searchParams.get('phillyOnly') !== 'false'
  );

  useEffect(() => {
    // Update phillyNewsOnly state when URL changes
    const phillyParam = searchParams.get('phillyOnly');
    if (phillyParam !== null) {
      setPhillyNewsOnly(phillyParam === 'true');
    }
  }, [searchParams]);

  const handleCategoryChange = (category: string | null) => {
    setSelectedCategory(category);
    
    // Update URL with new category and reset to page 1
    const params = new URLSearchParams(searchParams);
    if (category) {
      params.set('category', category);
    } else {
      params.delete('category');
    }
    params.set('page', '1'); // Reset to page 1 when changing category
    router.push(`/news?${params.toString()}`);
  };

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    
    // Update URL with new items per page and reset to page 1
    const params = new URLSearchParams(searchParams);
    params.set('itemsPerPage', value.toString());
    params.set('page', '1'); // Reset to page 1 when changing items per page
    router.push(`/news?${params.toString()}`);
  };

  const togglePhillyNewsFilter = () => {
    const newValue = !phillyNewsOnly;
    setPhillyNewsOnly(newValue);
    
    // Update URL with new phillyOnly value and reset to page 1
    const params = new URLSearchParams(searchParams);
    params.set('phillyOnly', newValue.toString());
    params.set('page', '1'); // Reset to page 1 when changing filter
    router.push(`/news?${params.toString()}`);
  };

  const categories = [
    { id: null, name: 'All News' },
    { id: 'general', name: 'General' },
    { id: 'business', name: 'Business' },
    { id: 'sports', name: 'Sports' },
    { id: 'education', name: 'Education' },
    { id: 'lifestyle', name: 'Lifestyle' }
  ];

  const itemsPerPageOptions = [
    { value: 6, label: '6 per page' },
    { value: 12, label: '12 per page' },
    { value: 24, label: '24 per page' },
    { value: 48, label: '48 per page' }
  ];

  return (
    <>
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaNewspaper className="mr-2 text-[#004C54]" />
              {phillyNewsOnly ? 'Philadelphia News' : 'All News'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              {phillyNewsOnly 
                ? "Stay updated with the latest news from Philadelphia's top sources"
                : "Browse news from Philadelphia and around the world"}
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Philly News Toggle */}
            <button 
              onClick={togglePhillyNewsFilter}
              className="flex items-center text-gray-700 hover:text-[#004C54] transition-colors px-3 py-2 bg-white rounded-md shadow-sm"
              aria-label={phillyNewsOnly ? "Show all news" : "Show only Philadelphia news"}
            >
              {phillyNewsOnly ? (
                <FaCheckSquare className="w-5 h-5 mr-2 text-[#004C54]" />
              ) : (
                <FaRegSquare className="w-5 h-5 mr-2" />
              )}
              <span className="font-medium">Philadelphia News Only</span>
            </button>
            
            {/* Category Filter */}
            <div className="relative">
              <div className="flex items-center space-x-2">
                <FaFilter className="text-gray-400" />
                <select
                  value={selectedCategory || ''}
                  onChange={(e) => handleCategoryChange(e.target.value || null)}
                  className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#004C54] focus:border-[#004C54] sm:text-sm rounded-md"
                  aria-label="Filter by category"
                >
                  {categories.map((category) => (
                    <option key={category.id || 'all'} value={category.id || ''}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Items per page selector */}
            <div className="relative">
              <select
                value={itemsPerPage}
                onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-[#004C54] focus:border-[#004C54] sm:text-sm rounded-md"
                aria-label="Items per page"
              >
                {itemsPerPageOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      
      {/* Category Quick Links */}
      <div className="mb-6">
        <div className="flex items-center mb-2">
          <FaTags className="text-[#004C54] mr-2" />
          <h2 className="text-lg font-medium text-gray-900">Categories</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.filter(cat => cat.id !== null).map(category => (
            <Link 
              key={category.id} 
              href={`/news/${category.id}`}
              className="px-4 py-2 bg-white rounded-full text-sm font-medium text-gray-700 hover:bg-[#004C54] hover:text-white transition-colors shadow-sm"
            >
              {category.name}
            </Link>
          ))}
        </div>
      </div>

      <NewsFeed 
        category={selectedCategory || undefined} 
        itemsPerPage={itemsPerPage}
        hidePhillyToggle={true}
      />
    </>
  );
}
