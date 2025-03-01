'use client';
import { useState } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import NewsFeed from '@/components/NewsFeed';
import { FaNewspaper, FaArrowLeft } from 'react-icons/fa';
import Link from 'next/link';

// Helper function to format category name
const formatCategoryName = (category: string): string => {
  return category.charAt(0).toUpperCase() + category.slice(1);
};

export default function CategoryNewsPage() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const category = params.category as string;
  
  const [itemsPerPage, setItemsPerPage] = useState(
    parseInt(searchParams.get('itemsPerPage') || '12')
  );

  const handleItemsPerPageChange = (value: number) => {
    setItemsPerPage(value);
    
    // Update URL with new items per page and reset to page 1
    const params = new URLSearchParams(searchParams);
    params.set('itemsPerPage', value.toString());
    params.set('page', '1'); // Reset to page 1 when changing items per page
    router.push(`/news/${category}?${params.toString()}`);
  };

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
            <Link href="/news" className="inline-flex items-center text-sm text-[#004C54] hover:underline mb-2">
              <FaArrowLeft className="mr-1" size={12} />
              Back to All News
            </Link>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center">
              <FaNewspaper className="mr-2 text-[#004C54]" />
              {formatCategoryName(category)} News
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Philadelphia&apos;s top {category.toLowerCase()} news sources
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
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

      <NewsFeed 
        category={category} 
        itemsPerPage={itemsPerPage} 
      />
    </>
  );
} 